const FLASK_URL = import.meta.env.VITE_FLASK_URL ?? 'http://127.0.0.1:5001'

// AUTH
// Returns { access_token, user_id, username } or throws on failure
export const loginUser = async (username: string, password: string) => {
    const res = await fetch(`${FLASK_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    })
    const data = await res.json()
    const result = data as { access_token: string; user_id: number; username: string }

    if (!res.ok) throw new Error(data.error || 'Login failed')

    return result
}

// Helper — returns headers with Authorization token attached.
// All protected API calls should use this instead of plain {}.
export const authHeaders = (): HeadersInit => {
    const token = localStorage.getItem('auth_token')

    return token ? { Authorization: `Bearer ${token}` } : {}
}

// Item-based CF: movies rated similarly by the same users ("people who liked X also liked...")
export const getSimilarMovies = async (movieId: number, n = 10) => {
    const res = await fetch(`${FLASK_URL}/recommend/similar/${movieId}?n=${n}`)
    
    if (!res.ok) throw new Error('Movie not found in ML dataset')
    
    const data = await res.json()
    const result = data.recommendations as { movieId: number; tmdbId: number | null; title: string; genres: string; similarity_score: number }[]

    return result
}

// Get content-based recommendations by movie title (legacy — genre + tag TF-IDF)
export const getContentRecs = async (title: string, n = 10) => {
    const res = await fetch(`${FLASK_URL}/recommend/content/${encodeURIComponent(title)}?n=${n}`)
    
    if (!res.ok) throw new Error('Movie not found in ML dataset')
    
    const data = await res.json()
    const result = data.recommendations as { movieId: number; tmdbId: number | null; title: string; genres: string; similarity_score: number }[]

    return result
}

// Get collaborative filtering recommendations by user ID
export const getCollaborativeRecs = async (userId: number, n = 10) => {
    const res = await fetch(`${FLASK_URL}/recommend/collaborative/${userId}?n=${n}`)
    
    if (!res.ok) throw new Error('User not found')
    
    const data = await res.json()
    const result = data.recommendations as { movieId: number; tmdbId: number | null; title: string; genres: string; predicted_rating: number }[]

    return result
}

// Get movies the user actually rated the highest
export const getUserTopRated = async (userId: number, n = 5) => {
    const res = await fetch(`${FLASK_URL}/user/${userId}/top-rated?n=${n}`, {
        headers: authHeaders()
    })
    
    if (!res.ok) throw new Error('User not found')
    
    const data = await res.json()
    const result = data.top_rated as { mlId: number; movieId: number; title: string }[]
    
    return result
}

// Content-based similarity via ML model — accepts a TMDB ID, Flask maps it to ML ID internally
export const getSimilarMoviesByTmdb = async (tmdbId: number) => {
    const res = await fetch(`${FLASK_URL}/recommend/similar/by-movie/${tmdbId}`, {
        headers: authHeaders()
    })

    if (!res.ok) throw new Error('Movie not found in ML dataset')

    const data = await res.json()
    const result = data.recommendations as { movieId: number }[]

    return result
}

// Get the genres a user has watched most (derived from their ratings history)
export const getUserTopGenres = async (userId: number, n = 3) => {
    const res = await fetch(`${FLASK_URL}/user/${userId}/top-genres?n=${n}`, {
        headers: authHeaders()
    })

    if (!res.ok) throw new Error('User not found')
    
    const data = await res.json()
    const result = data.top_genres as { genre: string; count: number }[]
    
    return result
}

// GET user recommendations based on other similar users
export const getUserRecommendations = async (userId: number) => {
    const res = await fetch(`${FLASK_URL}/recommend/user/${userId}`, {
        headers: authHeaders()
    })

    if (!res.ok) throw new Error('User not found')

    const data = await res.json()
    const result = data.recommendations as { movieId: number; genres: string }[]

    return result
}

// GET movie recommendations based on movie he liked
export const getMovieRecommendations = async (mlMovieId: number) => {
    const res = await fetch(`${FLASK_URL}/recommend/movie/${mlMovieId}`, {
        headers: authHeaders()
    })

    if (!res.ok) throw new Error("Movie not found")

    const data = await res.json()
    const result = data.recommendations as { movieId: number }[]

    return result
}