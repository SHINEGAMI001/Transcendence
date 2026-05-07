"""
state.py — Pure data layer.

No game logic, no async I/O. Just the canonical shape of a room's state
and the global room registry.

PERF NOTE: Room lookups (get_room) are plain dict reads — no async lock.
asyncio is cooperative / single-threaded, so dict reads between awaits are
safe without locking. The lock is only used for create/delete (multi-step
mutations that span awaits).
"""

import asyncio
import time
from collections import deque
from dataclasses import dataclass, field
from typing import Dict, Optional, Deque


# ─── Arena constants ──────────────────────────────────────────────────────────

ARENA_WIDTH  = 800
ARENA_HEIGHT = 500
GOAL_HEIGHT  = 150   # vertical span of each goal

PLAYER_RADIUS  = 20
BALL_RADIUS    = 12
PLAYER_SPEED   = 200.0   # px / second
PUSH_STRENGTH  = 0.0     # no bounce on touch (carry ball)
SHOOT_STRENGTH = 550.0   # px/s impulse on kick (space/enter key)

# --- Friction is specified as a per-SECOND multiplier, not per-tick.
# The engine converts it to a per-tick value using dt.
# 0.4 means the ball retains 40% of its speed after 1 full second.
BALL_FRICTION_PER_SEC = 0.4   # fraction of speed kept per second (0..1)

MAX_BALL_SPEED = 800.0   # px/s hard cap
MAX_SCORE      = 5       # first to N goals wins

# Pre-computed goal boundaries
_GOAL_TOP    = (ARENA_HEIGHT - GOAL_HEIGHT) / 2.0
_GOAL_BOTTOM = _GOAL_TOP + GOAL_HEIGHT


# ─── Player ───────────────────────────────────────────────────────────────────

@dataclass
class PlayerState:
    player_id: str
    x: float
    y: float
    team: str = "left"   # "left" or "right"
    radius: float = PLAYER_RADIUS

    # Live input flags — written by consumer layer, read by engine each tick.
    up:    bool = False
    down:  bool = False
    left:  bool = False
    right: bool = False
    # shoot is a one-shot flag: engine reads it, then clears it immediately.
    shoot: bool = False

    # Input queue for batched processing (optional, for future use)
    input_queue: Deque = field(default_factory=deque, repr=False)

    def to_dict(self) -> dict:
        return {
            "id": self.player_id,
            "x":  round(self.x, 1),
            "y":  round(self.y, 1),
            "r":  self.radius,
            "t":  self.team,
        }


# ─── Ball ─────────────────────────────────────────────────────────────────────

@dataclass
class BallState:
    x:      float = ARENA_WIDTH  / 2.0
    y:      float = ARENA_HEIGHT / 2.0
    vx:     float = 0.0
    vy:     float = 0.0
    radius: float = BALL_RADIUS

    def reset(self) -> None:
        self.x  = ARENA_WIDTH  / 2.0
        self.y  = ARENA_HEIGHT / 2.0
        self.vx = 0.0
        self.vy = 0.0

    def to_dict(self) -> dict:
        return {
            "x":  round(self.x,  1),
            "y":  round(self.y,  1),
            "vx": round(self.vx, 1),
            "vy": round(self.vy, 1),
            "r":  self.radius,
        }


# ─── Score ────────────────────────────────────────────────────────────────────

@dataclass
class ScoreState:
    left:  int = 0
    right: int = 0

    def to_dict(self) -> dict:
        return {"left": self.left, "right": self.right}


# ─── Tick Statistics (debug tools) ────────────────────────────────────────────

@dataclass
class TickStats:
    """Sliding-window statistics for the game loop. Resets every N ticks."""
    tick_count: int = 0
    total_tick_ms: float = 0.0
    max_tick_ms: float = 0.0
    slow_ticks: int = 0          # ticks that exceeded 16ms
    messages_in: int = 0         # input messages received since last reset
    messages_out: int = 0        # state broadcasts sent since last reset
    window_start: float = field(default_factory=time.monotonic)

    WINDOW_SIZE: int = 120       # report every 120 ticks (~2 sec at 60Hz)
    SLOW_THRESHOLD_MS: float = 16.0

    def record_tick(self, duration_ms: float) -> None:
        self.tick_count += 1
        self.total_tick_ms += duration_ms
        if duration_ms > self.max_tick_ms:
            self.max_tick_ms = duration_ms
        if duration_ms > self.SLOW_THRESHOLD_MS:
            self.slow_ticks += 1

    def record_message_in(self) -> None:
        self.messages_in += 1

    def record_message_out(self) -> None:
        self.messages_out += 1

    def should_report(self) -> bool:
        return self.tick_count >= self.WINDOW_SIZE

    def report(self) -> dict:
        avg = self.total_tick_ms / max(self.tick_count, 1)
        elapsed = time.monotonic() - self.window_start
        return {
            "ticks": self.tick_count,
            "avg_ms": round(avg, 2),
            "max_ms": round(self.max_tick_ms, 2),
            "slow": self.slow_ticks,
            "msg_in": self.messages_in,
            "msg_out": self.messages_out,
            "elapsed_s": round(elapsed, 2),
            "actual_hz": round(self.tick_count / max(elapsed, 0.001), 1),
        }

    def reset(self) -> None:
        self.tick_count = 0
        self.total_tick_ms = 0.0
        self.max_tick_ms = 0.0
        self.slow_ticks = 0
        self.messages_in = 0
        self.messages_out = 0
        self.window_start = time.monotonic()


