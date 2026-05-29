import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GameCanvas from '../GameCanvas';
import { useGameSocket } from '../useGameSocket';
import api from '../api';
import synthwaveBg from '../assets/synthwave_bg.png';

const GameRoom = () => {
    const { roomId } = useParams();
    const { isLoggedIn } = useAuth();
    const [user, setUser] = useState(null);

    useEffect(() => {
        if (isLoggedIn) {
            api.get('api/profile/me').then(res => setUser(res.data)).catch(() => { });
        }
    }, [isLoggedIn]);
    const navigate = useNavigate();
    const [matchInfo, setMatchInfo] = useState(null);
    const { gameState, status, connect, initData, sendMessage, chatMessages } = useGameSocket(roomId);
    const [chatInput, setChatInput] = useState('');
    const [isChatHovered, setIsChatHovered] = useState(false);
    const chatEndRef = useRef(null);

    useEffect(() => {
        api.get(`api/game/details/${roomId}/`).then(res => {
            const match = res.data.details;
            if (match) {
                setMatchInfo(match);
                const isTeamA = match.team_a_members?.includes(user?.username);
                const isTeamB = match.team_b_members?.includes(user?.username);
                if (isTeamA) connect('team_a');
                else if (isTeamB) connect('team_b');
                else connect('team_a');
            }
        }).catch(() => { });
    }, [roomId, user, connect]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    useEffect(() => {
        const handleBeforeUnload = (e) => {
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, []);

    useEffect(() => {
        if (gameState?.winner && matchInfo) {
            const isOwner = matchInfo.created_by === user?.username;

            if (isOwner) {
                // Owner ends game and recreates queue after 5 seconds
                const timer = setTimeout(async () => {
                    try {
                        const qId = matchInfo?.queue_id || sessionStorage.getItem('private_queue_id') || sessionStorage.getItem('public_queue_id') || sessionStorage.getItem('join_public_queue_id');
                        const res = await api.post('api/game/end_game/', {
                            game_id: roomId,
                            queue_id: Number(qId)
                        });
                        const newQId = res.data.new_queue_id;
                        const type = res.data.type;
                        if (type === 'public') {
                            sessionStorage.removeItem('public_queue_id');
                            sessionStorage.removeItem('join_public_queue_id');
                            navigate('/room/public');
                        } else {
                            sessionStorage.setItem('private_queue_id', newQId);
                            navigate('/room/private');
                        }
                    } catch (err) {
                        console.error('Failed to end game:', err);
                    }
                }, 5000);
                return () => clearTimeout(timer);
            } else {
                // Non-owner waits 6 seconds
                const timer = setTimeout(async () => {
                    const type = matchInfo.type || 'public';
                    if (type === 'public') {
                        sessionStorage.removeItem('join_public_queue_id');
                        sessionStorage.removeItem('public_queue_id');
                        navigate('/room/public');
                        return;
                    }

                    try {
                        const res = await api.get('api/game/my_queue/');
                        if (res.status === 200 && res.data.queue_id) {
                            const newQId = res.data.queue_id;
                            sessionStorage.setItem('private_queue_id', newQId);
                            navigate('/room/private');
                        } else {
                            navigate('/lobby');
                        }
                    } catch (err) {
                        console.error('Failed to fetch new queue:', err);
                        navigate('/lobby');
                    }
                }, 6000);
                return () => clearTimeout(timer);
            }
        }
    }, [gameState?.winner, matchInfo, roomId, navigate, user?.username]);

    const handleChatSubmit = (e) => {
        e.preventDefault();
        if (chatInput.trim()) {
            sendMessage({ type: 'chat', text: chatInput.trim() });
            setChatInput('');
        }
    };

    const getSenderColor = (sender) => {
        if (sender === user?.username) return '#fbbf24'; // Yellow for self

        // Check match info
        if (matchInfo?.team_a_members?.includes(sender)) return '#0c0cfdff';
        if (matchInfo?.team_b_members?.includes(sender)) return '#f60808ff';

        // Fallback to live game state if no match info
        if (gameState?.players) {
            const player = Object.values(gameState.players).find(p => p.n === sender);
            if (player?.t === 'left') return '#0c0cfdff';
            if (player?.t === 'right') return '#f60808ff';
        }

        return '#9ca3af'; // Grey fallback
    };

    return (
        <div style={styles.container}>
            {/* Quit button — door icon top-left */}
            <button
                onClick={async () => {
                    if (window.confirm("Are you sure you want to leave the match?")) {
                        // If we have a stored queueId, leave it as well
                        const storedPublic = sessionStorage.getItem('public_queue_id');
                        const storedPrivate = sessionStorage.getItem('private_queue_id');
                        const joinQueue = sessionStorage.getItem('join_public_queue_id');
                        const qId = storedPublic || storedPrivate || joinQueue || matchInfo?.queue_id;

                        if (qId) {
                            try {
                                await api.post('api/game/leave_game/', { game_id: roomId, queue_id: Number(qId) });
                            } catch (err) {
                                console.error('Failed to leave queue on quit:', err);
                            } finally {
                                sessionStorage.removeItem('public_queue_id');
                                sessionStorage.removeItem('private_queue_id');
                            }
                        }
                        navigate('/lobby');
                    }
                }}
                style={styles.quitBtn}
                title="Leave match"
            >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Door frame */}
                    <rect x="3" y="2" width="12" height="20" rx="2" stroke="rgba(89, 0, 223, 1)" strokeWidth="2" fill="rgba(0, 0, 0, 1)" />
                    {/* Open door leaf */}
                    <path d="M15 4 L15 20 L9 18 L9 6 Z" fill="rgba(89, 0, 223, 0.4)" stroke="rgba(89, 0, 223, 1)" strokeWidth="1.5" />
                    {/* Red arrow pointing out */}
                    <path d="M17 12 L22 12" stroke="#f60808ff" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M20 9 L22.5 12 L20 15" stroke="#f60808ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
            </button>

            {/* Connection status pill */}
            <div style={{
                ...styles.statusPill,
                ...(status === 'open' ? styles.statusOpen :
                    status === 'connecting' ? styles.statusConnecting :
                        styles.statusError)
            }}>
                ● {status === 'open' ? 'Live' : status === 'connecting' ? 'Connecting...' : 'Disconnected'}
            </div>

            {/* Scoreboard — moved up out of field */}
            <div style={styles.scoreboard}>
                <div style={styles.scoreGroup}>
                    <span style={{ color: '#0c0cfdff', fontSize: 24, fontWeight: 'bold', textShadow: '0 0 10px #0c0cfdff' }}>
                        {gameState?.score?.left ?? 0}
                    </span>
                    <span style={styles.teamLabel}>BLUE</span>
                </div>

                <div style={styles.timerGroup}>
                    <span style={{ color: 'rgba(251, 255, 0, 1)', fontSize: 14 }}>
                        {gameState?.timer ?? '00:00'}
                    </span>
                </div>

                <div style={styles.scoreGroup}>
                    <span style={{ color: '#f60808ff', fontSize: 24, fontWeight: 'bold', textShadow: '0 0 10px #f60808ff' }}>
                        {gameState?.score?.right ?? 0}
                    </span>
                    <span style={styles.teamLabel}>RED</span>
                </div>
            </div>

            {/* Canvas arena */}
            <div style={styles.arenaWrap}>
                <GameCanvas
                    gameState={gameState}
                    initData={initData}
                    width={800}
                    height={500}
                />

                {/* Chat overlay */}
                <div style={styles.chatWrapper}>
                    <div
                        style={{
                            ...styles.chatMessages,
                            overflowY: isChatHovered ? 'auto' : 'hidden'
                        }}
                        onMouseEnter={() => setIsChatHovered(true)}
                        onMouseLeave={() => setIsChatHovered(false)}
                    >
                        {chatMessages.map((msg, i) => (
                            <div key={i} style={styles.chatMsg}>
                                <span style={{
                                    fontWeight: 'bold',
                                    color: getSenderColor(msg.sender),
                                }}>
                                    {msg.sender}
                                </span>
                                <span style={{ color: 'rgba(255,255,255,0.6)' }}>: {msg.text}</span>
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                    </div>
                    <form onSubmit={handleChatSubmit} style={{ display: 'flex' }}>
                        <input
                            type="text"
                            placeholder="Enter to chat..."
                            autoComplete="off"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            style={styles.chatInput}
                        />
                    </form>
                </div>

                {/* Winner overlay */}
                {gameState?.winner && (
                    <div style={styles.overlay}>
                        <div style={{
                            ...styles.overlayMsg,
                            color: gameState.winner === 'left' ? '#3b82f6' : '#ef4444',
                            textShadow: `0 0 30px ${gameState.winner === 'left' ? '#3b82f6' : '#ef4444'}`,
                        }}>
                            {gameState.winner === 'left' ? 'BLUE TEAM WINS!' : 'RED TEAM WINS!'}
                        </div>
                    </div>
                )}

                {/* Disconnected overlay */}
                {(status === 'closed' || status === 'error') && (
                    <div style={styles.overlay}>
                        <div style={{ ...styles.overlayMsg, fontSize: '18px', color: '#ef4444' }}>
                            Connection lost — reconnecting…
                        </div>
                    </div>
                )}
            </div>

            {/* Controls hint */}
            <div style={styles.controlsHint}>
                WASD / Arrows — move &nbsp;|&nbsp; SPACE — shoot
            </div>
        </div>
    );
};

// ── Inline styles ────────────────────────────────────────────────────────────
const styles = {
    container: {
        background: '#050508',
        backgroundImage: `url(${synthwaveBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontFamily: "'Courier New', monospace",
        overflow: 'hidden',
        color: '#ccc',
        position: 'relative',
    },
    quitBtn: {
        position: 'absolute',
        top: 16,
        left: 16,
        background: 'black',
        border: '1px solid rgba(89, 0, 223, 1)',
        borderRadius: 8,
        padding: 8,
        cursor: 'pointer',
        zIndex: 50,
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusPill: {
        position: 'absolute',
        top: 20,
        right: 20,
        fontSize: 11,
        padding: '3px 14px',
        borderRadius: 20,
        zIndex: 50,
        fontFamily: "'Courier New', monospace",
    },
    statusOpen: {
        color: '#34d399',
        background: 'rgba(52,211,153,0.08)',
        border: '1px solid rgba(52,211,153,0.2)',
    },
    statusConnecting: {
        color: '#fbbf24',
        background: 'rgba(251,191,36,0.08)',
        border: '1px solid rgba(251,191,36,0.2)',
    },
    statusError: {
        color: '#f87171',
        background: 'rgba(248,113,113,0.08)',
        border: '1px solid rgba(248,113,113,0.2)',
    },
    scoreboard: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 60,
        background: 'rgba(10, 10, 15, 0.8)',
        padding: '10px 40px',
        borderRadius: '12px 12px 12px 12px',
        marginBottom: 10,
        zIndex: 40,
        boxShadow: '0 -10px 30px rgba(0,0,0,0.5)',
    },
    scoreGroup: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minWidth: 60,
    },
    timerGroup: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 20px',
    },
    teamLabel: {
        fontSize: 9,
        fontWeight: 'bold',
        color: 'rgba(89, 0, 223, 1)',
        marginTop: 2,
        letterSpacing: 1,
    },
    arenaWrap: {
        position: 'relative',
        display: 'inline-block',
    },
    chatWrapper: {
        position: 'absolute',
        bottom: 16,
        left: -270,
        width: 270,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 10,
    },
    chatMessages: {
        height: 140,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        fontSize: 12,
        marginBottom: 6,
        padding: '8px',
        background: 'rgba(5, 5, 10, 0.75)',
        borderRadius: '8px',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
    },
    chatMsg: {
        marginTop: 2,
        wordWrap: 'break-word',
        textAlign: 'left',
        textShadow: '1px 1px 3px rgba(0,0,0,0.8)',
    },
    chatInput: {
        width: '100%',
        background: 'rgba(5, 5, 10, 0.9)',
        border: '1px solid rgba(255,255,255,0.2)',
        color: 'white',
        padding: '8px 12px',
        borderRadius: 6,
        fontFamily: "'Courier New', monospace",
        fontSize: 12,
        outline: 'none',
        boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
    },
    overlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 20,
    },
    overlayMsg: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        whiteSpace: 'pre-line',
        background: 'rgba(0,0,0,0.65)',
        padding: '18px 36px',
        borderRadius: 10,
        letterSpacing: 2,
    },
    controlsHint: {
        marginTop: 10,
        fontSize: 11,
        color: 'rgba(255, 255, 255, 1)',
        fontFamily: "'Courier New', monospace",
    },
};

export default GameRoom;
