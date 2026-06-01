import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'
import { getAvatarUrl } from '../utils'
import lobbyBg from '../assets/lobbybackground.jpg'



function PublicRoom() {
  const navigate = useNavigate()
  const { isLoggedIn } = useAuth()
  const [user, setUser] = useState(null)
  const [rooms, setRooms] = useState([])
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)

  const fetchRooms = async () => {
    setLoading(true)
    try {
      const res = await api.get('api/game/list/')
      // The backend returns 200 with listed_games or 204 if empty
      setRooms(res.data.listed_games || [])
    } catch (error) {
      if (error.response?.status === 204) {
        setRooms([])
      } else {
        console.error('Failed to fetch rooms:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isLoggedIn) {
      api.get('api/profile/me').then(res => setUser(res.data)).catch(() => { })
      fetchRooms()
    }
  }, [isLoggedIn])

  const handleJoin = async () => {
    if (!selectedRoom || !user) return
    
    setJoining(true)
    try {
      const res = await api.post('api/game/join_queue/', {
        queue_id: selectedRoom.queue_id
      })

      if (res.data.queue_id) {
        sessionStorage.setItem('join_public_queue_id', String(res.data.queue_id))
        sessionStorage.setItem('join_public_game_id', String(selectedRoom.id))
        navigate(`/room/create`)
      }
    } catch (error) {
      console.error('Join failed:', error)
      if (error.response?.data?.['error message'] === 'already in another queue') {
        const gameId = error.response?.data?.game_id;
        if (gameId) {
            if (window.confirm("You are already in an active game. Reconnect?")) {
                navigate(`/game/${gameId}`);
            }
        } else {
            alert('You are already in another queue. Leave it first.')
        }
      } else {
        alert(error.response?.data?.['error message'] || 'Failed to join queue')
      }
    } finally {
      setJoining(false)
    }
  }

  const handleCreatePublicRoom = async () => {
    try {
      const res = await api.post('api/game/create_queue/')
      sessionStorage.setItem('public_queue_id', String(res.data.queue_id))
      navigate('/room/create')
    } catch (err) {
      console.error('Failed to create public room queue:', err)
      if (err.response?.data?.['error message'] === 'user already in queue') {
        const gameId = err.response?.data?.game_id;
        if (gameId) {
            if (window.confirm("You are already in an active game. Reconnect?")) {
                navigate(`/game/${gameId}`);
            }
        } else {
            const confirmLeave = window.confirm('You are already in another queue. Leave the current queue to create a new one?')
            if (confirmLeave) {
              const existingQueueId = err.response?.data?.queue_id
              if (existingQueueId) {
             try {
                await api.post('api/game/leave_queue/', { queue_id: existingQueueId })
                const retryRes = await api.post('api/game/create_queue/')
                sessionStorage.setItem('public_queue_id', String(retryRes.data.queue_id))
                navigate('/room/create')
             } catch (leaveErr) {
                alert('Failed to leave the existing queue.')
             }
          } else {
             alert('Please leave your current queue first.')
          }
        }
      }
      } else {
        alert(err.response?.data?.['error message'] || 'Failed to create queue')
      }
    }
  }

  return (
    <div className="min-h-screen text-text-primary flex flex-col relative overflow-hidden" style={{ fontFamily: "'Courier New', monospace" }}>
      {/* Background */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat grayscale-[0.3] blur-[3px] scale-[1.02]"
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
            <span className="text-white/50 group-hover:text-violet-400 transition-colors">←</span>
          </button>
          <h2 className="text-xl font-bold tracking-tight text-white italic">
            PUBLIC <span className="text-violet-400">ROOMS</span>
          </h2>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right flex flex-col">
            <span className="text-sm font-bold text-white">{user?.username}</span>
            <span className="text-[10px] text-violet-400 font-bold tracking-widest uppercase">Party Leader</span>
          </div>
          <div className="w-10 h-10 rounded-full border-2 border-violet-400/50 overflow-hidden shadow-[0_0_15px_rgba(139,92,246,0.3)]">
            {user?.avatar ? <img src={getAvatarUrl(user.avatar)} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-violet-400/20 flex items-center justify-center font-bold text-violet-400">{user?.username?.[0]}</div>}
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
              <button 
                onClick={fetchRooms}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-white/60 hover:bg-white/10 transition-colors cursor-pointer"
              >
                {loading ? 'SCANNING...' : 'REFRESH LIST'}
              </button>
            </div>

            <div className="grid gap-3">
              {rooms.length > 0 ? rooms.map(room => {
                const currentPlayers = room.total_players || 0
                return (
                  <button
                    key={room.id}
                    onClick={() => setSelectedRoom(room)}
                    className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 flex items-center justify-between group ${selectedRoom?.id === room.id
                        ? 'bg-violet-400/10 border-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.15)] scale-[1.01]'
                        : 'bg-black/40 border-white/5 hover:border-white/20 hover:bg-black/60'
                      }`}
                  >
                    <div className="flex items-center gap-5">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-colors ${selectedRoom?.id === room.id ? 'bg-violet-400 text-black' : 'bg-white/5 text-white/40'}`}>
                        ⚽
                      </div>
                      <div>
                        <h4 className={`font-bold transition-colors ${selectedRoom?.id === room.id ? 'text-violet-400' : 'text-white'}`}>Room #{room.id.slice(0, 8)}</h4>
                        <p className="text-xs text-white/40">Created by: {room.created_by}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8 px-4">
                      <div className="w-48 bg-white/5 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${currentPlayers === room.max_players ? 'bg-error' : 'bg-violet-400'}`}
                          style={{ width: `${(currentPlayers / room.max_players) * 100}%` }}
                        />
                      </div>
                      <p className="text-sm font-black text-white w-12 text-right">{currentPlayers}/{room.max_players}</p>
                    </div>
                  </button>
                )
              }) : !loading && (
                <div className="py-20 text-center space-y-4 opacity-20">
                   <p className="text-6xl">🏟️</p>
                   <p className="font-black italic uppercase tracking-tighter">No games found</p>
                   <p className="text-xs font-medium">Be the first to create a public match!</p>
                </div>
              )}
              
              {loading && (
                <div className="grid gap-3 animate-pulse">
                   {[1,2,3].map(i => <div key={i} className="h-20 bg-white/5 rounded-2xl border border-white/5" />)}
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Right Panel: Room Details */}
        <aside className={`w-96 border-l border-white/5 bg-black/40 backdrop-blur-xl flex flex-col shrink-0 transition-all duration-500 ${selectedRoom ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0'}`}>
          {selectedRoom ? (
            <div className="flex-1 flex flex-col h-full">
              <div className="h-48 bg-gradient-to-br from-violet-600/40 to-violet-900/40 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/grass.png')]" />
                <span className="text-6xl drop-shadow-2xl z-10">⚽</span>
                <div className="absolute bottom-4 left-6 right-6 z-10">
                  <h3 className="text-xl font-black text-white drop-shadow-md tracking-tight italic">ROOM #{selectedRoom.id.slice(0, 8)}</h3>
                  <span className="text-[10px] uppercase font-bold text-violet-400 tracking-widest">Active Match Session</span>
                </div>
              </div>

              <div className="p-8 space-y-8 flex-1">
                <div className="grid grid-cols-1 gap-4">

                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-black text-white/30 uppercase mb-1">Current Occupancy</p>
                      <p className="text-2xl font-black text-white tracking-tighter">
                        {selectedRoom.total_players || 0} / {selectedRoom.max_players}
                      </p>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${selectedRoom.total_players < selectedRoom.max_players ? 'bg-violet-400 animate-pulse' : 'bg-error'}`} />
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-black/20 border border-white/5 space-y-4">
                  <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest">Team Stats</h4>
                  <div className="space-y-3">
                     <div className="flex justify-between items-center text-xs">
                        <span className="text-white/40">Team Blue </span>
                        <span className="font-bold text-white">{selectedRoom.team_a_count} Players</span>
                     </div>
                     <div className="flex justify-between items-center text-xs">
                        <span className="text-white/40">Team Red </span>
                        <span className="font-bold text-white">{selectedRoom.team_b_count} Players</span>
                     </div>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-black/20 border border-white/5 space-y-4">
                  <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest">Match Administrator</h4>
                  <div className="flex items-center gap-4">
                     <div>
                        <p className="text-sm font-bold text-white tracking-tight">@{selectedRoom.created_by}</p>
                        <p className="text-[10px] text-violet-400 uppercase font-black tracking-widest">Room Creator</p>
                     </div>
                  </div>
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
            <span className="text-sm font-bold text-violet-400">{selectedRoom ? `ROOM #${selectedRoom.id.slice(0, 8)}` : 'NONE'}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={handleCreatePublicRoom} className="px-8 py-4 rounded-xl bg-violet-500/20 text-violet-400 border border-violet-400/30 font-black italic tracking-tighter text-lg hover:bg-violet-500/30 transition-all cursor-pointer">
            CREATE ROOM
          </button>
          <button
            disabled={!selectedRoom || selectedRoom.total_players === selectedRoom.max_players || joining}
            onClick={handleJoin}
            className={`px-12 py-4 rounded-xl font-black italic tracking-tighter text-lg transition-all duration-300 ${selectedRoom && selectedRoom.total_players < selectedRoom.max_players
                ? 'bg-violet-400 text-black hover:scale-105 shadow-[0_0_40px_rgba(139,92,246,0.4)] active:scale-95 cursor-pointer'
                : 'bg-white/5 text-white/20 border border-white/10 cursor-not-allowed'
              }`}
          >
            {joining ? 'JOINING...' : 'JOIN GAME'}
          </button>
        </div>
      </footer>
    </div>
  )
}

export default PublicRoom
