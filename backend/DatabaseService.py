import sqlite3

DB_PATH = r'C:\Users\Calvin\python filed\scraped_data.db'  # Define the database path as a constant


def get_data_from_db(query):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM scraped_data WHERE name LIKE ?", ('%' + query + '%',))
    rows = cursor.fetchall()
    conn.close()
    return rows

def get_image_path_by_id(card_id):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT image_path FROM scraped_data WHERE id = ?", (card_id,))
    row = cursor.fetchone()
    conn.close()
    return row[0] if row else None

def create_user(username, password):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("INSERT INTO users (username, password) VALUES (?, ?)", (username, password))
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(e)
        return False

def validate_user(username, password):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ? AND password = ?", (username, password))
    row = cursor.fetchone()
    conn.close()
    return row is not None

def search_card(name, nation):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM scraped_data WHERE name LIKE ? AND nation = ?", ('%' + name + '%', nation))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def save_deck(deck_name, username, description):
    """
    Save a new deck to the `decks` table.
    Returns the `deck_id` of the newly created deck.
    """
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        # Insert the deck into the `decks` table
        cursor.execute("INSERT INTO decks (deck_name, username, description) VALUES (?, ?, ?)", (deck_name, username, description))
        conn.commit()
        deck_id = cursor.lastrowid  # Get the ID of the newly inserted deck
        conn.close()
        return deck_id
    except Exception as e:
        print(f"[ERROR] Failed to save deck: {e}")
        return None

def save_deck_cards(deck_id, card_ids):
    """
    Save the cards associated with a deck to the `deck_cards` table.
    """
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        # Insert each card into the `deck_cards` table
        for card_id in card_ids:
            cursor.execute("INSERT INTO deck_cards (deck_id, card_id) VALUES (?, ?)", (deck_id, card_id))
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"[ERROR] Failed to save deck cards: {e}")
        return False
    
def get_decks_by_username(username):
    try:
        # Query the database for decks associated with the username
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT deck_id, deck_name, description FROM decks WHERE username = ?", (username,))
        rows = cursor.fetchall()
        conn.close()

        # Format the result as a list of dictionaries
        decks = [{"id": row[0], "name": row[1], "description": row[2]} for row in rows]
        return decks
    except Exception as e:
        print(f"[ERROR] Failed to get decks: {e}")
        return None
    
def get_cards_by_deck_id(deck_id):
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("""
            SELECT c.id, c.name, c.nation, c.image_path
            FROM deck_cards dc
            JOIN scraped_data c ON dc.card_id = c.id
            WHERE dc.deck_id = ?
        """, (deck_id,))
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]
    except Exception as e:
        print(f"[ERROR] Failed to get cards by deck ID: {e}")
        return None