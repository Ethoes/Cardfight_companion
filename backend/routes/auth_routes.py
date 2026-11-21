from flask import Blueprint, jsonify, request
from database.auth_service import AuthError, create_user, validate_user
from session_auth import current_user, log_in, log_out

auth_bp = Blueprint('auth', __name__)


def _credentials():
    data = request.get_json(silent=True) or {}
    username, password = data.get('username'), data.get('password')
    if not isinstance(username, str) or not isinstance(password, str):
        return None, None
    return username, password


@auth_bp.route('/register', methods=['POST'])
def register():
    username, password = _credentials()
    if username is None:
        return jsonify({"error": "Username and password are required"}), 400
    try:
        create_user(username, password)
    except AuthError as e:
        return jsonify({"error": e.message}), e.status
    except Exception as e:
        print(f"[ERROR] Registration failed: {e}")
        return jsonify({"error": "User creation failed"}), 500
    return jsonify({"message": "User created successfully"}), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    username, password = _credentials()
    if username is None:
        return jsonify({"error": "Username and password are required"}), 400
    stored_username = validate_user(username, password)
    if stored_username:
        log_in(stored_username)
        return jsonify({"message": "Login successful", "username": stored_username}), 200
    return jsonify({"error": "Invalid username or password"}), 401


@auth_bp.route('/logout', methods=['POST'])
def logout():
    log_out()
    return jsonify({"message": "Logged out"}), 200


@auth_bp.route('/me', methods=['GET'])
def me():
    """Who is logged in on this browser (used when the app loads)."""
    username = current_user()
    if not username:
        return jsonify({"error": "Not logged in"}), 401
    return jsonify({"username": username}), 200
