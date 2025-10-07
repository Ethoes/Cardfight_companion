from flask import Blueprint, jsonify, request
from DatabaseService import (
    save_deck, save_ride_deck, save_deck_cards, get_decks_by_username,
    get_cards_by_deck_id, get_ride_deck_by_deck_id, delete_deck_by_id
)
from cardmarketApi import calculate_deck_cost
import base64

deck_bp = Blueprint('deck', __name__)


@deck_bp.route('/createDeck', methods=['POST'])
def create_deck():
    data = request.get_json()
    if not data or 'username' not in data or 'deckName' not in data or 'cards' not in data:
        return jsonify({"error": "Invalid input"}), 400
    
    username = data['username']
    deck_name = data['deckName']
    cards = data['cards']
    ride_deck = data.get('rideDeck', [])
    deck_format = data.get('format', 'Standard')
    deck_type = data.get('deckType', 'Standard')
    description = data.get('description', '')
    
    # Save the deck
    deck_id = save_deck(username, deck_name, deck_format, deck_type, description)
    if not deck_id:
        return jsonify({"error": "Failed to save deck"}), 500
    
    # Save cards
    if not save_deck_cards(deck_id, cards):
        return jsonify({"error": "Failed to save deck cards"}), 500
    
    # Save ride deck if present
    if ride_deck and not save_ride_deck(deck_id, ride_deck):
        return jsonify({"error": "Failed to save ride deck"}), 500
    
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
