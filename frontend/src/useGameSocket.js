/**
 * useGameSocket.js
 * Handles the WebSocket connection, input sending, and state management.
 */
import { useEffect, useRef, useCallback, useState } from 'react';

const getWsBaseUrl = () => {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}`;
};

const WS_BASE = getWsBaseUrl();

// ── Input key maps ────────────────────────────────────────────────────────────
const KEY_MAP = {
  ArrowUp:    'up',    KeyW: 'up',
  ArrowDown:  'down',  KeyS: 'down',
  ArrowLeft:  'left',  KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  Space:      'shoot', Enter: 'shoot',
};

export function useGameSocket(roomId) {
  const wsRef       = useRef(null);
  const keysRef     = useRef({ up: false, down: false, left: false, right: false, shoot: false });
  const loopRef     = useRef(null);
  const mountedRef  = useRef(true);

  const [status,    setStatus]    = useState('idle');   // idle | connecting | open | closed | error
  const [initData,  setInitData]  = useState(null);     // { player_id, team, arena }
  const [gameState, setGameState] = useState(null);     // latest state from server
  const [ping,      setPing]      = useState(null);

  const pingRef  = useRef(null);
  const pingSent = useRef(0);

  // ── Send current keys to server at 60 Hz ─────────────────────────────────
  const startInputLoop = useCallback((ws) => {
    if (loopRef.current) clearInterval(loopRef.current);
    loopRef.current = setInterval(() => {
      if (ws.readyState !== WebSocket.OPEN) return;
      ws.send(JSON.stringify({ type: 'input', data: { ...keysRef.current } }));
      keysRef.current.shoot = false; // one-shot: clear after sending
    }, 1000 / 60);
  }, []);

  // ── Connect ───────────────────────────────────────────────────────────────
  const connect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
    }
    const url = `${WS_BASE}/ws/game/${roomId}/`;
    setStatus('connecting');
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) return;
      setStatus('open');
      startInputLoop(ws);
      // start ping
      pingRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          pingSent.current = performance.now();
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 2000);
    };

    ws.onmessage = (ev) => {
      if (!mountedRef.current) return;
      let msg;
      try { msg = JSON.parse(ev.data); } catch { return; }

      if (msg.type === 'init') {
        setInitData({ player_id: msg.player_id, team: msg.team, arena: msg.arena });
      } else if (msg.type === 'state') {
        setGameState(msg.state);
      } else if (msg.type === 'pong') {
        setPing(Math.round(performance.now() - pingSent.current));
      }
    };

    ws.onerror = () => { if (mountedRef.current) setStatus('error'); };
    ws.onclose = () => {
      if (!mountedRef.current) return;
      setStatus('closed');
      clearInterval(loopRef.current);
      clearInterval(pingRef.current);
    };
  }, [roomId, startInputLoop]);

  // ── Keyboard listeners ────────────────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e) => {
      const key = KEY_MAP[e.code];
      if (!key) return;
      e.preventDefault();
      if (key === 'shoot') keysRef.current.shoot = true;
      else keysRef.current[key] = true;
    };
    const onKeyUp = (e) => {
      const key = KEY_MAP[e.code];
      if (!key || key === 'shoot') return;
      e.preventDefault();
      keysRef.current[key] = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup',   onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup',   onKeyUp);
    };
  }, []);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearInterval(loopRef.current);
      clearInterval(pingRef.current);
      if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(); }
    };
  }, []);

  return { connect, status, initData, gameState, ping };
}
