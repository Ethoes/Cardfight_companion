"""
Cardfight!! Vanguard card scraper.
Discovers new sets on https://en.cf-vanguard.com/products/ that are not yet
in the local database, then scrapes all cards for those sets and appends them.
"""

import re
import sqlite3
import sys
import time
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://en.cf-vanguard.com"
DB_PATH = r"C:\Users\calvi\projects\Cardfight_companion\database\second db\scraped_data_2.db"
REQUEST_DELAY = 1.2  # seconds between requests — be respectful

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
}

session = requests.Session()
session.headers.update(HEADERS)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def log(msg: str) -> None:
    print(msg, flush=True)


def fetch(url: str, retries: int = 3) -> requests.Response | None:
    """GET a URL with simple retry logic."""
    for attempt in range(retries):
        try:
            resp = session.get(url, timeout=30)
            resp.raise_for_status()
            time.sleep(REQUEST_DELAY)
            return resp
        except requests.RequestException as exc:
            log(f"  [warn] fetch failed ({attempt + 1}/{retries}): {exc}")
            if attempt < retries - 1:
                time.sleep(REQUEST_DELAY * 2)
    return None


def normalize_set_code(code: str) -> str:
    """Strip leading 'VGE-' so codes can be compared consistently."""
    return code.removeprefix("VGE-").strip()


# ---------------------------------------------------------------------------
# Step 1 – build expansion_id → info map from the card-list page
# ---------------------------------------------------------------------------

def get_all_expansions() -> dict[int, dict]:
    """
    Scrape https://en.cf-vanguard.com/cardlist/ and return a dict:
        { expansion_id: { "set_code": "DZ-BT13", "set_name": "[VGE-DZ-BT13] …", "expansion_id": 252 } }
    """
    log("Fetching expansion list from card-list page …")
    resp = fetch(f"{BASE_URL}/cardlist/")
    if not resp:
        log("ERROR: could not fetch card-list page.")
        return {}

    soup = BeautifulSoup(resp.text, "html.parser")
    expansions: dict[int, dict] = {}

    for a in soup.find_all("a", href=True):
        m = re.search(r"expansion=(\d+)", a["href"])
        if not m:
            continue
        exp_id = int(m.group(1))
        if exp_id in expansions:
            continue

        raw_name = a.get_text(separator=" ", strip=True)
        # Extract set code like [VGE-DZ-BT13] from the anchor text
        code_match = re.search(r"\[([A-Z0-9\-]+)\]", raw_name)
        set_code = normalize_set_code(code_match.group(1)) if code_match else ""

        # The cleanest set name starts at the '[' bracket; strip trailing
        # date strings (e.g. "May 8, 2026") and "Featured …" suffixes.
        set_name = ""
        bracket_idx = raw_name.find("[")
        if bracket_idx != -1:
            candidate = raw_name[bracket_idx:]
            # Match month-name dates like "May 8, 2026" or "January 30, 2026"
            date_re = re.compile(
                r"\s+(?:January|February|March|April|May|June|July|August"
                r"|September|October|November|December)\b",
                re.IGNORECASE,
            )
            candidate = date_re.split(candidate)[0].strip()
            # Also strip "Featured …" suffixes
            candidate = re.split(r"\s+Featured\b", candidate)[0].strip()
            set_name = candidate

        expansions[exp_id] = {
            "expansion_id": exp_id,
            "set_code": set_code,
            "set_name": set_name,
        }

    log(f"  Found {len(expansions)} expansions on card-list page.")
    return expansions


# ---------------------------------------------------------------------------
# Step 2 – get expansion IDs already present in the database
# ---------------------------------------------------------------------------

def get_existing_expansion_ids(conn: sqlite3.Connection) -> set[int]:
    """Return the set of expansion IDs already stored in the cards table."""
    cur = conn.cursor()
    cur.execute("SELECT DISTINCT url FROM cards WHERE url LIKE '%expansion=%'")
    ids: set[int] = set()
    for (url,) in cur.fetchall():
        m = re.search(r"expansion=(\d+)", url)
        if m:
            ids.add(int(m.group(1)))
    return ids


