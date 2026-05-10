/**
 * PublicProfile.jsx — Public User Profile Page (Protected)
 *
 * Displays another user's public profile fetched from
 * GET /api/users/profile/pub/<username>.
 * Accessed by clicking a user card on the Search page.
 */

import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

const API_BASE = 'http://localhost:8000/'
const BACKEND_ORIGIN = 'http://localhost:8000'

function PublicProfile() {
  const { username } = useParams()  
  const navigate = useNavigate()
  const { setIsLoggedIn } = useAuth()

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchPublicProfile()
  }, [username])

  async function fetchPublicProfile() {
    setLoading(true)
    setError('')
    try {
      const response = await axios.get(
        `${API_BASE}api/users/profile/pub/${username}`,
        { withCredentials: true }
      )
      setUser(response.data)
    } catch (err) {
      if (err.response?.status === 401) {
        if (err.response?.data?.['error message'] === 'user doesnt exist') {
          setError('Player not found.')
        } else {
          setIsLoggedIn(false)
          navigate('/login', { state: { message: 'Session expired. Please log in again.' } })
          return
        }
      } else {
        setError('Failed to load profile. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  function getAvatarUrl(avatarPath) {
    if (!avatarPath) return null
    if (avatarPath.startsWith('http')) return avatarPath
    return `${BACKEND_ORIGIN}${avatarPath}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-text-muted text-sm">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
        <div className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border rounded-2xl p-8 text-center max-w-md">
          <div className="text-4xl mb-4">😕</div>
          <h2 className="text-xl font-bold text-text-primary mb-2">
            {error === 'Player not found.' ? 'Player Not Found' : 'Error'}
          </h2>
          <p className="text-text-secondary mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <Link to="/search" className="px-5 py-2.5 bg-accent hover:bg-accent-light text-white font-semibold rounded-lg transition-all">
              ← Back to Search
            </Link>
            {error !== 'Player not found.' && (
              <button onClick={fetchPublicProfile} className="px-5 py-2.5 bg-dark-border text-text-primary hover:bg-dark-border/80 font-semibold rounded-lg transition-all cursor-pointer">
                Retry
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-bg p-4 md:p-8">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -right-32 w-96 h-96 bg-accent/8 rounded-full blur-3xl" />
        <div className="absolute bottom-20 -left-32 w-96 h-96 bg-accent-light/8 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border rounded-2xl p-8 shadow-2xl shadow-accent-glow/10">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-24 h-24 rounded-full border-2 border-accent/50 overflow-hidden flex items-center justify-center shrink-0 shadow-lg shadow-accent/20 bg-accent/10">
              {getAvatarUrl(user?.avatar) ? (
                <img
                  src={getAvatarUrl(user.avatar)}
                  alt={`${user.username}'s avatar`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none'
                    e.target.parentElement.innerHTML = `<span class="text-3xl font-bold text-accent">${user?.username?.charAt(0).toUpperCase() || '?'}</span>`
                  }}
                />
              ) : (
                <span className="text-3xl font-bold text-accent">
                  {user?.username?.charAt(0).toUpperCase() || '?'}
                </span>
              )}
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-2xl font-bold text-text-primary">{user?.username}</h1>
              <p className="text-text-secondary mt-1">{user?.email}</p>
              <span className="inline-block mt-2 px-3 py-1 bg-accent/10 text-accent text-xs font-medium rounded-full border border-accent/20">
                Player #{user?.id}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border rounded-xl p-5 text-center">
            <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Level</p>
            <p className="text-3xl font-bold text-text-primary">{user?.level}</p>
          </div>
          <div className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border rounded-xl p-5 text-center">
            <p className="text-text-muted text-xs uppercase tracking-wider mb-1">XP</p>
            <p className="text-3xl font-bold text-accent">{user?.xp}</p>
          </div>
          <div className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border rounded-xl p-5 text-center">
            <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Wins</p>
            <p className="text-3xl font-bold text-success">{user?.wins}</p>
          </div>
          <div className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border rounded-xl p-5 text-center">
            <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Losses</p>
            <p className="text-3xl font-bold text-error">{user?.losses}</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="text-center">
          <Link to="/search" className="text-accent hover:text-accent-light transition-colors text-sm font-medium">
            ← Back to Search
          </Link>
        </div>
      </div>
    </div>
  )
}

export default PublicProfile
