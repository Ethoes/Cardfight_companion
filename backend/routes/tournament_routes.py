from flask import Blueprint, g, jsonify, request
from database.DatabaseService import (
    save_tournament, get_tournaments_by_username,
    save_tournament_details, get_tournament_details_with_deck,
    delete_tournament_by_id
)
from session_auth import login_required, tournament_owner, forbidden_unless_owner

tournament_bp = Blueprint('tournament', __name__)

# Tournament notes are private: every route needs a login, and anything that
# touches one tournament checks it belongs to the logged-in user.


@tournament_bp.route('/createTournament', methods=['POST'])
@login_required
def create_tournament():
    data = request.get_json(silent=True)
    if not data or 'name' not in data or 'description' not in data or 'deck_id' not in data:
        return jsonify({"error": "Invalid input"}), 400

    try:
        tournament_id = save_tournament(data['name'], data['description'], data['deck_id'], g.username)
        if not tournament_id:
            return jsonify({"error": "Failed to create tournament"}), 500

        return jsonify({"message": "Tournament created successfully", "tournament_id": tournament_id}), 201
    except Exception as e:
        print(f"[ERROR] Failed to create tournament: {e}")
        return jsonify({"error": "Failed to create tournament"}), 500


@tournament_bp.route('/tournaments', methods=['POST'])
@login_required
def get_tournaments():
    tournaments = get_tournaments_by_username(g.username)
    if tournaments is not None:
        return jsonify(tournaments), 200
    return jsonify({"error": "Failed to fetch tournaments"}), 500


@tournament_bp.route('/saveTournamentDetails', methods=['POST'])
@login_required
def save_tournament_details_route():
    data = request.get_json(silent=True)
    if not data or 'tournament_id' not in data or 'match_number' not in data or 'opponent_deck_name' not in data or 'match_result' not in data:
        return jsonify({"error": "Invalid input"}), 400

    tournament_id = data['tournament_id']
    denied = forbidden_unless_owner(tournament_owner(tournament_id), "Tournament")
    if denied:
        return denied

    try:
        result = save_tournament_details(
            tournament_id, data['match_number'], data['opponent_deck_name'],
            data.get('opponent_deck_log'), data['match_result'], data.get('match_notes'))
        if result:
            return jsonify({"message": "Tournament details saved successfully"}), 201
        return jsonify({"error": "Failed to save tournament details"}), 500
    except Exception as e:
        print(f"[ERROR] Failed to save tournament details: {e}")
        return jsonify({"error": "Failed to save tournament details"}), 500


@tournament_bp.route('/tournamentDetails', methods=['POST'])
@login_required
def get_tournament_details():
    data = request.get_json(silent=True)
    if not data or 'tournament_id' not in data:
        return jsonify({"error": "Invalid input"}), 400

    tournament_id = data['tournament_id']
    denied = forbidden_unless_owner(tournament_owner(tournament_id), "Tournament")
    if denied:
        return denied

    try:
        details = get_tournament_details_with_deck(tournament_id)
        if details is not None:
            return jsonify(details), 200
        return jsonify({"error": "Failed to fetch tournament details"}), 500
    except Exception as e:
        print(f"[ERROR] Failed to fetch tournament details: {e}")
        return jsonify({"error": "Failed to fetch tournament details"}), 500


@tournament_bp.route('/tournaments/<int:tournament_id>', methods=['DELETE'])
@login_required
def delete_tournament(tournament_id):
    denied = forbidden_unless_owner(tournament_owner(tournament_id), "Tournament")
    if denied:
        return denied
    try:
        if delete_tournament_by_id(tournament_id):
            return jsonify({"message": "Tournament deleted successfully"}), 200
        return jsonify({"error": "Failed to delete tournament"}), 500
    except Exception as e:
        print(f"[ERROR] Failed to delete tournament ID {tournament_id}: {e}")
        return jsonify({"error": "Failed to delete tournament"}), 500
