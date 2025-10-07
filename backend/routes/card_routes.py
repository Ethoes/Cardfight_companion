from flask import Blueprint, jsonify, request
from DatabaseService import get_data_from_db, search_card, get_sets_by_format

card_bp = Blueprint('card', __name__)


@card_bp.route('/data', methods=['POST'])
def get_data():
    data = request.get_json()
    if not data or 'query' not in data or not isinstance(data['query'], str):
        return jsonify({"error": "Invalid input"}), 400
    query = data['query']
    result = get_data_from_db(query + " LIMIT 300")  # Add LIMIT 300 to the query
    return jsonify(result)


@card_bp.route('/search', methods=['POST'])
def search():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid input"}), 400
    
    # Extract search parameters
    card_name = data.get('cardName', '')
    card_type = data.get('cardType', '')
    clan = data.get('clan', '')
    format_filter = data.get('format', '')
    grade = data.get('grade', '')
    
    # Call the search function
    cards = search_card(card_name, card_type, clan, format_filter, grade)
    
    if cards is None:
        return jsonify({"error": "Search failed"}), 500
    
    return jsonify(cards)


@card_bp.route('/sets', methods=['GET'])
def get_sets():
    format_param = request.args.get('format')
    if not format_param:
        return jsonify({"error": "Format parameter is required"}), 400
    
    try:
        sets = get_sets_by_format(format_param)
        return jsonify(sets)
    except Exception as e:
        print(f"[ERROR] Failed to fetch sets: {e}")
        return jsonify({"error": "Failed to fetch sets"}), 500
