"""
Cardfight!! Vanguard card scraper.

Uses the JSON API behind https://en.cf-vanguard.com/cardlist/ to find sets
(expansions) that are not yet in the local database, then appends their cards
in the same format as the existing rows.

Usage:
    python data_scraper.py               # add all missing sets
    python data_scraper.py --dry-run     # only list the sets that would be added
    python data_scraper.py --check 235   # compare one existing set against the DB (no writes)
"""

import argparse
import os
import sqlite3
import sys
import time

import requests

BASE_URL = "https://en.cf-vanguard.com"
API_BASE = f"{BASE_URL}/manage/en-api"
IMAGE_BASE = f"{BASE_URL}/wordpress/wp-content/images/cardlist/"
DB_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "..", "database", "second db", "scraped_data_2.db"
)
REQUEST_DELAY = 1.2  # seconds between requests — be respectful

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
}

# API code -> value stored in the `type` column (verified against existing rows).
# Codes not listed here are resolved through the card detail endpoint.
CARD_KIND_NAMES = {
    "1": "Normal Unit",
    "2": "Trigger Unit",
    "3": "G Unit",
    "4": "Others",
    "5": "Normal Order",
}

# API code -> value stored in the `regulation` column.
REGULATION_NAMES = {
    "D": "Standard",
    "V": "V-Premium",
    "G": "G-Regulation",
}

session = requests.Session()
session.headers.update(HEADERS)


def log(msg: str) -> None:
    print(msg, flush=True)


def fetch(url: str, params: dict | None = None, retries: int = 3) -> requests.Response | None:
    """GET a URL with simple retry logic and a polite delay."""
    for attempt in range(retries):
        try:
            resp = session.get(url, params=params, timeout=30)
            resp.raise_for_status()
            time.sleep(REQUEST_DELAY)
            return resp
        except requests.RequestException as exc:
            log(f"  [warn] fetch failed ({attempt + 1}/{retries}): {exc}")
            if attempt < retries - 1:
                time.sleep(REQUEST_DELAY * 2)
    return None


def api(path: str, **params) -> dict | None:
    resp = fetch(f"{API_BASE}/{path}", params=params)
    if not resp:
        return None
    try:
        return resp.json()
    except ValueError:
        log(f"  [warn] {path} did not return JSON")
        return None


# ---------------------------------------------------------------------------
# Discovering sets
# ---------------------------------------------------------------------------

def get_all_expansions() -> list[dict]:
    data = api("products")
    return data.get("items", []) if data else []


def get_existing_expansion_ids(conn: sqlite3.Connection) -> set[int]:
    """Expansion IDs already stored, taken from the `expansion=` part of card URLs."""
    ids: set[int] = set()
    for (url,) in conn.execute("SELECT DISTINCT url FROM cards WHERE url LIKE '%expansion=%'"):
        part = url.split("expansion=", 1)[1]
        digits = ""
        for ch in part:
            if not ch.isdigit():
                break
            digits += ch
        if digits:
            ids.add(int(digits))
    return ids


def get_expansion_cards(expansion_id: str) -> list[dict]:
    """All card list items for one expansion (the API pages 60 at a time)."""
    items: list[dict] = []
    page = 1
    while True:
        data = api("cards", expansion=expansion_id, page=page)
        if not data:
            break
        batch = data.get("items", [])
        items.extend(batch)
        total = int(data.get("total") or 0)
        if not batch or len(items) >= total:
            break
        page += 1
    return items


# ---------------------------------------------------------------------------
# Converting API data into the existing row format
# ---------------------------------------------------------------------------

_kind_cache: dict[str, str] = {}


def card_kind_name(item: dict) -> str:
    code = str(item.get("card_kind") or "")
    if code in CARD_KIND_NAMES:
        return CARD_KIND_NAMES[code]
    if code in _kind_cache:
        return _kind_cache[code]
    detail = api("card", cardno=item["card_number"])
    name = (detail or {}).get("card", {}).get("card_kind_name") or ""
    log(f"  [info] card kind {code!r} resolved as {name!r}")
    _kind_cache[code] = name
    return name


def labelled(label: str, value) -> str:
    """Existing rows store e.g. 'Grade 3', 'Power 13000', and just 'Shield' when empty."""
    value = "" if value is None else str(value).strip()
    return f"{label} {value}" if value else label


def card_url(item: dict) -> str:
    return (
        f"{BASE_URL}/cardlist/?cardno={item['card_number']}"
        f"&expansion={item['expansion']}&view=image"
    )


def download_image(picture: str) -> bytes | None:
    if not picture:
        return None
    resp = fetch(IMAGE_BASE + picture)
    return resp.content if resp else None


