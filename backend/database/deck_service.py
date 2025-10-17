import sqlite3
import base64
from .db_config import DB_PATH


def save_deck(deck_name, username, description, format=None):
    """
    Save a new deck to the `decks` table.
    Returns the `deck_id` of the newly created deck.
    """
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        # Insert the deck into the `decks` table
        cursor.execute("INSERT INTO decks (deck_name, username, description, deck_type) VALUES (?, ?, ?, ?)", (deck_name, username, description, format))
        conn.commit()
        deck_id = cursor.lastrowid  # Get the ID of the newly inserted deck
        conn.close()
        return deck_id
    except Exception as e:
        print(f"[ERROR] Failed to save deck: {e}")
        return None


def save_ride_deck(deck_id, ride_deck_cards):
    """
    Save the ride deck cards associated with a deck to the `ride_deck` table.
    """
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Insert each ride deck card
        for grade, card in ride_deck_cards.items():
            if card:  # Only insert if card exists
                cursor.execute("INSERT INTO ride_deck (deck_id, card_id, grade) VALUES (?, ?, ?)", 
                             (deck_id, card['id'], grade))
        
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"[ERROR] Failed to save ride deck: {e}")
        return False


def get_ride_deck_by_deck_id(deck_id):
    """
    Get ride deck cards for a specific deck ID.
    """
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT 
                rd.grade,
                c.id, 
                c.name, 
                c.grade as card_grade,
                c.type,
                c.image_data
            FROM ride_deck rd
            JOIN cards c ON rd.card_id = c.id
            WHERE rd.deck_id = ?
            ORDER BY rd.grade ASC
        """, (deck_id,))
        
        rows = cursor.fetchall()
        conn.close()
        
        # Convert to list of dictionaries and add base64 encoded images
        ride_deck_cards = []
        for row in rows:
            card = dict(row)
            if card['image_data']:
                card['image'] = base64.b64encode(card['image_data']).decode('utf-8')
                del card['image_data']
            ride_deck_cards.append(card)
        
        return ride_deck_cards
    except Exception as e:
        print(f"[ERROR] Failed to get ride deck: {e}")
        return []


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
        cursor.execute("SELECT deck_id, deck_name, description, deck_type FROM decks WHERE username = ?", (username,))
        rows = cursor.fetchall()
        conn.close()

        # Format the result as a list of dictionaries
        decks = [{"id": row[0], "name": row[1], "description": row[2], "deck_type": row[3]} for row in rows]
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
            SELECT 
                c.id, 
                c.url, 
                c.name, 
                c.nation, 
                c.type, 
                c.race, 
                c.grade, 
                c.power, 
                c.critical, 
                c.shield, 
                c.skill, 
                c.gift, 
                c.effect, 
                c.flavor, 
                c.regulation, 
                c.number, 
                c.rarity, 
                c.illustrator, 
                c.clan, 
                c.set_name, 
                c.image_data
            FROM deck_cards dc
            JOIN cards c ON dc.card_id = c.id
            WHERE dc.deck_id = ?
            ORDER BY 
                CASE 
                    WHEN c.grade LIKE 'Grade %' THEN CAST(SUBSTR(c.grade, 7) AS INTEGER)
                    WHEN c.grade LIKE 'Grade%' THEN CAST(SUBSTR(c.grade, 6) AS INTEGER)
                    ELSE -1  -- Assign a default value for invalid or missing grades
                END ASC, 
                CASE 
                    WHEN c.type = 'Normal Unit' THEN 1
                    WHEN c.type = 'Trigger Unit' THEN 2
                    WHEN c.type = 'G Unit' THEN 3
                    WHEN c.type = 'Others' THEN 4
                    WHEN c.type = 'Normal Order' THEN 5
                    WHEN c.type = 'Set Order' THEN 6
                    WHEN c.type = 'Blitz Order' THEN 7
                    WHEN c.type = 'Trigger Order' THEN 8
                    WHEN c.type = 'Ride Deck Crest' THEN 9
                    ELSE 10  -- Assign a default value for unknown types
                END ASC,
                c.name ASC
        """, (deck_id,))
        rows = cursor.fetchall()
        conn.close()
        
        # Convert to list of dictionaries and handle image encoding
        cards = []
        for row in rows:
            card = dict(row)
            # Handle image data encoding safely
            if card['image_data']:
                try:
                    # Check if image_data is already a string (base64) or bytes
                    if isinstance(card['image_data'], bytes):
                        card['image'] = base64.b64encode(card['image_data']).decode('utf-8')
                    elif isinstance(card['image_data'], str):
                        # If it's already a string, assume it's base64 encoded
                        card['image'] = card['image_data']
                    else:
                        # Handle other cases by converting to string
                        card['image'] = str(card['image_data'])
                except Exception as img_error:
                    print(f"[WARNING] Failed to process image data for card {card.get('name', 'unknown')}: {img_error}")
                    card['image'] = None
            else:
                card['image'] = None
            # Remove the raw image data
            if 'image_data' in card:
                del card['image_data']
            cards.append(card)
        
        return cards
    except Exception as e:
        print(f"[ERROR] Failed to get cards by deck ID: {e}")
        return None


def delete_deck_by_id(deck_id):
    """
    Delete a deck and all its associated cards from the database.
    """
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Delete associated deck cards first (foreign key constraint)
        cursor.execute("DELETE FROM deck_cards WHERE deck_id = ?", (deck_id,))
        
        # Delete associated ride deck cards if they exist
        cursor.execute("DELETE FROM ride_deck WHERE deck_id = ?", (deck_id,))
        
        # Delete the deck itself
        cursor.execute("DELETE FROM decks WHERE deck_id = ?", (deck_id,))
        
        conn.commit()
        
        # Check if the deck was actually deleted
        deleted_rows = cursor.rowcount
        conn.close()
        
        return deleted_rows > 0
    except Exception as e:
        print(f"[ERROR] Failed to delete deck: {e}")
        return False