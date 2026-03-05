import { useNavigate } from 'react-router-dom'
import type { Movie } from '../../types'
import './Hero.css'

interface HeroMovieProps {
    movie: Movie | null
}

function Hero({ movie }: HeroMovieProps) {
    const navigate = useNavigate()

    if (!movie) return null

    return (
        <div className="home-hero-poster">
            {movie.backdrop_path && (
                <img
                    className="home-hero-bg"
                    src={`https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`}
                    alt=""
                />
            )}
            <div className="home-hero-overlay">
                <div className="home-hero-content">
                    <p className="home-hero-label">Trending Now</p>
                    <h1 className="home-hero-title">{movie.title}</h1>
                    <div className="home-hero-rating">
                        ★ {movie.vote_average.toFixed(1)}
                    </div>
                    <div className="home-hero-buttons">
                        <button className="btn-primary" onClick={() => navigate(`/movie/${movie.id}`)}>More Info</button>
                        {/* <button className="btn-outline">+ My List</button> */}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Hero