def build_card(item: dict, with_image: bool = True) -> dict:
    regulation = str(item.get("regulation") or "")
    return {
        "url": card_url(item),
        "name": item.get("card_name") or "",
        "nation": item.get("country") or "",
        "type": card_kind_name(item),
        "race": item.get("tribe") or "",
        "grade": labelled("Grade", item.get("grade")),
        "power": labelled("Power", item.get("power")),
        "critical": labelled("Critical", item.get("critical")),
        "shield": labelled("Shield", item.get("shield")),
        "skill": item.get("skill_icon") or "",
        "gift": item.get("card_trigger") or "",
        "effect": (item.get("text") or "").replace("<br>", ""),
        "flavor": item.get("flavor") or "",
        "regulation": REGULATION_NAMES.get(regulation, regulation),
        "number": item.get("card_number") or "",
        "rarity": item.get("rare") or "",
        "illustrator": item.get("illustrator") or "",
        "clan": item.get("clan") or "",
        "set_name": item.get("expansion_name") or "",
        "image_data": download_image(item.get("picture") or "") if with_image else None,
    }


def insert_card(conn: sqlite3.Connection, card: dict) -> bool:
    """Insert a card row and its matching sets row. Returns False if it already exists."""
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
    cur.execute(
        "INSERT INTO sets (card_id, set_name, card_codes) VALUES (?, ?, NULL)",
        (cur.lastrowid, card["set_name"]),
    )
    conn.commit()
    return True


# ---------------------------------------------------------------------------
# Commands
# ---------------------------------------------------------------------------

def scrape_expansion(conn: sqlite3.Connection, expansion: dict) -> int:
    log(f"\nScraping expansion {expansion['id']}: {expansion['name']}")
    items = get_expansion_cards(expansion["id"])
    if not items:
        log("  No cards listed for this expansion (may not be released yet).")
        return 0

    added = 0
    for item in items:
        exists = conn.execute("SELECT 1 FROM cards WHERE url = ?", (card_url(item),)).fetchone()
        if exists:
            log(f"  [=] {item['card_number']} — {item['card_name']}")
            continue
        card = build_card(item)
        if insert_card(conn, card):
            added += 1
            img = "" if card["image_data"] else "  (no image)"
            log(f"  [+] {card['number']} — {card['name']} ({card['rarity']}){img}")

    log(f"  Done — {added} new card(s) added for expansion {expansion['id']}.")
    return added


def check_expansion(conn: sqlite3.Connection, expansion_id: str) -> None:
    """Compare freshly built rows with what is already stored for one set. Writes nothing."""
    conn.row_factory = sqlite3.Row
    items = get_expansion_cards(expansion_id)
    fields = [
        "name", "nation", "type", "race", "grade", "power", "critical", "shield", "skill",
        "gift", "effect", "flavor", "regulation", "number", "rarity", "illustrator", "clan", "set_name",
    ]
    matched = missing = 0
    diffs: dict[str, int] = {}
    for item in items:
        row = conn.execute("SELECT * FROM cards WHERE url = ?", (card_url(item),)).fetchone()
        if not row:
            missing += 1
            continue
        matched += 1
        built = build_card(item, with_image=False)
        for f in fields:
            if (row[f] or "") != built[f]:
                if f not in diffs:
                    log(f"  diff in {f!r} for {item['card_number']}: db={row[f]!r} api={built[f]!r}")
                diffs[f] = diffs.get(f, 0) + 1
    log(f"\nChecked {len(items)} API cards: {matched} found in DB, {missing} not in DB.")
    log(f"Field differences: {diffs or 'none'}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--dry-run", action="store_true", help="only list the sets that would be added")
    parser.add_argument("--check", metavar="EXPANSION_ID", help="compare one existing set against the DB")
    args = parser.parse_args()

    log("=== Cardfight!! Vanguard database updater ===\n")
    if not os.path.exists(DB_PATH):
        log(f"ERROR: database not found at {DB_PATH}")
        sys.exit(1)
    conn = sqlite3.connect(DB_PATH)

    if args.check:
        check_expansion(conn, args.check)
        conn.close()
        return

    expansions = get_all_expansions()
    if not expansions:
        log("No expansions returned by the API. Exiting.")
        conn.close()
        return
    log(f"Found {len(expansions)} expansions on the site.")

    existing_ids = get_existing_expansion_ids(conn)
    log(f"DB already contains {len(existing_ids)} expansion(s).")

    missing = sorted(
        (e for e in expansions if int(e["id"]) not in existing_ids),
        key=lambda e: int(e["id"]),
    )
    if not missing:
        log("Database is already up to date — no new sets to scrape.")
        conn.close()
        return

    log(f"\nFound {len(missing)} expansion(s) to scrape:")
    for e in missing:
        log(f"  [{e['id']}] {e['name']} (released {e.get('release_label') or e.get('release_date')})")

    if args.dry_run:
        conn.close()
        return

    total_added = 0
    for e in missing:
        total_added += scrape_expansion(conn, e)

    log(f"\n=== Finished — {total_added} new card(s) added to the database. ===")
    conn.close()


if __name__ == "__main__":
    main()
