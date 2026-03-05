/**
 * App.tsx — root of the component tree.
 *
 * Two new concepts here:
 *
 * 1. AuthProvider wraps everything so any component can call useAuth().
 *
 * 2. ProtectedRoute — a wrapper component that checks if the user is
 *    logged in before rendering a page. If not, it redirects to /login.
 *    This is a standard React Router v6 pattern:
 *    - <Navigate> performs an instant redirect
 *    - replace={true} replaces the history entry so the back button
 *      doesn't loop the user back to the protected page
 */

import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Navbar from './components/Navbar/Navbar'
import Home from './pages/Home/Home'
import Movies from './pages/Movies/Movies'
import ForYou from './pages/ForYou/ForYou'
import Search from './pages/Search/Search'
import MovieDetails from './pages/MovieDetails/MovieDetails'
import Login from './pages/Login/Login'

// Wraps any route that requires authentication.
// If user is null (not logged in), redirect to /login.
// Otherwise, render the page as normal.
// Wraps any route that requires authentication.
// If user is null (not logged in), redirect to /login.
function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { user } = useAuth()
    if (!user) return <Navigate to="/login" replace />
    return <>{children}</>
}

// Inner component — lives inside AuthProvider so it can call useAuth().
// App() itself can't call useAuth() because the Provider hasn't mounted yet
// when App's function body runs. This inner wrapper solves that.
function AppInner() {
    const { user } = useAuth()
    const location = useLocation()

    return (
        <>
            {/* Hide the navbar on the login page, even if the user is technically logged in
                (e.g. navigating back — the Login component will redirect them away) */}
            {user && location.pathname !== '/login' && <Navbar />}
            <main>
                <Routes>
                    <Route path="/login" element={<Login />} />

                    <Route path="/" element={
                        <ProtectedRoute><Home /></ProtectedRoute>
                    } />
                    <Route path="/movies" element={
                        <ProtectedRoute><Movies /></ProtectedRoute>
                    } />
                    <Route path="/search" element={
                        <ProtectedRoute><Search /></ProtectedRoute>
                    } />
                    <Route path="/movie/:id" element={
                        <ProtectedRoute><MovieDetails /></ProtectedRoute>
                    } />
                    <Route path="/for-you" element={
                        <ProtectedRoute><ForYou /></ProtectedRoute>
                    } />
                </Routes>
            </main>
        </>
    )
}

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppInner />
            </AuthProvider>
        </BrowserRouter>
    )
}

export default App
