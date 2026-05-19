import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import api, { BACKEND_ORIGIN } from '../api'
import { formatDate } from '../utils'

function Chat() {
  const { username } = useParams()
  const [currentUser, setCurrentUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [receiverStatus, setReceiverStatus] = useState({ isOnline: false, lastSeen: null })
  
  const wsRef = useRef(null)
  const messagesEndRef = useRef(null)

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    let ws;
    let isActive = true;

    async function initChat() {
      try {
        // Fetch current user
        const meRes = await api.get('api/profile/me')
        if (!isActive) return;
        setCurrentUser(meRes.data)

        // Fetch receiver status
        api.get(`api/users/friends/friend_status/${username}`)
          .then(resStatus => {
            if (isActive) {
              setReceiverStatus({
                isOnline: resStatus.data.status === true,
                lastSeen: resStatus.data.last_seen
              })
            }
          })
          .catch(() => {})

        // Fetch the conversation ID for this user
        const res = await api.get(`api/chat/conversation_id/${username}`)
        if (!isActive) return;
        const convId = res.data.conversation_id
        
        // Construct the WebSocket URL safely depending on protocol
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
        const host = BACKEND_ORIGIN.replace(/^https?:\/\//, '')
        const wsUrl = `${wsProtocol}//${host}/ws/chat/${convId}/`
        
        ws = new WebSocket(wsUrl)
        
        if (!isActive) {
          ws.close()
          return
        }
        
        wsRef.current = ws

        ws.onopen = () => {
          if (isActive) setLoading(false)
        }

        ws.onmessage = (event) => {
          if (!isActive) return;
          const data = JSON.parse(event.data)
          if (data.message) {
            setMessages(prev => [...prev, { 
              text: data.message, 
              sender: data.sender,
              time: new Date() 
            }])
          }
        }

        ws.onerror = (e) => {
          if (!isActive) return;
          console.error("WebSocket error", e)
          setError('Connection error')
          setLoading(false)
        }

        ws.onclose = () => {
          console.log('WebSocket connection closed')
        }

      } catch (err) {
        if (!isActive) return;
        console.error("Failed to init chat:", err)
        setError('Failed to initialize chat session.')
        setLoading(false)
      }
    }

    initChat()

    return () => {
      isActive = false
      if (ws) {
        ws.close()
      }
      wsRef.current = null
    }
  }, [username])

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!inputValue.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return

    wsRef.current.send(JSON.stringify({ text: inputValue.trim() }))
    setInputValue('')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
         <div className="flex flex-col items-center gap-4">
           <div className="w-10 h-10 border-4 border-green-400 border-t-transparent rounded-full animate-spin" />
           <p className="text-white/50 text-sm">Connecting to chat...</p>
         </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
        <div className="bg-dark-surface/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center max-w-md">
          <div className="text-4xl mb-4">🔌</div>
          <h2 className="text-xl font-bold text-white mb-2">Connection Error</h2>
          <p className="text-white/50 mb-6">{error}</p>
          <Link to={`/user/${username}`} className="px-5 py-2.5 bg-white/5 border border-white/10 hover:border-green-400/30 font-semibold rounded-lg transition-all text-white">
            ← Back to Profile
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -right-64 w-[500px] h-[500px] bg-green-500/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-64 -left-64 w-[500px] h-[500px] bg-green-400/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-6xl flex h-[85vh] bg-black/40 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative z-10">
        
        {/* Main Conversation Area (Left) */}
        <div className="flex-1 flex flex-col min-w-0 bg-black/20">
          {/* Chat Header */}
          <header className="h-20 bg-white/5 border-b border-white/10 flex items-center px-6 shrink-0 justify-between">
            <div className="flex items-center gap-4">
              <Link to={`/user/${username}`} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer group">
                <span className="text-white/50 group-hover:text-green-400 transition-colors">←</span>
              </Link>
              <div>
                <h2 className="text-lg font-bold text-white tracking-wide">{username}</h2>
                <div className="flex items-center gap-2">
                   <span className={`w-2 h-2 rounded-full ${receiverStatus.isOnline ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
                   <span className={`text-[10px] uppercase font-bold tracking-widest ${receiverStatus.isOnline ? 'text-green-400/70' : 'text-white/30'}`}>
                     {receiverStatus.isOnline ? 'Online' : (receiverStatus.lastSeen ? `Last seen: ${formatDate(receiverStatus.lastSeen)}` : 'Offline')}
                   </span>
                </div>
              </div>
            </div>
            <div className="text-2xl filter grayscale opacity-20 hidden sm:block">⚽</div>
          </header>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                <span className="text-6xl mb-4">💬</span>
                <p className="text-white text-sm font-medium">No messages yet</p>
                <p className="text-xs mt-1">Start the conversation with {username}!</p>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isMe = msg.sender === currentUser?.username
                return (
                  <div 
                    key={index} 
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2 duration-300`}
                  >
                    <div 
                      className={`max-w-[80%] px-5 py-3 rounded-2xl shadow-md text-sm break-words whitespace-pre-wrap ${
                        isMe 
                          ? 'bg-green-600/80 text-white rounded-tr-sm border border-green-500/30' 
                          : 'bg-white/5 text-white/90 rounded-tl-sm border border-white/20'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className={`text-[9px] text-white/30 mt-1.5 font-medium ${isMe ? 'mr-1' : 'ml-1'}`}>
                      {msg.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Area */}
          <div className="p-4 bg-white/5 border-t border-white/10 flex items-end gap-3 shrink-0">
            <div className="flex-1 relative">
              <form onSubmit={handleSendMessage}>
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Type your message..."
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-3.5 pl-5 pr-12 text-sm text-white focus:outline-none focus:border-green-400/50 focus:bg-black/60 transition-all placeholder:text-white/30"
                    autoComplete="off"
                  />
              </form>
            </div>
            <button 
              type="submit"
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
              className="w-12 h-12 rounded-2xl bg-green-500/20 text-green-400 flex items-center justify-center hover:bg-green-500/30 border border-green-500/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0 cursor-pointer"
            >
              ➤
            </button>
          </div>
        </div>

        {/* Conversations Sidebar (Right) */}
        <aside className="w-80 bg-black/40 border-l border-white/10 flex flex-col hidden md:flex shrink-0">
          <header className="h-20 border-b border-white/10 flex items-center px-6 bg-white/5">
            <h3 className="text-sm font-black tracking-widest text-white/60 uppercase">Conversations</h3>
          </header>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center text-center opacity-20">
            <div className="p-4 rounded-full border-2 border-dashed border-white/20 mb-4">
               <span className="text-3xl">🗂️</span>
            </div>
            <p className="text-xs font-bold uppercase tracking-tighter">History coming soon</p>
          </div>
        </aside>

      </div>
    </div>
  )
}

export default Chat
