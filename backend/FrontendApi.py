from flask import Flask, jsonify, request, send_file, abort
from flask_cors import CORS
from DatabaseService import get_data_from_db, get_image_path_by_id, create_user, validate_user, search_card
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
    return jsonify({"message": "Deck creation succesful"}), 200
    
@app.route('/search', methods=['POST'])
def search():
    print("[INFO] Search endpoint called")
    data = request.get_json()
    if not data or 'name' not in data or 'nation' not in data:
        return jsonify({"error": "Invalid input"}), 400
    name = data['name']
    nation = data['nation']
    result = search_card(name, nation)
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