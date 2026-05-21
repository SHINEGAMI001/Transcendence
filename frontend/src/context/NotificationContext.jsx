import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth } from './AuthContext';
import { BACKEND_ORIGIN } from '../api';

const NotificationContext = createContext({
  notifications: [],
  clearNotification: () => {},
  setNotifications: () => {}
});

export function NotificationProvider({ children }) {
  const { isLoggedIn, loading } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [popups, setPopups] = useState([]);
  const wsRef = useRef(null);

  useEffect(() => {
    if (loading) return;

    if (isLoggedIn) {
      // Connect to WebSocket
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
          // Depending on the backend event structure
          // e.g. {"info": "new message", "sender": "John", "created_at": "..."}
          setNotifications(prev => [...prev, data]);
          setPopups(prev => [...prev, { ...data, id: notifId }]);
          setTimeout(() => {
            setPopups(prev => prev.filter(p => p.id !== notifId));
          }, 1337);
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
      // User logged out
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

  return (
    <NotificationContext.Provider value={{ notifications, clearNotification, setNotifications }}>
      <div className="fixed top-0 left-0 right-0 z-[9999] flex flex-col items-center pointer-events-none p-4 space-y-3">
        {popups.map(popup => (
          <div key={popup.id} className="pointer-events-auto w-full max-w-xs bg-black/60 backdrop-blur-lg border border-green-400/20 rounded-xl shadow-[0_5px_20px_rgba(34,197,94,0.1)] px-4 py-2.5 animate-in slide-in-from-top-10 fade-in duration-500 ease-out flex items-center gap-3">
            <div className="text-lg animate-bounce">🔔</div>
            <div className="flex-1 min-w-0">
               <h4 className="text-sm font-bold text-green-400 truncate leading-tight">{popup.sender}</h4>
               <p className="text-[10px] text-white/70 mt-0.5 truncate leading-tight">{popup.info || 'New notification'}</p>
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
