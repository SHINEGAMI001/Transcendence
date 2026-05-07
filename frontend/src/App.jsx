/**
 * App.jsx — Main game shell
 * Screens: Lobby → Connecting → Game (with winner overlay)
 */
import { useState, useEffect, useCallback } from 'react';
import './App.css';
import GameCanvas from './GameCanvas';
import { useGameSocket } from './useGameSocket';

const ARENA_W = 800;
const ARENA_H = 500;

// ── Lobby ─────────────────────────────────────────────────────────────────────
function Lobby({ onJoin }) {
  const [roomId, setRoomId] = useState('room1');

  return (
    <div className="lobby">
      <div className="lobby-brand">
        <div className="lobby-logo">HAXBALL</div>
        <div className="lobby-sub">ft_transcendence · multiplayer</div>
      </div>

      <div className="lobby-card">
        <h2>Join a Game Room</h2>

        <div className="input-group">
          <label htmlFor="room-input">Room ID</label>
          <input
            id="room-input"
            type="text"
            value={roomId}
            onChange={e => setRoomId(e.target.value.trim())}
            onKeyDown={e => e.key === 'Enter' && roomId && onJoin(roomId)}
            placeholder="e.g. room1"
            maxLength={32}
            autoFocus
          />
        </div>

        <button
          id="join-btn"
          className="btn-primary"
          onClick={() => roomId && onJoin(roomId)}
          disabled={!roomId}
        >
          Join Room →
        </button>

        <div className="lobby-controls">
          <p><strong>Player 1</strong> — <span style={{color:'#6c63ff'}}>Left team</span></p>
          <p>Move: <strong>WASD</strong> or <strong>Arrow Keys</strong></p>
          <p>Kick: <strong>Space</strong> or <strong>Enter</strong></p>
          <p style={{marginTop:4}}><strong>Player 2</strong> — <span style={{color:'#ff6b6b'}}>Right team</span></p>
          <p>Open the same Room ID on your friend&apos;s browser to start playing!</p>
        </div>
      </div>
    </div>
  );
}

