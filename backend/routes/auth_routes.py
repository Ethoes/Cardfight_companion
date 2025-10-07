from flask import Blueprint, jsonify, request
from DatabaseService import create_user, validate_user

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/register', methods=['POST'])
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


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or 'username' not in data or 'password' not in data:
        return jsonify({"error": "Invalid input"}), 400
    username = data['username']
    password = data['password']
    result = validate_user(username, password)
    if result:
        return jsonify({"message": "Login successful", "username": username}), 200
    else:
        return jsonify({"error": "Invalid credentials"}), 401
