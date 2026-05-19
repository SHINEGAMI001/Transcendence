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
import api, { BACKEND_ORIGIN } from '../api'
import { getAvatarUrl, formatDate } from '../utils'

function PublicProfile() {
  const { username } = useParams()
  const navigate = useNavigate()
  const { setIsLoggedIn } = useAuth()

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Friend logic state
  const [friendStatus, setFriendStatus] = useState('none') // 'none', 'friend', 'incoming_request', 'outgoing_request', 'self'
  const [incomingRequestId, setIncomingRequestId] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [isOnline, setIsOnline] = useState(false)
  const [lastSeen, setLastSeen] = useState(null)

  useEffect(() => {
    fetchPublicProfile()
  }, [username])

  async function fetchPublicProfile() {
    setLoading(true)
    setError('')
    try {
      // Fetch public profile, current friends list, pending incoming requests, our own profile, and outgoing request status in parallel
      const [profileRes, friendsRes, requestsRes, meRes, statusRes] = await Promise.all([
        api.get(`api/users/profile/pub/${username}`),
        api.get('api/users/friends/list_friends'),
        api.get('api/users/friends/friend_requests'),
        api.get('api/profile/me').catch(() => ({ data: {} })),
        api.get(`api/users/friends/check_status/${username}`).catch(() => ({ data: {} }))
      ])

      setUser(profileRes.data)

      // Determine friend status
      const me = meRes.data
      if (me?.username === username) {
        setFriendStatus('self')
        setIsOnline(true) // You are always online to yourself
      } else {
        const friends = friendsRes.data?.friends || []
        const isFriend = friends.some(f => f.username === username)

        if (isFriend) {
          setFriendStatus('friend')
          // Check if this friend is online using the new API
          try {
            const statusCheck = await api.get(`api/users/friends/friend_status/${username}`)
            setIsOnline(statusCheck.data?.status === true)
            setLastSeen(statusCheck.data?.last_seen)
          } catch (e) {
            setIsOnline(false)
          }
        } else {
          const pending = requestsRes.data['pending requests'] || []
          const incoming = pending.find(r => r.from_user === username)
          if (incoming) {
            setFriendStatus('incoming_request')
            setIncomingRequestId(incoming.request_id)
          } else if (statusRes.data?.status === 'pending') {
            setFriendStatus('outgoing_request')
          } else {
            setFriendStatus('none')
          }
        }
      }
    } catch (err) {
      if (err.response?.status === 401 && err.response?.data?.['error message'] === 'user doesnt exist') {
        setError('Player not found.')
      } else if (err.response?.status === 401) {
        setIsLoggedIn(false)
        navigate('/login', { state: { message: 'Session expired. Please log in again.' } })
        return
      } else {
        setError('Failed to load profile. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  // --- Friend Action Methods ---
  async function handleAddFriend() {
    setActionLoading(true)
    try {
      await api.post('api/users/friends/send_request', { username })
      setFriendStatus('outgoing_request')
    } catch (err) {
      if (err.response?.status === 406) {
        setFriendStatus('outgoing_request')
      } else if (err.response?.status === 405) {
        alert("You can't send a friend request to yourself!")
      } else {
        alert("Failed to send friend request.")
      }
    } finally {
      setActionLoading(false)
    }
  }

  async function handleRemoveFriend() {
    setActionLoading(true)
    try {
      await api.post('api/users/friends/remove_friend', { username })
      setFriendStatus('none')
    } catch (err) {
      alert("Failed to remove friend.")
    } finally {
      setActionLoading(false)
    }
  }

  async function handleAcceptRequest() {
    setActionLoading(true)
    try {
      await api.post('api/users/friends/accept_request', { request_id: incomingRequestId })
      setFriendStatus('friend')
    } catch (err) {
      alert("Failed to accept friend request.")
    } finally {
      setActionLoading(false)
    }
  }

  async function handleRejectRequest() {
    setActionLoading(true)
    try {
      await api.post('api/users/friends/reject_request', { request_id: incomingRequestId })
      setFriendStatus('none')
    } catch (err) {
      alert("Failed to reject friend request.")
    } finally {
      setActionLoading(false)
    }
  }

  // Replaced local getAvatarUrl with utils

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
        <Link to="/" className="inline-flex items-center text-text-muted hover:text-accent transition-colors text-sm font-medium mb-2">
          ← Back to Home
        </Link>
        {/* Header */}
        <div className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border rounded-2xl p-8 shadow-2xl shadow-accent-glow/10">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative shrink-0">
              <div className="w-24 h-24 rounded-full border-2 border-accent/50 overflow-hidden flex items-center justify-center shadow-lg shadow-accent/20 bg-accent/10">
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
              {/* Online/Offline status dot (matching private profile style) */}
              <span
                className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-dark-surface ${
                  isOnline ? 'bg-green-500' : 'bg-gray-500'
                }`}
                title={isOnline ? 'Online' : (lastSeen ? `Last seen: ${formatDate(lastSeen)}` : 'Offline')}
              >
                {isOnline && (
                  <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75" />
                )}
              </span>
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-2xl font-bold text-text-primary">{user?.username}</h1>
              <p className="text-text-secondary mt-1">{user?.email}</p>
              <span className="inline-block mt-2 px-3 py-1 bg-accent/10 text-accent text-xs font-medium rounded-full border border-accent/20">
                Player #{user?.id}
              </span>
              {!isOnline && lastSeen && (
                <p className="text-[10px] text-text-muted mt-2 italic">
                  Last seen: {formatDate(lastSeen)}
                </p>
              )}

              {/* Action Buttons */}
              {friendStatus !== 'self' && (
                <div className="mt-5 flex flex-wrap gap-3 justify-center sm:justify-start">
                  {friendStatus === 'friend' && (
                    <>
                      <Link to={`/chat/${user?.username}`} className="px-4 py-2 text-sm font-semibold rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30 transition-all">
                        Message
                      </Link>
                      <button onClick={handleRemoveFriend} disabled={actionLoading} className="px-4 py-2 text-sm font-semibold rounded-lg bg-error/10 text-error hover:bg-error/20 border border-error/30 transition-all cursor-pointer disabled:opacity-50">
                        {actionLoading ? 'Loading...' : 'Remove Friend'}
                      </button>
                    </>
                  )}
                  {friendStatus === 'none' && (
                    <button onClick={handleAddFriend} disabled={actionLoading} className="px-4 py-2 text-sm font-semibold rounded-lg bg-accent hover:bg-accent-light text-white transition-all cursor-pointer disabled:opacity-50">
                      {actionLoading ? 'Loading...' : 'Add Friend'}
                    </button>
                  )}
                  {friendStatus === 'outgoing_request' && (
                    <button disabled className="px-4 py-2 text-sm font-semibold rounded-lg bg-dark-bg border border-dark-border text-text-muted cursor-not-allowed">
                      Friend Request Pending
                    </button>
                  )}
                  {friendStatus === 'incoming_request' && (
                    <>
                      <button onClick={handleAcceptRequest} disabled={actionLoading} className="px-4 py-2 text-sm font-semibold rounded-lg bg-success/20 text-success hover:bg-success/30 border border-success/40 transition-all cursor-pointer disabled:opacity-50">
                        Accept Request
                      </button>
                      <button onClick={handleRejectRequest} disabled={actionLoading} className="px-4 py-2 text-sm font-semibold rounded-lg bg-dark-bg border border-dark-border hover:bg-dark-border/80 text-text-secondary transition-all cursor-pointer disabled:opacity-50">
                        Reject
                      </button>
                    </>
                  )}
                </div>
              )}
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
