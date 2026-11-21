"""
Login sessions.

After a successful login the username is stored in Flask's session cookie,
which is signed with SECRET_KEY (so it can't be forged or edited by the
browser) and marked HttpOnly (so page scripts can't read it). Routes that act
on a user's data use `login_required` and read the user from `g.username`,
never from the request body.
"""

import os
import secrets
import sqlite3
from datetime import timedelta
from functools import wraps

from flask import g, jsonify, session

from database.db_config import DB_PATH

SESSION_LIFETIME = timedelta(days=30)
_SECRET_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".secret_key")


def _load_secret_key():
    """
    SECRET_KEY from the environment (.env) if set; otherwise a random key that
    is generated once and kept in backend/.secret_key (gitignored), so logins
    survive restarts. Each machine gets its own key.
    """
    key = os.environ.get("SECRET_KEY")
    if key:
        return key
    if os.path.exists(_SECRET_FILE):
        with open(_SECRET_FILE, encoding="utf-8") as f:
            key = f.read().strip()
        if key:
            return key
    key = secrets.token_hex(32)
    with open(_SECRET_FILE, "w", encoding="utf-8") as f:
        f.write(key)
    return key


def init_sessions(app):
    app.config.update(
        SECRET_KEY=_load_secret_key(),
        SESSION_COOKIE_HTTPONLY=True,
        # Lax: the cookie isn't sent on cross-site POST/DELETE requests, which
        # blocks other websites from acting as a logged-in user (CSRF).
        SESSION_COOKIE_SAMESITE="Lax",
        # Set SESSION_COOKIE_SECURE=1 in .env when the app is only used over https.
        SESSION_COOKIE_SECURE=os.environ.get("SESSION_COOKIE_SECURE", "").lower() in ("1", "true", "yes"),
        PERMANENT_SESSION_LIFETIME=SESSION_LIFETIME,
    )


def log_in(username):
    session.clear()
    session.permanent = True
    session["username"] = username


def log_out():
    session.clear()


def current_user():
    """The logged-in username, or None. Sessions of deleted accounts don't count."""
    username = session.get("username")
    if not username:
        return None
    conn = sqlite3.connect(DB_PATH)
    try:
        row = conn.execute("SELECT username FROM users WHERE username = ?", (username,)).fetchone()
    finally:
        conn.close()
    if row is None:
        session.clear()
        return None
    return row[0]


def login_required(view):
    @wraps(view)
    def wrapper(*args, **kwargs):
        username = current_user()
        if not username:
            return jsonify({"error": "Please log in first"}), 401
        g.username = username
        return view(*args, **kwargs)
    return wrapper


def _owner(query, item_id):
    conn = sqlite3.connect(DB_PATH)
    try:
        row = conn.execute(query, (item_id,)).fetchone()
    finally:
        conn.close()
    return row[0] if row else None


def deck_owner(deck_id):
    return _owner("SELECT username FROM decks WHERE deck_id = ?", deck_id)


def tournament_owner(tournament_id):
    return _owner("SELECT username FROM tournaments WHERE id = ?", tournament_id)


def forbidden_unless_owner(owner, what):
    """Return an error response if the item is missing or not the user's, else None."""
    if owner is None:
        return jsonify({"error": f"{what} not found"}), 404
    if owner != g.username:
        return jsonify({"error": f"You can only access your own {what.lower()}s"}), 403
    return None
