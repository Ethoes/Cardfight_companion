"""
Clean start for user data before switching to hashed passwords.

Deletes every user account, deck (with its cards and ride deck) and tournament
note (with its match details). Card data, sets and rules-bot feedback are kept.

Run this once on each machine's database after pulling the hashed-password
update. Old accounts stored plain-text passwords and can no longer log in, so
everyone registers again afterwards.

Usage (from the repository root, with the venv active):
    python backend/scripts/reset_user_data.py              # asks for confirmation
    python backend/scripts/reset_user_data.py --yes        # no prompt
    python backend/scripts/reset_user_data.py --db "path/to/other.db"
    python backend/scripts/reset_user_data.py --dry-run    # only show counts

Stop the backend first, or at least make sure nobody is using the app.
"""

import argparse
import os
import sqlite3
import sys

DEFAULT_DB = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "..", "..", "database", "second db", "scraped_data_2.db"
)

# Children before parents, so foreign keys never point at deleted rows.
TABLES = ["ride_deck", "deck_cards", "decks", "tournament_details", "tournaments", "users"]


def existing_tables(conn):
    return {row[0] for row in conn.execute("SELECT name FROM sqlite_master WHERE type = 'table'")}


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--db", default=DEFAULT_DB, help="path to the SQLite database (default: the app's database)")
    parser.add_argument("--yes", action="store_true", help="skip the confirmation prompt")
    parser.add_argument("--dry-run", action="store_true", help="show what would be deleted, change nothing")
    args = parser.parse_args()

    db_path = os.path.abspath(args.db)
    if not os.path.exists(db_path):
        sys.exit(f"Database not found: {db_path}")

    # Wait up to 60s for locks, e.g. while the card scraper is committing.
    conn = sqlite3.connect(db_path, timeout=60)
    tables = [t for t in TABLES if t in existing_tables(conn)]
    counts = {t: conn.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0] for t in tables}

    print(f"Database: {db_path}\n")
    for t in TABLES:
        print(f"  {t:20} {counts[t]:>7} row(s)" if t in counts else f"  {t:20}   (table not present)")
    print("\nCards, sets and rules feedback are not touched.")

    if args.dry_run:
        print("\nDry run: nothing deleted.")
        return
    if not any(counts.values()):
        print("\nNothing to delete.")
        return
    if not args.yes:
        answer = input("\nPermanently delete ALL users, decks and tournament notes above? Type 'yes' to continue: ")
        if answer.strip().lower() != "yes":
            print("Cancelled, nothing deleted.")
            return

    try:
        with conn:  # one transaction: all or nothing
            for t in tables:
                conn.execute(f"DELETE FROM {t}")
            # Restart the AUTOINCREMENT ids at 1 for the emptied tables.
            if "sqlite_sequence" in existing_tables(conn):
                conn.executemany("DELETE FROM sqlite_sequence WHERE name = ?", [(t,) for t in tables])
    except sqlite3.OperationalError as e:
        sys.exit(f"Failed, nothing was deleted: {e}\n(Is the backend or the scraper holding the database? Stop it and retry.)")
    finally:
        conn.close()

    print("\nDone. All users, decks and tournament notes were deleted.")
    print("Everyone needs to register a new account; new passwords are stored hashed.")


if __name__ == "__main__":
    main()
