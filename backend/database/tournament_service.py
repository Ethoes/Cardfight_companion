import sqlite3
from .db_config import DB_PATH


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


def save_tournament_details(tournament_id, match_number, opponent_deck_name, opponent_deck_log, match_result, match_notes):
    """
    Save a new match to the tournament_details table.
    """
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO tournament_details (tournament_id, match_number, opponent_deck_name, opponent_deck_log, match_result, match_notes)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (tournament_id, match_number, opponent_deck_name, opponent_deck_log, match_result, match_notes))
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"[ERROR] Failed to save tournament details: {e}")
        return False


def get_tournament_details_by_id(tournament_id):
    """
    Fetch all tournament details for a specific tournament.
    """
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT match_number, opponent_deck_name, opponent_deck_log, match_result, match_notes
            FROM tournament_details
            WHERE tournament_id = ?
            ORDER BY match_number ASC
        """, (tournament_id,))
        details = [
            {
                "match_number": row[0],
                "opponent_deck_name": row[1],
                "opponent_deck_log": row[2],
                "match_result": row[3],
                "match_notes": row[4],
            }
            for row in cursor.fetchall()
        ]
        conn.close()
        return details
    except Exception as e:
        print(f"[ERROR] Failed to fetch tournament details: {e}")
        return None


def get_tournament_details_with_deck(tournament_id):
    """
    Fetch all tournament details for a specific tournament, including deck information.
    """
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        # Fetch tournament details with deck information
        cursor.execute("""
            SELECT 
                t.match_number, 
                t.opponent_deck_name, 
                t.opponent_deck_log, 
                t.match_result, 
                t.match_notes,
                d.deck_name, 
                d.description AS deck_description, 
                d.deck_type
            FROM tournament_details t
            JOIN tournaments tr ON t.tournament_id = tr.id
            JOIN decks d ON tr.deck_id = d.deck_id
            WHERE t.tournament_id = ?
            ORDER BY t.match_number ASC
        """, (tournament_id,))
        details = [
            {
                "match_number": row[0],
                "opponent_deck_name": row[1],
                "opponent_deck_log": row[2],
                "match_result": row[3],
                "match_notes": row[4],
                "deck_name": row[5],
                "deck_description": row[6],
                "deck_type": row[7],
            }
            for row in cursor.fetchall()
        ]
        conn.close()
        return details
    except Exception as e:
        print(f"[ERROR] Failed to fetch tournament details: {e}")
        return None


def delete_tournament_by_id(tournament_id):
    """
    Delete a tournament and all its associated match details from the database.
    """
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Delete associated tournament details first (foreign key constraint)
        cursor.execute("DELETE FROM tournament_details WHERE tournament_id = ?", (tournament_id,))
        
        # Delete the tournament itself
        cursor.execute("DELETE FROM tournaments WHERE id = ?", (tournament_id,))
        
        conn.commit()
        
        # Check if the tournament was actually deleted
        deleted_rows = cursor.rowcount
        conn.close()
        
        return deleted_rows > 0
    except Exception as e:
        print(f"[ERROR] Failed to delete tournament: {e}")
        return False