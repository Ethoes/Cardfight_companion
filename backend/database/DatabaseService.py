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