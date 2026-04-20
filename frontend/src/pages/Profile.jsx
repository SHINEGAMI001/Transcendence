/**
 * Profile.jsx — User Profile Page (Protected)
 *
 * PURPOSE:
 * Displays the authenticated user's profile data fetched from
 * GET /api/profile/me. This page is only accessible when wrapped
 * by ProtectedRoute (which verifies auth state before rendering).
 *
 * DATA DISPLAYED:
 * The backend returns 10 fields:
 *   id, username, email, date_joined, last_login, xp, level, wins, losses
 *
 * LAYOUT:
 * - Header section: avatar placeholder, username, email
 * - Stats grid: level, XP, wins, losses (4 cards)
 * - Account info: date joined, last login
 *
 * ERROR HANDLING:
 * - 401 response → session expired → redirect to /login
 * - Network error → show error message with retry option
 *
 * WHY withCredentials:
 * The profile endpoint requires the Django session cookie to identify
 * the user. Without withCredentials: true, the cookie isn't sent.
 */

import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

const API_BASE = 'http://localhost:8000/'

function Profile() {
  const navigate = useNavigate()
  const { setIsLoggedIn } = useAuth()

  // User data from backend — null until fetched
  const [user, setUser] = useState(null)

  // Loading state — true while fetching profile data
  const [loading, setLoading] = useState(true)

  // Error message if fetch fails (non-401 errors)
  const [error, setError] = useState('')

  /**
   * fetchProfile — GET /api/profile/me
   * Called on component mount and when retry is clicked.
   * On 401 → session is invalid → update auth state and redirect.
   */
  async function fetchProfile() {
    setLoading(true)
    setError('')

    try {
      const response = await axios.get(`${API_BASE}api/profile/me`, {
        withCredentials: true,
      })
      // Backend returns the user object directly in response.data
      setUser(response.data)
    } catch (err) {
      if (err.response?.status === 401) {
        // Session expired or invalid — log out globally and redirect
        setIsLoggedIn(false)
        navigate('/login', {
          state: { message: 'Session expired. Please log in again.' },
        })
        return
      }
      // Other errors (network, server error, etc.)
      setError('Failed to load profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Fetch profile data on mount
  useEffect(() => {
    fetchProfile()
  }, [])

  /**
   * formatDate — converts ISO date string to a readable format
   * Example: "2024-01-15T10:30:00Z" → "Jan 15, 2024, 10:30 AM"
   */
  function formatDate(dateString) {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // --- Loading State ---
  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <svg
            className="animate-spin h-10 w-10 text-accent"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-text-secondary text-sm">Loading profile...</p>
        </div>
      </div>
    )
  }

  // --- Error State ---
  if (error) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
        <div className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border rounded-2xl p-8 text-center max-w-md">
          <div className="text-error text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-text-primary mb-2">Error</h2>
          <p className="text-text-secondary mb-6">{error}</p>
          <button
            onClick={fetchProfile}
            className="px-6 py-2.5 bg-accent hover:bg-accent-light text-white font-semibold rounded-lg transition-all duration-200 cursor-pointer"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // --- Profile Content ---
  return (
    <div className="min-h-screen bg-dark-bg p-4 md:p-8">
      {/* Decorative background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -right-32 w-96 h-96 bg-accent/8 rounded-full blur-3xl" />
        <div className="absolute bottom-20 -left-32 w-96 h-96 bg-accent-light/8 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-2xl mx-auto space-y-6">
        {/* ========================================
            HEADER SECTION — User identity
            Shows avatar initial, username, and email
            ======================================== */}
        <div className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border rounded-2xl p-8 shadow-2xl shadow-accent-glow/10">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar — first letter of username */}
            <div className="w-20 h-20 rounded-full bg-accent/20 border-2 border-accent/50 flex items-center justify-center shrink-0">
              <span className="text-3xl font-bold text-accent">
                {user?.username?.charAt(0).toUpperCase() || '?'}
              </span>
            </div>

            <div className="text-center sm:text-left">
              <h1 className="text-2xl font-bold text-text-primary">
                {user?.username}
              </h1>
              <p className="text-text-secondary mt-1">{user?.email}</p>
              <span className="inline-block mt-2 px-3 py-1 bg-accent/10 text-accent text-xs font-medium rounded-full border border-accent/20">
                Player #{user?.id}
              </span>
            </div>
          </div>
        </div>

        {/* ========================================
            STATS GRID — Game statistics
            4 cards: Level, XP, Wins, Losses
            Designed for easy expansion (add more cards later)
            ======================================== */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Level card */}
          <div className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border rounded-xl p-5 text-center">
            <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Level</p>
            <p className="text-3xl font-bold text-text-primary">{user?.level}</p>
          </div>

          {/* XP card */}
          <div className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border rounded-xl p-5 text-center">
            <p className="text-text-muted text-xs uppercase tracking-wider mb-1">XP</p>
            <p className="text-3xl font-bold text-accent">{user?.xp}</p>
          </div>

          {/* Wins card */}
          <div className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border rounded-xl p-5 text-center">
            <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Wins</p>
            <p className="text-3xl font-bold text-success">{user?.wins}</p>
          </div>

          {/* Losses card */}
          <div className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border rounded-xl p-5 text-center">
            <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Losses</p>
            <p className="text-3xl font-bold text-error">{user?.losses}</p>
          </div>
        </div>

        {/* ========================================
            ACCOUNT INFO — Dates and metadata
            Shows when the account was created and last login
            ======================================== */}
        <div className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            Account Info
          </h2>
          <div className="space-y-4">
            {/* Date joined */}
            <div className="flex justify-between items-center py-2 border-b border-dark-border/50">
              <span className="text-text-secondary text-sm">Member since</span>
              <span className="text-text-primary text-sm font-medium">
                {formatDate(user?.date_joined)}
              </span>
            </div>
            {/* Last login */}
            <div className="flex justify-between items-center py-2">
              <span className="text-text-secondary text-sm">Last login</span>
              <span className="text-text-primary text-sm font-medium">
                {formatDate(user?.last_login)}
              </span>
            </div>
          </div>
        </div>

        {/* ========================================
            NAVIGATION — Quick links
            Back to home. More links can be added later.
            ======================================== */}
        <div className="text-center">
          <Link
            to="/"
            className="text-accent hover:text-accent-light transition-colors text-sm font-medium"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Profile
