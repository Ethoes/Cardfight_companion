import sqlite3

from werkzeug.security import check_password_hash, generate_password_hash

from .db_config import DB_PATH

MIN_PASSWORD_LENGTH = 8
MAX_USERNAME_LENGTH = 32

# Compared against when the username doesn't exist, so a failed login takes
# about as long for unknown users as for wrong passwords (no username probing
# through response timing).
_DUMMY_HASH = generate_password_hash("not-a-real-password")


class AuthError(Exception):
    """A registration problem that is safe to show to the user."""

    def __init__(self, message, status=400):
        super().__init__(message)
        self.message = message
        self.status = status


def normalize_username(username):
    return (username or "").strip()


def create_user(username, password):
    """
    Store a new user with a salted scrypt hash of the password (never the
    password itself). Raises AuthError for invalid input or a taken username.
    """
    username = normalize_username(username)
    password = password or ""

    if not username:
        raise AuthError("Username is required")
    if len(username) > MAX_USERNAME_LENGTH:
        raise AuthError(f"Username can be at most {MAX_USERNAME_LENGTH} characters")
    if len(password) < MIN_PASSWORD_LENGTH:
        raise AuthError(f"Password must be at least {MIN_PASSWORD_LENGTH} characters")

    password_hash = generate_password_hash(password)
    conn = sqlite3.connect(DB_PATH)
    try:
        # Usernames are unique regardless of case ("Calvin" and "calvin" clash).
        exists = conn.execute(
            "SELECT 1 FROM users WHERE username = ? COLLATE NOCASE", (username,)
        ).fetchone()
        if exists:
            raise AuthError("That username is already taken", status=409)
        conn.execute(
            "INSERT INTO users (username, password) VALUES (?, ?)", (username, password_hash)
        )
        conn.commit()
    except sqlite3.IntegrityError:
        raise AuthError("That username is already taken", status=409)
    finally:
        conn.close()
    return True


def validate_user(username, password):
    """
    Return the stored username (with its original capitalisation) when the
    password matches, otherwise None. Rows still holding a plain-text password
    from before hashing was added never match.
    """
    username = normalize_username(username)
    conn = sqlite3.connect(DB_PATH)
    try:
        row = conn.execute(
            "SELECT username, password FROM users WHERE username = ? COLLATE NOCASE",
            (username,),
        ).fetchone()
    finally:
        conn.close()

    if row is None:
        check_password_hash(_DUMMY_HASH, password or "")
        return None
    stored_username, password_hash = row
    if check_password_hash(password_hash, password or ""):
        return stored_username
    return None
