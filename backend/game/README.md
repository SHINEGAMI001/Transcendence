# Game Backend Sandbox (Haxball Style)

This application serves as an interactive testing environment and baseline interface for our Haxball-style project. It is written using vanilla JavaScript on the HTML5 `<canvas>` and integrated into a basic Django setup. 

The primary goal here is **stability and predictability** over extreme realism, making it significantly easier to transition the physics calculation directly to a server-side backend later using Django Channels (WebSockets).

## Current Architecture

### 1. Game State (`state`)
All gameplay variables are bundled inside a single `state` object at the top of `game.js`.

```javascript
const state = {
  player: { x, y, radius, speed, ... },
  ball:   { x, y, radius, vx, vy },
  score:  { left, right },
  shootCooldownUntil: 0,
  paused: false
};
```
Why? By keeping it inside a single source of truth, it perfectly mimics how a Backend-Authoritative model works. When WebSockets are hooked up later, you will simply replace this local `state` object with JSON data parsed from `ws.onmessage()`.

### 2. The Game Loop
Using `requestAnimationFrame()`, the code triggers `gameLoop()` continuously.
Important sequence logic:
1. `updatePlayer()` -> Updates movement coordinates.
2. `updateBall()` -> Updates velocity and friction.
3. `handlePlayerBallCollision()` -> Checks if they overlap. If yes, it mathematically separates them first (push out) before applying physical rebound. This is what perfectly eliminates the "sticky ball" bug.
4. `handleWallCollision()` -> Contains the ball within the bounds of the arena.
5. `checkGoal()` -> Increments scores and resets the ball appropriately.

### 3. Collision Logic Breakdown
The "stickiness" bugs that commonly affect JavaScript canvas games happen because a ball's velocity forces it *inside* a player's hitbox. In the next frame, it gets caught inside, repeatedly recalculating collisions.

**How it was fixed:**
- **Step 1: Separation.** If the ball is inside the player, we instantly update `ball.x` and `ball.y` directly along the vector to sit exactly at the edge (`player.radius + ball.radius + 1`). This is called a *Projection Rebound*.
- **Step 2: Force.** Upon separation, we apply speed vectors. If they press `Space`, shoot power is applied. Otherwise, a slight `PUSH_STRENGTH` operates automatically so that simply running into the ball acts as "dribbling."

## Why the "Space Lag" was occurring & The Fix

When playing canvas games within a web browser, the `Space` key defaults to scrolling the viewport down, while arrow keys navigate across the DOM. The browser natively tries to execute these scroll events inside the internal event queue.

Even if you focus on the `<canvas>`, the moment it loses focus, standard keyboard routing takes priority. When the player pressed `Space` rapidly:
1. The browser tried pushing the scroll position.
2. The browser immediately processed an expensive `console.log` trace (which locks standard IO processes when Dev Tools are open).
3. The JavaScript collision function instantly moved the ball via projection and velocity, occasionally causing overlapping stutters depending on CPU cycles.

**The Fix:**
1. Mapped the keyboard handlers to use `e.code` (which reads hardware keys like `"KeyW"` and `"Space"`) instead of `e.key`.
2. Passed `{ passive: false }` to the `window.addEventListener("keydown")` which strongly guarantees `e.preventDefault()` halts DOM rendering updates for scrolling.
3. The Ball Kick vector was repositioned safely **before** final velocity bounds to prevent overlapping physics calculation frames.

## Next Steps for Server Integration (WebSockets)

When you are ready to move this to the backend:
1. **Take away the physics from JS.** Disconnect `updatePlayer()` and `updateBall()` loops from the frontend.
2. **Setup Django Channels.** Read inputs (WASD, Space) inside `game.js`, and stream those inputs in real-time as JSON vectors (`{ inputs: ["KeyW", "Space"] }`) to the backend.
3. The Backend will run this exact same math logic using Python asyncio.
4. **Broadcast State.** The server broadcasts the JSON `state` dictionary entirely back to all players in the room roughly `60` times a second.
5. The Frontend will act purely as a "dumb renderer", looping the `drawField()`, `drawPlayer()`, and `drawBall()` based on exactly what the backend tells it.
