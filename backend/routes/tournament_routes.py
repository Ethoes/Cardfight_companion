from flask import Blueprint, jsonify, request
from DatabaseService import (
    save_tournament, get_tournaments_by_username,
    save_tournament_details, get_tournament_details_with_deck
)

tournament_bp = Blueprint('tournament', __name__)


@tournament_bp.route('/createTournament', methods=['POST'])
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


@tournament_bp.route('/tournaments', methods=['POST'])
def get_tournaments():
    data = request.get_json()
    if not data or 'username' not in data:
        return jsonify({"error": "Invalid input"}), 400
    
    username = data['username']
    tournaments = get_tournaments_by_username(username)
    if tournaments is not None:
        return jsonify(tournaments), 200
    else:
        return jsonify({"error": "Failed to fetch tournaments"}), 500


@tournament_bp.route('/saveTournamentDetails', methods=['POST'])
def save_tournament_details_route():
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


@tournament_bp.route('/tournamentDetails', methods=['POST'])
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
