import sqlite3
from flask import g

DB_PATH = 'movierecommender.db'


def get_db():
    """
    Returns a database connection scoped to the current Flask request.

    Flask's `g` object lives for exactly one request — it's created when a
    request comes in and torn down when the response is sent. By storing the
    connection there, we guarantee:
      - One connection per request (thread-safe)
      - The connection is always closed when the request ends (no leaks)

    `sqlite3.Row` makes rows behave like dicts: row['column'] instead of row[0].
    """
    if 'db' not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
    return g.db


def close_db(e=None):
    """Called automatically at the end of every request (registered in init_app)."""
    db = g.pop('db', None)
    if db is not None:
        db.close()


def init_app(app):
    """
    Register close_db so Flask calls it after every request automatically.
    Call this once in app.py during setup.
    """
    app.teardown_appcontext(close_db)


def create_tables():
    """
    Creates all tables if they don't already exist.
    `IF NOT EXISTS` makes this safe to run multiple times — it won't
    wipe data if the tables are already there.
    """
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # --- Users ---
    # password_hash: we never store the real password, only the bcrypt hash
    # created_at: auto-filled by SQLite using the current UTC time
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            username      TEXT    NOT NULL UNIQUE,
            password_hash TEXT    NOT NULL,
            created_at    TEXT    DEFAULT (datetime('now'))
        )
    ''')

    # --- Movies ---
    # tmdb_id can be NULL (not every MovieLens movie maps to TMDB)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS movies (
            movie_id  INTEGER PRIMARY KEY,
            title     TEXT    NOT NULL,
            genres    TEXT,
            tmdb_id   INTEGER
        )
    ''')

    # --- Ratings ---
    # Composite primary key: one user can only rate one movie once
    # FOREIGN KEY ties every rating to a real user and a real movie
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS ratings (
            user_id    INTEGER NOT NULL,
            movie_id   INTEGER NOT NULL,
            rating     REAL    NOT NULL,
            timestamp  INTEGER,
            PRIMARY KEY (user_id, movie_id),
            FOREIGN KEY (user_id)  REFERENCES users(id),
            FOREIGN KEY (movie_id) REFERENCES movies(movie_id)
        )
    ''')

    # --- Tags ---
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS tags (
            user_id    INTEGER NOT NULL,
            movie_id   INTEGER NOT NULL,
            tag        TEXT    NOT NULL,
            timestamp  INTEGER,
            FOREIGN KEY (user_id)  REFERENCES users(id),
            FOREIGN KEY (movie_id) REFERENCES movies(movie_id)
        )
    ''')

    conn.commit()
    conn.close()
    print("✅ Tables created (or already existed)")
