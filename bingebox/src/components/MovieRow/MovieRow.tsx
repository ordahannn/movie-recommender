import { useNavigate } from 'react-router-dom'
import MovieCard from '../MovieCard/MovieCard'
import type { Movie } from '../../types'
import './MovieRow.css'

interface MovieRowProps {
    title: string
    movies: Movie[]
    showSeeAll?: boolean
}

function MovieRow({ title, movies, showSeeAll = true }: MovieRowProps) {
    const navigate = useNavigate() 
    
    const displayMovies = movies.slice(0, 10)
    
    return (
        <section className="movie-row">
            <div className="movie-row-header">
                <h2 className="movie-row-title">
                    {title}
                </h2>
                {showSeeAll && (
                    <button
                        className="movie-row-see-all"
                        onClick={() => navigate(`/movies?category=${encodeURIComponent(title)}`)}
                    >
                        See All →
                    </button>
                )}
            </div>

            <div className="movie-row-cards">
                {displayMovies.map((movie) => (
                    <MovieCard
                        key={movie.id}
                        id={movie.id}
                        title={movie.title}
                        posterPath={movie.poster_path}
                        rating={movie.vote_average}
                    />
                ))}
            </div>
        </section>
    )
}

export default MovieRow