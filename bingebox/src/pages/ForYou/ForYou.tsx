import { useEffect, useState } from 'react'
import { getMovieDetails } from '../../services/tmdb'
import { getUserTopGenres, getUserTopRated, getUserRecommendations, getMovieRecommendations } from '../../services/flask'
import { useAuth } from '../../contexts/AuthContext'
import MovieRow from '../../components/MovieRow/MovieRow'
import type { Movie } from '../../types'
import './ForYou.css'

const cleanTitle = (title: string) => {
    let t = title.replace(/\s*\(\d{4}\)\s*$/, '').trim()
    t = t.replace(/^(.*),\s*(The|A|An)$/i, '$2 $1')
    return t.trim()
}

interface GenreRow {
    genreName: string
    movies: Movie[]
}

interface ContentRow {
    basedOn: string
    movies: Movie[]
}

function ForYou() {
    const { user } = useAuth()
    const [pickedForYou, setPickedForYou] = useState<Movie[]>([])
    const [genreRows, setGenreRows]     = useState<GenreRow[]>([])
    const [contentRows, setContentRows] = useState<ContentRow[]>([])
    const [loading, setLoading]         = useState(true)
    const [error, setError]             = useState('')

    useEffect(() => {
        if (!user) return

        const fetchData = async () => {
            try {
                setLoading(true)
                setError('')

                const [cfRecs, topGenres, topRated] = await Promise.all([
                    getUserRecommendations(user.id),
                    getUserTopGenres(user.id, 3),
                    getUserTopRated(user.id, 3),
                ])

                const pickedMovies = (await Promise.all(
                    cfRecs.slice(0, 20).map(({ movieId }) =>
                        getMovieDetails(movieId).catch(() => null)
                    )
                )).filter(Boolean) as Movie[]
                setPickedForYou(pickedMovies)

                const genreRowsData = await Promise.all(
                    topGenres.map(async ({ genre }) => {
                        const filtered = cfRecs
                            .filter(rec => rec.genres?.includes(genre))
                            .slice(0, 15)
                        const genreMovies = (await Promise.all(
                            filtered.map(({ movieId }) =>
                                getMovieDetails(movieId).catch(() => null)
                            )
                        )).filter(Boolean) as Movie[]

                        return { genreName: genre, movies: genreMovies }
                    })
                )
                setGenreRows(genreRowsData.filter(row => row.movies.length > 0))

                const contentRowsData = (await Promise.all(
                    topRated.map(async rec => {
                        try {
                            const similar = await getMovieRecommendations(rec.mlId)
                            const recMovies = (await Promise.all(
                                similar.slice(0, 20).map(({ movieId }) =>
                                    getMovieDetails(movieId).catch(() => null)
                                )
                            )).filter(Boolean) as Movie[]

                            return { basedOn: cleanTitle(rec.title), movies: recMovies }
                        } catch { return null }
                    })
                )).filter(Boolean) as ContentRow[]

                setContentRows(contentRowsData)
            } catch (e: unknown) {
                setError(e instanceof Error ? e.message : 'Could not load recommendations')
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [user])

    if (loading) {
        return (
            <div className="loading">
                <div className="loading-spinner" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="error-page">
                <p className="error-msg">⚠️ {error}</p>
                <p className="error-sub">An error has occured.</p>
            </div>
        )
    }

    return (
        <div className="fy-page">
            {pickedForYou.length > 0 && (
                <MovieRow title="Chosen just for you" movies={pickedForYou} showSeeAll={false} />
            )}

            {genreRows.map(row => (
                <MovieRow key={row.genreName} title={`Because you like ${row.genreName}`} movies={row.movies} showSeeAll={false} />
            ))}

            {contentRows.map(row => (
                <MovieRow key={row.basedOn} title={`Because you watched ${row.basedOn}`} movies={row.movies} showSeeAll={false} />
            ))}

        </div>
    )
}

export default ForYou