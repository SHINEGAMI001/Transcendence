import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'
import { getAvatarUrl } from '../utils'
import lobbyBg from '../assets/lobbybackground.png.jpg'

// Mock data for rooms
const MOCK_ROOMS = [
  { id: 1, players: 3, maxPlayers: 10 },
  { id: 2, players: 8, maxPlayers: 8 },
  { id: 3, players: 1, maxPlayers: 4 },
  { id: 4, players: 5, maxPlayers: 6 },
  { id: 5, players: 2, maxPlayers: 10 },
  { id: 6, players: 4, maxPlayers: 4 },
]

function PublicRoom() {
  const navigate = useNavigate()
  const { isLoggedIn } = useAuth()
  const [user, setUser] = useState(null)
  const [selectedRoom, setSelectedRoom] = useState(null)

  useEffect(() => {
    if (isLoggedIn) {
      api.get('api/profile/me').then(res => setUser(res.data)).catch(() => { })
    }
  }, [isLoggedIn])

  // Mock party members
  const partyMembers = user ? [user] : []

  return (
    <div className="min-h-screen text-text-primary flex flex-col relative overflow-hidden">
      {/* Background */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat grayscale-[0.3]"
        style={{ backgroundImage: `url(${lobbyBg})` }}
      />
      <div className="fixed inset-0 bg-gradient-to-t from-black via-black/60 to-black/40" />

      {/* Header */}
      <header className="h-20 border-b border-white/10 bg-black/40 backdrop-blur-md flex items-center justify-between px-8 relative z-20">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/lobby')}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer group"
          >
            <span className="text-white/50 group-hover:text-green-400 transition-colors">←</span>
          </button>
          <h2 className="text-xl font-bold tracking-tight text-white italic">
            PUBLIC <span className="text-green-400">ROOMS</span>
          </h2>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right flex flex-col">
            <span className="text-sm font-bold text-white">{user?.username}</span>
            <span className="text-[10px] text-green-400 font-bold tracking-widest uppercase">Party Leader</span>
          </div>
          <div className="w-10 h-10 rounded-full border-2 border-green-400/50 overflow-hidden shadow-[0_0_15px_rgba(34,197,94,0.3)]">
            {user?.avatar ? <img src={getAvatarUrl(user.avatar)} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-green-400/20 flex items-center justify-center font-bold text-green-400">{user?.username?.[0]}</div>}
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="flex-1 flex relative z-10 overflow-hidden">

        {/* Center: Room Browser */}
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-black text-white italic tracking-tighter">AVAILABLE ROOMS</h3>
                <p className="text-xs text-white/40 font-medium">Select a room to see match details</p>
              </div>
              <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-white/60 hover:bg-white/10 transition-colors">REFRESH LIST</button>
            </div>

            <div className="grid gap-3">
              {MOCK_ROOMS.map(room => (
                <button
                  key={room.id}
                  onClick={() => setSelectedRoom(room)}
                  className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 flex items-center justify-between group ${selectedRoom?.id === room.id
                      ? 'bg-green-400/10 border-green-400 shadow-[0_0_20px_rgba(34,197,94,0.15)] scale-[1.01]'
                      : 'bg-black/40 border-white/5 hover:border-white/20 hover:bg-black/60'
                    }`}
                >
                  <div className="flex items-center gap-5">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-colors ${selectedRoom?.id === room.id ? 'bg-green-400 text-black' : 'bg-white/5 text-white/40'}`}>
                      ⚽
                    </div>
                    <div>
                      <h4 className={`font-bold transition-colors ${selectedRoom?.id === room.id ? 'text-green-400' : 'text-white'}`}>Room #{room.id}</h4>
                      <p className="text-xs text-white/40">Status: {room.players < room.maxPlayers ? 'Open' : 'Full'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8 px-4">
                    <div className="w-48 bg-white/5 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${room.players === room.maxPlayers ? 'bg-error' : 'bg-green-400'}`}
                        style={{ width: `${(room.players / room.maxPlayers) * 100}%` }}
                      />
                    </div>
                    <p className="text-sm font-black text-white w-12 text-right">{room.players}/{room.maxPlayers}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </main>

        {/* Right Panel: Room Details */}
        <aside className={`w-96 border-l border-white/5 bg-black/40 backdrop-blur-xl flex flex-col shrink-0 transition-all duration-500 ${selectedRoom ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0'}`}>
          {selectedRoom ? (
            <div className="flex-1 flex flex-col h-full">
              <div className="h-48 bg-gradient-to-br from-green-600/40 to-green-900/40 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/grass.png')]" />
                <span className="text-6xl drop-shadow-2xl z-10">⚽</span>
                <div className="absolute bottom-4 left-6 right-6 z-10">
                  <h3 className="text-xl font-black text-white drop-shadow-md tracking-tight italic">ROOM #{selectedRoom.id}</h3>
                  <span className="text-[10px] uppercase font-bold text-green-400 tracking-widest">Active Match Session</span>
                </div>
              </div>

              <div className="p-8 space-y-8 flex-1">
                <div className="grid grid-cols-1 gap-4">
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-black text-white/30 uppercase mb-1">Current Occupancy</p>
                      <p className="text-2xl font-black text-white tracking-tighter">
                        {selectedRoom.players} / {selectedRoom.maxPlayers}
                      </p>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${selectedRoom.players < selectedRoom.maxPlayers ? 'bg-green-400 animate-pulse' : 'bg-error'}`} />
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-black/20 border border-white/5 space-y-4">
                  <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest">Server Settings</h4>
                  <p className="text-xs text-white/60 leading-relaxed italic border-l-2 border-green-400/30 pl-4">
                    Standard match rules apply. All players must be ready to begin the countdown once the room reaches minimum capacity.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 opacity-20">
              <span className="text-6xl mb-4">🏟️</span>
              <p className="font-black italic uppercase tracking-tighter">Select a Room</p>
              <p className="text-xs mt-2 font-medium">Browse the available matches to join the pit</p>
            </div>
          )}
        </aside>
      </div>

      {/* Bottom Control Bar */}
      <footer className="h-24 border-t border-white/10 bg-black/80 backdrop-blur-2xl relative z-20 flex items-center px-12 justify-between">
        <div className="flex items-center gap-8">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Environment</span>
            <span className="text-sm font-bold text-white italic">PUBLIC MATCHMAKING</span>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Match Selection</span>
            <span className="text-sm font-bold text-green-400">{selectedRoom ? `ROOM #${selectedRoom.id}` : 'NONE'}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/room/create')} className="px-8 py-4 rounded-xl bg-green-500/20 text-green-400 border border-green-400/30 font-black italic tracking-tighter text-lg hover:bg-green-500/30 transition-all cursor-pointer">
            CREATE ROOM
          </button>
          <button
            disabled={!selectedRoom || selectedRoom.players === selectedRoom.maxPlayers}
            className={`px-12 py-4 rounded-xl font-black italic tracking-tighter text-lg transition-all duration-300 ${selectedRoom && selectedRoom.players < selectedRoom.maxPlayers
                ? 'bg-green-400 text-black hover:scale-105 shadow-[0_0_40px_rgba(34,197,94,0.4)] active:scale-95 cursor-pointer'
                : 'bg-white/5 text-white/20 border border-white/10 cursor-not-allowed'
              }`}
          >
            JOIN GAME
          </button>
        </div>
      </footer>
    </div>
  )
}

export default PublicRoom
