# ft_transcendence – 2D Football Game Architecture

This document defines the **game architecture** based on a **2D football (soccer) multiplayer game**.

The game must support:

* 2 players
* 4 players
* 6 players

This file explains:

* how the game must be built
* how the architecture must be designed
* what each team member is responsible for
* how multiplayer will work

---

# 1. Game Concept

We are building a **real‑time multiplayer 2D football game in the browser**.

The game includes:

* Multiple players on the field
* One ball
* Two goals
* Real‑time multiplayer using WebSockets
* Match results saved in the database

This is NOT a complex football simulation. It must remain:

* simple
* fast
* stable
* easy to synchronize in real time

---

# 2. Core Game Elements

The game engine must support these core elements:

## Players

Each player must have:

* position (x, y)
* movement (up, down, left, right)
* team (Team A or Team B)

## Ball

The ball must support:

* movement
* direction
* speed
* collision with players
* collision with field borders

## Goals

The game must detect:

* when the ball enters the left goal
* when the ball enters the right goal

## Score System

The game must track:

* Team A score
* Team B score

---

# 3. Game Engine Design (Frontend – Member 3)

The game must NOT be hardcoded for 2 players only.

Instead of:

```
player1
player2
```

The engine must be built using a dynamic structure:

```
players = [player1, player2, player3, player4, player5, player6]
```

This allows the same engine to work with:

* 2 players
* 4 players
* 6 players

---

# 4. Game Engine Structure

The internal structure of the game should look like this:

```
GameEngine
  ├── PlayerManager
  ├── Ball
  ├── CollisionSystem
  ├── GoalSystem
  ├── ScoreSystem
  ├── GameTimer
  └── GameLoop
```

This structure makes multiplayer easier later.

---

# 5. Correct Development Order

The game must be developed in this order:

Step 1: Build local version with 2 players
Step 2: Add ball physics
Step 3: Add goal detection
Step 4: Add score system
Step 5: Support 4 players
Step 6: Support 6 players
Step 7: Connect the game to WebSockets

This order avoids bugs and saves time.

---

# 6. Multiplayer Architecture (Member 4)

The multiplayer system must work like this:

Player presses a key → frontend sends input to backend
Backend updates the game state → backend sends updated state to all players
Frontend receives state → frontend renders the new state

The backend must control the game state.

---

# 7. Game State Structure

The backend must manage a structure similar to this:

```
{
  players: [
    { id: 1, x: 100, y: 200, team: "A" },
    { id: 2, x: 300, y: 200, team: "B" }
  ],
  ball: { x: 200, y: 200 },
  score: { teamA: 1, teamB: 0 }
}
```

The frontend must NOT calculate the game logic once multiplayer is active.

---

# 8. Responsibilities by Team Member

## Member 3 – Game Developer

Responsible for:

* Game engine
* Player movement
* Ball physics
* Player ↔ ball collision
* Goal detection
* Local playable version

---

## Member 4 – Real‑Time Developer

Responsible for:

* WebSocket server
* Game state synchronization
* Multiplayer system
* Player input handling
* Real‑time updates

---

## Member 2 – Frontend Developer

Responsible for:

* Game UI page
* Player interface
* Match interface
* Connecting the game to WebSockets
* Rendering multiplayer matches

---

## Member 1 – Team Leader

Responsible for:

* Integration between game and backend
* Database structure for matches
* Match results storage
* Code reviews
* Making sure the architecture is respected

---

# 9. Final Goal

At the end of the project, the game must:

* work in real time
* support 2–6 players
* detect goals correctly
* save match results in the database
* be fully integrated into the web application

---

# Final Note

If this architecture is respected, the project will stay organized and the team will avoid most of the problems that usually appear in multiplayer game projects.
