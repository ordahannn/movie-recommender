import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import icon from '../../assets/icon-lg-light.png'
import './Navbar.css'

function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false)
    const [query, setQuery] = useState('')

    const location = useLocation()
    const navigate  = useNavigate()
    const isActive  = (path: string) => location.pathname === path

    const { user, logout } = useAuth()

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && query.trim()) {
            navigate(`/search?q=${encodeURIComponent(query.trim())}`)
            setQuery('')
            setMenuOpen(false)
        }
    }

    return (
    <nav className={`navbar ${menuOpen ? 'navbar--open' : ''}`}>
      <div className="navbar-top">
        <Link to="/" className="navbar-link logo">
          <img src={icon} alt="BingeBox" height={50} />
          BingeBox
        </Link>

        <div className="navbar-links">
          <Link to="/" className={`navbar-link ${isActive('/') ? 'active' : ''}`}>Home</Link>
          {/* <Link to="/movies" className={`navbar-link ${isActive('/movies') ? 'active' : ''}`}>Movies</Link> */}
          <Link to="/for-you" className={`navbar-link ${isActive('/for-you') ? 'active' : ''}`}>For You</Link>
        </div>

        <div className="navbar-actions">
          <input
            type="text"
            placeholder="Search movies"
            className="navbar-search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleSearch}
          />
          {user ? (
            <div className="navbar-user">
              <button className="navbar-logout" onClick={handleLogout}>Sign out</button>
            </div>
          ) : (
            <Link to="/login" className="navbar-link navbar-signin">Sign in</Link>
          )}
        </div>
        
        <button className="navbar-hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? '✖️' : '➕'}
        </button>
      </div>

      {menuOpen && (
        <div className="navbar-mobile-menu">
          <div className="navbar-mobile-auth">
            <input
              type="text"
              placeholder="Search Movies"
              className="navbar-search mobile"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleSearch}
            />
            {user ? (
              <div className="navbar-user">
                <button className="navbar-logout mobile" onClick={handleLogout}>Sign out</button>
              </div>
            ) : (
              <Link to="/login" className="navbar-link navbar-signin">Sign in</Link>
            )}
          </div>
          <Link to="/" className={`navbar-link mobile ${isActive('/') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>Home</Link>
          {/* <Link to="/movies" className={`navbar-link mobile ${isActive('/movies') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>Movies</Link> */}
          <Link to="/for-you" className={`navbar-link mobile ${isActive('/for-you') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>For You</Link>
        </div>
      )}

    </nav>
  )
}

export default Navbar
