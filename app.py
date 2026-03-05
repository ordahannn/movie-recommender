#---------------------------- IMPORTS --------------------------------------------#
# for user auth
import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    jwt_required,
    get_jwt_identity
)
from werkzeug.security import check_password_hash
from sklearn.feature_extraction.text import TfidfVectorizer
import db

# for recommendation model
import sqlite3
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import MultiLabelBinarizer
from collections import Counter

app = Flask(__name__)

# CORS — allow the frontend origin (set FRONTEND_URL env var in production)
_frontend = os.environ.get('FRONTEND_URL', 'http://localhost:5173')
CORS(app, origins=[_frontend, 'http://127.0.0.1:5173'])

# JWT config — secret loaded from env var, fallback only for local dev
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'change-this-in-production-use-env-var')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = False

jwt = JWTManager(app)
db.init_app(app)

#---------------------------- LOAD DATA ------------------------------------------#
print("📊 Loding data from database...")
conn = sqlite3.connect('movierecommender.db')

# pd.read_sql() runs SQL query and puts the result into DataFrame
ratings = pd.read_sql('SELECT user_id, movie_id, rating, timestamp FROM ratings', conn)
movies = pd.read_sql('SELECT movie_id AS movieId, title, genres, tmdb_id AS tmdbId FROM movies', conn)

ml_to_tmdb = dict(zip(movies['movieId'], movies['tmdbId']))
tmdb_to_ml = {int(v): k for k, v in ml_to_tmdb.items() if pd.notna(v)}

conn.close()

print("🔢 Building user-movie rating matrix...")
# rows -> usere, columns -> movies, values -> ratings, 0 -> not rated
user_movie_matrix = ratings.pivot_table(
    index='user_id',
    columns='movie_id',
    values='rating'
).fillna(0)

print("🤝 Computing user similarity matrix...")

# Cosine_similarity() returns an NxN array where [i][j] -> similarity between user i and user j
user_sim = cosine_similarity(user_movie_matrix.values)
user_sim_df = pd.DataFrame(user_sim, index=user_movie_matrix.index, columns=user_movie_matrix.index)

# Build genre similarity lookup
mlb = MultiLabelBinarizer()
genre_matrix = mlb.fit_transform(movies['genres'].str.split('|'))
movie_id_to_pos = {mid: pos for pos, mid in enumerate(movies['movieId'])}

print("🎬 Computing movies similarity matrix...")

movie_sim = cosine_similarity(user_movie_matrix.values.T)
movie_sim_df = pd.DataFrame(
    movie_sim,
    index=user_movie_matrix.columns,
    columns=user_movie_matrix.columns
)

# Recommendations Functions
def recommend_for_user(user_id, n_similar=20, n_recs=30):
    if user_id not in user_sim_df.index:
        return []
    
    similar_users = (
        user_sim_df[user_id]
        .drop(index=user_id)
        .sort_values(ascending=False)
        .head(n_similar)
    )

    seen = set(user_movie_matrix.columns[user_movie_matrix.loc[user_id] > 0])

    scores = {}
    for sim_user_id, sim_score in similar_users.items():
        for movie_id in user_movie_matrix.columns:
            if movie_id in seen:
                continue
            rating = user_movie_matrix.loc[sim_user_id, movie_id]
            if rating == 0:
                continue
            scores[movie_id] = scores.get(movie_id, 0) + sim_score * rating

    ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    return [movie_id for movie_id, _ in ranked[:n_recs]]

def similar_to_movie(movie_id, n=20, alpha=0.6):
    if movie_id not in movie_sim_df.index:
        return []

    # CF similarity scores
    cf_scores = movie_sim_df[movie_id].drop(index=movie_id)

    # Genre cosine similarity
    pos = movie_id_to_pos.get(movie_id)
    if pos is None:
        return cf_scores.sort_values(ascending=False).head(n).index.tolist()

    target_vec = genre_matrix[pos].reshape(1, -1)
    all_genre_sims = cosine_similarity(target_vec, genre_matrix)[0]

    genre_series = pd.Series(all_genre_sims, index=movies['movieId'])
    genre_series = genre_series.reindex(cf_scores.index, fill_value=0)

    # 60% CF + 40% genre
    combined = alpha * cf_scores + (1 - alpha) * genre_series
    return combined.sort_values(ascending=False).head(n).index.tolist()

def content_similar_to_movie(movie_id, n=20):
    pos = movie_id_to_pos.get(movie_id)
    if pos is None:
        return []

    target_vec = genre_matrix[pos].reshape(1, -1)
    all_sims = cosine_similarity(target_vec, genre_matrix)[0]

    genre_series = pd.Series(all_sims, index=movies['movieId'])
    genre_series = genre_series.drop(index=movie_id, errors='ignore')

    return genre_series.sort_values(ascending=False).head(n).index.tolist()

#---------------------------- API ENDPOINTS -------------------------------------#
# POST /auth/login
# Body: { "username": "user_42", "password": "demo123" }
# Returns: { "access_token": "eyJ..." }
@app.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json()

    if not data or 'username' not in data or 'password' not in data:
        return jsonify({'error': 'username and password required'}), 400

    conn = db.get_db()
    user = conn.execute(
        'SELECT * FROM users WHERE username = ?', (data['username'],)
    ).fetchone()

    if user is None or not check_password_hash(user['password_hash'], data['password']):
        return jsonify({'error': 'Invalid credentials'}), 401

    token = create_access_token(identity=str(user['id']))
    return jsonify({
        'access_token': token,
        'user_id': user['id'],
        'username': user['username']
    })

