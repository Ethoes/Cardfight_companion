"""Cardfight rooms: create / join / leave, plus the synchronised action log.

See services/fight_rooms.py for how a match is kept in sync.
"""

from flask import Blueprint, g, jsonify, request

from services import fight_rooms
from services.fight_rooms import RoomError
from session_auth import login_required

fight_bp = Blueprint('fight', __name__)


def _error(e):
    return jsonify({'error': e.message}), e.status


def _token():
    return request.headers.get('X-Room-Token') or request.args.get('token')


@fight_bp.route('/fight/rooms', methods=['GET'])
def list_rooms():
    return jsonify({'rooms': fight_rooms.list_open_rooms()})


@fight_bp.route('/fight/rooms', methods=['POST'])
@login_required
def create_room():
    data = request.get_json(silent=True) or {}
    try:
        room, token = fight_rooms.create_room(
            data.get('name'), g.username, data.get('deckId'), data.get('deckName'))
        return jsonify({'room': room, 'token': token}), 201
    except RoomError as e:
        return _error(e)


@fight_bp.route('/fight/rooms/<room_id>/join', methods=['POST'])
@login_required
def join_room(room_id):
    data = request.get_json(silent=True) or {}
    try:
        room, token = fight_rooms.join_room(
            room_id, g.username, data.get('deckId'), data.get('deckName'))
        return jsonify({'room': room, 'token': token})
    except RoomError as e:
        return _error(e)


@fight_bp.route('/fight/rooms/<room_id>', methods=['GET'])
def get_room(room_id):
    try:
        return jsonify({'room': fight_rooms.get_room(room_id, _token())})
    except RoomError as e:
        return _error(e)


@fight_bp.route('/fight/rooms/<room_id>/leave', methods=['POST'])
def leave_room(room_id):
    fight_rooms.leave_room(room_id, _token())
    return jsonify({'ok': True})


@fight_bp.route('/fight/rooms/<room_id>/actions', methods=['POST'])
def post_actions(room_id):
    data = request.get_json(silent=True) or {}
    try:
        length = fight_rooms.post_actions(room_id, _token(), data.get('actions'))
        return jsonify({'logLength': length})
    except RoomError as e:
        return _error(e)


@fight_bp.route('/fight/rooms/<room_id>/actions', methods=['GET'])
def get_actions(room_id):
    try:
        since = max(int(request.args.get('since', 0)), 0)
        timeout = float(request.args.get('wait', 20))
    except ValueError:
        return jsonify({'error': 'Bad query parameters.'}), 400
    try:
        return jsonify(fight_rooms.wait_for_actions(room_id, _token(), since, timeout))
    except RoomError as e:
        return _error(e)
