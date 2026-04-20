/**
 * AuthContext.jsx — Global Authentication State
 *
 * PURPOSE:
 * Provides a React Context that tracks whether the user is logged in
 * across the entire app. On mount, it calls GET /api/profile/me to
 * check if a valid Django session cookie exists in the browser.
 *
 * EXPORTS:
 * - AuthProvider: wraps the app to provide auth state to all children
 * - useAuth(): hook to access { isLoggedIn, setIsLoggedIn, loading }
 *
 * HOW IT WORKS:
 * 1. App loads → AuthProvider mounts → calls /api/profile/me
 * 2. If 200 response → user has a valid session → isLoggedIn = true
 * 3. If 401 or error → no valid session → isLoggedIn = false
 * 4. Login.jsx calls setIsLoggedIn(true) after successful login
 * 5. ProtectedRoute reads isLoggedIn to gate protected pages
 *
 * WHY withCredentials:
 * Django stores a session ID in a cookie. The browser only sends that
 * cookie if axios is configured with withCredentials: true. Without it,
 * the backend sees an anonymous user and returns 401.
 */

import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const API_BASE = 'http://localhost:8000/'

// Create the context with default values (never used directly,
// always accessed via AuthProvider below)
const AuthContext = createContext({
  isLoggedIn: false,
  setIsLoggedIn: () => {},
  loading: true,
})

/**
 * AuthProvider — wrap this around <App /> in main.jsx
 *
 * Manages three pieces of state:
 * - isLoggedIn (boolean): whether the user has a valid session
 * - loading (boolean): true while the initial session check is pending
 *   (prevents ProtectedRoute from flashing the login page)
 */
export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)

  // Run once on mount: check if user already has a valid session
  useEffect(() => {
    async function checkSession() {
      try {
        // Attempt to fetch the profile — if session cookie is valid,
        // this returns 200 with user data
        await axios.get(`${API_BASE}api/profile/me`, {
          withCredentials: true,
        })
        // Session is valid
        setIsLoggedIn(true)
      } catch {
        // 401 or network error — user is not authenticated
        setIsLoggedIn(false)
      } finally {
        // Done checking, stop showing the loading spinner
        setLoading(false)
      }
    }
    checkSession()
  }, [])

  return (
    <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * useAuth() — custom hook to access auth state from any component
 *
 * Usage:
 *   const { isLoggedIn, setIsLoggedIn, loading } = useAuth()
 */
export function useAuth() {
  return useContext(AuthContext)
}
