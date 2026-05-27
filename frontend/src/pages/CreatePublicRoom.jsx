import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'
import { getAvatarUrl } from '../utils'
import lobbyBg from '../assets/homebg.jpg'

const SLOTS = 5
const STORAGE_KEY = 'public_queue_id'

function CreatePublicRoom() {
  const navigate = useNavigate()
  const { isLoggedIn } = useAuth()
  
  const [user, setUser] = useState(null)
  const [queueId, setQueueId] = useState(null)
  const [teamA, setTeamA] = useState([])   // array of usernames
  const [teamB, setTeamB] = useState([])
  const [creating, setCreating] = useState(false)
  const [loading, setLoading] = useState(true)

  const isGameReady = useMemo(() => {
     return teamA.length >= 1 || teamB.length >= 1;
  }, [teamA, teamB])

  // Build padded slot arrays for rendering
  const blueSlots = useMemo(() => {
    const slots = teamA.map(u => u)
    while (slots.length < SLOTS) slots.push(null)
    return slots
  }, [teamA])

  const redSlots = useMemo(() => {
    const slots = teamB.map(u => u)
    while (slots.length < SLOTS) slots.push(null)
    return slots
  }, [teamB])

  // Fetch queue details from backend
  const fetchQueue = useCallback(async (id) => {
    try {
      const res = await api.get(`api/game/list_queue/${id}/`)
      const d = res.data.details
      setTeamA(d.team_a_users || [])
      setTeamB(d.team_b_users || [])
      return true
    } catch {
      // Queue no longer exists
      sessionStorage.removeItem(STORAGE_KEY)
      return false
    }
  }, [])

  // On mount: get user, then create or restore queue
  useEffect(() => {
    if (!isLoggedIn) return

    const init = async () => {
      setLoading(true)
      try {
        const profileRes = await api.get('api/profile/me')
        const me = profileRes.data
        setUser(me)

        // Check if we have an existing queue in sessionStorage
        const storedId = sessionStorage.getItem(STORAGE_KEY)
        if (storedId) {
          const ok = await fetchQueue(Number(storedId))
          if (ok) {
            setQueueId(Number(storedId))
            setLoading(false)
            return
          }
        }

        // Create a new queue
        const queueRes = await api.post('api/game/create_queue/')
        const newId = queueRes.data.queue_id
        setQueueId(newId)
        sessionStorage.setItem(STORAGE_KEY, String(newId))
        setTeamA([])
        setTeamB([])
      } catch (err) {
        console.error('Init failed:', err)
        const msg = err.response?.data?.['error message']
        if (msg === 'user already in queue') {
          alert('You are already in another queue. Leave it first.')
          navigate('/room/public')
        }
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [isLoggedIn, fetchQueue, navigate])

  // beforeunload warning
  useEffect(() => {
     const handleBeforeUnload = (e) => {
         e.preventDefault();
         e.returnValue = '';
     };
     window.addEventListener('beforeunload', handleBeforeUnload);
     return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Handle slot click — call choose_team API
  const handleSlotClick = async (team, index) => {
    if (!user || !queueId) return
    const teamKey = team === 'blue' ? 'team_a' : 'team_b'
    const slots = team === 'blue' ? blueSlots : redSlots

    // Only allow clicking empty slots
    if (slots[index]) return

    // Check if already on this team
    const currentTeamList = team === 'blue' ? teamA : teamB
    if (currentTeamList.includes(user.username)) return

    try {
      const res = await api.post('api/game/choose_team/', {
        queue_id: queueId,
        team: teamKey
      })
      // Refresh the queue state from backend
      await fetchQueue(queueId)
    } catch (err) {
      console.error('Choose team failed:', err)
      alert(err.response?.data?.['error message'] || 'Failed to choose team')
    }
  }

  // Create the game from the queue
  const handleCreateGame = async () => {
    if (!isGameReady || !user || !queueId) return;
    
    setCreating(true);
    try {
      const res = await api.post('api/game/create/', {
        queue_id: queueId,
        type: 'public'
      });
      if (res.data.game_id) {
        sessionStorage.removeItem(STORAGE_KEY)
        navigate(`/game/${res.data.game_id}`);
      }
    } catch (error) {
      console.error('Failed to create game:', error);
      alert(error.response?.data?.['error message'] || 'Failed to create game');
    } finally {
      setCreating(false);
    }
  }

  // Leave queue and navigate away
  const handleLeaveQueue = async () => {
    if (!window.confirm('Are you sure you want to leave the queue? The queue will be deleted.')) return
    try {
      if (queueId) {
        await api.post('api/game/leave_queue/', { queue_id: queueId })
      }
    } catch (err) {
      console.error('Leave queue failed:', err)
    }
    sessionStorage.removeItem(STORAGE_KEY)
    navigate('/room/public')
  }

  const UserAvatar = ({ member, isLarge = false }) => {
    if (!member) return null;
    const sizeClasses = isLarge ? 'w-20 h-20' : 'w-14 h-14';
    return (
      <div className={`${sizeClasses} shrink-0 rounded-full border-2 ${member.username === user?.username ? 'border-green-400 shadow-[0_0_20px_rgba(34,197,94,0.3)]' : 'border-white/20'} overflow-hidden relative bg-black/50 group`}>
        {member.avatar ? (
          <img src={getAvatarUrl(member.avatar)} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center font-bold text-white/50 text-xl">
            {member.username?.[0]}
          </div>
        )}
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black px-2 py-1 rounded text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
           {member.username} {member.username === user?.username && '(You)'}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-violet-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-white/50 text-sm font-medium">Setting up queue...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-text-primary flex flex-col relative overflow-hidden">
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat grayscale-[0.5]"
        style={{ backgroundImage: `url(${lobbyBg})` }}
      />
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />

      <header className="h-28 border-b border-white/10 bg-black/40 backdrop-blur-md flex items-center relative z-20 px-8 gap-8">
        <button 
          onClick={handleLeaveQueue}
          className="w-10 h-10 shrink-0 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer group mr-4"
        >
          <span className="text-white/50 group-hover:text-green-400 transition-colors">←</span>
        </button>

        <div className="flex flex-col shrink-0 mr-8">
            <h2 className="text-2xl font-black tracking-tight text-white italic">
               PUBLIC <span className="text-violet-400">ARENA</span>
            </h2>
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-white/30">Match Setup {queueId ? `• Queue #${queueId}` : ''}</div>
        </div>

        {/* User Avatar */}
        <div className="flex items-center gap-4 py-2">
            {user && <UserAvatar member={user} isLarge={true} />}
        </div>
      </header>

      <div className="flex-1 flex relative z-10 overflow-hidden">
         <main className="flex-1 flex flex-col justify-center items-center p-12 overflow-y-auto">
            <div className="text-center mb-12">
               <h1 className="text-4xl font-black italic text-white tracking-tighter drop-shadow-lg uppercase">Team Selection</h1>
               <p className="text-sm text-white/50 mt-2 font-medium">Position yourself for the public match</p>
            </div>

            <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-12 relative pb-20">
               <div className="absolute inset-y-0 left-1/2 w-px bg-white/20 -translate-x-1/2 hidden md:block">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-black border-2 border-white/20 rounded-full flex items-center justify-center font-black italic text-white/50 text-sm">VS</div>
               </div>

               {/* BLUE TEAM (team_a) */}
               <div className="space-y-6">
                  <div className="text-center"><h3 className="text-2xl font-black italic text-cyan-400 uppercase tracking-tighter drop-shadow-[0_0_15px_rgba(34,211,238,0.4)]">Blue Team</h3></div>
                  <div className="bg-cyan-900/10 border border-cyan-500/30 rounded-3xl p-6 space-y-4 backdrop-blur-md">
                     {blueSlots.map((slot, idx) => (
                        <div key={`blue-${idx}`} onClick={() => handleSlotClick('blue', idx)} className={`h-24 rounded-2xl border-2 transition-all duration-300 flex items-center px-6 gap-6 relative overflow-hidden ${slot ? 'bg-cyan-900/40 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.15)]' : 'bg-black/40 border-cyan-900/30 border-dashed hover:border-cyan-400/50 cursor-pointer hover:bg-cyan-900/20'}`}>
                           {slot && <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/10 to-transparent pointer-events-none" />}
                           <div className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center shrink-0 overflow-hidden relative z-10 ${slot ? 'border-cyan-400 bg-black' : 'border-cyan-900/40 bg-transparent'}`}>
                              {slot ? <span className="font-bold text-cyan-400 text-xl">{slot[0]}</span> : <span className="text-cyan-900/50 font-black">+</span>}
                           </div>
                           <div className="relative z-10">
                              {slot ? (<><p className="text-lg font-bold text-white leading-tight">{slot}</p><p className="text-[10px] text-cyan-400 uppercase tracking-widest font-black">{slot === user?.username ? 'YOU' : 'PLAYER'}</p></>) : <p className="text-sm font-bold text-cyan-500/40 uppercase tracking-widest">Available Slot</p>}
                           </div>
                        </div>
                     ))}
                  </div>
               </div>

               {/* RED TEAM (team_b) */}
               <div className="space-y-6">
                  <div className="text-center"><h3 className="text-2xl font-black italic text-rose-500 uppercase tracking-tighter drop-shadow-[0_0_15px_rgba(244,63,94,0.4)]">Red Team</h3></div>
                  <div className="bg-rose-900/10 border border-rose-500/30 rounded-3xl p-6 space-y-4 backdrop-blur-md">
                     {redSlots.map((slot, idx) => (
                        <div key={`red-${idx}`} onClick={() => handleSlotClick('red', idx)} className={`h-24 rounded-2xl border-2 transition-all duration-300 flex items-center px-6 gap-6 relative overflow-hidden flex-row-reverse text-right ${slot ? 'bg-rose-900/40 border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.15)]' : 'bg-black/40 border-rose-900/30 border-dashed hover:border-rose-500/50 cursor-pointer hover:bg-rose-900/20'}`}>
                           {slot && <div className="absolute inset-0 bg-gradient-to-l from-rose-500/10 to-transparent pointer-events-none" />}
                           <div className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center shrink-0 overflow-hidden relative z-10 ${slot ? 'border-rose-500 bg-black' : 'border-rose-900/40 bg-transparent'}`}>
                              {slot ? <span className="font-bold text-rose-500 text-xl">{slot[0]}</span> : <span className="text-rose-900/50 font-black">+</span>}
                           </div>
                           <div className="relative z-10">
                              {slot ? (<><p className="text-lg font-bold text-white leading-tight">{slot}</p><p className="text-[10px] text-rose-500 uppercase tracking-widest font-black">{slot === user?.username ? 'YOU' : 'PLAYER'}</p></>) : <p className="text-sm font-bold text-rose-500/40 uppercase tracking-widest">Available Slot</p>}
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         </main>
      </div>

      <footer className="h-24 border-t border-white/10 bg-black/80 backdrop-blur-2xl relative z-20 flex items-center px-12 justify-between">
         <div className="flex flex-col">
            <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Match Status</span>
            <span className={`text-sm font-bold italic transition-colors duration-300 ${isGameReady ? 'text-green-400 font-black' : 'text-white/50'}`}>
              {isGameReady ? 'READY TO CREATE MATCH' : 'SELECT A TEAM TO PROCEED'}
            </span>
         </div>

         <div className="flex items-center gap-4">
            <button 
              onClick={handleLeaveQueue}
              className="px-8 py-4 rounded-xl bg-red-500/20 text-red-400 border border-red-400/30 font-black italic tracking-tighter text-lg hover:bg-red-500/30 transition-all cursor-pointer"
            >
              LEAVE QUEUE
            </button>
            <button 
              disabled={!isGameReady || creating}
              onClick={handleCreateGame}
              className={`px-16 py-4 rounded-xl font-black italic tracking-tighter text-xl transition-all duration-300 ${
                isGameReady
                ? 'bg-green-600 text-white hover:scale-105 shadow-[0_0_40px_rgba(34,197,94,0.4)] active:scale-95 cursor-pointer' 
                : 'bg-white/5 text-white/20 border border-white/10 cursor-not-allowed'
              }`}
            >
              {creating ? 'CREATING...' : 'CREATE ROOM'}
            </button>
         </div>
      </footer>
    </div>
  )
}

export default CreatePublicRoom
