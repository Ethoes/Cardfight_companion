from flask import Flask, jsonify, request, abort
from flask_cors import CORS
from DatabaseService import (
    get_data_from_db, create_user, validate_user, search_card, save_deck, save_ride_deck,
    save_deck_cards, get_decks_by_username, get_cards_by_deck_id, get_ride_deck_by_deck_id,
    get_sets_by_format, save_tournament, get_tournaments_by_username,
    save_tournament_details,  get_tournament_details_with_deck # Import the new function
)
import base64
from cardmarketApi import calculate_deck_cost

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes


@app.route('/hello', methods=['GET'])
def hello():
    return "Hello, World!"


@app.route('/data', methods=['POST'])
def get_data():
    data = request.get_json()
    if not data or 'query' not in data or not isinstance(data['query'], str):
        return jsonify({"error": "Invalid input"}), 400
    query = data['query']
    result = get_data_from_db(query + " LIMIT 300")  # Add LIMIT 300 to the query
    return jsonify(result)

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data or 'username' not in data or 'password' not in data:
        return jsonify({"error": "Invalid input"}), 400
    username = data['username']
    password = data['password']
    result = create_user(username, password)
    if result:
        return jsonify({"message": "User created successfully"}), 201
    else:
        return jsonify({"error": "User creation failed"}), 500


@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or 'username' not in data or 'password' not in data:
        return jsonify({"error": "Invalid input"}), 400
    username = data['username']
    password = data['password']
    if validate_user(username, password):
        return jsonify({"message": "Login successful"}), 200
    else:
        return jsonify({"error": "Invalid username or password"}), 401


@app.route('/createDeck', methods=['POST'])
def createDeck():
    data = request.get_json()
    if not data or 'name' not in data or 'deck' not in data or 'user' not in data or 'description' not in data:
        return jsonify({"error": "Invalid input"}), 400

    deck_name = data['name']
    username = data['user']
    description = data['description']
    format = data.get('format', None)
    ride_deck = data.get('rideDeck', None)
    card_ids = [card['id'] for card in data['deck']]

    try:
        # Save the deck and get the deck_id
        deck_id = save_deck(deck_name, username, description, format)
        if not deck_id:
            return jsonify({"error": "Failed to save deck"}), 500

        # Save the cards associated with the deck
        if not save_deck_cards(deck_id, card_ids):
            return jsonify({"error": "Failed to save deck cards"}), 500
        
        # Save ride deck if provided (Standard format only)
        if format == 'Standard' and ride_deck:
            if not save_ride_deck(deck_id, ride_deck):
                return jsonify({"error": "Failed to save ride deck"}), 500

        return jsonify({"message": "Deck creation successful", "deck_id": deck_id}), 200
    except Exception as e:
        print(f"[ERROR] {e}")
        return jsonify({"error": "Failed to create deck"}), 500


@app.route('/search', methods=['POST'])
def search():
    print("[INFO] Search endpoint called")
    data = request.get_json()
    if not data or 'name' not in data or 'nation' not in data:
        return jsonify({"error": "Invalid input"}), 400

    name = data['name']
    nation = data['nation']
    grade = data.get('grade', None)  # Get the grade parameter if provided
    unitType = data.get('unitType', None)  # Get the unitType parameter if provided
    format = data.get('format', None) 
    clan = data.get('clan', None)  # Get the clan parameter if provided
    set = data.get('selectedSet', None)  # Get the selectedSets parameter if provided

    result = search_card(name, nation, grade, unitType, format, clan, set)  # Pass grade to the search_card function
    if result:
        # Convert sqlite3.Row objects to dictionaries
        result = [dict(row) for row in result]

        # Add images to each row in the result
        for row in result:
            if 'image_data' in row and row['image_data']:  # Check if 'image_data' exists and is not None
                row['image'] = base64.b64encode(row['image_data']).decode('utf-8')  # Encode to Base64
                del row['image_data']  # Remove the raw binary data from the response
        return jsonify(result), 200
    else:
        return jsonify({"error": "No results found"}), 404


@app.route('/decks', methods=['POST'])
def get_decks():
    data = request.get_json()
    if not data or 'username' not in data:
        return jsonify({"error": "Invalid input"}), 400

    username = data['username']
    decks = get_decks_by_username(username)
    if not decks:
        return jsonify({"error": "No decks found"}), 404

    return jsonify(decks), 200

