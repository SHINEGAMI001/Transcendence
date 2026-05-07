/**
 * game.js — True Online Multiplayer Client
 */
const canvas = document.getElementById("gameCanvas");
const ctx    = canvas.getContext("2d");
const W      = canvas.width;
const H      = canvas.height;

const params = new URLSearchParams(window.location.search);
const roomId = params.get("room") || "lobby";
document.getElementById("room-label").textContent = roomId;

const statusEl   = document.getElementById("status");
const overlayMsg = document.getElementById("overlay-msg");
const fpsEl      = document.getElementById("fps-display");

function setStatus(text, cls) {
  statusEl.textContent = text;
  statusEl.className   = cls;
}

function showOverlay(text) {
  overlayMsg.textContent   = text;
  overlayMsg.style.display = text ? "block" : "none";
}

let gameState  = null;
let prevState  = null;
let stateTime  = 0;

let frameCount  = 0;
let lastFPSTime = performance.now();
let displayFPS  = 0;
let statesRecv  = 0;
let lastStatsTime = performance.now();
let pingMs      = 0;

class LocalPlayer {
  constructor() {
    this.keyMap = {
      KeyW: "up", ArrowUp: "up",
      KeyS: "down", ArrowDown: "down",
      KeyA: "left", ArrowLeft: "left",
      KeyD: "right", ArrowRight: "right"
    };
    this.shootKeys = new Set(["Space", "Enter"]);
    this.input = { up: false, down: false, left: false, right: false, shoot: false };
    this.shootPending = false;
    this.ws = null;
    this.myPlayerId = null;
    this.myTeam = null;
    this.lastPingSent = 0;
  }

  connect(url) {
    this.ws = new WebSocket(url);
    this.ws.onopen = () => this.sendPing();
    this.ws.onmessage = (ev) => {
      let msg;
      try { msg = JSON.parse(ev.data); } catch { return; }
      if (msg.type === "init") {
        this.myPlayerId = msg.player_id;
        this.myTeam = msg.team;
        setStatus("● Connected", "connected");
        showOverlay("");
        gameState = null;
        prevState = null;
      } else if (msg.type === "state") {
        prevState = gameState;
        gameState = msg.state;
        stateTime = performance.now();
        statesRecv++;
        if (gameState.winner) {
          const side = gameState.winner === "left" ? "🟦 LEFT" : "🟥 RIGHT";
          showOverlay(`${side} WINS! 🎉\nNext match starting...`);
        } else {
          showOverlay("");
        }
      } else if (msg.type === "pong") {
        pingMs = Math.round(performance.now() - this.lastPingSent);
      }
    };
    this.ws.onclose = () => {
      setStatus("● Disconnected", "error");
      showOverlay("Disconnected — reconnecting…");
    };
  }

  sendPing() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.lastPingSent = performance.now();
      this.ws.send(JSON.stringify({ type: "ping" }));
    }
    setTimeout(() => this.sendPing(), 2000);
  }

  sendInput() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.input.shoot = this.shootPending;
    this.shootPending = false;
    this.ws.send(JSON.stringify({ type: "input", data: { ...this.input } }));
  }

  handleKeyDown(e) {
    if (this.shootKeys.has(e.code) && !e.repeat) this.shootPending = true;
    const a = this.keyMap[e.code];
    if (a) this.input[a] = true;
  }

  handleKeyUp(e) {
    const a = this.keyMap[e.code];
    if (a) this.input[a] = false;
  }
}

const player = new LocalPlayer();
const SCROLL_BLOCK = new Set(["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter"]);

window.addEventListener("keydown", (e) => {
  if (SCROLL_BLOCK.has(e.code)) e.preventDefault();
  player.handleKeyDown(e);
}, { passive: false });

window.addEventListener("keyup", (e) => player.handleKeyUp(e));
window.addEventListener("blur", () => {
  player.input.up = player.input.down = player.input.left = player.input.right = false;
});

let reconnectT = null;
function connect() {
  clearTimeout(reconnectT);
  const url = `ws://${window.location.host}/ws/game/${roomId}/`;
  setStatus("● Connecting…", "connecting");
  player.connect(url);
}

connect();

function lerp(a, b, t) { return a + (b - a) * t; }

function getInterpolated() {
  if (!gameState) return null;
  if (!prevState) return gameState;
  const TICK_MS = 1000 / 60;
  const t = Math.min((performance.now() - stateTime) / TICK_MS, 1.0);
  const interp = {
    score:  gameState.score,
    winner: gameState.winner,
    players: {},
    ball: {
      x:  lerp(prevState.ball.x,  gameState.ball.x,  t),
      y:  lerp(prevState.ball.y,  gameState.ball.y,  t),
      vx: gameState.ball.vx,
      vy: gameState.ball.vy,
      r:  gameState.ball.r,
    },
  };
  for (const pid in gameState.players) {
    const cur  = gameState.players[pid];
    const prev = prevState.players?.[pid];
    interp.players[pid] = prev ? {
      id: cur.id,
      t:  cur.t,
      r:  cur.r,
      x:  lerp(prev.x, cur.x, t),
      y:  lerp(prev.y, cur.y, t),
    } : cur;
  }
  return interp;
}

