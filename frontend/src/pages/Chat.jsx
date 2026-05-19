import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import api, { BACKEND_ORIGIN } from '../api'

function Chat() {
  const { username } = useParams()
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  const wsRef = useRef(null)
  const messagesEndRef = useRef(null)

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    let ws;

    async function initChat() {
      try {
        // Fetch the conversation ID for this user
        const res = await api.get(`api/chat/conversation_id/${username}`)
        const convId = res.data.conversation_id
        
        // Construct the WebSocket URL safely depending on protocol
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
        const host = BACKEND_ORIGIN.replace(/^https?:\/\//, '')
        const wsUrl = `${wsProtocol}//${host}/ws/chat/${convId}/`
        
        ws = new WebSocket(wsUrl)
        wsRef.current = ws

        ws.onopen = () => {
          setLoading(false)
        }

        ws.onmessage = (event) => {
          const data = JSON.parse(event.data)
          if (data.message) {
            setMessages(prev => [...prev, { text: data.message, time: new Date() }])
          }
        }

        ws.onerror = (e) => {
          console.error("WebSocket error", e)
          setError('Connection error')
          setLoading(false)
        }

        ws.onclose = () => {
          console.log('WebSocket connection closed')
        }

      } catch (err) {
        console.error("Failed to init chat:", err)
        setError('Failed to initialize chat session.')
        setLoading(false)
      }
    }

    initChat()

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
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

      <div className="w-full max-w-3xl flex flex-col h-[85vh] bg-black/40 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative z-10">
        
        {/* Chat Header */}
        <header className="h-20 bg-white/5 border-b border-white/10 flex items-center px-6 shrink-0 justify-between">
          <div className="flex items-center gap-4">
            <Link to={`/user/${username}`} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer group">
              <span className="text-white/50 group-hover:text-green-400 transition-colors">←</span>
            </Link>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">{username}</h2>
              <div className="flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                 <span className="text-[10px] uppercase font-bold tracking-widest text-green-400/70">Connected</span>
              </div>
            </div>
          </div>
          <div className="text-3xl filter grayscale opacity-20 hidden sm:block">⚽</div>
        </header>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-black/20">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
              <span className="text-6xl mb-4">💬</span>
              <p className="text-white text-sm font-medium">No messages yet</p>
              <p className="text-xs mt-1">Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div key={index} className="flex flex-col animate-in slide-in-from-bottom-2 duration-300">
                <div className="max-w-[75%] px-5 py-3 rounded-2xl rounded-tl-sm bg-white/5 border border-white/10 text-white/90 text-sm shadow-md self-start">
                  {msg.text}
                </div>
                <span className="text-[9px] text-white/30 mt-1.5 font-medium ml-1">
                  {msg.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
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
    </div>
  )
}

export default Chat
