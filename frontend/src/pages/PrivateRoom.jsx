import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'
import { getAvatarUrl } from '../utils'
import lobbyBg from '../assets/lobbybackground.png.jpg'

// Mock Data for Friends
const MOCK_FRIENDS = [
  { username: 'Striker99', avatar: null, isOnline: true },
  { username: 'Goaly', avatar: null, isOnline: true },
  { username: 'NeonRider', avatar: null, isOnline: true },
  { username: 'WaveRunner', avatar: null, isOnline: true },
  { username: 'UrbanLegend', avatar: null, isOnline: false },
]

function PrivateRoom() {
  const navigate = useNavigate()
  const { isLoggedIn } = useAuth()
  
  const [user, setUser] = useState(null)
  
  // Party state (max 6)
  const [party, setParty] = useState([])
  const [friends, setFriends] = useState(MOCK_FRIENDS)
  
  // Team slots (null indicates empty)
  const [redTeam, setRedTeam] = useState([null, null, null])
  const [blueTeam, setBlueTeam] = useState([null, null, null])

  // Track if all party members are assigned to a team
  const isGameReady = React.useMemo(() => {
     if (party.length === 0) return false;
     
     let assignedCount = 0;
     redTeam.forEach(slot => { if (slot) assignedCount++ })
     blueTeam.forEach(slot => { if (slot) assignedCount++ })
     
     // The game is ready when all current party members are in a slot
     return assignedCount === party.length && party.length > 0;
  }, [party, redTeam, blueTeam])

  useEffect(() => {
    if (isLoggedIn) {
      api.get('api/profile/me').then(res => {
         const me = res.data;
         setUser(me)
         // Automatically add current user to party on load
         setParty([{ ...me, isLeader: true }])
      }).catch(() => {})
    }
  }, [isLoggedIn])

  // --- Handlers ---

  function handleInvite(friend) {
    if (party.length >= 6) return
    if (party.some(p => p.username === friend.username)) return
    
    const newMember = { ...friend };
    setParty(prev => [...prev, newMember])

    // Mockup logic: Automatically assign invited friend to a random empty slot for UI interaction
    setTimeout(() => {
       let assigned = false;
       setRedTeam(prevRed => {
          const newRed = [...prevRed];
          for (let i = 0; i < 3; i++) {
             if (!newRed[i] && !assigned) {
                newRed[i] = newMember;
                assigned = true;
             }
          }
          if (!assigned) {
              setBlueTeam(prevBlue => {
                  const newBlue = [...prevBlue];
                  for(let j = 0; j < 3; j++) {
                      if (!newBlue[j]) {
                          newBlue[j] = newMember;
                          break;
                      }
                  }
                  return newBlue;
              })
          }
          return newRed;
       })
    }, 500)
  }

  // Handle switching slots by clicking an empty slot
  function handleSlotClick(team, index) {
     if (!user) return;
     
     const isTargetEmpty = team === 'red' ? !redTeam[index] : !blueTeam[index];
     
     if (isTargetEmpty) {
       // Remove user from any current slot
       const cleanRed = redTeam.map(s => s?.username === user.username ? null : s);
       const cleanBlue = blueTeam.map(s => s?.username === user.username ? null : s);

       // Assign user to the newly clicked slot
       if (team === 'red') {
          cleanRed[index] = user;
       } else {
          cleanBlue[index] = user;
       }

       setRedTeam(cleanRed);
       setBlueTeam(cleanBlue);
     }
  }

  // Helper to render an avatar nicely
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
        {/* Tooltip on hover */}
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black px-2 py-1 rounded text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
           {member.username} {member.username === user?.username && '(You)'}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-text-primary flex flex-col relative overflow-hidden">
      {/* Background */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat grayscale-[0.5]"
        style={{ backgroundImage: `url(${lobbyBg})` }}
      />
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />

      {/* HORIZONTAL PARTY BAR (TOP) */}
      <header className="h-28 border-b border-white/10 bg-black/40 backdrop-blur-md flex items-center relative z-20 px-8 gap-8">
        <button 
          onClick={() => navigate('/lobby')}
          className="w-10 h-10 shrink-0 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer group mr-4"
        >
          <span className="text-white/50 group-hover:text-green-400 transition-colors">←</span>
        </button>

        <div className="flex flex-col shrink-0 mr-8">
            <h2 className="text-2xl font-black tracking-tight text-white italic">
               PRIVATE <span className="text-violet-400">ARENA</span>
            </h2>
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-white/30">Party ({party.length}/6)</div>
        </div>

        {/* Party Member Avatars */}
        <div className="flex items-center gap-4 py-2">
            {party.map((m) => {
               if (m.username === user?.username) {
                  return <UserAvatar key={m.username} member={m} isLarge={true} />
               }
               return null;
            })}
            
            <div className="w-px h-12 bg-white/10 mx-2" />

            {party.map((m) => {
               if (m.username !== user?.username) {
                  return <UserAvatar key={m.username} member={m} />
               }
               return null;
            })}
            
            {/* Empty Slots */}
            {Array.from({ length: 6 - party.length }).map((_, i) => (
                <div key={`empty-${i}`} className="w-14 h-14 rounded-full border border-dashed border-white/20 flex items-center justify-center opacity-30">
                   <span className="text-xl">+</span>
                </div>
            ))}
        </div>
      </header>

      {/* MAIN CONTENT SPLIT */}
      <div className="flex-1 flex relative z-10 overflow-hidden">
         
         {/* FRIENDS SIDEBAR (LEFT) */}
         <aside className="w-80 border-r border-white/5 bg-black/20 backdrop-blur-md flex flex-col shrink-0">
            <div className="p-6 border-b border-white/5">
                <h3 className="text-xs font-black tracking-[0.2em] text-white/50 uppercase">Invite Friends</h3>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                {friends.map(friend => {
                   const isInvited = party.some(p => p.username === friend.username);
                   return (
                     <div key={friend.username} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-lg bg-black/50 border border-white/10 flex items-center justify-center text-white/50 font-bold overflow-hidden relative">
                               {friend.avatar ? <img src={getAvatarUrl(friend.avatar)} className="w-full h-full object-cover" /> : friend.username[0]}
                               <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-black ${friend.isOnline ? 'bg-green-400' : 'bg-gray-500'}`} />
                           </div>
                           <div>
                              <p className="text-sm font-bold text-white">{friend.username}</p>
                              <p className="text-[10px] text-white/40 uppercase font-medium">{friend.isOnline ? 'Online' : 'Offline'}</p>
                           </div>
                        </div>
                        <button 
                           onClick={() => handleInvite(friend)}
                           disabled={isInvited || !friend.isOnline || party.length >= 6}
                           className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                             isInvited ? 'bg-violet-500/20 text-violet-400 cursor-not-allowed border border-violet-500/30' :
                             friend.isOnline ? 'bg-white/10 text-white hover:bg-white/20 cursor-pointer border border-white/20' :
                             'bg-transparent text-white/20 cursor-not-allowed'
                           }`}
                        >
                           {isInvited ? 'IN PARTY' : 'INVITE'}
                        </button>
                     </div>
                   )
                })}
            </div>
         </aside>

         {/* TEAM SELECTION PIT (CENTER) */}
         <main className="flex-1 flex flex-col justify-center items-center p-12">
            
            <div className="text-center mb-12">
               <h1 className="text-4xl font-black italic text-white tracking-tighter drop-shadow-lg">TEAM SELECTION</h1>
               <p className="text-sm text-white/50 mt-2 font-medium">Click an empty slot to join a side</p>
            </div>

            <div className="w-full max-w-5xl grid grid-cols-2 gap-12 relative">
               {/* VS Divider */}
               <div className="absolute inset-y-0 left-1/2 w-px bg-white/20 -translate-x-1/2 hidden md:block">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-black border-2 border-white/20 rounded-full flex items-center justify-center font-black italic text-white/50 text-sm">
                    VS
                  </div>
               </div>

               {/* BLUE TEAM */}
               <div className="space-y-6">
                  <div className="text-center">
                     <h3 className="text-2xl font-black italic text-cyan-400 tracking-tighter drop-shadow-[0_0_15px_rgba(34,211,238,0.4)]">BLUE TEAM</h3>
                  </div>
                  <div className="bg-cyan-900/10 border border-cyan-500/30 rounded-3xl p-6 space-y-4 backdrop-blur-md shadow-[0_0_50px_rgba(34,211,238,0.05)_inset]">
                     {blueTeam.map((slot, idx) => (
                        <div 
                           key={`blue-${idx}`}
                           onClick={() => handleSlotClick('blue', idx)}
                           className={`h-24 rounded-2xl border-2 transition-all duration-300 flex items-center px-6 gap-6 relative overflow-hidden ${
                             slot 
                             ? 'bg-cyan-900/40 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.15)]' 
                             : 'bg-black/40 border-cyan-900/30 border-dashed hover:border-cyan-400/50 cursor-pointer hover:bg-cyan-900/20'
                           }`}
                        >
                           {/* Decorative background glow for occupied slot */}
                           {slot && <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/10 to-transparent pointer-events-none" />}
                           
                           <div className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center shrink-0 overflow-hidden relative z-10 ${slot ? 'border-cyan-400 bg-black' : 'border-cyan-900/40 bg-transparent'}`}>
                              {slot ? (
                                 slot.avatar ? <img src={getAvatarUrl(slot.avatar)} className="w-full h-full object-cover" /> : <span className="font-bold text-cyan-400 text-xl">{slot.username[0]}</span>
                              ) : (
                                 <span className="text-cyan-900/50 font-black">+</span>
                              )}
                           </div>
                           <div className="relative z-10">
                              {slot ? (
                                 <>
                                    <p className="text-lg font-bold text-white">{slot.username}</p>
                                    <p className="text-[10px] text-cyan-400 uppercase tracking-widest font-black">{slot.username === user?.username ? 'YOU' : 'READY'}</p>
                                 </>
                              ) : (
                                 <p className="text-sm font-bold text-cyan-500/40 uppercase tracking-widest">Available Slot</p>
                              )}
                           </div>
                        </div>
                     ))}
                  </div>
               </div>

               {/* RED TEAM */}
               <div className="space-y-6">
                  <div className="text-center">
                     <h3 className="text-2xl font-black italic text-rose-500 tracking-tighter drop-shadow-[0_0_15px_rgba(244,63,94,0.4)]">RED TEAM</h3>
                  </div>
                  <div className="bg-rose-900/10 border border-rose-500/30 rounded-3xl p-6 space-y-4 backdrop-blur-md shadow-[0_0_50px_rgba(244,63,94,0.05)_inset]">
                     {redTeam.map((slot, idx) => (
                        <div 
                           key={`red-${idx}`}
                           onClick={() => handleSlotClick('red', idx)}
                           className={`h-24 rounded-2xl border-2 transition-all duration-300 flex items-center px-6 gap-6 relative overflow-hidden flex-row-reverse text-right ${
                             slot 
                             ? 'bg-rose-900/40 border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.15)]' 
                             : 'bg-black/40 border-rose-900/30 border-dashed hover:border-rose-500/50 cursor-pointer hover:bg-rose-900/20'
                           }`}
                        >
                           {/* Decorative background glow for occupied slot */}
                           {slot && <div className="absolute inset-0 bg-gradient-to-l from-rose-500/10 to-transparent pointer-events-none" />}

                           <div className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center shrink-0 overflow-hidden relative z-10 ${slot ? 'border-rose-500 bg-black' : 'border-rose-900/40 bg-transparent'}`}>
                              {slot ? (
                                 slot.avatar ? <img src={getAvatarUrl(slot.avatar)} className="w-full h-full object-cover" /> : <span className="font-bold text-rose-500 text-xl">{slot.username[0]}</span>
                              ) : (
                                 <span className="text-rose-900/50 font-black">+</span>
                              )}
                           </div>
                           <div className="relative z-10">
                              {slot ? (
                                 <>
                                    <p className="text-lg font-bold text-white">{slot.username}</p>
                                    <p className="text-[10px] text-rose-500 uppercase tracking-widest font-black">{slot.username === user?.username ? 'YOU' : 'READY'}</p>
                                 </>
                              ) : (
                                 <p className="text-sm font-bold text-rose-500/40 uppercase tracking-widest">Available Slot</p>
                              )}
                           </div>
                        </div>
                     ))}
                  </div>
               </div>

            </div>
         </main>
      </div>

      {/* BOTTOM CONTROL BAR */}
      <footer className="h-24 border-t border-white/10 bg-black/80 backdrop-blur-2xl relative z-20 flex items-center px-12 justify-between">
         <div className="flex flex-col">
            <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Match Status</span>
            <span className={`text-sm font-bold italic ${isGameReady ? 'text-green-400' : 'text-white/50'}`}>
              {isGameReady ? 'TEAMS ASSIGNED - READY TO START' : 'WAITING FOR ALL MEMBERS TO PICK A SIDE...'}
            </span>
         </div>
         
         <button 
           disabled={!isGameReady}
           className={`px-16 py-4 rounded-xl font-black italic tracking-tighter text-xl transition-all duration-300 ${
             isGameReady
             ? 'bg-violet-600 text-white hover:scale-105 shadow-[0_0_40px_rgba(124,58,237,0.4)] active:scale-95 cursor-pointer' 
             : 'bg-white/5 text-white/20 border border-white/10 cursor-not-allowed'
           }`}
         >
           START GAME
         </button>
      </footer>
    </div>
  )
}

export default PrivateRoom