# ---------------------------------------------------------------------------
# Step 3 – discover set codes on every products page
# ---------------------------------------------------------------------------

SET_CODE_RE = re.compile(r"\b(?:VGE-)?([A-Z]{1,4}-[A-Z]{1,5}\d{2,3})\b")
SKIP_URL_FRAGMENTS = (
    "/products/cat/",
    "/products/schedule/",
    "/products/page/",
    "playmat",
    "rubber-mat",
    "sleeve",
    "card-case",
    "storage",
    "supply",
)


def is_card_set_url(url: str) -> bool:
    return not any(frag in url.lower() for frag in SKIP_URL_FRAGMENTS)


def get_product_set_codes() -> set[str]:
    """
    Crawl all pages of /products/ and collect every normalised set code
    found in the page text of card-set product pages.
    """
    log("Crawling products pages …")
    found_codes: set[str] = set()
    page = 1

    while True:
        url = (
            f"{BASE_URL}/products/"
            if page == 1
            else f"{BASE_URL}/products/page/{page}/"
        )
        log(f"  Products page {page}: {url}")
        resp = fetch(url)
        if not resp:
            break

        soup = BeautifulSoup(resp.text, "html.parser")

        # Collect product URLs on this page
        product_urls: set[str] = set()
        for a in soup.find_all("a", href=True):
            href = a["href"]
            abs_href = urljoin(BASE_URL, href)
            if (
                "/products/" in abs_href
                and abs_href != f"{BASE_URL}/products/"
                and is_card_set_url(abs_href)
            ):
                product_urls.add(abs_href)

        # Visit each product page and harvest set codes from its text
        for prod_url in product_urls:
            prod_resp = fetch(prod_url)
            if not prod_resp:
                continue
            codes_on_page = SET_CODE_RE.findall(prod_resp.text)
            for code in codes_on_page:
                found_codes.add(normalize_set_code(code))

        # Detect next page
        if f"/products/page/{page + 1}/" not in resp.text:
            break
        page += 1
        if page > 20:  # hard cap
            break

    log(f"  Collected {len(found_codes)} distinct set codes from products pages.")
    return found_codes


# ---------------------------------------------------------------------------
# Step 4 – determine which expansions need scraping
# ---------------------------------------------------------------------------

def find_missing_expansions(
    all_expansions: dict[int, dict],
    existing_ids: set[int],
    product_codes: set[str],
) -> list[dict]:
    """
    Return expansion info dicts for sets that appear on the products pages
    but are not yet in the database.
    """
    missing: list[dict] = []
    for exp_id, info in all_expansions.items():
        if exp_id in existing_ids:
            continue
        if info["set_code"] and info["set_code"] in product_codes:
            missing.append(info)

    # Sort by expansion_id so older missing sets come first
    missing.sort(key=lambda x: x["expansion_id"])
    return missing


# ---------------------------------------------------------------------------
# Step 5 – card scraping helpers
# ---------------------------------------------------------------------------

def get_first_card_url(expansion_id: int) -> str | None:
    """Get the URL of the first card in an expansion from the search results."""
    search_url = f"{BASE_URL}/cardlist/cardsearch/?expansion={expansion_id}"
    resp = fetch(search_url)
    if not resp:
        return None

    soup = BeautifulSoup(resp.text, "html.parser")
    first_link = soup.find("a", href=lambda h: h and "cardno=" in h)
    if not first_link:
        return None

    href = first_link["href"]
    return urljoin(BASE_URL, href)


