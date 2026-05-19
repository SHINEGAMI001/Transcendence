"""
engine.py — Server-authoritative game logic.
"""

import math

from .state import (
    RoomState, PlayerState, BallState, ARENA_WIDTH, ARENA_HEIGHT, GOAL_HEIGHT,
    PLAYER_RADIUS, BALL_RADIUS, PLAYER_SPEED, PUSH_STRENGTH, SHOOT_STRENGTH,
    BALL_FRICTION_PER_SEC, MAX_BALL_SPEED, MAX_SCORE, _GOAL_TOP, _GOAL_BOTTOM,
)

_INV_SQRT2 = 1.0 / math.sqrt(2.0)
_OVERLAP_BUFFER = 1.0
_EPSILON = 1e-9
_MIN_SPEED = 0.5
CORNER_RADIUS = 80.0  # Defines the curve of the rounded corners

def _clamp(value: float, lo: float, hi: float) -> float:
    if value < lo: return lo
    if value > hi: return hi
    return value

def _length_sq(dx: float, dy: float) -> float:
    return dx * dx + dy * dy

def _length(dx: float, dy: float) -> float:
    return math.sqrt(dx * dx + dy * dy)

# ─── Physically Rounded Walls ─────────────────────────────────────────────────

def constrain_to_arena(entity, is_ball=False) -> None:
    r = entity.radius
    cr = CORNER_RADIUS

    # 1. Base rectangular clamp (Flat straight walls)
    if is_ball:
        if entity.y - r < 0:
            entity.y = r
            entity.vy = abs(entity.vy)
        elif entity.y + r > ARENA_HEIGHT:
            entity.y = ARENA_HEIGHT - r
            entity.vy = -abs(entity.vy)

        if entity.x - r < 0:
            if not (_GOAL_TOP < entity.y < _GOAL_BOTTOM):
                entity.x = r
                entity.vx = abs(entity.vx)
        elif entity.x + r > ARENA_WIDTH:
            if not (_GOAL_TOP < entity.y < _GOAL_BOTTOM):
                entity.x = ARENA_WIDTH - r
                entity.vx = -abs(entity.vx) 
    else:
        # Players strictly stay in the box
        entity.x = _clamp(entity.x, r, ARENA_WIDTH - r)
        entity.y = _clamp(entity.y, r, ARENA_HEIGHT - r)

    # 2. Rounded corners clamp (Curved physics for convex corners)
    corners = [
        (cr, cr), (ARENA_WIDTH - cr, cr),
        (cr, ARENA_HEIGHT - cr), (ARENA_WIDTH - cr, ARENA_HEIGHT - cr)
    ]
    
    for cx, cy in corners:
        # Check if entity is deep in the corner zone
        in_x = (cx == cr and entity.x < cr) or (cx > cr and entity.x > ARENA_WIDTH - cr)
        in_y = (cy == cr and entity.y < cr) or (cy > cr and entity.y > ARENA_HEIGHT - cr)
        
        if in_x and in_y:
            dx = entity.x - cx
            dy = entity.y - cy
            dist = math.sqrt(dx*dx + dy*dy)
            max_dist = cr - r
            
            # If the entity pushes past the curve, shove it back inside the pitch
            if dist > max_dist and dist > 0:
                nx = dx / dist
                ny = dy / dist
                overlap = dist - max_dist
                
                entity.x -= nx * overlap
                entity.y -= ny * overlap
                
                # Reflect momentum for the ball so it bounces realistically
                if is_ball:
                    dot = entity.vx * nx + entity.vy * ny
                    if dot > 0: 
                        entity.vx -= 2 * dot * nx
                        entity.vy -= 2 * dot * ny

def update_player(player: PlayerState, dt: float) -> None:
    dx = dy = 0.0
    if player.right: dx += 1.0
    if player.left:  dx -= 1.0
    if player.down:  dy += 1.0
    if player.up:    dy -= 1.0

    if dx != 0.0 or dy != 0.0:
        if dx != 0.0 and dy != 0.0:
            dx *= _INV_SQRT2
            dy *= _INV_SQRT2
        speed = PLAYER_SPEED * dt
        player.x += dx * speed
        player.y += dy * speed

    # Apply the physical curve to the player
    constrain_to_arena(player, is_ball=False)


# ─── Interactions ─────────────────────────────────────────────────────────────

