/**
 * AuthContext — global authentication state for the app.
 *
 * CONCEPTS:
 *
 * createContext() defines the "shape" of the store and its default value.
 * The default only matters if a component tries to read context without
 * an AuthProvider above it — in practice that should never happen.
 *
 * useContext() lets any component read the context value.
 * We wrap it in a custom hook (useAuth) so components import one thing
 * instead of importing both useContext and AuthContext every time.
 *
 * The Provider component wraps the whole app (see App.tsx).
 * It holds the real state and exposes login/logout functions.
 * Every component inside the Provider re-renders when the state changes.
 */

import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

interface AuthUser {
    id: number
    username: string
}

interface AuthContextType {
    user: AuthUser | null
    token: string | null
    login: (user: AuthUser, token: string) => void
    logout: () => void
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    token: null,
    login: () => {},
    logout: () => {}
})

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(() => {
        const stored = localStorage.getItem('auth_user')
        return stored ? JSON.parse(stored) : null
    })

    const [token, setToken] = useState<string | null>(() => {
        return localStorage.getItem('auth_token')
    })

    const login = (newUser: AuthUser, newToken: string) => {
        setUser(newUser)
        setToken(newToken)
        localStorage.setItem('auth_user', JSON.stringify(newUser))
        localStorage.setItem('auth_token', newToken)
    }

    const logout = () => {
        setUser(null)
        setToken(null)
        localStorage.removeItem('auth_user')
        localStorage.removeItem('auth_token')
    }

    return (
        <AuthContext.Provider value={{ user, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    return useContext(AuthContext)
}
