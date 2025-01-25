from flask import Flask, jsonify, request, send_file, abort
from flask_cors import CORS
from DatabaseService import get_data_from_db, get_image_path_by_id, create_user, validate_user
import os
import mimetypes

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
    result = get_data_from_db(query)
    return jsonify(result)

@app.route('/card/<int:card_id>/image', methods=['GET'])
def get_card_image(card_id):
    image_path = get_image_path_by_id(card_id)
    if not image_path:
        return abort(404, description="Image not found")
    image_path = "C:\\Users\\Calvin\\python filed\\" + image_path
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

if __name__ == '__main__':
    app.run(debug=True)