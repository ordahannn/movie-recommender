// Base URL for all TMDB API calls
const BASE_URL = 'https://api.themoviedb.org/3'

// Base URL for movie poster images
export const IMG_BASE_URL = 'https://image.tmdb.org/t/p/w500'

// Read tmdb API key from .env
const API_KEY = import.meta.env.VITE_TMDB_API_KEY

// API Functions
// Get this week's trending movies
export const getTrending = async () => {
  const res = await fetch(`${BASE_URL}/trending/movie/week?api_key=${API_KEY}`)
  const data = await res.json()

  const result = data.results
  console.log('This week trending movies', result)

  return result
}

// Get a list of movies that are currently in theatres
export const getNowPlaying = async () => {
  const res = await fetch(`${BASE_URL}/movie/now_playing?api_key=${API_KEY}`)
  const data = await res.json()

  const result = data.results
  console.log('Movies in theater', result)

  return result
}

// Get a list of movies that are being released soon
export const getUpcoming = async () => {
  const res = await fetch(`${BASE_URL}/movie/upcoming?api_key=${API_KEY}`)
  const data = await res.json()

  const result = data.results
  console.log('Movies soon to be released', result)

  return result
}

// Get top rated movies
export const getTopRated = async () => {
  const res = await fetch(`${BASE_URL}/movie/top_rated?api_key=${API_KEY}`)
  const data = await res.json()

  const result = data.results
  console.log('Top rated movies of all times', result)

  return result
}

// Get popular movies
export const getPopular = async () => {
  const res = await fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}`)
  const data = await res.json()

  const result = data.results
  console.log('Popular movies', result)

  return result
}

// Get movie details by ID
export const getMovieDetails = async (movieId: number) => {
  const res = await fetch(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}`)
  const data = await res.json()

  const result = data
  console.log(`Movie ${movieId} details`, result)

  return result
}

// Search movies by query
export const searchMovies = async (query: string) => {
  const res = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}`)
  const data = await res.json()

  const result = data.results
  console.log(`Movies by query "${query}"`, result)

  return result
}

// Discover movies by genre IDs (comma-separated)
export const discoverByGenres = async (genreIds: number[]) => {
  const res = await fetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${genreIds.join(',')}&sort_by=popularity.desc&vote_count.gte=50&vote_average.gte=1`)
  const data = await res.json()

  const result = data.results
  console.log(`Movies by genre ids "${genreIds}"`, result)

  return result
}

// Get all TMDB genres
export const getGenres = async () => {
  const res = await fetch(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}`)
  const data = await res.json()

  const result = data.genres
  console.log('All TMDB genres', result)

  return result
}

// Get similar movies — tries /recommendations first, falls back to /similar
export const getSimilarMovies = async (movieId: number) => {
  const recsRes = await fetch(`${BASE_URL}/movie/${movieId}/recommendations?api_key=${API_KEY}`)
  const recsData = await recsRes.json()
  if (recsData.results?.length > 0) return recsData.results

  const simRes = await fetch(`${BASE_URL}/movie/${movieId}/similar?api_key=${API_KEY}`)
  const simData = await simRes.json()
  return simData.results ?? []
}