// ── Connecting screen ─────────────────────────────────────────────────────────
function Connecting({ roomId, onCancel }) {
  return (
    <div className="lobby">
      <div className="lobby-brand">
        <div className="lobby-logo">HAXBALL</div>
        <div className="lobby-sub">ft_transcendence · multiplayer</div>
      </div>
      <div className="lobby-card">
        <div className="lobby-status">
          <div className="dot-pulse" />
          Connecting to <strong style={{color:'#e2e8f0',marginLeft:4}}>#{roomId}</strong>…
        </div>
        <button
          className="btn-primary"
          style={{background:'rgba(255,255,255,0.05)',boxShadow:'none',border:'1px solid #2a2d3e'}}
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Winner overlay ────────────────────────────────────────────────────────────
function WinnerOverlay({ winner, myTeam, onPlayAgain }) {
  const isMyTeam = winner === myTeam;
  const emoji    = isMyTeam ? '🏆' : '😞';
  const msg      = isMyTeam ? 'YOU WIN!' : 'YOU LOSE!';

  return (
    <div className="overlay" role="dialog" aria-label="Game over">
      <div className="overlay-emoji">{emoji}</div>
      <div className={`overlay-title ${winner}`}>{msg}</div>
      <div className="overlay-sub">
        <span style={{color: winner === 'left' ? '#6c63ff' : '#ff6b6b'}}>
          {winner === 'left' ? '🟣 Left' : '🔴 Right'}
        </span>
        {' '}team scored 5 goals!
      </div>
      <button id="play-again-btn" className="btn-primary" onClick={onPlayAgain}>
        Play Again
      </button>
    </div>
  );
}

// ── Waiting overlay ───────────────────────────────────────────────────────────
function WaitingOverlay({ myTeam }) {
  return (
    <div className="overlay" role="status" aria-label="Waiting for opponent">
      <div className="overlay-emoji">⏳</div>
      <div className="overlay-title neutral">Waiting for opponent…</div>
      <div className="overlay-sub">
        Share the Room ID with your friend to start the game.
      </div>
      <div className="lobby-status" style={{marginTop:8}}>
        <div className="dot-pulse" />
        You are on the{' '}
        <span style={{
          color: myTeam === 'left' ? '#6c63ff' : '#ff6b6b',
          fontWeight: 600, marginLeft: 4
        }}>
          {myTeam === 'left' ? '🟣 Left' : '🔴 Right'} team
        </span>
      </div>
    </div>
  );
}

// ── Game Screen ───────────────────────────────────────────────────────────────
function GameScreen({ roomId, onLeave }) {
  const { connect, status, initData, gameState, ping } = useGameSocket(roomId);

  // Connect once on mount
  useEffect(() => { connect(); }, [connect]);

  const myTeam      = initData?.team ?? null;
  const score       = gameState?.score  ?? { left: 0, right: 0 };
  const winner      = gameState?.winner ?? null;
  const playerCount = Object.keys(gameState?.players ?? {}).length;
  const waiting     = playerCount < 2 && !winner;

  const handlePlayAgain = useCallback(() => {
    // Re-connect to restart
    connect();
  }, [connect]);

  if (status === 'error' || status === 'closed') {
    return (
      <div className="lobby">
        <div className="lobby-card">
          <div className="overlay-emoji">🔌</div>
          <div className="overlay-title neutral" style={{marginBottom:8}}>
            {status === 'error' ? 'Connection Error' : 'Disconnected'}
          </div>
          <div className="lobby-status" style={{marginBottom:16}}>
            Could not reach the server at ws://localhost:8000
          </div>
          <button className="btn-primary" onClick={connect} id="reconnect-btn">Reconnect</button>
          <button
            className="btn-primary"
            style={{background:'rgba(255,255,255,0.05)',boxShadow:'none',border:'1px solid #2a2d3e',marginTop:8}}
            onClick={onLeave}
            id="leave-btn"
          >
            ← Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-layout">
      {/* ── Score bar ── */}
      <div className="scorebar">
        <div className="score-team left">
          <div className="team-dot left" />
          Left
          {myTeam === 'left' && <span style={{fontSize:10,opacity:0.7}}>(YOU)</span>}
        </div>

        <div className="score-center">
          <span className="score-number left" id="score-left">{score.left}</span>
          <span className="score-sep">:</span>
          <span className="score-number right" id="score-right">{score.right}</span>
        </div>

        <div className="score-team right">
          Right
          {myTeam === 'right' && <span style={{fontSize:10,opacity:0.7}}>(YOU)</span>}
          <div className="team-dot right" />
        </div>

        {ping !== null && <div className="ping-badge" id="ping-badge">{ping}ms</div>}
      </div>

      {/* ── Arena ── */}
      <div className="arena-wrapper">
        <GameCanvas
          gameState={gameState}
          initData={initData}
          width={ARENA_W}
          height={ARENA_H}
        />

        {/* Overlays */}
        {status === 'connecting' && (
          <div className="overlay">
            <div className="dot-pulse" />
            <div className="overlay-sub">Connecting…</div>
          </div>
        )}
        {status === 'open' && waiting && (
          <WaitingOverlay myTeam={myTeam} />
        )}
        {status === 'open' && winner && (
          <WinnerOverlay winner={winner} myTeam={myTeam} onPlayAgain={handlePlayAgain} />
        )}

        {/* My team badge */}
        {myTeam && (
          <div className="my-team-badge">
            Team: <span className={myTeam}>{myTeam === 'left' ? '🟣 Left' : '🔴 Right'}</span>
          </div>
        )}
      </div>

      {/* ── Bottom bar ── */}
      <div className="bottombar">
        <div className="keys-hint">
          <div className="key-item"><span className="key">W A S D</span> Move</div>
          <div className="key-item"><span className="key">Space</span> Kick</div>
          <div className="key-item"><span className="key">↑←↓→</span> Also works</div>
        </div>
        <button
          id="leave-room-btn"
          onClick={onLeave}
          style={{
            background:'none', border:'1px solid #2a2d3e', borderRadius:8,
            color:'#64748b', fontSize:12, padding:'4px 12px', cursor:'pointer',
            fontFamily:'inherit', transition:'color 0.2s, border-color 0.2s',
          }}
          onMouseOver={e => { e.target.style.color='#e2e8f0'; e.target.style.borderColor='#6c63ff'; }}
          onMouseOut={e => { e.target.style.color='#64748b'; e.target.style.borderColor='#2a2d3e'; }}
        >
          ← Leave
        </button>
      </div>
    </div>
  );
}

// ── App root ──────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState('lobby');  // lobby | connecting | game
  const [roomId, setRoomId] = useState('');

  const handleJoin = (id) => {
    setRoomId(id);
    setScreen('game');
  };

  const handleLeave = () => {
    setRoomId('');
    setScreen('lobby');
  };

  if (screen === 'lobby')  return <Lobby onJoin={handleJoin} />;
  if (screen === 'game')   return <GameScreen roomId={roomId} onLeave={handleLeave} />;
  return null;
}