# GET /auth/me
# Requires: Authorization: Bearer <token> header
# Returns: { "id": 42, "username": "user_42", "created_at": "..." }
@app.route('/auth/me', methods=['GET'])
@jwt_required()
def me():
    user_id = int(get_jwt_identity())
    conn = db.get_db()
    user = conn.execute(
        'SELECT id, username, created_at FROM users WHERE id = ?', (user_id,)
    ).fetchone()

    if user is None:
        return jsonify({'error': 'User not found'}), 404

    return jsonify({'id': user['id'], 'username': user['username'], 'created_at': user['created_at']})

# GET /recommend/user/<user_id>
# Requires: Authorization: Bearer <token> header
# Returns: { "recommendations": [{ "movieId": <tmdb_id>, "genres": "Action|Sci-Fi" }, ...] }
@app.route('/recommend/user/<int:user_id>')
@jwt_required()
def recommend_user(user_id):
    movie_ids = recommend_for_user(user_id)
    recs = []
    for ml_id in movie_ids:
        tmdb_id = ml_to_tmdb.get(ml_id)
        row = movies[movies['movieId'] == ml_id]
        if tmdb_id and not pd.isna(tmdb_id) and not row.empty:
            recs.append({
                'movieId': int(tmdb_id),
                'genres': row.iloc[0]['genres']   # e.g. "Action|Adventure|Sci-Fi"
            })
    return jsonify({'recommendations': recs})

# GET /user/<user_id>/top-rated
# Requires: Authorization: Bearer <token> header
# Returns: { "top_rated": [{ "mlId": 1, "movieId": <tmdb_id>, "title": "..." }] }
@app.route('/user/<int:user_id>/top-rated')
@jwt_required()
def user_top_rated(user_id):
    user_ratings = (
        ratings[ratings['user_id'] == user_id]
        .sort_values('timestamp', ascending=False)
        .head(1)
    )
    
    top = []
    for _, r in user_ratings.iterrows():
        ml_id = r['movie_id']
        tmdb_id = ml_to_tmdb.get(ml_id)
        row = movies[movies['movieId'] == ml_id]
        if tmdb_id and not pd.isna(tmdb_id) and not row.empty:
            top.append({
                'mlId': int(ml_id),
                'movieId': int(tmdb_id),
                'title': row.iloc[0]['title']
            })

    return jsonify({'top_rated': top})


# GET /user/<user_id>/top-genres?n=3
# Requires: Authorization: Bearer <token> header
# Returns: { "top_genres": [{ "genre": "Action", "count": 90 }, ...] }
@app.route('/user/<int:user_id>/top-genres')
@jwt_required()
def user_top_genres(user_id):
    n = request.args.get('n', 3, type=int)

    if user_id not in user_movie_matrix.index:
        return jsonify({'top_genres': []})
    
    user_ratings = user_movie_matrix.loc[user_id]
    seen_ids = user_ratings[user_ratings > 0].index.tolist()
    seen_movies = movies[movies['movieId'].isin(seen_ids)]['genres']

    genre_counts = Counter()
    for genre_str in seen_movies:
        for g in genre_str.split('|'):
            if g != '(no genres listed)':
                genre_counts[g] += 1
    
    top = [{'genre': g, 'count': c} for g, c in genre_counts.most_common(n)]

    return jsonify({'top_genres': top})

# GET /recommend/movie/<movie_id>
# Requires: Authorization: Bearer <token> header
# Returns: { "recommendations": [{ "movieId": <tmdb_id> }, ...] }
@app.route('/recommend/movie/<int:movie_id>')
@jwt_required()
def recommend_movie(movie_id):
    similar_ml_ids = similar_to_movie(movie_id)
    recs = []

    for ml_id in similar_ml_ids:
        tmdb_id = ml_to_tmdb.get(ml_id)
        if tmdb_id and not pd.isna(tmdb_id):
            recs.append({'movieId': int(tmdb_id)})
    
    return jsonify({'recommendations': recs})

# GET /recommend/similar/by-movie/<movie_id>
# Requires: Authorization: Bearer <token> header
# Returns: { "recommendations": [{ "movieId": <movie_id> }, ...] }
@app.route('/recommend/similar/by-movie/<int:movie_id>')
@jwt_required()
def recommend_similar_by_movie(movie_id):
    ml_id = tmdb_to_ml.get(movie_id)
    if ml_id is None:
        return jsonify({'recommendations': []})
    similar_ml_ids = content_similar_to_movie(ml_id)

    recs = []
    for sid in similar_ml_ids:
        m_id = ml_to_tmdb.get(sid)
        if m_id and not pd.isna(m_id):
            recs.append({'movieId': int(m_id)})
    return jsonify({'recommendations': recs})

# This block only runs when you execute app.py directly
if __name__ == '__main__':
    app.run(debug=True, port=5001)