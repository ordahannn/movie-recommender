/**
 * Login page.
 *
 * FLOW:
 * 1. User types username + password, hits submit
 * 2. We call loginUser() from flask.ts → POST /auth/login
 * 3. On success: call context.login() to set global state, then redirect to home
 * 4. On failure: show the error message from the server
 *
 * useNavigate() is React Router's hook for programmatic navigation
 * (redirecting in code, not via a <Link> click).
 */

import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { loginUser } from '../../services/flask'
import icon from '../../assets/icon-lg-light.png'
import './Login.css'

function Login() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError]       = useState<string | null>(null)
    const [loading, setLoading]   = useState(false)

    const { user, login } = useAuth()
    const navigate  = useNavigate()

    if (user) return <Navigate to="/" replace />

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        try {
            const data = await loginUser(username, password)
            login({ id: data.user_id, username: data.username }, data.access_token)
            navigate('/')
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Login failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-header">
                    <img src={icon} alt="BingeBox" className="login-logo" />
                    <h1>BingeBox</h1>
                    <p className="login-subtitle">Sign in to your account</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form" noValidate>
                    <div className="login-field">
                        <label htmlFor="username">Username</label>
                        <input
                            id="username"
                            type="text"
                            placeholder="e.g. user_42"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>

                    <div className="login-field">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            placeholder="demo123"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            autoComplete="current-password"
                            required
                        />
                    </div>

                    {error && <p className="login-error">{error}</p>}

                    <button type="submit" className="login-btn" disabled={loading}>
                        {loading ? 'Signing in…' : 'Sign in'}
                    </button>
                </form>

                <p className="login-hint">
                    Demo accounts: <strong>user_1</strong> through <strong>user_610</strong>
                    <br />Password: <strong>demo123</strong>
                </p>
            </div>
        </div>
    )
}

export default Login
