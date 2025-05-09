import sqlite3

DB_PATH = r'E:\cfv stuffs\Cardfight_companion\database\second db\scraped_data_2.db'  # Define the database path as a constant


def get_data_from_db(query):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM cards WHERE name LIKE ?", ('%' + query + '%',))
    rows = cursor.fetchall()
    conn.close()
    return rows


def get_image_path_by_id(card_id):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT image_data FROM cards WHERE id = ?", (card_id,))
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


def search_card(name, nation=None, grade=None, unitType=None, format=None, clan=None, set=None):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Build the query dynamically based on whether nation, grade, or unitType are provided
    query = "SELECT * FROM cards WHERE name LIKE ?"
    params = ['%' + name + '%']

    if nation:  # Add nation filter if provided
        query += " AND nation LIKE ?"
        params.append('%' + nation + '%')

    if grade:  # Add grade filter if provided
        query += " AND grade LIKE ?"
        params.append('%' + grade + '%')  # Use LIKE to match any string containing the grade

    if unitType:  # Add type filter if provided
        query += " AND type LIKE ?"
        params.append('%' + unitType + '%')

    if format:  # Add format filter if provided
        query += " AND regulation LIKE ?"
        params.append('%' + format + '%')

    if clan:  # Add clan filter if provided
        query += " AND clan LIKE ?"
        params.append('%' + clan + '%')

    if set:  # Add set filter if provided
        query += " AND set_name LIKE ?"
        params.append('%' + set + '%')

    # Add ORDER BY clause to sort by grade first and then by name
    # Use a CASE statement to extract the numeric part of the grade for sorting
    query += """
        ORDER BY 
            CASE 
                WHEN grade LIKE 'Grade %' THEN CAST(SUBSTR(grade, 7) AS INTEGER)
                WHEN grade LIKE 'Grade%' THEN CAST(SUBSTR(grade, 6) AS INTEGER)
                ELSE -1  -- Assign a default value for invalid or missing grades
            END ASC, 
            CASE 
                WHEN type = 'Normal Unit' THEN 1
                WHEN type = 'Trigger Unit' THEN 2
                WHEN type = 'G Unit' THEN 3
                WHEN type = 'Others' THEN 4
                WHEN type = 'Normal Order' THEN 5
                WHEN type = 'Set Order' THEN 6
                WHEN type = 'Blitz Order' THEN 7
                WHEN type = 'Trigger Order' THEN 8
                WHEN type = 'Ride Deck Crest' THEN 9
                ELSE 10  -- Assign a default value for unknown types
            END ASC,
            name ASC         
    """

    # Add LIMIT 300 to restrict the number of rows
    query += " LIMIT 300"

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


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
        return [dict(row) for row in rows]
    except Exception as e:
        print(f"[ERROR] Failed to get cards by deck ID: {e}")
        return None
    
def get_sets_by_format(format=None):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        if format == 'Standard':
            # Fetch sets linked to cards in the "Standard" regulation
            cursor.execute("""
                SELECT DISTINCT s.set_name
                FROM sets s
                JOIN cards c ON s.card_id = c.id
                WHERE c.regulation = 'Standard'
            """)
        else:
            # Fetch all distinct sets
            cursor.execute("""
                SELECT DISTINCT set_name
                FROM sets
            """)

        rows = cursor.fetchall()
        conn.close()
        return [row[0] for row in rows]
    except Exception as e:
        print(f"[ERROR] Failed to fetch sets: {e}")
        return None
    
def save_tournament(name, description, deck_id, username):
    """
    Save a new tournament to the `tournaments` table.
    """
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO tournaments (name, description, deck_id, username)
            VALUES (?, ?, ?, ?)
        """, (name, description, deck_id, username))
        conn.commit()
        tournament_id = cursor.lastrowid  # Get the ID of the newly inserted tournament
        conn.close()
        return tournament_id
    except Exception as e:
        print(f"[ERROR] Failed to save tournament: {e}")
        return None
    
def get_tournaments_by_username(username):
    """
    Fetch all tournaments created by a specific user.
    """
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, name, description, deck_id, username
            FROM tournaments
            WHERE username = ?
            ORDER BY id DESC
        """, (username,))
        tournaments = [
            {"id": row[0], "name": row[1], "description": row[2], "deck_id": row[3], "username": row[4]}
            for row in cursor.fetchall()
        ]
        conn.close()
        return tournaments
    except Exception as e:
        print(f"[ERROR] Failed to fetch tournaments: {e}")
        return []