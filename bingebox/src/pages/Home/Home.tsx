import { useEffect, useState } from 'react'
import MovieRow from '../../components/MovieRow/MovieRow'
import Hero from '../../components/Hero/Hero'
import { getTrending, getNowPlaying, getUpcoming } from '../../services/tmdb'
import type { Movie } from '../../types'
import './Home.css'

function Home() {
    const [trending, setTrending] = useState<Movie[]>([])
    const [nowPlaying, setNowPlaying] = useState<Movie[]>([])
    const [upcoming, setUpcoming] = useState<Movie[]>([])

    const [loading, setLoading] = useState(true)

    const heroMovie = trending.find(m => m.backdrop_path) ?? (trending.length > 0 ? trending[0] : null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)

                const [trendingData, nowPlayingData, upcomingData] = await Promise.all([
                    getTrending(),
                    // getTopRated(),
                    getNowPlaying(),
                    getUpcoming()
                ])

                setTrending(trendingData)
                setNowPlaying(nowPlayingData)
                setUpcoming(upcomingData)
            } catch (error) {
                console.error('Error fetching movies:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, []) // Empty array = run once on mount

    if (loading) {
        return (
            <div className="loading">
                <div className="loading-spinner">
                </div>
            </div>
        )
    }

    return (
        <div className="home">
            <Hero movie={heroMovie}/>

            <div className="home-rows">
                <MovieRow title="In Theater" movies={nowPlaying} />
                <MovieRow title="Trending This Week" movies={trending} />
                <MovieRow title="Upcoming" movies={upcoming} />
            </div>
        </div>
    )
}

export default Home