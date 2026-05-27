import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { BACKEND_ORIGIN } from '../api';

const NotificationContext = createContext({
  notifications: [],
  clearNotification: () => { },
  setNotifications: () => { }
});

export function NotificationProvider({ children }) {
  const { isLoggedIn, loading } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [popups, setPopups] = useState([]);
  const wsRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    if (isLoggedIn) {
      const wsProtocol = BACKEND_ORIGIN.startsWith('https') ? 'wss' : 'ws';
      const host = BACKEND_ORIGIN.replace(/^http(s)?:\/\//, '');
      const wsUrl = `${wsProtocol}://${host}/ws/notifications/`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Notification WebSocket connected');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const notifId = Date.now().toString() + Math.random().toString();
          setNotifications(prev => [...prev, data]);
          setPopups(prev => [...prev, { ...data, id: notifId }]);
          setTimeout(() => {
            setPopups(prev => prev.filter(p => p.id !== notifId));
          }, 3000);
        } catch (e) {
          console.error("Error parsing notification:", e);
        }
      };

      ws.onerror = (error) => {
        console.error("Notification WebSocket error:", error);
      };

      ws.onclose = () => {
        console.log("Notification WebSocket closed");
      };

      return () => {
        ws.close();
      };
    } else {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setNotifications([]);
    }
  }, [isLoggedIn, loading]);

  const clearNotification = (index) => {
    setNotifications(prev => prev.filter((_, i) => i !== index));
  };

  const handlePopupClick = async (popup) => {
    setPopups(prev => prev.filter(p => p.id !== popup.id));
    
    if (popup.info === 'game invite' && popup.invite_id) {
      if (window.confirm(`${popup.sender} invited you to a game. Accept?`)) {
        try {
          await api.post('api/game/accept/', { invite_id: popup.invite_id })
          // After accepting, we need to go to the private room page
          // The invite.queue.id is used to join the correct queue
          sessionStorage.setItem('private_queue_id', String(popup.queue_id))
          navigate('/room/private')
        } catch (err) {
          alert('Failed to accept invite')
        }
      }
      return
    }

    if (popup.info === 'friend request' && popup.sender) {
      navigate('/lobby');
    } else if (popup.sender) {
      navigate(`/chat/${popup.sender}`);
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, clearNotification, setNotifications }}>
      <div className="fixed top-0 left-0 right-0 z-[9999] flex flex-col items-center pointer-events-none p-4 space-y-3">
        {popups.map(popup => (
          <div
            key={popup.id}
            onClick={() => handlePopupClick(popup)}
            className="pointer-events-auto w-full max-w-xs bg-black/70 backdrop-blur-lg border border-green-400/30 rounded-xl shadow-[0_5px_20px_rgba(34,197,94,0.15)] px-4 py-3 animate-in slide-in-from-top-10 fade-in duration-500 ease-out flex items-center gap-3 cursor-pointer hover:bg-black/80 hover:border-green-400/50 hover:shadow-[0_5px_25px_rgba(34,197,94,0.25)] transition-all group"
          >
            <div className="text-lg group-hover:scale-110 transition-transform">
              {popup.info === 'friend request' ? '👋' : popup.info === 'game invite' ? '🎮' : '💬'}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-green-400 truncate leading-tight">{popup.sender}</h4>
              <p className="text-[10px] text-white/70 mt-0.5 truncate leading-tight">{popup.info || 'New message'}</p>
            </div>
            <div className="text-[10px] text-white/30 group-hover:text-green-400/50 transition-colors">
              Open →
            </div>
          </div>
        ))}
      </div>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
