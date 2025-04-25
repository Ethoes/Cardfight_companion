from flask import Flask, jsonify, request, send_file, abort
from flask_cors import CORS
from DatabaseService import get_data_from_db, get_image_path_by_id, create_user, validate_user, search_card, save_deck, save_deck_cards, get_decks_by_username, get_cards_by_deck_id
import os
import mimetypes

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
# app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 MB

@app.route('/hello', methods=['GET'])
def hello():
    return "Hello, World!"

@app.route('/data', methods=['POST'])
def get_data():
    data = request.get_json()
    if not data or 'query' not in data or not isinstance(data['query'], str):
        return jsonify({"error": "Invalid input"}), 400
    query = data['query']
    result = get_data_from_db(query)
    return jsonify(result)

@app.route('/card/<int:card_id>/image', methods=['GET'])
def get_card_image(card_id):
    image_path = get_image_path_by_id(card_id)
    if not image_path:
        return abort(404, description="Image not found")
    image_path = "Z:\\cfv stuffs\\Cardfight_companion\\database\\images\\" + image_path
    if image_path and os.path.exists(image_path):
        mime_type, _ = mimetypes.guess_type(image_path)
        return send_file(image_path, mimetype=mime_type)
    else:
        return abort(404, description="Image not found" + str(image_path))

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
    card_ids = [card['id'] for card in data['deck']]

    try:
        # Save the deck and get the deck_id
        deck_id = save_deck(deck_name, username, description)
        if not deck_id:
            return jsonify({"error": "Failed to save deck"}), 500

        # Save the cards associated with the deck
        if not save_deck_cards(deck_id, card_ids):
            return jsonify({"error": "Failed to save deck cards"}), 500

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

    result = search_card(name, nation, grade, unitType)  # Pass grade to the search_card function
    if result:
        # Convert sqlite3.Row objects to dictionaries
        result = [dict(row) for row in result]

        # Add images to each row in the result
        for row in result:
            if 'id' in row:  # Assuming each row has an 'id' field
                image = get_image(row['id'])
                if image:
                    row['image'] = image
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

@app.route('/decks/<int:deck_id>/cards', methods=['GET'])
def get_deck_cards(deck_id):
    try:
        # Query the database for cards associated with the deck_id
        cards = get_cards_by_deck_id(deck_id)
        if not cards:
            return jsonify({"error": "No cards found for this deck"}), 404

        # Add images to each card
        for card in cards:
            if 'id' in card:  # Assuming each card has an 'id' field
                image = get_image(card['id'])
                if image:
                    card['image'] = image

        return jsonify(cards), 200
    except Exception as e:
        print(f"[ERROR] Failed to get cards for deck ID {deck_id}: {e}")
        return jsonify({"error": "Failed to retrieve cards"}), 500
    
    
def get_image(card_id):
    try:
        # Retrieve the image path
        image_path = get_image_path_by_id(card_id)
        if not image_path:
            print(f"[ERROR] No image path found for card ID: {card_id}")
            return None

        # Construct the full image path
        image_path = "Z:\\cfv stuffs\\Cardfight_companion\\database\\images\\" + image_path

        # Check if the file exists and read it
        with open(image_path, 'rb') as image_file:
            import base64
            encoded_image = base64.b64encode(image_file.read()).decode('utf-8')
            return encoded_image
    except FileNotFoundError:
        print(f"[ERROR] Image file not found: {image_path}")
        return None
    except Exception as e:
        print(f"[ERROR] Unexpected error while retrieving image for card ID {card_id}: {e}")
        return None


if __name__ == '__main__':
    app.run(debug=True)