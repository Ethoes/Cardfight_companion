from flask import Blueprint, jsonify

misc_bp = Blueprint('misc', __name__)


@misc_bp.route('/hello', methods=['GET'])
def hello():
    return "Hello, World!"


@misc_bp.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "message": "API is running"})