@app.route('/sets', methods=['GET'])
def get_sets():
    format = request.args.get('format')  # Get the format parameter from the query string
    try:
        sets = get_sets_by_format(format)  # Call the function from DatabaseService.py
        if sets is None:
            return jsonify({"error": "Failed to fetch sets"}), 500
        return jsonify(sets), 200
    except Exception as e:
        print(f"[ERROR] Failed to fetch sets: {e}")
        return jsonify({"error": "Failed to fetch sets"}), 500


@app.route('/decks/<int:deck_id>/cards', methods=['GET'])
def get_deck_cards(deck_id):
    try:
        # Query the database for cards associated with the deck_id
        cards = get_cards_by_deck_id(deck_id)
        if not cards:
            return jsonify({"error": "No cards found for this deck"}), 404

        # Add images to each card
        for card in cards:
            if 'image_data' in card and card['image_data']:  # Check if 'image_data' exists and is not None
                card['image'] = base64.b64encode(card['image_data']).decode('utf-8')  # Encode to Base64
                del card['image_data']  # Remove the raw binary data from the response

        return jsonify(cards), 200
    except Exception as e:
        print(f"[ERROR] Failed to get cards for deck ID {deck_id}: {e}")
        return jsonify({"error": "Failed to retrieve cards"}), 500
    
@app.route('/decks/<int:deck_id>/ride-deck', methods=['GET'])
def get_deck_ride_deck(deck_id):
    try:
        ride_deck_cards = get_ride_deck_by_deck_id(deck_id)
        return jsonify(ride_deck_cards), 200
    except Exception as e:
        print(f"[ERROR] Failed to get ride deck for deck ID {deck_id}: {e}")
        return jsonify({"error": "Failed to retrieve ride deck"}), 500
    
@app.route('/createTournament', methods=['POST'])
def create_tournament():
    data = request.get_json()
    if not data or 'name' not in data or 'description' not in data or 'deck_id' not in data or 'username' not in data:
        return jsonify({"error": "Invalid input"}), 400

    name = data['name']
    description = data['description']
    deck_id = data['deck_id']
    username = data['username']

    try:
        # Use the save_tournament function to save the tournament
        tournament_id = save_tournament(name, description, deck_id, username)
        if not tournament_id:
            return jsonify({"error": "Failed to create tournament"}), 500

        return jsonify({"message": "Tournament created successfully", "tournament_id": tournament_id}), 201
    except Exception as e:
        print(f"[ERROR] Failed to create tournament: {e}")
        return jsonify({"error": "Failed to create tournament"}), 500
    
@app.route('/tournaments', methods=['POST'])
def get_user_tournaments():
    data = request.get_json()
    if not data or 'username' not in data:
        return jsonify({"error": "Invalid input"}), 400

    username = data['username']

    try:
        tournaments = get_tournaments_by_username(username)
        return jsonify(tournaments), 200
    except Exception as e:
        print(f"[ERROR] Failed to fetch tournaments for user {username}: {e}")
        return jsonify({"error": "Failed to fetch tournaments"}), 500

@app.route('/saveTournamentDetails', methods=['POST'])
def save_tournament_details_endpoint():
    data = request.get_json()
    if not data or 'tournament_id' not in data or 'match_number' not in data or 'opponent_deck_name' not in data or 'match_result' not in data:
        return jsonify({"error": "Invalid input"}), 400

    tournament_id = data['tournament_id']
    match_number = data['match_number']
    opponent_deck_name = data['opponent_deck_name']
    opponent_deck_log = data.get('opponent_deck_log', None)
    match_result = data['match_result']
    match_notes = data.get('match_notes', None)

    try:
        result = save_tournament_details(tournament_id, match_number, opponent_deck_name, opponent_deck_log, match_result, match_notes)
        if result:
            return jsonify({"message": "Tournament details saved successfully"}), 201
        else:
            return jsonify({"error": "Failed to save tournament details"}), 500
    except Exception as e:
        print(f"[ERROR] Failed to save tournament details: {e}")
        return jsonify({"error": "Failed to save tournament details"}), 500
    
@app.route('/tournamentDetails', methods=['POST'])
def get_tournament_details():
    data = request.get_json()
    if not data or 'tournament_id' not in data:
        return jsonify({"error": "Invalid input"}), 400

    tournament_id = data['tournament_id']

    try:
        details = get_tournament_details_with_deck(tournament_id)
        if details is not None:
            return jsonify(details), 200
        else:
            return jsonify({"error": "Failed to fetch tournament details"}), 500
    except Exception as e:
        print(f"[ERROR] Failed to fetch tournament details: {e}")
        return jsonify({"error": "Failed to fetch tournament details"}), 500

if __name__ == '__main__':
    app.run(debug=True)