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
import AvatarUploader from '../components/AvatarUploader'
import api, { BACKEND_ORIGIN } from '../api'
import { getAvatarUrl, formatDate } from '../utils'

function Profile() {
  const navigate = useNavigate()
  const { setIsLoggedIn } = useAuth()

  // User data from backend — null until fetched
  const [user, setUser] = useState(null)

  // Loading state — true while fetching profile data
  const [loading, setLoading] = useState(true)

  // Error message if fetch fails (non-401 errors)
  const [error, setError] = useState('')
  // Cache-buster for avatar image — forces re-fetch from server when updated
  const [avatarCacheBuster, setAvatarCacheBuster] = useState(0)

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false)
  const [editUsername, setEditUsername] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [savingUsername, setSavingUsername] = useState(false)
  const [savingEmail, setSavingEmail] = useState(false)
  const [editMessage, setEditMessage] = useState({ type: '', text: '' })

  /**
   * fetchProfile — GET /api/profile/me
   * Called on component mount and when retry is clicked.
   * On 401 → session is invalid → update auth state and redirect.
   */
  async function fetchProfile() {
    setLoading(true)
    setError('')

    try {
      const response = await api.get('api/profile/me')
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

  // Handle successful avatar upload: refresh profile and bump cache-buster
  function handleAvatarUploadSuccess() {
    setAvatarCacheBuster((p) => p + 1)
    fetchProfile()
  }

  // Toggle edit mode and pre-fill form fields with current values
  function toggleEditMode() {
    if (!isEditing && user) {
      setEditUsername(user.username || '')
      setEditEmail(user.email || '')
      setEditMessage({ type: '', text: '' })
    }
    setIsEditing(!isEditing)
  }

  /**
   * handleSaveUsername — update username on backend
   */
  async function handleSaveUsername() {
    if (!editUsername.trim()) {
      setEditMessage({ type: 'error', text: 'Username cannot be empty.' })
      return
    }
    if (editUsername === user?.username) {
      setEditMessage({ type: 'error', text: 'Username is the same as current.' })
      return
    }
    if (editUsername.trim().length < 3) {
      setEditMessage({ type: 'error', text: 'Username must be at least 3 characters.' })
      return
    }
    if (editUsername.trim().length > 20) {
      setEditMessage({ type: 'error', text: 'Username must be 20 characters or less.' })
      return
    }
    setSavingUsername(true)
    setEditMessage({ type: '', text: '' })
    try {
      await api.put('api/profile/update', { username: editUsername })
      setEditMessage({ type: 'success', text: 'Username updated!' })
      setUser((prev) => ({ ...prev, username: editUsername }))
      setTimeout(() => setEditMessage({ type: '', text: '' }), 3000)
    } catch (err) {
      setEditMessage({ type: 'error', text: err.response?.data?.message || err.response?.data?.['error message'] || 'Failed to update username.' })
    } finally {
      setSavingUsername(false)
    }
  }

  /**
   * handleSaveEmail — update email on backend
   */
  async function handleSaveEmail() {
    if (!editEmail.trim()) {
      setEditMessage({ type: 'error', text: 'Email cannot be empty.' })
      return
    }
    if (editEmail === user?.email) {
      setEditMessage({ type: 'error', text: 'Email is the same as current.' })
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(editEmail.trim())) {
      setEditMessage({ type: 'error', text: 'Please enter a valid email address.' })
      return
    }
    setSavingEmail(true)
    setEditMessage({ type: '', text: '' })
    try {
      await api.put('api/profile/update', { email: editEmail })
      setEditMessage({ type: 'success', text: 'Email updated!' })
      setUser((prev) => ({ ...prev, email: editEmail }))
      setTimeout(() => setEditMessage({ type: '', text: '' }), 3000)
    } catch (err) {
      setEditMessage({ type: 'error', text: err.response?.data?.message || err.response?.data?.['error message'] || 'Failed to update email.' })
    } finally {
      setSavingEmail(false)
    }
  }

  /**
   * handleLogout — log the user out
   * Calls the backend API then clears auth state and redirects to login.
   */
  async function handleLogout() {
    try {
      await api.get('api/auth/logout')
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      setIsLoggedIn(false)
      navigate('/login', {
        state: { message: 'You have been logged out.' },
      })
    }
  }

  /**
   * handleDeleteProfile — Delete user profile
   * Calls the backend DELETE api and logs the user out.
   */
  async function handleDeleteProfile() {
    const isConfirmed = window.confirm('Are you sure you want to delete your profile? This action is permanent and cannot be undone.')
    
    if (!isConfirmed) return
    
    try {
      await api.delete('api/profile/delete')
      setIsLoggedIn(false)
      navigate('/login', {
        state: { message: 'Your profile has been permanently deleted.' },
      })
    } catch (err) {
      console.error('Error deleting profile:', err)
      alert(err.response?.data?.message || err.response?.data?.['error message'] || 'Failed to delete profile.')
    }
  }

  // Fetch profile data on mount
  useEffect(() => {
    fetchProfile()
  }, [])

  // Replaced local getAvatarUrl and formatDate with utils

  // The user viewing their own profile is always online (they're authenticated)
  const isOnline = true

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
        <Link to="/" className="inline-flex items-center text-text-muted hover:text-accent transition-colors text-sm font-medium mb-2">
          ← Back to Home
        </Link>
        {/* ========================================
            HEADER SECTION — User identity
            Shows avatar initial, username, and email
            ======================================== */}
        <div className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border rounded-2xl p-8 shadow-2xl shadow-accent-glow/10">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Avatar with online status indicator */}
            <div className="relative shrink-0">
              {getAvatarUrl(user?.avatar, avatarCacheBuster) ? (
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-accent/50 flex items-center justify-center shadow-lg shadow-accent/20">
                  <img
                    src={getAvatarUrl(user?.avatar, avatarCacheBuster)}
                    alt={`${user.username}'s avatar`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.parentElement.classList.add('bg-accent/20')
                      e.target.parentElement.innerHTML = `<span class="text-3xl font-bold text-accent">${user?.username?.charAt(0).toUpperCase() || '?'}</span>`
                    }}
                  />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-accent/20 border-2 border-accent/50 flex items-center justify-center shadow-lg shadow-accent/20">
                  <span className="text-3xl font-bold text-accent">
                    {user?.username?.charAt(0).toUpperCase() || '?'}
                  </span>
                </div>
              )}
              {/* Online/Offline status dot */}
              <span
                className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-dark-surface ${
                  isOnline ? 'bg-green-500' : 'bg-gray-500'
                }`}
                title={isOnline ? 'Online' : 'Offline'}
              >
                {isOnline && (
                  <span className="absolute inset-0 rounded-full bg-violet-400 animate-ping opacity-75" />
                )}
              </span>
            </div>

            {/* User info + action buttons */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-text-primary">
                  {user?.username}
                </h1>
                {/* Online/Offline text badge */}
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    isOnline
                      ? 'bg-violet-500/15 text-violet-400 border border-violet-500/30'
                      : 'bg-gray-500/15 text-gray-400 border border-gray-500/30'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isOnline ? 'bg-green-400' : 'bg-gray-400'
                    }`}
                  />
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              <p className="text-text-secondary mt-1">{user?.email}</p>
              <span className="inline-block mt-2 px-3 py-1 bg-accent/10 text-accent text-xs font-medium rounded-full border border-accent/20">
                Player #{user?.id}
              </span>

              {/* Action buttons */}
              <div className="flex items-center gap-3 mt-4 flex-wrap">
                <button
                  onClick={toggleEditMode}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                    isEditing
                      ? 'bg-dark-border text-text-primary hover:bg-dark-border/80'
                      : 'bg-accent hover:bg-accent-light text-white'
                  }`}
                >
                  {isEditing ? (
                    <>
                      <span>✕</span> Close Editor
                    </>
                  ) : (
                    <>
                      <span>✏</span> Edit Profile
                    </>
                  )}
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-dark-border text-text-primary hover:bg-dark-border/80 transition-all duration-200 flex items-center gap-2 cursor-pointer"
                >
                  <span>⏻</span> Logout
                </button>
                <button
                  onClick={handleDeleteProfile}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 transition-all duration-200 flex items-center gap-2 cursor-pointer"
                >
                  <span>🗑</span> Delete Profile
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================
            EDIT PROFILE SECTION — Shown when isEditing is true
            Contains: Avatar uploader, Username editor, Email editor
            ======================================== */}
        {isEditing && (
          <div className="bg-dark-surface/80 backdrop-blur-xl border border-accent/20 rounded-2xl p-6 space-y-6 animate-in">
            <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
              <span className="text-accent"></span> Edit Profile
            </h2>

            {/* Edit feedback message */}
            {editMessage.text && (
              <div
                className={`p-3 rounded-lg text-sm font-medium ${
                  editMessage.type === 'success'
                    ? 'bg-violet-500/15 text-violet-400 border border-violet-500/30'
                    : 'bg-red-500/15 text-red-400 border border-red-500/30'
                }`}
              >
                {editMessage.type === 'success' ? '✓ ' : '✕ '}
                {editMessage.text}
              </div>
            )}

            {/* --- Avatar Upload --- */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-text-secondary uppercase tracking-wider">
                Profile Picture
              </label>
              <AvatarUploader
                currentAvatar={getAvatarUrl(user?.avatar, avatarCacheBuster)}
                onUploadSuccess={handleAvatarUploadSuccess}
              />
            </div>

            {/* Divider */}
            <div className="border-t border-dark-border/50" />

            {/* --- Username Edit --- */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-text-secondary uppercase tracking-wider">
                Username
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  placeholder="Enter new username"
                  disabled={savingUsername}
                  className="flex-1 px-4 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-text-primary text-sm placeholder-text-muted focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/25 transition-all disabled:opacity-50"
                />
                <button
                  onClick={handleSaveUsername}
                  disabled={savingUsername || !editUsername.trim()}
                  className="px-4 py-2.5 bg-accent hover:bg-accent-light text-white text-sm font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer shrink-0"
                >
                  {savingUsername ? (
                    <>
                      <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </button>
              </div>
              <p className="text-xs text-text-muted">Current: {user?.username}</p>
            </div>

            {/* --- Email Edit --- */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-text-secondary uppercase tracking-wider">
                Email Address
              </label>
              <div className="flex gap-3">
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="Enter new email"
                  disabled={savingEmail}
                  className="flex-1 px-4 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-text-primary text-sm placeholder-text-muted focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/25 transition-all disabled:opacity-50"
                />
                <button
                  onClick={handleSaveEmail}
                  disabled={savingEmail || !editEmail.trim()}
                  className="px-4 py-2.5 bg-accent hover:bg-accent-light text-white text-sm font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer shrink-0"
                >
                  {savingEmail ? (
                    <>
                      <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </button>
              </div>
              <p className="text-xs text-text-muted">Current: {user?.email}</p>
            </div>
          </div>
        )}

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
