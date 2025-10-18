# Main DatabaseService - imports all functions from modular services
# This maintains backward compatibility with existing imports

from .auth_service import create_user, validate_user
from .card_service import get_data_from_db, get_image_path_by_id, search_card, get_sets_by_format
from .deck_service import (
    save_deck, save_ride_deck, get_ride_deck_by_deck_id, save_deck_cards,
    get_decks_by_username, get_cards_by_deck_id, delete_deck_by_id
)
from .tournament_service import (
    save_tournament, get_tournaments_by_username, save_tournament_details,
    get_tournament_details_by_id, get_tournament_details_with_deck, delete_tournament_by_id
)
from database.db_config import get_database_connection, get_db_type

# Re-export all functions for backward compatibility
__all__ = [
    # Auth functions
    'create_user', 'validate_user',
    
    # Card functions
    'get_data_from_db', 'get_image_path_by_id', 'search_card', 'get_sets_by_format',
    
    # Deck functions
    'save_deck', 'save_ride_deck', 'get_ride_deck_by_deck_id', 'save_deck_cards',
    'get_decks_by_username', 'get_cards_by_deck_id', 'delete_deck_by_id',
    
    # Tournament functions
    'save_tournament', 'get_tournaments_by_username', 'save_tournament_details',
    'get_tournament_details_by_id', 'get_tournament_details_with_deck', 'delete_tournament_by_id'
]

def save_deck(deck_name, username, description, deck_format):
    """Save a deck to the database"""
    conn = get_database_connection()
    cursor = conn.cursor()
    
    try:
        if get_db_type() == 'mysql':
            cursor.execute('''
                INSERT INTO decks (deck_name, deck_type, username, description) 
                VALUES (%s, %s, %s, %s)
            ''', (deck_name, deck_format, username, description))
            deck_id = cursor.lastrowid
        else:  # SQLite
            cursor.execute('''
                INSERT INTO decks (deck_name, deck_type, username, description) 
                VALUES (?, ?, ?, ?)
            ''', (deck_name, deck_format, username, description))
            deck_id = cursor.lastrowid
        
        conn.commit()
        return deck_id
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()