def parse_card(soup: BeautifulSoup, card_url: str) -> dict | None:
    """
    Parse a card detail page and return a dict ready for DB insertion.
    Returns None if the page doesn't look like a valid card page.
    """
    detail = soup.find("div", class_="cardlist_detail")
    if not detail:
        return None

    def text_of(selector: str) -> str:
        el = detail.select_one(selector)
        return el.get_text(separator="\n", strip=True) if el else ""

    # -- Basic fields --
    name = text_of(".name .face")
    if not name:
        return None

    card_type = text_of(".text-list .type")
    nation = text_of(".text-list .nation")
    race = text_of(".text-list .race")

    grade_raw = text_of(".text-list .grade")
    grade = grade_raw.removeprefix("Grade").strip()

    power_raw = text_of(".text-list .power")
    power = power_raw.removeprefix("Power").strip()

    critical_raw = text_of(".text-list .critical")
    critical = critical_raw.removeprefix("Critical").strip()

    shield_raw = text_of(".text-list .shield")
    shield = shield_raw.removeprefix("Shield").strip()

    skill = text_of(".text-list .skill")
    gift = text_of(".text-list .gift")
    effect = text_of(".effect")
    flavor = text_of(".flavor")

    # -- Second text-list (metadata) --
    # There are two .text-list blocks; the second has regulation/number/rarity/illust
    text_lists = detail.find_all("div", class_="text-list")
    regulation = number = rarity = illustrator = ""
    if len(text_lists) >= 2:
        meta = text_lists[1]

        def meta_text(cls: str) -> str:
            el = meta.find("div", class_=cls)
            return el.get_text(strip=True) if el else ""

        regulation = meta_text("regulation")
        number = meta_text("number")
        rarity = meta_text("rarity")
        # Note: there is a typo in the site HTML — "illstrator" (missing 'u')
        illustrator = meta_text("illstrator").removeprefix("illust/").strip()

    # -- Set name from the variation table --
    set_name = ""
    table = soup.find("table")
    if table:
        tds = table.find_all("td")
        for td in tds:
            td_text = td.get_text(strip=True)
            if td_text.startswith("["):
                set_name = td_text
                break

    # -- Card image --
    img_tag = detail.select_one(".image .main img")
    image_data: bytes | None = None
    if img_tag and img_tag.get("src"):
        img_url = urljoin(BASE_URL, img_tag["src"])
        try:
            img_resp = session.get(img_url, timeout=30)
            if img_resp.status_code == 200:
                image_data = img_resp.content
            time.sleep(REQUEST_DELAY)
        except requests.RequestException as exc:
            log(f"    [warn] image download failed for {img_url}: {exc}")

    return {
        "url": card_url,
        "name": name,
        "nation": nation,
        "type": card_type,
        "race": race,
        "grade": grade,
        "power": power,
        "critical": critical,
        "shield": shield,
        "skill": skill,
        "gift": gift,
        "effect": effect,
        "flavor": flavor,
        "regulation": regulation,
        "number": number,
        "rarity": rarity,
        "illustrator": illustrator,
        "clan": "",  # DZ era uses nation, not clan
        "set_name": set_name,
        "image_data": image_data,
    }


def insert_card(conn: sqlite3.Connection, card: dict) -> bool:
    """Insert a card row and its matching sets row. Returns True if inserted, False if already exists."""
    cur = conn.cursor()
    cur.execute("SELECT id FROM cards WHERE url = ?", (card["url"],))
    if cur.fetchone():
        return False

    cur.execute(
        """
        INSERT INTO cards
            (url, name, nation, type, race, grade, power, critical, shield,
             skill, gift, effect, flavor, regulation, number, rarity,
             illustrator, clan, set_name, image_data)
        VALUES
            (:url, :name, :nation, :type, :race, :grade, :power, :critical, :shield,
             :skill, :gift, :effect, :flavor, :regulation, :number, :rarity,
             :illustrator, :clan, :set_name, :image_data)
        """,
        card,
    )
    card_id = cur.lastrowid
    cur.execute(
        "INSERT INTO sets (card_id, set_name, card_codes) VALUES (?, ?, NULL)",
        (card_id, card["set_name"]),
    )
    conn.commit()
    return True


