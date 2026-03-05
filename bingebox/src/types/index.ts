/**
 * Shared types used across multiple components and pages.
 *
 * Why centralise?
 * If `Movie` changes (e.g. TMDB adds a field we start using),
 * you update it in one place and TypeScript flags every file
 * that needs to handle it — instead of hunting down 6 copies.
 *
 */

// Base movie shape returned by most TMDB endpoints.
export interface Movie {
    id: number
    title: string
    poster_path: string | null
    backdrop_path: string | null
    vote_average: number
}

// Full detail shape — extends Movie with fields only the detail page uses.
export interface MovieDetail extends Movie {
    overview: string
    genres: { id: number; name: string }[]
    release_date: string
}
