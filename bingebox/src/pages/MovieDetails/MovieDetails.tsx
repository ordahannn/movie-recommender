import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getMovieDetails, discoverByGenres } from '../../services/tmdb'
import { getSimilarMoviesByTmdb } from '../../services/flask'
import MovieRow from '../../components/MovieRow/MovieRow'
import type { Movie, MovieDetail } from '../../types'
import './MovieDetails.css'


function MovieDetails() {
    const { id } = useParams<{ id: string }>()
    const [movie, setMovie] = useState<MovieDetail | null>(null)
    const [similarMovies, setSimilarMovies] = useState<Movie[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!id) return

        window.scrollTo(0, 0)

        const fetchData = async () => {
            try {
                setLoading(true)

                const movieData = await getMovieDetails(Number(id))
                setMovie(movieData)

                try {
                    const flaskRecs = await getSimilarMoviesByTmdb(Number(id))
                    if (flaskRecs.length > 0) {
                        const tmdbResults = await Promise.all(
                            flaskRecs.slice(0, 20).map(({ movieId }) =>
                                getMovieDetails(movieId).catch(() => null)
                            )
                        )
                        setSimilarMovies(
                            (tmdbResults.filter(Boolean) as Movie[]).filter(m => m.vote_average > 0)
                        )
                    } else {
                        // Movie not in ML dataset — discover popular movies in the same genres
                        const genreIds = movieData.genres?.map((g: { id: number }) => g.id).slice(0, 2) ?? []
                        if (genreIds.length > 0) {
                            const discovered = await discoverByGenres(genreIds)
                            setSimilarMovies(
                                discovered
                                    .filter((m: Movie) => m?.id && m.id !== Number(id) && m.vote_average > 0)
                                    .slice(0, 20)
                            )
                        }
                    }
                } catch {
                    // Similar movies are optional — don't fail the whole page if ML server is down
                }
            } catch {
                setMovie(null)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [id])

    if (loading) {
        return (
            <div className="loading">
                <div className="loading-spinner" />
            </div>
        )
    }

    if (!movie) {
        return (
            <div className="error-page">
                <p className="error-msg">⚠️ Movie Details Not Found</p>
                <p className="error-sub">An error is occured.</p>
            </div>
        )
    }

    return (
        <div>
            <div className="movie-details-poster">
                {movie.backdrop_path && (
                    <img
                        className="movie-details-bg"
                        src={`https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`}
                        alt=""
                    />
                )}
                <div className="movie-details-overlay">
                    <div className="movie-details-content">
                        <div className="movie-details-rating">
                            ★ {movie.vote_average.toFixed(1)}
                        </div>
                        <h1 className="movie-details-title">{movie.title}</h1>
                        {movie.release_date && (
                            <h3 className="movie-details-aired">{new Date(movie.release_date).getFullYear()}</h3>
                        )}
                        
                        {movie.genres?.length > 0 && (
                            <div className="movie-details-genres">
                                {movie.genres.map(g => (
                                    <span key={g.id} className="movie-details-genre-tag">{g.name}</span>
                                ))}
                            </div>
                        )}
                        {/* <div className="movie-details-buttons">
                            <button className="btn-outline">+ My List</button>
                        </div> */}
                    </div>
                </div>
            </div>
            <div className="movie-details-overview">
                <p className="movie-details-details">{movie.overview}</p>
            </div>
            {similarMovies.length > 0
                ? <MovieRow title="Similar Movies" movies={similarMovies} showSeeAll={false} />
                : <p className="movie-details-no-similar">Not enough data has been collected on this movie</p>
            }
        </div>
    )
}

export default MovieDetails
