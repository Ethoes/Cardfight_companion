from flask import Blueprint, jsonify, request
from DatabaseService import (
    save_tournament, get_tournaments_by_username,
    save_tournament_details, get_tournament_details_with_deck
)

tournament_bp = Blueprint('tournament', __name__)


@tournament_bp.route('/createTournament', methods=['POST'])
def create_tournament():
    data = request.get_json()
    if not data or 'username' not in data or 'tournamentName' not in data:
        return jsonify({"error": "Invalid input"}), 400
    
    username = data['username']
    tournament_name = data['tournamentName']
    location = data.get('location', '')
    date = data.get('date', '')
    format_type = data.get('format', 'Standard')
    
    tournament_id = save_tournament(username, tournament_name, location, date, format_type)
    if tournament_id:
        return jsonify({"message": "Tournament created successfully", "tournament_id": tournament_id}), 201
    else:
        return jsonify({"error": "Tournament creation failed"}), 500


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
    if not data:
        return jsonify({"error": "Invalid input"}), 400
    
    tournament_id = data.get('tournamentId')
    deck_id = data.get('deckId')
    placement = data.get('placement')
    notes = data.get('notes', '')
    
    if not all([tournament_id, deck_id, placement]):
        return jsonify({"error": "Missing required fields"}), 400
    
    success = save_tournament_details(tournament_id, deck_id, placement, notes)
    if success:
        return jsonify({"message": "Tournament details saved successfully"}), 200
    else:
        return jsonify({"error": "Failed to save tournament details"}), 500


@tournament_bp.route('/tournamentDetails', methods=['POST'])
def get_tournament_details():
    data = request.get_json()
    if not data or 'tournamentId' not in data:
        return jsonify({"error": "Invalid input"}), 400
    
    tournament_id = data['tournamentId']
    
    try:
        details = get_tournament_details_with_deck(tournament_id)
        if details:
            return jsonify(details), 200
        else:
            return jsonify({"error": "Tournament details not found"}), 404
    except Exception as e:
        print(f"[ERROR] Failed to fetch tournament details: {e}")
        return jsonify({"error": "Failed to fetch tournament details"}), 500
