import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { getTrending, getTopRated, getPopular, getNowPlaying, getUpcoming } from '../../services/tmdb'
import MovieCard from '../../components/MovieCard/MovieCard'
import type { Movie } from '../../types'
import '/src/App.css'
import './Movies.css'

const CATEGORIES = ['In Theater', 'Trending This Week', 'Upcoming', 'Popular Now', 'Top Rated']

function Movies() {
    const navigate = useNavigate()
    
    const [movies, setMovies] = useState<Movie[]>([])
    const [loading, setLoading] = useState(true)

    const [searchParams] = useSearchParams()

    const category = searchParams.get('category') || 'Trending This Week'

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            
            try {
                let data

                if (category === 'Trending This Week') data = await getTrending()
                else if (category === 'Popular Now') data = await getPopular()
                else if (category === 'Top Rated') data = await getTopRated()
                else if (category === 'In Theater') data = await getNowPlaying()
                else if (category === 'Upcoming') data = await getUpcoming()
                else data = await getTrending()

                setMovies(data ?? [])
            } catch (error) {
                console.error('Error fetching movies:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [category]) // re-runs when category changes

    if (loading) {
        return (
        <div className="loading">
            <div className="loading-spinner" />
        </div>
        )
    }

    return (
    <div className="movies-page">
        <div className="movies-tabs">
            {CATEGORIES.map((cat) => (
                <button
                    key={cat}
                    className={`movies-tab ${category === cat ? 'active' : ''}`}
                    onClick={() => navigate(`/movies?category=${encodeURIComponent(cat)}`)}
                >
                    {cat}
                </button>
            ))}
        </div>

        <div className="movies-grid">
            {movies.map((movie) => (
                <MovieCard
                    key={movie.id}
                    id={movie.id}
                    title={movie.title}
                    posterPath={movie.poster_path}
                    rating={movie.vote_average}
                />
            ))}
        </div>
    </div>
  )
}

export default Movies