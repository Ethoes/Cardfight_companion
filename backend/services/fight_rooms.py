"""In-memory cardfight rooms.

A room holds at most two players. Once the second player joins, the room is
"playing" and nobody else can join. The game itself is synchronised as an
ordered action log: clients append the (deterministic) game-engine actions they
perform and long-poll for new ones, so every client replays the same log into
the same game state.

State lives in this process only, so it is lost on restart and requires a
single backend process (which is how app.py runs Flask).
"""

import random
import secrets
import threading
import time

MAX_PLAYERS = 2
MAX_LOG = 20000                 # safety cap on actions per room
WAITING_TIMEOUT = 25            # s: a waiting room vanishes if its host stops polling
PLAYING_TIMEOUT = 60 * 60       # s: a game nobody has touched for an hour is dropped
CLOSED_TIMEOUT = 5 * 60         # s: closed rooms linger so the other player sees why

_lock = threading.Lock()
_rooms = {}


class RoomError(Exception):
    def __init__(self, message, status=400):
        super().__init__(message)
        self.message = message
        self.status = status


class Room:
    def __init__(self, name):
        self.id = secrets.token_urlsafe(6)
        self.name = name
        self.status = 'waiting'          # waiting -> playing -> closed
        self.players = []                # [{id, username, deckId, token, lastSeen}]
        self.setup = None                # {seeds: {p1, p2}, firstPlayerId}
        self.log = []                    # [{seq, playerId, clientId, action}]
        self.closed_reason = None
        self.created = time.time()
        self.updated = time.time()
        self.cond = threading.Condition(_lock)

    # -- helpers ---------------------------------------------------------
    def player_by_token(self, token):
        return next((p for p in self.players if p['token'] == token), None)

    def touch(self, player=None):
        now = time.time()
        self.updated = now
        if player:
            player['lastSeen'] = now

    def public(self, viewer=None):
        """Room info safe to send to clients (no tokens)."""
        now = time.time()
        return {
            'id': self.id,
            'name': self.name,
            'status': self.status,
            'closedReason': self.closed_reason,
            'players': [
                {
                    'id': p['id'],
                    'username': p['username'],
                    'deckId': p['deckId'],
                    'deckName': p.get('deckName'),
                    'connected': now - p['lastSeen'] < 15,
                }
                for p in self.players
            ],
            'setup': self.setup,
            'you': viewer['id'] if viewer else None,
            'logLength': len(self.log),
        }


def _prune():
    """Drop abandoned rooms. Caller holds the lock."""
    now = time.time()
    for room_id, room in list(_rooms.items()):
        if room.status == 'waiting':
            host = room.players[0] if room.players else None
            if not host or now - host['lastSeen'] > WAITING_TIMEOUT:
                del _rooms[room_id]
        elif room.status == 'playing':
            if now - room.updated > PLAYING_TIMEOUT:
                del _rooms[room_id]
        elif now - room.updated > CLOSED_TIMEOUT:
            del _rooms[room_id]


def _get(room_id):
    room = _rooms.get(room_id)
    if not room:
        raise RoomError('This room no longer exists.', 404)
    return room


def _auth(room, token):
    player = room.player_by_token(token)
    if not player:
        raise RoomError('You are not a player in this room.', 403)
    return player


def _new_player(player_id, username, deck_id, deck_name):
    return {
        'id': player_id,
        'username': username,
        'deckId': deck_id,
        'deckName': deck_name,
        'token': secrets.token_urlsafe(16),
        'lastSeen': time.time(),
    }


# -- public API ------------------------------------------------------------

def list_open_rooms():
    with _lock:
        _prune()
        return [r.public() for r in sorted(_rooms.values(), key=lambda r: -r.created)
                if r.status == 'waiting']


def create_room(name, username, deck_id, deck_name=None):
    name = (name or '').strip()[:60]
    if not name:
        raise RoomError('Give your room a name.')
    if not username:
        raise RoomError('You need to be logged in.')
    if deck_id is None:
        raise RoomError('Choose a deck first.')
    with _lock:
        _prune()
        room = Room(name)
        player = _new_player('p1', username, deck_id, deck_name)
        room.players.append(player)
        _rooms[room.id] = room
        return room.public(player), player['token']


def join_room(room_id, username, deck_id, deck_name=None):
    if not username:
        raise RoomError('You need to be logged in.')
    if deck_id is None:
        raise RoomError('Choose a deck first.')
    with _lock:
        _prune()
        room = _get(room_id)
        if room.status != 'waiting' or len(room.players) >= MAX_PLAYERS:
            raise RoomError('This room is already full.', 409)
        player = _new_player('p2', username, deck_id, deck_name)
        room.players.append(player)
        # Room is full: lock it and set up the game.
        room.status = 'playing'
        room.setup = {
            'seeds': {p['id']: random.randrange(2 ** 32) for p in room.players},
            'firstPlayerId': random.choice([p['id'] for p in room.players]),
        }
        room.touch(player)
        room.cond.notify_all()
        return room.public(player), player['token']


def get_room(room_id, token):
    with _lock:
        room = _get(room_id)
        player = _auth(room, token)
        room.touch(player)
        return room.public(player)


def leave_room(room_id, token):
    with _lock:
        room = _rooms.get(room_id)
        if not room:
            return
        player = room.player_by_token(token)
        if not player:
            return
        if room.status == 'waiting':
            del _rooms[room_id]
            return
        if room.status == 'playing':
            room.status = 'closed'
            room.closed_reason = f"{player['username']} left the cardfight."
            room.touch()
            room.cond.notify_all()


def post_actions(room_id, token, actions):
    """Append actions ([{clientId, action}]) to the log. Returns the new length."""
    if not isinstance(actions, list) or not actions:
        raise RoomError('No actions given.')
    with _lock:
        room = _get(room_id)
        player = _auth(room, token)
        if room.status != 'playing':
            raise RoomError('This cardfight is over.', 409)
        if len(room.log) + len(actions) > MAX_LOG:
            raise RoomError('This cardfight has too many actions.', 409)
        for entry in actions:
            if not isinstance(entry, dict) or not isinstance(entry.get('action'), dict):
                raise RoomError('Malformed action.')
            room.log.append({
                'seq': len(room.log),
                'playerId': player['id'],
                'clientId': entry.get('clientId'),
                'action': entry['action'],
            })
        room.touch(player)
        room.cond.notify_all()
        return len(room.log)


def wait_for_actions(room_id, token, since, timeout=20):
    """Long-poll: returns log entries from `since` once there are any (or on timeout)."""
    deadline = time.time() + min(max(timeout, 0), 25)
    with _lock:
        room = _get(room_id)
        player = _auth(room, token)
        room.touch(player)
        while len(room.log) <= since and room.status == 'playing':
            remaining = deadline - time.time()
            if remaining <= 0:
                break
            room.cond.wait(remaining)
            if _rooms.get(room_id) is not room:
                raise RoomError('This room no longer exists.', 404)
        room.touch(player)
        return {
            'entries': room.log[since:],
            'room': room.public(player),
        }
