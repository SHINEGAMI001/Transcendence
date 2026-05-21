/**
 * Lobby.jsx — Game Lobby Page (Protected)
 *
 * PURPOSE:
 * Main hub for logged-in users. Shows the lobby background with
 * options to create/join Private or Public rooms, manage friends,
 * and view notifications.
 */

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationContext'
import api from '../api'
import SettingsPanel from '../components/SettingsPanel'
import { getAvatarUrl, formatDate } from '../utils'
import lobbyBg from '../assets/lobbybackground.png.jpg'

function FriendItem({ friend }) {
  const [statusInfo, setStatusInfo] = useState({ isOnline: false, lastSeen: null })

  useEffect(() => {
    api.get(`api/users/friends/friend_status/${friend.username}`)
      .then(res => setStatusInfo({ 
        isOnline: res.data.status === true, 
        lastSeen: res.data.last_seen 
      }))
      .catch(() => setStatusInfo({ isOnline: false, lastSeen: null }))
  }, [friend.username])

  const { isOnline, lastSeen } = statusInfo
  const statusLabel = isOnline ? 'online' : (lastSeen ? `last seen ${formatDate(lastSeen)}` : 'offline')

  return (
    <div className="group relative p-2 rounded-2xl bg-white/5 border border-white/10 hover:border-green-400/30 hover:bg-white/10 transition-all flex items-center gap-3 backdrop-blur-md overflow-hidden">
      <Link to={`/user/${friend.username}`} className="flex items-center gap-3 flex-1 overflow-hidden z-10">
        <div className="relative shrink-0">
          <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shadow-inner">
            {friend.avatar ? (
              <img src={getAvatarUrl(friend.avatar)} className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-black text-green-400">{friend.username[0]}</span>
            )}
          </div>
          <span
            className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-dark-surface ${
              isOnline ? 'bg-green-500' : 'bg-gray-500'
            }`}
            title={isOnline ? 'Online' : (lastSeen ? `Last seen: ${formatDate(lastSeen)}` : 'Offline')}
          >
            {isOnline && (
              <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75" />
            )}
          </span>
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-bold text-white truncate group-hover:text-green-400 transition-colors">
            {friend.username}
          </h4>
          <p className="text-[10px] text-white/50 capitalize truncate font-medium">{statusLabel}</p>
        </div>
      </Link>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
    </div>
  )
}

function Lobby() {
  const { isLoggedIn } = useAuth()
  const navigate = useNavigate()

  const [user, setUser] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [friends, setFriends] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [showRequestsSidebar, setShowRequestsSidebar] = useState(false)
  const { notifications, clearNotification } = useNotifications()

  const acceptRequest = async (requestId) => {
    try {
      await api.post('api/users/friends/accept_request', { request_id: requestId })
      setPendingRequests(prev => prev.filter(r => r.request_id !== requestId))
      // Refresh friends list
      api.get('api/users/friends/list_friends').then(res => setFriends(res.data.friends || [])).catch(() => {})
    } catch (error) {
      console.error('Failed to accept request:', error)
    }
  }

  const rejectRequest = async (requestId) => {
    try {
      await api.post('api/users/friends/reject_request', { request_id: requestId })
      setPendingRequests(prev => prev.filter(r => r.request_id !== requestId))
    } catch (error) {
      console.error('Failed to reject request:', error)
    }
  }

  useEffect(() => {
    if (isLoggedIn) {
      api.get('api/profile/me').then(res => setUser(res.data)).catch(() => {})
      api.get('api/users/friends/list_friends').then(res => setFriends(res.data.friends || [])).catch(() => {})
      api.get('api/users/friends/friend_requests').then(res => setPendingRequests(res.data['pending requests'] || [])).catch(() => {})
    }
  }, [isLoggedIn])

  return (
    <div className="min-h-screen text-text-primary flex overflow-hidden relative">
      <SettingsPanel />

      {/* Full-screen lobby background */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${lobbyBg})` }}
      />
      <div className="fixed inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30" />
      
      {/* Right Sidebar: Friends List (Glassmorphic) */}
      <aside className="w-80 border-l border-white/5 flex flex-col hidden lg:flex relative z-10 bg-black/20 backdrop-blur-md shadow-[-20px_0_40px_rgba(0,0,0,0.3)]">
        <div className="p-6 border-b border-white/5">
          <h2 className="text-lg font-black tracking-wider text-white flex items-center gap-2">
            <span className="text-white/30 text-xl font-normal">|</span>
            <span className="text-green-400 font-normal">👥</span> FRIENDS
          </h2>
          <p className="text-xs text-white/40 mt-1 font-medium">Your squad on the pitch</p>
        </div>
        
        <div className="p-4 border-b border-white/5 bg-white/5">
          <div className="relative group">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-xs transition-colors group-focus-within:text-green-400">🔍</span>
            <input 
              type="text" 
              placeholder="Search players..." 
              className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-9 pr-3 text-xs font-medium text-white focus:outline-none focus:border-green-400/50 focus:bg-black/60 transition-all placeholder:text-white/30"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
                }
              }}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {friends.length > 0 ? (
            friends.map(friend => (
              <FriendItem 
                key={friend.id} 
                friend={friend} 
              />
            ))
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 opacity-50">
              <span className="text-4xl filter grayscale">🏟️</span>
              <div>
                <p className="text-sm font-bold text-white">Empty stands</p>
                <p className="text-xs text-white/60 mt-1">Search for players to add them here.</p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative z-10">
        <header className="h-20 border-b border-white/10 bg-black/40 backdrop-blur-md flex items-center justify-between px-8">
          <div className="flex-1 max-w-md flex items-center gap-4">
            <h2 className="text-xl font-bold tracking-tight text-green-400 italic drop-shadow-[0_2px_10px_rgba(34,197,94,0.3)]">⚽ KICK OFF — LOBBY</h2>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={() => setShowRequestsSidebar(true)} className="relative p-2 text-xl hover:scale-110 transition-transform hover:text-green-400 cursor-pointer">
               🔔
               {(pendingRequests.length > 0 || notifications.length > 0) && <span className="absolute top-0 right-0 w-4 h-4 bg-error text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg transform translate-x-1 -translate-y-1">{pendingRequests.length + notifications.length}</span>}
            </button>
            <Link to="/profile" className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl transition-all">
              <div className="text-right flex flex-col">
                <span className="text-sm font-bold">{user?.username}</span>
                <span className="text-[10px] text-green-400 font-semibold tracking-widest px-1.5 py-0.5 bg-green-400/10 rounded border border-green-400/20">LVL {user?.level || 1}</span>
              </div>
              <div className="w-10 h-10 rounded-full border-2 border-green-400/50 overflow-hidden">
                 {user?.avatar ? <img src={getAvatarUrl(user.avatar)} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-green-400/20 flex items-center justify-center font-bold text-green-400">{user?.username?.[0]}</div>}
              </div>
            </Link>
          </div>
        </header>

        {showRequestsSidebar && (
          <>
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={() => setShowRequestsSidebar(false)} />
            <aside className="fixed right-0 top-0 bottom-0 w-80 bg-dark-surface/95 backdrop-blur-2xl border-l border-dark-border z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
              <div className="p-6 border-b border-dark-border flex items-center justify-between">
                <h2 className="text-lg font-bold text-text-primary flex items-center gap-2"><span className="text-green-400">🛎️</span> Notifications</h2>
                <button onClick={() => setShowRequestsSidebar(false)} className="w-8 h-8 rounded-full bg-dark-bg/50 hover:bg-error/20 hover:text-error flex items-center justify-center transition-colors cursor-pointer">✕</button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                
                {/* Chat Notifications */}
                {notifications.length > 0 && notifications.map((notif, idx) => (
                  <div key={`notif-${idx}`} className="p-4 bg-white/5 border border-white/10 rounded-xl shadow-lg flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-green-400">{notif.sender}</p>
                      <p className="text-xs text-text-muted leading-tight">{notif.info || 'Sent a new message'}</p>
                    </div>
                    <div className="flex gap-2">
                       <Link to={`/chat/${notif.sender}`} onClick={() => setShowRequestsSidebar(false)} className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded hover:bg-green-500 hover:text-white transition">Chat</Link>
                       <button onClick={() => clearNotification(idx)} className="px-2 py-1 bg-red-500/10 text-red-400 text-xs font-bold rounded hover:bg-red-500 hover:text-white transition">✕</button>
                    </div>
                  </div>
                ))}

                {/* Friend Requests */}
                {pendingRequests.length > 0 && pendingRequests.map(req => (
                    <div key={req.request_id} className="p-4 bg-dark-bg/50 border border-dark-border rounded-xl shadow-lg">
                      <div className="flex items-center gap-3 mb-3">
                         <div className="w-10 h-10 rounded-full bg-accent/20 border border-accent/50 flex items-center justify-center overflow-hidden shrink-0">
                           {req.from_user_avatar ? <img src={getAvatarUrl(req.from_user_avatar)} className="w-full h-full object-cover" /> : <span className="text-sm font-bold text-accent">{req.from_user[0]}</span>}
                         </div>
                         <div><p className="text-sm font-bold text-text-primary">{req.from_user}</p><p className="text-xs text-text-muted leading-tight">wants to be your friend</p></div>
                      </div>
                      <div className="flex gap-2 mt-2">
                         <button onClick={() => acceptRequest(req.request_id)} className="flex-1 py-1.5 text-xs font-semibold bg-green-500/10 border border-green-500/30 text-green-500 hover:bg-green-500 hover:text-white rounded-lg transition-all">Accept</button>
                         <button onClick={() => rejectRequest(req.request_id)} className="flex-1 py-1.5 text-xs font-semibold bg-error/10 border border-error/30 text-error hover:bg-error hover:text-white rounded-lg transition-all">Reject</button>
                      </div>
                    </div>
                ))}

                {(pendingRequests.length === 0 && notifications.length === 0) && (
                  <div className="py-12 text-center space-y-3 text-text-muted">
                    <p className="text-3xl">📭</p>
                    <p className="text-sm">No new notifications.</p>
                  </div>
                )}
              </div>
            </aside>
          </>
        )}

        {/* Center content: Room selection */}
        <section className="flex-1 overflow-y-auto flex flex-col items-center justify-center z-10 p-8 pb-16">
          <div className="text-center mb-12 animate-in fade-in duration-700 mt-auto">
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter italic select-none drop-shadow-[0_4px_30px_rgba(34,197,94,0.3)]">
              CHOOSE YOUR PITCH
            </h1>
            <p className="text-white/50 text-sm mt-3 tracking-widest uppercase font-medium">
              Select a game mode to start playing
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 animate-in fade-in zoom-in duration-700 delay-200 mb-8">
            {/* Public Room Button */}
            <button
              onClick={() => navigate('/room/public')}
              className="group relative w-64 h-36 rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(34,197,94,0.3)] active:scale-95"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-600/80 to-green-800/80 border-2 border-green-400/30 rounded-3xl" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <div className="relative z-10 h-full flex flex-col items-center justify-center gap-2">
                <span className="text-4xl drop-shadow-lg">🌍</span>
                <div>
                  <h3 className="text-xl font-black text-white tracking-wider">PUBLIC ROOM</h3>
                  <p className="text-green-200/60 text-[10px] mt-0.5 font-medium">Join an open match</p>
                </div>
              </div>
            </button>

            {/* Private Room Button */}
            <button
              onClick={() => navigate('/room/private')}
              className="group relative w-64 h-36 rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(124,58,237,0.3)] active:scale-95"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-violet-600/80 to-violet-900/80 border-2 border-violet-400/30 rounded-3xl" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <div className="relative z-10 h-full flex flex-col items-center justify-center gap-2">
                <span className="text-4xl drop-shadow-lg">🔒</span>
                <div>
                  <h3 className="text-xl font-black text-white tracking-wider">PRIVATE ROOM</h3>
                  <p className="text-violet-200/60 text-[10px] mt-0.5 font-medium">Create match with friends</p>
                </div>
              </div>
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}

export default Lobby
