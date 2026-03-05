# 🍿 BingeBox

A full-stack movie recommendation app powered by a custom ML engine built on the MovieLens dataset. Browse trending and in-theater movies, get personalized recommendations, and discover similar titles using hybrid collaborative + content-based filtering.

---

## Features

- 🎬 **Browse movies** — In Theater, Trending, Upcoming, Popular, Top Rated
- 🔍 **Search** — Live search powered by TMDB
- 🤖 **Personalized recommendations** — "For You" page using user-user collaborative filtering
- 🎯 **Similar movies** — Hybrid ML model (CF + genre TF-IDF) with TMDB fallback for new releases
- 🔐 **Auth** — JWT-based login with hashed passwords

---

## Tech Stack

**Frontend**
- React 19 + TypeScript + Vite
- React Router v7
- TMDB API for movie data, images, and metadata

**Backend**
- Flask + Flask-JWT-Extended + Flask-CORS
- SQLite database
- Pandas, NumPy, scikit-learn, scikit-surprise

---

## How the Recommendation Engine Works

The ML model is loaded at server startup from the SQLite database (MovieLens small dataset — 100k ratings, 9k movies).

### 1. Collaborative Filtering (user-user)
Builds a user × movie rating matrix and computes cosine similarity between users. For a given user, finds the 20 most similar users and aggregates their ratings on unseen movies to generate recommendations.

### 2. Hybrid (CF + Content) — Similar Movies
Blends two signals with a 60/40 weight:
- **CF signal** — movie-movie cosine similarity from rating patterns (people who liked X also liked Y)
- **Content signal** — genre similarity using TF-IDF weighting so rare genres (Horror, Film-Noir) count more than common ones (Drama, Comedy)

### 3. TMDB Fallback — New Releases
For movies not yet in the ML dataset (e.g. 2025/2026 releases), falls back to TMDB's `/recommendations` API, then `/similar`, then genre-based discover.

---

## Project Structure

```
movie-recommender/
├── app.py                    # Flask API + ML recommendation engine
├── db.py                     # SQLite schema + connection management
├── seed.py                   # Database seed script (MovieLens → SQLite)
├── requirements.txt
├── Procfile                  # Gunicorn start command for Render
├── render.yaml               # Render deployment config
├── movierecommender.db       # SQLite database
├── ml-latest-small/          # Raw MovieLens dataset (CSV files)
└── bingebox/                 # React frontend
    └── src/
        ├── pages/
        │   ├── Home/         # Hero + movie rows
        │   ├── Movies/       # Browse by category (tabbed)
        │   ├── MovieDetails/ # Movie page + similar movies
        │   ├── ForYou/       # Personalized recs
        │   ├── Search/       # TMDB search
        │   └── Login/
        ├── components/
        │   ├── Navbar/
        │   ├── Hero/
        │   ├── MovieCard/
        │   └── MovieRow/
        ├── services/
        │   ├── flask.ts      # Flask API client
        │   └── tmdb.ts       # TMDB API client
        └── contexts/
            └── AuthContext   # JWT auth state
```

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/login` | — | Login, returns JWT |
| GET | `/auth/me` | ✓ | Current user info |
| GET | `/recommend/user/<user_id>` | ✓ | CF recs for a user |
| GET | `/recommend/similar/by-movie/<tmdb_id>` | ✓ | Similar movies by TMDB ID |
| GET | `/recommend/movie/<ml_id>` | ✓ | Hybrid recs from ML movie ID |
| GET | `/user/<user_id>/top-rated` | ✓ | User's highest-rated movies |
| GET | `/user/<user_id>/top-genres` | ✓ | User's top genres by watch history |

---

## Running Locally

### Backend

```bash
cd movie-recommender
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
# Runs on http://127.0.0.1:5001
```

### Frontend

```bash
cd bingebox
npm install
npm run dev
# Runs on http://localhost:5173
```

### Environment Variables

**`bingebox/.env`**
```
VITE_TMDB_API_KEY=your_tmdb_api_key
VITE_FLASK_URL=http://127.0.0.1:5001
```

Get a free TMDB API key at [themoviedb.org](https://www.themoviedb.org/settings/api).

---

## Deployment

- **Backend** → [Render](https://render.com) (Python web service, `gunicorn app:app`)
- **Frontend** → [Vercel](https://vercel.com) (set root directory to `bingebox`)

Set these env vars on each platform:

| Platform | Variable | Value |
|----------|----------|-------|
| Render | `JWT_SECRET_KEY` | any long random string |
| Render | `FRONTEND_URL` | your Vercel URL |
| Vercel | `VITE_FLASK_URL` | your Render URL |
| Vercel | `VITE_TMDB_API_KEY` | your TMDB key |

---

## Dataset

Uses the [MovieLens Small Dataset](https://grouplens.org/datasets/movielens/latest/) (GroupLens Research):
- 100,836 ratings across 9,742 movies
- 610 users
- Ratings on a 0.5–5.0 scale
