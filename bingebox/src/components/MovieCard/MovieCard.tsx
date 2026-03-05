import './MovieCard.css'
import { useNavigate } from 'react-router-dom'

interface MovieCardProps {
    id: number
    title: string
    posterPath: string | null
    rating: number
    genres?: string
    predictedRating?: number
    onClick?: () => void
}

function MovieCard({ id, title, posterPath, rating, genres, predictedRating }: MovieCardProps) {
    const navigate = useNavigate()

    const posterUrl = posterPath ? `https://image.tmdb.org/t/p/w500${posterPath}` : null

    return (
        <div className="movie-card" onClick={() => navigate(`/movie/${id}`)}>
            <div className="movie-card-poster">
                {posterUrl ? (
                    <img src={posterUrl} alt={title} />
                ) : (
                    <div className="movie-card-no-poster">
                        <p>{title}</p>
                    </div>
                )}

                <div className="movie-card-badge">
                    ★ {(rating ?? 0).toFixed(1)}
                </div>
            </div>

            <div className="movie-card-info">
                <h3 className="movie-card-title">{title}</h3>

                {genres && (
                    <p className="movie-card-genres">{genres}</p>
                )}

                {predictedRating && (
                    <p className="movie-card-predicted">
                        AI Score: {predictedRating.toFixed(2)}
                    </p>
                )}
            </div>
        </div>
    )
}

export default MovieCard