/**
 * GameCanvas.jsx
 * Neon-futuristic server-authoritative canvas renderer.
 * All field elements drawn with canvas API — no image assets.
 */
import React, { useEffect, useRef } from 'react';

// ── Arena constants (must match backend) ─────────────────────────────────────
const ARENA_W = 800;
const ARENA_H = 500;
const CORNER_R = 80;
const GOAL_H = 150;
const GOAL_TOP = (ARENA_H - GOAL_H) / 2;
const GOAL_BOTTOM = GOAL_TOP + GOAL_H;
const GOAL_DEPTH = 22;

// ── Neon palette ─────────────────────────────────────────────────────────────
const NEON = {
  bg:         '#0a0a0f',
  border:      'rgba(89, 0, 223, 1)',
  line:       'rgba(89, 0, 223, 1)',
  goalLeft:   '#0c0cfdff',
  goalRight:  '#f60808ff',
  playerLeft: '#3b82f6',
  playerRight:'#ef4444',
  ball:       'rgba(89, 0, 223, 1)',
  ballGlow:   'rgba(89, 0, 223, 1)',
  timerText:  'rgba(251, 255, 0, 1)',
};

// ── Draw functions ───────────────────────────────────────────────────────────

function drawField(ctx, W, H) {
  // Outer border (non-glowing, dim)
  ctx.save();
  ctx.strokeStyle = NEON.border;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(0, 0, W, H, CORNER_R);
  ctx.stroke();
  ctx.restore();

  // Center line
  ctx.save();
  ctx.strokeStyle = NEON.line;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(W / 2, 0);
  ctx.lineTo(W / 2, H);
  ctx.stroke();

  // Center circle
  ctx.beginPath();
  ctx.arc(W / 2, H / 2, 60, 0, Math.PI * 2);
  ctx.stroke();

  // Center dot
  ctx.fillStyle = NEON.line;
  ctx.beginPath();
  ctx.arc(W / 2, H / 2, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Penalty areas
  const penaltyW = 70;
  const penaltyH = 200;
  const penaltyTop = (H - penaltyH) / 2;
  ctx.save();
  ctx.strokeStyle = NEON.line;
  ctx.lineWidth = 1.5;
  // Left penalty area
  ctx.strokeRect(0, penaltyTop, penaltyW, penaltyH);
  // Right penalty area
  ctx.strokeRect(W - penaltyW, penaltyTop, penaltyW, penaltyH);
  ctx.restore();

  // ── Goal lines (with glow) ──
  // Left goal — blue glow
  ctx.save();
  ctx.shadowBlur = 24;
  ctx.shadowColor = NEON.goalLeft;
  ctx.strokeStyle = NEON.goalLeft;
  ctx.lineWidth = 42;
  ctx.beginPath();
  ctx.moveTo(0, GOAL_TOP);
  ctx.lineTo(-GOAL_DEPTH, GOAL_TOP);
  ctx.lineTo(-GOAL_DEPTH, GOAL_BOTTOM);
  ctx.lineTo(0, GOAL_BOTTOM);
  ctx.stroke();
  
  // Highlight goal area
  ctx.fillStyle = 'rgba(16, 103, 243, 0.83)';
  ctx.fillRect(-GOAL_DEPTH, GOAL_TOP, GOAL_DEPTH, GOAL_H);
  ctx.restore();

  // Right goal — red glow
  ctx.save();
  ctx.shadowBlur = 24;
  ctx.shadowColor = NEON.goalRight;
  ctx.strokeStyle = NEON.goalRight;
  ctx.lineWidth = 42;
  ctx.beginPath();
  ctx.moveTo(W, GOAL_TOP);
  ctx.lineTo(W + GOAL_DEPTH, GOAL_TOP);
  ctx.lineTo(W + GOAL_DEPTH, GOAL_BOTTOM);
  ctx.lineTo(W, GOAL_BOTTOM);
  ctx.stroke();

  // Highlight goal area
  ctx.fillStyle = 'rgba(239, 68, 68, 0.05)';
  ctx.fillRect(W, GOAL_TOP, GOAL_DEPTH, GOAL_H);
  ctx.restore();
}

function drawPlayer(ctx, p, myId) {
  const r = p.r || 20;
  const isMe = p.id === myId;
  const isLeft = p.t === 'left';
  const color = isLeft ? NEON.playerLeft : NEON.playerRight;

  // Glow
  ctx.save();
  ctx.shadowBlur = isMe ? 28 : 16;
  ctx.shadowColor = color;

  // Body circle
  ctx.beginPath();
  ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
  const grad = ctx.createRadialGradient(p.x - r * 0.3, p.y - r * 0.3, 1, p.x, p.y, r);
  grad.addColorStop(0, isMe ? '#ffffff' : lighten(color, 0.35));
  grad.addColorStop(1, color);
  ctx.fillStyle = grad;
  ctx.fill();

  // Rim
  ctx.strokeStyle = isMe ? 'rgba(255,255,255,0.9)' : `${color}aa`;
  ctx.lineWidth = isMe ? 2.5 : 1.5;
  ctx.stroke();
  ctx.restore();

  // Player name below
  const name = p.n || '';
  if (name) {
    ctx.save();
    ctx.font = 'bold 9px "Inter", "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = isMe ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.55)';
    ctx.shadowBlur = 4;
    ctx.shadowColor = color;
    ctx.fillText(name, p.x, p.y + r + 4);
    ctx.restore();
  }
}

function drawBall(ctx, ball) {
  const r = ball.r || 12;

  ctx.save();
  ctx.shadowBlur = 14;
  ctx.shadowColor = NEON.ballGlow;

  ctx.beginPath();
  ctx.arc(ball.x, ball.y, r, 0, Math.PI * 2);
  ctx.fillStyle = NEON.ball;
  ctx.fill();

  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

function drawWaiting(ctx, W, H) {
  ctx.textAlign = 'center';
  ctx.font = '16px "Courier New", monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fillText('Connecting to server…', W / 2, H / 2);
}

function lighten(hex, amount) {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.min(255, (num >> 16) + Math.round(255 * amount));
  const g = Math.min(255, ((num >> 8) & 0xff) + Math.round(255 * amount));
  const b = Math.min(255, (num & 0xff) + Math.round(255 * amount));
  return `rgb(${r},${g},${b})`;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function GameCanvas({ gameState, initData, width, height }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, width, height);

    if (!gameState) {
      drawWaiting(ctx, width, height);
      return;
    }

    drawField(ctx, width, height);

    const myId = initData?.player_id ?? null;

    // Draw players
    const players = Object.values(gameState.players || {});
    players.forEach(p => drawPlayer(ctx, p, myId));

    // Draw ball
    if (gameState.ball) drawBall(ctx, gameState.ball);

  }, [gameState, initData, width, height]);

  return (
    <canvas
      id="gameCanvas"
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        display: 'block',
        background: NEON.bg,
        borderRadius: '77px',
      }}
    />
  );
}
