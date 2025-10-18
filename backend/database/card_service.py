import os
import sqlite3
import base64

# Define DB_PATH constant
current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(current_dir, '..', 'database', 'second db', 'scraped_data_2.db')


def get_database_connection():
    """Get SQLite database connection"""
    return sqlite3.connect(DB_PATH)


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


def get_sets_by_format(format=None):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        if format == 'Standard':
            # Fetch sets linked to cards in the "Standard" regulation
            cursor.execute("""
                SELECT DISTINCT s.set_name
                FROM sets s
                JOIN cards c ON s.set_name = c.set_name
                WHERE c.regulation = 'Standard'
                ORDER BY s.set_name
            """)
        elif format == 'Premium':
            # Fetch sets linked to cards in the "Premium" regulation
            cursor.execute("""
                SELECT DISTINCT s.set_name
                FROM sets s
                JOIN cards c ON s.set_name = c.set_name
                WHERE c.regulation = 'Premium'
                ORDER BY s.set_name
            """)
        else:
            # Fetch all sets if no format is specified
            cursor.execute("SELECT DISTINCT set_name FROM sets ORDER BY set_name")

        rows = cursor.fetchall()
        conn.close()
        return [row[0] for row in rows]
    except Exception as e:
        print(f"[ERROR] Failed to get sets: {e}")
        return []