import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { searchMovies } from '../../services/tmdb'
import MovieCard from '../../components/MovieCard/MovieCard'
import type { Movie } from '../../types'
import './Search.css'


function Search() {
    const [searchParams] = useSearchParams()
    const query = searchParams.get('q') || ''

    const [results, setResults] = useState<Movie[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!query.trim()) {
            setResults([])
            return
        }

        const fetchResults = async () => {
            setLoading(true)
            try {
                const data = await searchMovies(query)
                setResults(data ?? [])
            } catch (err) {
                console.error('Search error:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchResults()
    }, [query])

    if (loading) {
        return (
            <div className="loading">
                <div className="loading-spinner" />
            </div>
        )
    }

    return (
        <div className="search-page">
            <h2 className="search-title">
                {query ? `Results for "${query}"` : 'Search for a movie'}
            </h2>

            {!loading && query && results.length === 0 && (
                <p className="search-empty">No movies found for "{query}"</p>
            )}

            <div className="search-grid">
                {results.map((movie) => (
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

export default Search