# ─── Room State ───────────────────────────────────────────────────────────────

@dataclass
class RoomState:
    room_id: str
    players: Dict[str, PlayerState] = field(default_factory=dict)
    ball:    BallState               = field(default_factory=BallState)
    score:   ScoreState              = field(default_factory=ScoreState)

    # Internal loop bookkeeping — NOT sent to clients
    loop_task:      Optional[asyncio.Task] = field(default=None,  repr=False)
    last_tick_time: float = field(default_factory=time.monotonic, repr=False)
    running:        bool  = False
    winner:         Optional[str] = None   # "left" | "right" | None

    # Debug / monitoring
    stats: TickStats = field(default_factory=TickStats, repr=False)

    # Direct references to consumer channels for fast broadcast
    # Maps channel_name -> consumer instance (for direct send)
    _consumers: Dict[str, 'GameConsumer'] = field(default_factory=dict, repr=False)

    def to_dict(self) -> dict:
        return {
            "players": {pid: p.to_dict() for pid, p in self.players.items()},
            "ball":    self.ball.to_dict(),
            "score":   self.score.to_dict(),
            "winner":  self.winner,
        }

    def add_player(self, player_id: str) -> PlayerState:
        """Assign spawn position and team based on join order."""
        slot = len(self.players)
        if slot == 0:
            x, y = ARENA_WIDTH * 0.20, ARENA_HEIGHT / 2.0
            team = "left"
        elif slot == 1:
            x, y = ARENA_WIDTH * 0.80, ARENA_HEIGHT / 2.0
            team = "right"
        else:
            # Extra players: alternate teams, offset positions
            team = "left" if slot % 2 == 0 else "right"
            x = ARENA_WIDTH * 0.30 if team == "left" else ARENA_WIDTH * 0.70
            y = ARENA_HEIGHT * 0.3 + (slot - 2) * 60
        p = PlayerState(player_id=player_id, x=x, y=y, team=team)
        self.players[player_id] = p
        return p

    def remove_player(self, player_id: str) -> None:
        self.players.pop(player_id, None)
        self._consumers.pop(player_id, None)

    def register_consumer(self, player_id: str, consumer) -> None:
        """Store a direct reference to the consumer for fast broadcast."""
        self._consumers[player_id] = consumer

    def unregister_consumer(self, player_id: str) -> None:
        self._consumers.pop(player_id, None)

    def is_empty(self) -> bool:
        return len(self.players) == 0

    def player_count(self) -> int:
        return len(self.players)

    def reset_round(self) -> None:
        """Reset positions and ball after a goal."""
        self.ball.reset()
        slots = list(self.players.values())
        if len(slots) > 0:
            slots[0].x = ARENA_WIDTH * 0.20
            slots[0].y = ARENA_HEIGHT / 2.0
        if len(slots) > 1:
            slots[1].x = ARENA_WIDTH * 0.80
            slots[1].y = ARENA_HEIGHT / 2.0


# ─── Global room registry ─────────────────────────────────────────────────────
# asyncio is cooperative/single-threaded: plain dict reads between awaits are
# safe. We only need a lock for create/delete which are multi-step mutations.

_rooms: Dict[str, RoomState] = {}
_rooms_lock: asyncio.Lock | None = None


def _get_lock() -> asyncio.Lock:
    """Lazily create the rooms lock inside the running event loop."""
    global _rooms_lock
    if _rooms_lock is None:
        _rooms_lock = asyncio.Lock()
    return _rooms_lock


def get_room(room_id: str) -> Optional[RoomState]:
    """Fast, lock-free room lookup. Safe because asyncio is single-threaded."""
    return _rooms.get(room_id)


async def get_or_create_room(room_id: str) -> RoomState:
    """Create room if it doesn't exist. Uses lock to guard the check-then-set."""
    # Fast path: no lock needed for read
    room = _rooms.get(room_id)
    if room is not None:
        return room
    # Slow path: lock for creation
    async with _get_lock():
        if room_id not in _rooms:
            _rooms[room_id] = RoomState(room_id=room_id)
        return _rooms[room_id]


async def delete_room(room_id: str) -> None:
    async with _get_lock():
        _rooms.pop(room_id, None)


def get_all_rooms() -> Dict[str, RoomState]:
    """Return all active rooms (for debug/monitoring)."""
    return dict(_rooms)