# ---------------------------------------------------------------------------
# Step 6 – scrape all cards in one expansion
# ---------------------------------------------------------------------------

def scrape_expansion(
    conn: sqlite3.Connection,
    expansion_id: int,
    expansion_info: dict,
) -> int:
    """
    Traverse all cards in an expansion via the Next button and insert them.
    Returns the number of new cards added.
    """
    log(f"\nScraping expansion {expansion_id}: {expansion_info['set_name']}")

    first_url = get_first_card_url(expansion_id)
    if not first_url:
        log("  No cards found for this expansion (may not be released yet).")
        return 0

    # Derive the expected card number prefix (e.g. "DZ-BT13/") from the first URL
    m = re.search(r"cardno=([A-Z0-9\-]+)/", first_url)
    card_prefix = (m.group(1) + "/") if m else None

    current_url = first_url
    added = 0
    visited: set[str] = set()

    while current_url and current_url not in visited:
        visited.add(current_url)

        # Guard: stop if we've drifted into a different set
        if card_prefix:
            encoded_prefix = card_prefix.replace("/", "%2F")
            url_lower = current_url.lower()
            if (
                card_prefix.lower() not in url_lower
                and encoded_prefix.lower() not in url_lower
            ):
                log(f"  Stopped: card prefix changed at {current_url}")
                break

        resp = fetch(current_url)
        if not resp:
            log(f"  [warn] Failed to fetch {current_url}, stopping.")
            break

        soup = BeautifulSoup(resp.text, "html.parser")
        card = parse_card(soup, current_url)

        if card:
            inserted = insert_card(conn, card)
            status = "+" if inserted else "="
            log(f"  [{status}] {card['number']} — {card['name']} ({card['rarity']})")
            if inserted:
                added += 1
        else:
            log(f"  [warn] Could not parse card at {current_url}")

        # Find the Next link
        next_el = soup.find("a", id="nextCardLink")
        if not next_el:
            log("  Reached end of set (no Next link).")
            break

        next_href = next_el.get("href", "")
        # Re-attach the expansion parameter so the detail page keeps context
        if "expansion=" not in next_href:
            sep = "&" if "?" in next_href else "?"
            next_href = f"{next_href}{sep}expansion={expansion_id}"

        current_url = urljoin(BASE_URL, next_href)

    log(f"  Done — {added} new card(s) added for expansion {expansion_id}.")
    return added


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    log("=== Cardfight!! Vanguard database updater ===\n")

    conn = sqlite3.connect(DB_PATH)

    # 1. Get all known expansions from the card-list page
    all_expansions = get_all_expansions()
    if not all_expansions:
        log("No expansions found. Exiting.")
        conn.close()
        return

    # 2. Find which expansion IDs are already in the DB
    existing_ids = get_existing_expansion_ids(conn)
    log(f"DB already contains {len(existing_ids)} expansion(s).\n")

    # 3. Collect set codes referenced on the products pages
    product_codes = get_product_set_codes()
    log(f"Products page codes: {sorted(product_codes)}\n")

    # 4. Determine what to scrape
    missing = find_missing_expansions(all_expansions, existing_ids, product_codes)

    if not missing:
        log("Database is already up to date — no new sets to scrape.")
        conn.close()
        return

    log(f"\nFound {len(missing)} expansion(s) to scrape:")
    for info in missing:
        log(f"  [{info['expansion_id']}] {info['set_code']} — {info['set_name']}")

    # 5. Scrape each missing expansion
    total_added = 0
    for info in missing:
        added = scrape_expansion(conn, info["expansion_id"], info)
        total_added += added

    log(f"\n=== Finished — {total_added} new card(s) added to the database. ===")
    conn.close()


if __name__ == "__main__":
    main()