def handle_player_player_collision(players: list[PlayerState]) -> None:
    n = len(players)
    for i in range(n):
        for j in range(i + 1, n):
            a, b = players[i], players[j]
            dx = b.x - a.x
            dy = b.y - a.y
            min_dist = a.radius + b.radius
            dist_sq = _length_sq(dx, dy)

            if dist_sq >= min_dist * min_dist or dist_sq < _EPSILON:
                continue

            dist = math.sqrt(dist_sq)
            nx, ny = dx / dist, dy / dist
            push = (min_dist - dist) / 2.0 + 0.5
            a.x -= nx * push
            a.y -= ny * push
            b.x += nx * push
            b.y += ny * push
            
            constrain_to_arena(a, is_ball=False)
            constrain_to_arena(b, is_ball=False)

def update_ball(ball: BallState, dt: float) -> None:
    ball.x += ball.vx * dt
    ball.y += ball.vy * dt

    friction_tick = BALL_FRICTION_PER_SEC ** dt
    ball.vx *= friction_tick
    ball.vy *= friction_tick

    if abs(ball.vx) < _MIN_SPEED: ball.vx = 0.0
    if abs(ball.vy) < _MIN_SPEED: ball.vy = 0.0

    speed_sq = _length_sq(ball.vx, ball.vy)
    if speed_sq > MAX_BALL_SPEED * MAX_BALL_SPEED:
        speed = math.sqrt(speed_sq)
        ball.vx = ball.vx / speed * MAX_BALL_SPEED
        ball.vy = ball.vy / speed * MAX_BALL_SPEED

def handle_player_ball_collision(player: PlayerState, ball: BallState) -> None:
    dx   = ball.x - player.x
    dy   = ball.y - player.y
    min_dist = player.radius + ball.radius
    dist_sq = _length_sq(dx, dy)

    if dist_sq >= min_dist * min_dist or dist_sq < _EPSILON:
        return

    dist = math.sqrt(dist_sq)
    nx, ny = dx / dist, dy / dist

    overlap = min_dist - dist + _OVERLAP_BUFFER
    
    # 50/50 Split for multi-body stability
    ball.x += nx * overlap * 0.5
    ball.y += ny * overlap * 0.5
    player.x -= nx * overlap * 0.5
    player.y -= ny * overlap * 0.5
    
    constrain_to_arena(player, is_ball=False)

    strength = SHOOT_STRENGTH if player.shoot else PUSH_STRENGTH
    dot = ball.vx * nx + ball.vy * ny
    if dot < strength:
        ball.vx = nx * strength
        ball.vy = ny * strength


# ─── Game Loop ────────────────────────────────────────────────────────────────

def check_goal(room: RoomState) -> bool:
    ball = room.ball
    scored_side = None
    if ball.x + ball.radius < 0 and _GOAL_TOP < ball.y < _GOAL_BOTTOM:
        scored_side = "right"
    elif ball.x - ball.radius > ARENA_WIDTH and _GOAL_TOP < ball.y < _GOAL_BOTTOM:
        scored_side = "left"

    if scored_side is None: return False

    if scored_side == "right": room.score.right += 1
    else: room.score.left += 1

    if room.score.left >= MAX_SCORE: room.winner = "left"
    elif room.score.right >= MAX_SCORE: room.winner = "right"

    room.reset_round()
    return True

def tick(room: RoomState, dt: float) -> None:
    dt = min(dt, 0.05)
    player_list = list(room.players.values())

    # --- 1. ARCADE AUTO-RESTART LOGIC ---
    if room.winner:
        # If there's a winner, start a 4-second countdown timer
        if not hasattr(room, 'win_timer'):
            room.win_timer = 4.0
        room.win_timer -= dt

        # When timer hits zero, reset everything!
        if room.win_timer <= 0:
            room.winner = None
            room.score.left = 0
            room.score.right = 0
            del room.win_timer
            room.reset_round()

        return  # Skip physics updates while the win screen is showing
    # ------------------------------------

    # 2. Normal physics (only runs if there is no winner)
    for player in player_list:
        update_player(player, dt)

    update_ball(room.ball, dt)

    # 3x Iteration Solver to prevent corner traps
    for _ in range(3):
        handle_player_player_collision(player_list)
        for player in player_list:
            handle_player_ball_collision(player, room.ball)

        constrain_to_arena(room.ball, is_ball=True)

    check_goal(room)

    for player in player_list:
        player.shoot = False

_ALLOWED_KEYS = frozenset(["up", "down", "left", "right", "shoot"])

def apply_input(player: PlayerState, raw: dict) -> None:
    for key in _ALLOWED_KEYS:
        value = raw.get(key)
        if not isinstance(value, bool): continue
        if key == "shoot":
            if value: player.shoot = True
        else:
            setattr(player, key, value)
