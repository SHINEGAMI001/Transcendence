/**
 * Home.jsx — Landing Page & Lobby
 *
 * PURPOSE:
 * Public landing page for guests, and a feature-rich Lobby for logged-in users.
 */

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import SettingsPanel from '../components/SettingsPanel'

const API_BASE = 'http://localhost:8000/'
const BACKEND_ORIGIN = 'http://localhost:8000'

function Home() {
  const { isLoggedIn, loading } = useAuth()
  const navigate = useNavigate()

  // User profile data (for lobby)
  const [user, setUser] = useState(null)
  
  // Lobby States
  const [searchQuery, setSearchQuery] = useState('')
  const [friends, setFriends] = useState([]) // Friends list (to be fetched from backend)
  const [party, setParty] = useState([]) // Friends currently in your lobby
  const [matchMode, setMatchMode] = useState('1v1')

  // Max players allowed for each mode (including the user)
  const maxPlayersMap = { '1v1': 1, '2v2': 2, '3v3': 3 }
  const maxPlayers = maxPlayersMap[matchMode]
  const currentPartySize = party.length + 1
  const isPartyValid = currentPartySize <= maxPlayers

  // Fetch basic user info if logged in
  useEffect(() => {
    if (isLoggedIn) {
      axios.get(`${API_BASE}api/profile/me`, { withCredentials: true })
        .then(res => setUser(res.data))
        .catch(() => {})
    }
  }, [isLoggedIn])

  function getAvatarUrl(avatarPath) {
    if (!avatarPath) return null
    if (avatarPath.startsWith('http')) return avatarPath
    return `${BACKEND_ORIGIN}${avatarPath}`
  }

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

  // --- Guest View (Landing Page) ---
  if (!isLoggedIn && !loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl" />
        </div>
        <div className="relative text-center space-y-8 animate-in">
          <div>
            <h1 className="text-6xl md:text-8xl font-bold text-text-primary tracking-tighter italic">
              TRANSCENDENCE
            </h1>
            <p className="text-text-secondary mt-4 text-xl font-medium tracking-wide border-l-4 border-accent pl-4 text-left inline-block">
              DOMINATE THE COURT. <br/>REDEFINE THE GAME.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
            <Link to="/register" className="px-10 py-4 bg-accent hover:bg-accent-light text-white font-bold rounded-xl transition-all duration-300 hover:shadow-2xl hover:shadow-accent/40 hover:-translate-y-1 active:scale-95 text-center min-w-[200px]">
              GET STARTED
            </Link>
            <Link to="/login" className="px-10 py-4 bg-dark-surface border border-dark-border hover:border-accent/40 text-text-primary font-bold rounded-xl transition-all duration-300 hover:bg-accent/5 hover:shadow-xl active:scale-95 text-center min-w-[200px]">
              SIGN IN
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // --- Loading State ---
  if (loading) {
    return <div className="min-h-screen bg-dark-bg flex items-center justify-center"><div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" /></div>
  }

  // --- Lobby View (Logged In) ---
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
              <div key={friend.id} className="group p-3 rounded-xl bg-dark-card/30 border border-transparent hover:border-accent/30 transition-all flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center overflow-hidden">
                      {friend.avatar ? <img src={getAvatarUrl(friend.avatar)} className="w-full h-full object-cover" /> : <span className="text-xs font-bold text-accent">{friend.username[0]}</span>}
                    </div>
                    <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-dark-surface ${friend.status === 'online' ? 'bg-success' : friend.status === 'in-game' ? 'bg-accent' : 'bg-text-muted'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{friend.username}</p>
                    <p className="text-[10px] text-text-muted capitalize">{friend.status}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleInvite(friend)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-accent hover:bg-accent/10 rounded-lg transition-all"
                  title="Invite to Party"
                >
                  ➕
                </button>
              </div>
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
        {/* Background Blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent-light/5 rounded-full blur-[100px]" />
        </div>

        {/* Top Header Bar */}
        <header className="h-20 border-b border-dark-border bg-dark-bg/80 backdrop-blur-md flex items-center justify-between px-8 z-10">
          <div className="flex-1 max-w-md flex items-center gap-4">
            <h2 className="text-xl font-bold tracking-tight text-accent italic">TRANSCENDENCE LOBBY</h2>
          </div>
          <div className="flex items-center gap-6">
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

        {/* Lobby Content */}
        <section className="flex-1 overflow-y-auto p-12 flex flex-col items-center justify-center z-10">
          
          {/* My Party Display */}
          <div className="flex items-center justify-center gap-8 mb-16">
            {/* The User */}
            <div className="flex flex-col items-center gap-4 group">
              <div className="relative">
                <div className="w-28 h-28 rounded-full border-4 border-accent flex items-center justify-center overflow-hidden shadow-2xl shadow-accent/20 bg-dark-surface">
                   {user?.avatar ? <img src={getAvatarUrl(user.avatar)} className="w-full h-full object-cover" /> : <span className="text-4xl font-bold text-accent">{user?.username?.[0]}</span>}
                </div>
                <div className="absolute -top-2 -right-2 bg-accent text-white text-[10px] font-bold px-2 py-1 rounded-md border border-white/20 shadow-xl">LEADER</div>
              </div>
              <span className="font-bold text-lg">{user?.username} (You)</span>
            </div>

            {/* Party Slot 1 */}
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
              ) : (
                <div className="w-24 h-24 rounded-full border-2 border-dashed border-dark-border flex items-center justify-center text-dark-border text-4xl">＋</div>
              )}
              <div className="w-8 h-1 bg-dark-border rounded-full mx-2" />
            </div>

            {/* Party Slot 2 */}
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
              ) : (
                <div className="w-24 h-24 rounded-full border-2 border-dashed border-dark-border flex items-center justify-center text-dark-border text-4xl">＋</div>
              )}
            </div>
          </div>

          <div className="bg-dark-surface/40 backdrop-blur-xl border border-dark-border rounded-[32px] p-10 max-w-xl w-full text-center space-y-10 shadow-2xl">
            <div className="space-y-4">
              <h3 className="text-text-muted text-xs font-bold uppercase tracking-[0.2em]">Select Arena Mode</h3>
              <div className="flex justify-center gap-4">
                {['1v1', '2v2', '3v3'].map(mode => (
                  <button 
                    key={mode} 
                    onClick={() => setMatchMode(mode)}
                    className={`px-8 py-3 rounded-2xl font-bold transition-all duration-300 border ${matchMode === mode ? 'bg-accent border-accent text-white shadow-lg shadow-accent/30' : 'bg-dark-bg/50 border-dark-border text-text-muted hover:border-accent/40'}`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={handleStartMatchmaking}
              disabled={!isPartyValid}
              className={`w-full py-5 text-xl font-black rounded-2xl transition-all duration-300 group overflow-hidden relative ${
                isPartyValid 
                ? 'bg-accent hover:bg-accent-light text-white shadow-2xl shadow-accent/40 hover:-translate-y-1 active:translate-y-0 cursor-pointer' 
                : 'bg-dark-border text-text-muted cursor-not-allowed opacity-60'
              }`}
            >
              <span className="relative z-10 flex items-center justify-center gap-3">
                {isPartyValid ? 'START MATCHMAKING' : 'PARTY TOO LARGE'} <span className="text-2xl transition-transform group-hover:translate-x-2">{isPartyValid ? '🚀' : '🛑'}</span>
              </span>
              {isPartyValid && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />}
            </button>
            <div className="space-y-1">
               {!isPartyValid && (
                <p className="text-red-400 text-sm font-bold animate-pulse">
                  ⚠️ Remove {currentPartySize - maxPlayers} player(s) to play {matchMode}
                </p>
              )}
              <p className="text-text-muted text-xs italic">Finding matches based on skill level...</p>
            </div>
          </div>
        </section>
      </main>

      {/* Floating Mobile Friend Toggle (could be added later) */}
    </div>
  )
}

export default Home
