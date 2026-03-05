"""
seed.py — Run this once to populate the database from the MovieLens CSVs.

What it does:
  1. Creates all tables (via db.create_tables)
  2. Imports movies + links → movies table
  3. Imports ratings → ratings table (using MovieLens userId directly)
  4. Imports tags    → tags table
  5. Creates one user account per unique userId in the ratings CSV
     username: user_1 ... user_610
     password: demo123  (same for all, hashed with werkzeug)

Safe to re-run: INSERT OR IGNORE skips rows that already exist.
"""

import sqlite3
import pandas as pd
from werkzeug.security import generate_password_hash
from db import DB_PATH, create_tables

DEMO_PASSWORD = 'demo123'


def seed():
    create_tables()

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # ------------------------------------------------------------------ #
    # 1. Movies
    # ------------------------------------------------------------------ #
    print("🎬 Seeding movies...")
    movies = pd.read_csv('ml-latest-small/movies.csv')
    links  = pd.read_csv('ml-latest-small/links.csv')[['movieId', 'tmdbId']].dropna()
    links['tmdbId'] = links['tmdbId'].astype(int)
    movies = movies.merge(links, on='movieId', how='left')

    for _, row in movies.iterrows():
        tmdb_id = int(row['tmdbId']) if pd.notna(row.get('tmdbId')) else None
        cursor.execute(
            'INSERT OR IGNORE INTO movies (movie_id, title, genres, tmdb_id) VALUES (?, ?, ?, ?)',
            (int(row['movieId']), row['title'], row['genres'], tmdb_id)
        )

    print(f"   → {len(movies)} movies inserted")

    # ------------------------------------------------------------------ #
    # 2. Ratings
    # ------------------------------------------------------------------ #
    print("⭐ Seeding ratings...")
    ratings = pd.read_csv('ml-latest-small/ratings.csv')

    for _, row in ratings.iterrows():
        cursor.execute(
            'INSERT OR IGNORE INTO ratings (user_id, movie_id, rating, timestamp) VALUES (?, ?, ?, ?)',
            (int(row['userId']), int(row['movieId']), float(row['rating']), int(row['timestamp']))
        )

    print(f"   → {len(ratings)} ratings inserted")

    # ------------------------------------------------------------------ #
    # 3. Tags
    # ------------------------------------------------------------------ #
    print("🏷️  Seeding tags...")
    tags = pd.read_csv('ml-latest-small/tags.csv')

    for _, row in tags.iterrows():
        cursor.execute(
            'INSERT OR IGNORE INTO tags (user_id, movie_id, tag, timestamp) VALUES (?, ?, ?, ?)',
            (int(row['userId']), int(row['movieId']), str(row['tag']), int(row['timestamp']))
        )

    print(f"   → {len(tags)} tags inserted")

    # ------------------------------------------------------------------ #
    # 4. Users
    # We create one account for every unique userId that appears in ratings.
    # The MovieLens userId becomes our user's primary key directly — so
    # ratings already link to the right user without any remapping.
    # ------------------------------------------------------------------ #
    print("👤 Seeding users...")
    unique_user_ids = ratings['userId'].unique()
    hashed_password = generate_password_hash(DEMO_PASSWORD)

    for user_id in unique_user_ids:
        cursor.execute(
            '''INSERT OR IGNORE INTO users (id, username, password_hash)
               VALUES (?, ?, ?)''',
            (int(user_id), f'user_{user_id}', hashed_password)
        )

    print(f"   → {len(unique_user_ids)} users created (password: '{DEMO_PASSWORD}')")

    conn.commit()
    conn.close()
    print("\n🎉 Database seeded successfully!")
    print(f"   DB file: {DB_PATH}")


if __name__ == '__main__':
    seed()
