from flask import Blueprint, jsonify, request
from database.DatabaseService import (
    save_deck, save_ride_deck, save_deck_cards, get_decks_by_username,
    get_cards_by_deck_id, get_ride_deck_by_deck_id, delete_deck_by_id, get_all_user_decks_paginated
)
from cardmarketApi import calculate_deck_cost
import base64

deck_bp = Blueprint('deck', __name__)


@deck_bp.route('/createDeck', methods=['POST'])
def create_deck():
    data = request.get_json()
    
    # Enhanced logging to debug the issue
    print(f"[DEBUG] Received data: {data}")
    print(f"[DEBUG] Data type: {type(data)}")
    
    if not data:
        print("[ERROR] No data received")
        return jsonify({"error": "No data received"}), 400
    
    # Check each required field individually for better debugging
    missing_fields = []
    if 'user' not in data:  # Changed from 'username' to 'user'
        missing_fields.append('user')
    if 'name' not in data:  # Changed from 'deckName' to 'name'
        missing_fields.append('name')
    if 'deck' not in data:  # Changed from 'cards' to 'deck'
        missing_fields.append('deck')
    
    if missing_fields:
        print(f"[ERROR] Missing required fields: {missing_fields}")
        return jsonify({"error": f"Missing required fields: {', '.join(missing_fields)}"}), 400
    
    username = data['user']  # Changed from data['username']
    deck_name = data['name']  # Changed from data['deckName']
    cards = data['deck']  # Changed from data['cards']
    ride_deck = data.get('rideDeck', [])
    deck_format = data.get('format', 'Standard')
    deck_type = data.get('deckType', 'Standard')
    description = data.get('description', '')
    
    print(f"[DEBUG] Parsed data - Username: {username}, DeckName: {deck_name}, Format: {deck_format}, Type: {deck_type}")
    print(f"[DEBUG] Cards count: {len(cards) if cards else 0}, RideDeck count: {len(ride_deck) if ride_deck else 0}")
    
    # Extract card IDs from the card objects
    card_ids = [card['id'] for card in cards] if cards else []
    
    # Save the deck
    deck_id = save_deck(deck_name, username, description, deck_format)
    if not deck_id:
        print("[ERROR] Failed to save deck to database")
        return jsonify({"error": "Failed to save deck"}), 500
    
    print(f"[DEBUG] Deck saved with ID: {deck_id}")
    
    # Save cards
    if not save_deck_cards(deck_id, card_ids):
        print("[ERROR] Failed to save deck cards")
        return jsonify({"error": "Failed to save deck cards"}), 500
    
    print(f"[DEBUG] Saved {len(card_ids)} cards")
    
    # Save ride deck if present
    if ride_deck and not save_ride_deck(deck_id, ride_deck):
        print("[ERROR] Failed to save ride deck")
        return jsonify({"error": "Failed to save ride deck"}), 500
    
    if ride_deck:
        print(f"[DEBUG] Saved {len(ride_deck)} ride deck cards")
    
    return jsonify({"message": "Deck created successfully", "deck_id": deck_id}), 201


@deck_bp.route('/decks', methods=['POST'])
def get_decks():
    data = request.get_json()
    if not data or 'username' not in data:
        return jsonify({"error": "Invalid input"}), 400
    
    username = data['username']
    decks = get_decks_by_username(username)
    return jsonify(decks)


@deck_bp.route('/decks/<int:deck_id>/cards', methods=['GET'])
def get_deck_cards(deck_id):
    try:
        cards = get_cards_by_deck_id(deck_id)
        if cards is None:
            return jsonify({"error": "Deck not found"}), 404
        
        # Image encoding is already handled in get_cards_by_deck_id
        return jsonify(cards), 200
    except Exception as e:
        print(f"[ERROR] Failed to fetch deck cards: {e}")
        return jsonify({"error": "Failed to fetch deck cards"}), 500


@deck_bp.route('/decks/<int:deck_id>/ride-deck', methods=['GET'])
def get_ride_deck(deck_id):
    ride_deck = get_ride_deck_by_deck_id(deck_id)
    return jsonify(ride_deck)


@deck_bp.route('/decks/<int:deck_id>', methods=['DELETE'])
def delete_deck(deck_id):
    try:
        success = delete_deck_by_id(deck_id)
        if success:
            return jsonify({"message": "Deck deleted successfully"}), 200
        else:
            return jsonify({"error": "Failed to delete deck"}), 500
    except Exception as e:
        print(f"[ERROR] Failed to delete deck ID {deck_id}: {e}")
        return jsonify({"error": "Failed to delete deck"}), 500


@deck_bp.route('/decks/<int:deck_id>/cost', methods=['GET'])
def get_deck_cost(deck_id):
    try:
        cards = get_cards_by_deck_id(deck_id)
        if not cards:
            return jsonify({"error": "Deck not found"}), 404
        
        total_cost = calculate_deck_cost(cards)
        return jsonify({"total_cost": total_cost}), 200
    except Exception as e:
        print(f"[ERROR] Failed to calculate deck cost: {e}")
        return jsonify({"error": "Failed to calculate deck cost"}), 500


@deck_bp.route('/all-decks', methods=['GET'])
def get_all_decks():
    """Get paginated decks from all users for the UserDecks page"""
    try:
        # Get query parameters
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        search = request.args.get('search', '')
        sort_field = request.args.get('sort_field', 'deck_id')
        sort_direction = request.args.get('sort_direction', 'desc')
        
        # Validate parameters
        if page < 1:
            page = 1
        if per_page < 1 or per_page > 100:  # Limit max per_page to prevent abuse
            per_page = 10
            
        # Valid sort fields to prevent SQL injection
        valid_sort_fields = ['deck_id', 'deck_name', 'username', 'deck_type', 'created_at']
        if sort_field not in valid_sort_fields:
            sort_field = 'deck_id'
            
        if sort_direction not in ['asc', 'desc']:
            sort_direction = 'desc'
        
        result = get_all_user_decks_paginated(page, per_page, search, sort_field, sort_direction)
        return jsonify(result), 200
        
    except ValueError:
        return jsonify({"error": "Invalid pagination parameters"}), 400
    except Exception as e:
        print(f"[ERROR] Failed to fetch all decks: {e}")
        return jsonify({"error": "Failed to fetch decks"}), 500
