/**
 * GameCanvas.jsx
 * Server-authoritative canvas renderer.
 * Draws arena, players, ball, goals, and field markings.
 */
import { useEffect, useRef } from 'react';

// ── Colors ────────────────────────────────────────────────────────────────────
const C = {
  bg:          '#0d0e18',
  field:       '#0f1122',
  fieldLine:   'rgba(255,255,255,0.06)',
  goalLeft:    'rgba(108,99,255,0.18)',
  goalRight:   'rgba(255,107,107,0.18)',
  goalBorder:  'rgba(255,255,255,0.15)',
  playerLeft:  '#6c63ff',
  playerRight: '#ff6b6b',
  playerMe:    '#ffffff',
  ball:        '#ffd700',
  ballShadow:  'rgba(255,215,0,0.35)',
  wall:        '#1e2035',
  wallStroke:  '#2a2d3e',
  centerLine:  'rgba(255,255,255,0.08)',
};

const GOAL_H      = 150;
const CORNER_R    = 80;
const PLAYER_R    = 20;
const BALL_R      = 12;

function drawArena(ctx, W, H) {
  // Background
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);

  // Field surface
  ctx.fillStyle = C.field;
  ctx.beginPath();
  ctx.roundRect(0, 0, W, H, CORNER_R);
  ctx.fill();

  // ── Field lines ──
  ctx.strokeStyle = C.fieldLine;
  ctx.lineWidth = 1.5;

  // Center circle
  ctx.beginPath();
  ctx.arc(W / 2, H / 2, 70, 0, Math.PI * 2);
  ctx.stroke();

  // Center dot
  ctx.fillStyle = C.fieldLine;
  ctx.beginPath();
  ctx.arc(W / 2, H / 2, 4, 0, Math.PI * 2);
  ctx.fill();

  // Center vertical line
  ctx.beginPath();
  ctx.moveTo(W / 2, 0);
  ctx.lineTo(W / 2, H);
  ctx.strokeStyle = C.centerLine;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // ── Goals ──
  const goalTop    = (H - GOAL_H) / 2;
  const goalBottom = goalTop + GOAL_H;
  const goalDepth  = 30;

  // Left goal fill
  ctx.fillStyle = C.goalLeft;
  ctx.beginPath();
  ctx.rect(-goalDepth, goalTop, goalDepth, GOAL_H);
  ctx.fill();
  // Left goal border
  ctx.strokeStyle = C.goalBorder;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, goalTop);
  ctx.lineTo(-goalDepth, goalTop);
  ctx.lineTo(-goalDepth, goalBottom);
  ctx.lineTo(0, goalBottom);
  ctx.stroke();

  // Right goal fill
  ctx.fillStyle = C.goalRight;
  ctx.beginPath();
  ctx.rect(W, goalTop, goalDepth, GOAL_H);
  ctx.fill();
  // Right goal border
  ctx.strokeStyle = C.goalBorder;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W, goalTop);
  ctx.lineTo(W + goalDepth, goalTop);
  ctx.lineTo(W + goalDepth, goalBottom);
  ctx.lineTo(W, goalBottom);
  ctx.stroke();

  // ── Arena border ──
  ctx.strokeStyle = C.wallStroke;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(0, 0, W, H, CORNER_R);
  ctx.stroke();
}

function drawPlayer(ctx, p, myId) {
  const isMe = p.id === myId;
  const color = p.t === 'left' ? C.playerLeft : C.playerRight;

  // Shadow / glow
  ctx.save();
  ctx.shadowBlur  = isMe ? 24 : 14;
  ctx.shadowColor = color;

  // Body
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.r || PLAYER_R, 0, Math.PI * 2);

  // Gradient fill
  const grad = ctx.createRadialGradient(p.x - 5, p.y - 5, 2, p.x, p.y, p.r || PLAYER_R);
  grad.addColorStop(0, isMe ? '#ffffff' : lighten(color, 0.3));
  grad.addColorStop(1, color);
  ctx.fillStyle = grad;
  ctx.fill();

  // Border
  ctx.strokeStyle = isMe ? '#ffffff' : 'rgba(255,255,255,0.3)';
  ctx.lineWidth = isMe ? 2.5 : 1.5;
  ctx.stroke();
  ctx.restore();

  // "ME" label
  if (isMe) {
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = 'bold 9px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('YOU', p.x, p.y);
  }
}

function drawBall(ctx, ball) {
  const r = ball.r || BALL_R;

  // Outer glow
  ctx.save();
  ctx.shadowBlur  = 20;
  ctx.shadowColor = C.ballShadow;

  // Ball body
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, r, 0, Math.PI * 2);
  const grad = ctx.createRadialGradient(ball.x - 3, ball.y - 3, 1, ball.x, ball.y, r);
  grad.addColorStop(0, '#fffacd');
  grad.addColorStop(1, '#e6b800');
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.strokeStyle = 'rgba(255,200,0,0.5)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

function lighten(hex, amount) {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.min(255, (num >> 16) + Math.round(255 * amount));
  const g = Math.min(255, ((num >> 8) & 0xff) + Math.round(255 * amount));
  const b = Math.min(255, (num & 0xff) + Math.round(255 * amount));
  return `rgb(${r},${g},${b})`;
}

export default function GameCanvas({ gameState, initData, width, height }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, width, height);

    drawArena(ctx, width, height);

    if (!gameState) return;

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
      style={{ width, height }}
    />
  );
}
