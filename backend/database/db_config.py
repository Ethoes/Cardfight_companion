import os
import sqlite3

# Define DB_PATH constant
current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(current_dir, '..', 'database', 'second db', 'scraped_data_2.db')

def get_database_connection():
    """Get SQLite database connection"""
    return sqlite3.connect(DB_PATH)

def get_db_type():
    """Return database type"""
    return 'sqlite'

def ensure_schema():
    """Create tables the code needs that older database copies may be missing."""
    conn = get_database_connection()
    try:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS ride_deck (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                deck_id INTEGER NOT NULL,
                card_id INTEGER NOT NULL,
                grade INTEGER NOT NULL,
                FOREIGN KEY (deck_id) REFERENCES decks(deck_id) ON DELETE CASCADE
            )
        """)
        conn.commit()
    finally:
        conn.close()
