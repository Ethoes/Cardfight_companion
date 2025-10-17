from flask import Blueprint, jsonify, request
from database.DatabaseService import get_data_from_db, search_card, get_sets_by_format
import base64

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