const GOAL_H   = 150;
const GOAL_TOP = (H - GOAL_H) / 2;
const TEAM_COLORS = {
  left:  { light: "#90c4ff", dark: "#1d4ed8", rim: "rgba(100,180,255,0.9)" },
  right: { light: "#ff9090", dark: "#b91c1c", rim: "rgba(255,120,120,0.9)" },
};
const MY_RIM = "rgba(255,220,80,0.95)";

function drawField() {
  const cr = 80;
  ctx.fillStyle = "#222222"; 
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#718c5a"; 
  ctx.beginPath();
  ctx.moveTo(cr, 0);
  ctx.lineTo(W - cr, 0);
  ctx.arc(W - cr, cr, cr, -Math.PI/2, 0, false);
  ctx.lineTo(W, H - cr);
  ctx.arc(W - cr, H - cr, cr, 0, Math.PI/2, false);
  ctx.lineTo(cr, H);
  ctx.arc(cr, H - cr, cr, Math.PI/2, Math.PI, false);
  ctx.lineTo(0, cr);
  ctx.arc(cr, cr, cr, Math.PI, -Math.PI/2, false);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(W/2, 0); ctx.lineTo(W/2, H); ctx.stroke();
  ctx.beginPath();
  ctx.arc(W/2, H/2, 60, 0, Math.PI*2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(W/2, H/2, 6, 0, Math.PI*2);
  ctx.fillStyle = "#ffffff"; ctx.fill();
  const gd = 20;
  ctx.fillStyle   = "rgba(0, 0, 0, 0.2)";
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth   = 3;
  ctx.fillRect(0,    GOAL_TOP, gd, GOAL_H); ctx.strokeRect(0,    GOAL_TOP, gd, GOAL_H);
  ctx.fillRect(W-gd, GOAL_TOP, gd, GOAL_H); ctx.strokeRect(W-gd, GOAL_TOP, gd, GOAL_H);
}

function drawScore(score) {
  ctx.font      = "bold 32px monospace";
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText(`${score.left}  —  ${score.right}`, W/2, 38);
}

function drawPlayer(p) {
  const r     = p.r;
  const isMe  = (p.id === player.myPlayerId);
  const team  = p.t || "left";
  const col   = TEAM_COLORS[team] || TEAM_COLORS.left;
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + r + 2, r*0.7, 5, 0, 0, Math.PI*2);
  ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.fill();
  const g = ctx.createRadialGradient(p.x - r*0.3, p.y - r*0.3, 1, p.x, p.y, r);
  g.addColorStop(0, col.light);
  g.addColorStop(1, col.dark);
  ctx.beginPath();
  ctx.arc(p.x, p.y, r, 0, Math.PI*2);
  ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = isMe ? MY_RIM : col.rim;
  ctx.lineWidth   = isMe ? 3 : 1.5;
  ctx.stroke();
  if (isMe) {
    ctx.font      = "bold 10px monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    ctx.fillText("YOU", p.x, p.y + 4);
  }
}

function drawBall(b) {
  const r = b.r;
  ctx.beginPath();
  ctx.ellipse(b.x, b.y + r + 1, r*0.6, 3, 0, 0, Math.PI*2);
  ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.fill();
  ctx.beginPath();
  ctx.arc(b.x, b.y, r, 0, Math.PI*2);
  ctx.fillStyle = "#ffffff"; 
  ctx.fill();
  ctx.strokeStyle = "#000000"; 
  ctx.lineWidth = 1.5; 
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(b.x, b.y, r * 0.4, 0, Math.PI*2);
  ctx.stroke();
}

function drawWaiting() {
  ctx.fillStyle = "#222222";
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = "center";
  ctx.font      = "18px monospace";
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.fillText("Connecting to server…", W/2, H/2 - 20);
  ctx.font      = "13px monospace";
  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.fillText(`Room: ${roomId}`, W/2, H/2 + 10);
}

function drawHUD() {
  if (!fpsEl) return;
  fpsEl.textContent = `FPS: ${displayFPS} | Ping: ${pingMs}ms`;
}

function render(now) {
  frameCount++;
  if (now - lastFPSTime >= 1000) {
    displayFPS  = frameCount;
    frameCount  = 0;
    lastFPSTime = now;
  }
  if (now - lastStatsTime >= 1000) {
    statesRecv    = 0;
    lastStatsTime = now;
  }
  player.sendInput();
  const state = getInterpolated();
  if (!state) {
    drawWaiting();
  } else {
    drawField();
    drawScore(state.score);
    for (const pid in state.players) drawPlayer(state.players[pid]);
    drawBall(state.ball);
  }
  drawHUD();
  requestAnimationFrame(render);
}

requestAnimationFrame(render);
