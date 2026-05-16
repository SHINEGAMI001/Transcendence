/**
 * Home.jsx — Landing Page
 *
 * PURPOSE:
 * Provides a stunning first impression for guests and a simple,
 * high-impact actions dashboard for logged-in users.
 * Includes a friends status bar showing online/recently seen friends.
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'
import SettingsPanel from '../components/SettingsPanel'
import { getAvatarUrl, formatDate } from '../utils'

function FriendsStatusBar() {
  const [friends, setFriends] = useState([])
  const [friendStatuses, setFriendStatuses] = useState([])
  const [loadingStatus, setLoadingStatus] = useState(true)

  useEffect(() => {
    api.get('api/users/friends/list_friends')
      .then(res => {
        const friendsList = res.data.friends || []
        setFriends(friendsList)
        // For each friend, fetch their online status
        return Promise.all(
          friendsList.map(f =>
            api.get(`api/users/friends/friend_status/${f.username}`)
              .then(r => ({ ...f, isOnline: r.data.status === true, lastSeen: r.data.last_seen }))
              .catch(() => ({ ...f, isOnline: false, lastSeen: null }))
          )
        )
      })
      .then(statuses => {
        setFriendStatuses(statuses || [])
        setLoadingStatus(false)
      })
      .catch(() => setLoadingStatus(false))
  }, [])

  if (loadingStatus || friends.length === 0) return null

  const onlineFriends = friendStatuses.filter(f => f.isOnline)
  const offlineFriends = friendStatuses
    .filter(f => !f.isOnline && f.lastSeen)
    .sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen))

  const hasOnline = onlineFriends.length > 0
  const displayFriends = hasOnline ? onlineFriends.slice(0, 3) : offlineFriends.slice(0, 3)
  const lastSeenFriend = offlineFriends[0]

  if (displayFriends.length === 0) return null

  return (
    <div className="absolute bottom-8 left-8 z-30 w-full max-w-sm animate-in slide-in-from-left-8 duration-700">
      <div className="bg-dark-surface/60 backdrop-blur-xl border border-dark-border/60 rounded-2xl px-6 py-4 flex items-center gap-4 shadow-lg shadow-black/20">
        {/* Stacked Avatars */}
        <div className="flex items-center -space-x-3 shrink-0">
          {displayFriends.map((f, i) => (
            <Link key={f.id} to={`/user/${f.username}`} className="relative" style={{ zIndex: displayFriends.length - i }}>
              <div className={`w-10 h-10 rounded-full border-2 ${hasOnline ? 'border-green-500' : 'border-dark-border'} overflow-hidden bg-accent/10 shadow-md`}>
                {f.avatar ? (
                  <img src={getAvatarUrl(f.avatar)} alt={f.username} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-bold text-accent">{f.username[0]}</div>
                )}
              </div>
              {hasOnline && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-dark-surface">
                  <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75" />
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* Status Message */}
        <div className="flex-1 min-w-0">
          {hasOnline ? (
            <p className="text-sm text-text-primary font-medium">
              <span className="text-green-400 font-bold">{onlineFriends.length}</span>
              <span className="text-text-secondary"> of your friends {onlineFriends.length === 1 ? 'is' : 'are'} playing</span>
            </p>
          ) : lastSeenFriend ? (
            <p className="text-sm text-text-secondary">
              Last seen: <span className="text-text-primary font-medium">{lastSeenFriend.username}</span>
              <span className="text-text-muted text-xs ml-1">({formatDate(lastSeenFriend.lastSeen)})</span>
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function Home() {
  const { isLoggedIn, loading } = useAuth()

  // --- Loading State ---
  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <SettingsPanel />
      
      {/* Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/5 rounded-full blur-[120px]" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-accent-light/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px]" />
      </div>

      {isLoggedIn && <FriendsStatusBar />}

      <div className="relative text-center space-y-12 animate-in fade-in zoom-in duration-700">
        <div className="space-y-4">
          <h1 className="text-7xl md:text-9xl font-black text-text-primary tracking-tighter italic select-none">
            required name PLEASE
          </h1>
          <div className="flex flex-col items-center">
            <p className="text-text-secondary text-lg md:text-2xl font-medium tracking-[0.2em] uppercase">
              Dominate the Court. Redefine the Game.
            </p>
            <div className="h-1 w-24 bg-accent mt-4 rounded-full" />
          </div>
        </div>

        {isLoggedIn ? (
          <div className="flex flex-col items-center gap-8 pt-8">
            <Link 
              to="/lobby" 
              className="group relative px-16 py-6 bg-accent hover:bg-accent-light text-white font-black text-2xl rounded-2xl transition-all duration-300 hover:shadow-[0_0_50px_rgba(var(--accent-rgb),0.4)] hover:-translate-y-1 active:scale-95 flex items-center gap-4 overflow-hidden"
            >
              <span className="relative z-10 tracking-widest">START GAME</span>
              <span className="relative z-10 text-3xl group-hover:translate-x-2 transition-transform duration-300">🚀</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </Link>
            
            <div className="flex gap-4">
              <Link to="/profile" className="px-6 py-3 bg-dark-surface/50 border border-dark-border hover:border-accent/40 text-text-secondary hover:text-text-primary font-bold rounded-xl transition-all">
                MY PROFILE
              </Link>
              <Link to="/search" className="px-6 py-3 bg-dark-surface/50 border border-dark-border hover:border-accent/40 text-text-secondary hover:text-text-primary font-bold rounded-xl transition-all">
                FIND PLAYERS
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
            <Link to="/register" className="px-12 py-5 bg-accent hover:bg-accent-light text-white font-black text-xl rounded-2xl transition-all duration-300 hover:shadow-2xl hover:shadow-accent/40 hover:-translate-y-1 active:scale-95 text-center min-w-[240px] tracking-widest">
              GET STARTED
            </Link>
            <Link to="/login" className="px-12 py-5 bg-dark-surface/80 border border-dark-border hover:border-accent/40 text-text-primary font-black text-xl rounded-2xl transition-all duration-300 hover:bg-accent/5 hover:shadow-xl active:scale-95 text-center min-w-[240px] tracking-widest backdrop-blur-md">
              SIGN IN
            </Link>
          </div>
        )}

        <div className="pt-12 text-text-muted/40 text-[10px] font-bold tracking-[0.5em] uppercase pointer-events-none">
          Haxball • 42 common core
        </div>
      </div>
    </div>
  )
}

export default Home
