/**
 * Lobby.jsx — Dedicated Game Lobby Page (Protected)
 *
 * PURPOSE:
 * Provides a dedicated space for matchmaking, managing the party,
 * and interacting with friends.
 */

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'
import SettingsPanel from '../components/SettingsPanel'
import { getAvatarUrl, formatDate } from '../utils'

function FriendItem({ friend, handleInvite, navigate }) {
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
    <div className="group p-3 rounded-xl bg-dark-card/30 border border-transparent hover:border-accent/30 transition-all flex items-center justify-between">
      <Link to={`/user/${friend.username}`} className="flex items-center gap-3 flex-1">
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center overflow-hidden">
            {friend.avatar ? (
              <img src={getAvatarUrl(friend.avatar)} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-bold text-accent">{friend.username[0]}</span>
            )}
          </div>
          <span
            className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-dark-surface ${
              isOnline ? 'bg-green-500' : 'bg-gray-500'
            }`}
            title={isOnline ? 'Online' : (lastSeen ? `Last seen: ${formatDate(lastSeen)}` : 'Offline')}
          >
            {isOnline && (
              <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75" />
            )}
          </span>
        </div>
        <div>
          <span className="text-sm font-semibold group-hover:text-accent transition-colors">
            {friend.username}
          </span>
          <p className="text-[10px] text-text-muted capitalize truncate max-w-[120px]">{statusLabel}</p>
        </div>
      </Link>
      <button 
        onClick={(e) => { e.preventDefault(); handleInvite(friend); }}
        className="opacity-0 group-hover:opacity-100 p-2 text-accent hover:bg-accent/10 rounded-lg transition-all z-10 relative cursor-pointer"
        title="Invite to Party"
      >
        ➕
      </button>
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
  const [party, setParty] = useState([])
  const [matchMode, setMatchMode] = useState('1v1')

  const maxPlayersMap = { '1v1': 1, '2v2': 2, '3v3': 3 }
  const maxPlayers = maxPlayersMap[matchMode]
  const currentPartySize = party.length + 1
  const isPartyValid = currentPartySize <= maxPlayers

  useEffect(() => {
    if (isLoggedIn) {
      api.get('api/profile/me').then(res => setUser(res.data)).catch(() => {})
      api.get('api/users/friends/list_friends').then(res => setFriends(res.data.friends || [])).catch(() => {})
      api.get('api/users/friends/friend_requests').then(res => setPendingRequests(res.data['pending requests'] || [])).catch(() => {})
    }
  }, [isLoggedIn])

  function handleInvite(friend) {
    if (currentPartySize >= maxPlayers) {
      alert(`Party is full for ${matchMode} mode! (Max ${maxPlayers} players)`)
      return
    }
    if (party.find(p => p.id === friend.id)) return
    setParty([...party, friend])
  }

  function handleRemoveFromParty(friendId) {
    setParty(party.filter(p => p.id !== friendId))
  }

  function handleStartMatchmaking() {
    if (!isPartyValid) return
    navigate('/queue')
  }

  return (
    <div className="min-h-screen bg-dark-bg text-text-primary flex overflow-hidden">
      <SettingsPanel />
      
      {/* Sidebar: Friends List */}
      <aside className="w-72 bg-dark-surface/50 border-r border-dark-border flex flex-col hidden lg:flex">
        <div className="p-6 border-b border-dark-border">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="text-accent">👥</span> Friends
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {friends.length > 0 ? (
            friends.map(friend => (
              <FriendItem 
                key={friend.id} 
                friend={friend} 
                getAvatarUrl={getAvatarUrl} 
                handleInvite={handleInvite} 
                navigate={navigate} 
              />
            ))
          ) : (
            <div className="py-10 text-center space-y-2">
              <p className="text-2xl">🧊</p>
              <p className="text-xs text-text-muted">No friends yet.<br/>Use the search bar to find players!</p>
            </div>
          )}
        </div>
        <div className="p-4 border-t border-dark-border bg-dark-surface/30 space-y-3">
          <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest pl-1">Find Players</label>
          <div className="relative group">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-xs group-focus-within:text-accent">🔍</span>
            <input 
              type="text" 
              placeholder="Username..." 
              className="w-full bg-dark-bg/50 border border-dark-border rounded-lg py-2 pl-9 pr-3 text-xs focus:outline-none focus:border-accent/50 transition-all placeholder:text-text-muted/50"
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
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent-light/5 rounded-full blur-[100px]" />
        </div>

        <header className="h-20 border-b border-dark-border bg-dark-bg/80 backdrop-blur-md flex items-center justify-between px-8 z-10">
          <div className="flex-1 max-w-md flex items-center gap-4">
            <Link to="/" className="text-text-muted hover:text-accent transition-colors">← Back</Link>
            <h2 className="text-xl font-bold tracking-tight text-accent italic">TRANSCENDENCE LOBBY</h2>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={() => setShowRequestsSidebar(true)} className="relative p-2 text-xl hover:scale-110 transition-transform hover:text-accent cursor-pointer">
               🔔
               {pendingRequests.length > 0 && <span className="absolute top-0 right-0 w-4 h-4 bg-error text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg transform translate-x-1 -translate-y-1">{pendingRequests.length}</span>}
            </button>
            <Link to="/profile" className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl transition-all">
              <div className="text-right flex flex-col">
                <span className="text-sm font-bold">{user?.username}</span>
                <span className="text-[10px] text-accent font-semibold tracking-widest px-1.5 py-0.5 bg-accent/10 rounded border border-accent/20">LVL {user?.level || 1}</span>
              </div>
              <div className="w-10 h-10 rounded-full border-2 border-accent/50 overflow-hidden">
                 {user?.avatar ? <img src={getAvatarUrl(user.avatar)} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-accent/20 flex items-center justify-center font-bold text-accent">{user?.username?.[0]}</div>}
              </div>
            </Link>
          </div>
        </header>

        {showRequestsSidebar && (
          <>
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={() => setShowRequestsSidebar(false)} />
            <aside className="fixed right-0 top-0 bottom-0 w-80 bg-dark-surface/95 backdrop-blur-2xl border-l border-dark-border z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
              <div className="p-6 border-b border-dark-border flex items-center justify-between">
                <h2 className="text-lg font-bold text-text-primary flex items-center gap-2"><span className="text-accent">🛎️</span> Friend Requests</h2>
                <button onClick={() => setShowRequestsSidebar(false)} className="w-8 h-8 rounded-full bg-dark-bg/50 hover:bg-error/20 hover:text-error flex items-center justify-center transition-colors cursor-pointer">✕</button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {pendingRequests.length > 0 ? pendingRequests.map(req => (
                    <div key={req.request_id} className="p-4 bg-dark-bg/50 border border-dark-border rounded-xl shadow-lg">
                      <div className="flex items-center gap-3 mb-3">
                         <div className="w-10 h-10 rounded-full bg-accent/20 border border-accent/50 flex items-center justify-center overflow-hidden shrink-0">
                           {req.from_user_avatar ? <img src={getAvatarUrl(req.from_user_avatar)} className="w-full h-full object-cover" /> : <span className="text-sm font-bold text-accent">{req.from_user[0]}</span>}
                         </div>
                         <div><p className="text-sm font-bold text-text-primary">{req.from_user}</p><p className="text-xs text-text-muted leading-tight">wants to be your friend</p></div>
                      </div>
                      <Link to={`/user/${req.from_user}`} onClick={() => setShowRequestsSidebar(false)} className="block w-full py-2 text-center text-xs font-semibold bg-accent/10 border border-accent/30 text-accent hover:bg-accent hover:text-white rounded-lg transition-all">View Profile to Respond</Link>
                    </div>
                )) : <div className="py-12 text-center space-y-3 text-text-muted"><p className="text-3xl">📭</p><p className="text-sm">No pending requests.</p></div>}
              </div>
            </aside>
          </>
        )}

        <section className="flex-1 overflow-y-auto p-12 flex flex-col items-center justify-center z-10">
          <div className="flex items-center justify-center gap-8 mb-16">
            <div className="flex flex-col items-center gap-4 group">
              <div className="w-28 h-28 rounded-full border-4 border-accent flex items-center justify-center overflow-hidden shadow-2xl shadow-accent/20 bg-dark-surface">
                 {user?.avatar ? <img src={getAvatarUrl(user.avatar)} className="w-full h-full object-cover" /> : <span className="text-4xl font-bold text-accent">{user?.username?.[0]}</span>}
              </div>
              <span className="font-bold text-lg">{user?.username} (You)</span>
            </div>
            <div className="flex items-center justify-center">
              <div className="w-8 h-1 bg-dark-border rounded-full mx-2" />
              {party[0] ? (
                <div className="flex flex-col items-center gap-4 group animate-in">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full border-2 border-accent/40 flex items-center justify-center overflow-hidden bg-dark-surface">
                      {party[0].avatar ? <img src={getAvatarUrl(party[0].avatar)} className="w-full h-full object-cover" /> : <span className="text-2xl font-bold text-accent">{party[0].username[0]}</span>}
                    </div>
                    <button onClick={() => handleRemoveFromParty(party[0].id)} className="absolute -top-1 -right-1 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs border border-white/20 opacity-0 group-hover:opacity-100 transition-all">✕</button>
                  </div>
                  <span className="font-semibold text-text-secondary">{party[0].username}</span>
                </div>
              ) : <div className="w-24 h-24 rounded-full border-2 border-dashed border-dark-border flex items-center justify-center text-dark-border text-4xl">＋</div>}
              <div className="w-8 h-1 bg-dark-border rounded-full mx-2" />
            </div>
            <div className="flex items-center justify-center">
               {party[1] ? (
                <div className="flex flex-col items-center gap-4 group animate-in">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full border-2 border-accent/40 flex items-center justify-center overflow-hidden bg-dark-surface">
                      {party[1].avatar ? <img src={getAvatarUrl(party[1].avatar)} className="w-full h-full object-cover" /> : <span className="text-2xl font-bold text-accent">{party[1].username[0]}</span>}
                    </div>
                    <button onClick={() => handleRemoveFromParty(party[1].id)} className="absolute -top-1 -right-1 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs border border-white/20 opacity-0 group-hover:opacity-100 transition-all">✕</button>
                  </div>
                  <span className="font-semibold text-text-secondary">{party[1].username}</span>
                </div>
              ) : <div className="w-24 h-24 rounded-full border-2 border-dashed border-dark-border flex items-center justify-center text-dark-border text-4xl">＋</div>}
            </div>
          </div>

          <div className="bg-dark-surface/40 backdrop-blur-xl border border-dark-border rounded-[32px] p-10 max-w-xl w-full text-center space-y-10 shadow-2xl">
            <div className="space-y-4">
              <h3 className="text-text-muted text-xs font-bold uppercase tracking-[0.2em]">Select Arena Mode</h3>
              <div className="flex justify-center gap-4">
                {['1v1', '2v2', '3v3'].map(mode => (
                  <button key={mode} onClick={() => setMatchMode(mode)} className={`px-8 py-3 rounded-2xl font-bold transition-all duration-300 border ${matchMode === mode ? 'bg-accent border-accent text-white shadow-lg shadow-accent/30' : 'bg-dark-bg/50 border-dark-border text-text-muted hover:border-accent/40'}`}>{mode}</button>
                ))}
              </div>
            </div>
            <button onClick={handleStartMatchmaking} disabled={!isPartyValid} className={`w-full py-5 text-xl font-black rounded-2xl transition-all duration-300 group overflow-hidden relative ${isPartyValid ? 'bg-accent hover:bg-accent-light text-white shadow-2xl shadow-accent/40 hover:-translate-y-1 active:translate-y-0 cursor-pointer' : 'bg-dark-border text-text-muted cursor-not-allowed opacity-60'}`}>
              <span className="relative z-10 flex items-center justify-center gap-3">{isPartyValid ? 'START MATCHMAKING' : 'PARTY TOO LARGE'} <span className="text-2xl transition-transform group-hover:translate-x-2">{isPartyValid ? '🚀' : '🛑'}</span></span>
              {isPartyValid && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />}
            </button>
            <div className="space-y-1">
               {!isPartyValid && <p className="text-red-400 text-sm font-bold animate-pulse">⚠️ Remove {currentPartySize - maxPlayers} player(s) to play {matchMode}</p>}
              <p className="text-text-muted text-xs italic">Finding matches based on skill level...</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default Lobby
