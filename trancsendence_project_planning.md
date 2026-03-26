# ft_transcendence – Full Project Planning & Team Responsibilities

This document is the **main planning file for the entire project**. It combines:

* Full project architecture
* Detailed module planning (with points)
* Clear team roles
* Responsibilities for each member during the whole project
* How the modules connect to each team member

This README must be read by the entire team before starting development.

---

# 1. Project Goal

The goal of this project is to build a **real-time multiplayer web game platform** using a modern full‑stack architecture.

The application must allow users to:

* Register and log in securely
* Play a real-time multiplayer game in the browser
* View match history
* Interact with other users
* Use the platform as a real production web application

---

# 2. Final Technology Stack

## Frontend

* React (Vite)
* JavaScript
* Tailwind CSS
* React Router
* Canvas for the game
* WebSocket client (browser WebSocket API)

## Backend

* Django
* Django REST Framework
* Django Channels (for WebSockets)

## Database

* PostgreSQL

## DevOps / Deployment

* Docker
* Docker Compose
* Nginx (reverse proxy + HTTPS)
* Environment variables (.env)

---

# 3. High-Level Architecture

```
User Browser
     |
     | HTTPS
     |
Nginx (Reverse Proxy)
     |
     |-----------------------------|
     |                             |
React Frontend                Django Backend (API)
     |                             |
     |------ WebSocket (WSS) ------|
     |
PostgreSQL Database
```

---

# 4. Module Planning (With Points)

We are targeting **15+ points** to guarantee validation.

---

## MODULE GROUP 1 – Web Technologies (6 Points)

### Module 1 – Frontend Framework (React) → 1 point

This means the entire UI must be built using React components.

### Module 2 – Backend Framework (Django) → 1 point

All backend logic must be implemented using Django.

### Module 3 – Real-Time Features (WebSockets) → 2 points

Players must be able to play in real time using WebSocket communication.

### Module 4 – User Interaction Features → 2 points

Users must have profiles and match history.

**Subtotal: 6 Points**

---

## MODULE GROUP 2 – Gaming Features (5 Points)

### Module 5 – Web-Based Multiplayer Game → 2 points

A real game must be playable inside the browser.

### Module 6 – Remote Players (Real-Time Multiplayer) → 2 points

Two players must play from different browsers in real time.

### Module 7 – Tournament System → 1 point

Users must be able to play multiple matches and a winner must be determined.

**Subtotal: 5 Points**

---

## MODULE GROUP 3 – User Management (2 Points)

### Module 8 – Standard User Management → 2 points

Includes registration, login, profile, and secure authentication.

**Subtotal: 2 Points**

---

## Extra Safety Module (Optional but Recommended)

Choose one:

* Leaderboard → 1 point
* Game statistics → 1 point
* Real-time chat → 1 point

---

## Final Points Calculation

6 (Web) + 5 (Game) + 2 (User Management) = **13 Points**

* 1 Extra Module = **14 Points (Guaranteed Pass)**

---

# 5. Team Structure and Responsibilities

We are 4 team members. Each person has a **main responsibility**, but everyone contributes to the full project.

---

## DevOps / Technical Architect – Member 1

Main role: Architecture + Backend foundation + Project coordination

Responsibilities during the whole project:

* Define project structure
* Setup Docker
* Setup Django project
* Configure PostgreSQL
* Define database models
* Code reviews
* Coordinate integration between teammates

Modules mainly owned:

* Backend Framework (1 point)
* User Management (2 points)

---

## Frontend Developer – Member 2

Main role: React application + User Interface

Responsibilities during the whole project:

* Build all frontend pages
* Implement UI components
* Build the game interface
* Connect frontend with backend APIs
* Connect frontend with WebSockets

Modules mainly owned:

* Frontend Framework (1 point)
* User Interaction Features (2 points)

---

## Game Developer / Backend – Member 3

Main role: Game engine + Game logic

Responsibilities during the whole project:

* Build the full local game first
* Implement ball movement
* Implement paddle movement
* Implement collision detection
* Implement score system
* Implement winner detection
* Help integrate game with multiplayer

Modules mainly owned:

* Web-Based Multiplayer Game (2 points)
* Tournament logic support (1 point)

---

## Real-Time / Multiplayer Developer / Backend – Member 4

Main role: WebSockets + Multiplayer synchronization

Responsibilities during the whole project:

* Implement WebSocket server (Django Channels)
* Synchronize game state between players
* Handle real-time game communication
* Implement multiplayer match system
* Integrate multiplayer with game engine

Modules mainly owned:

* Real-Time Features (2 points)
* Remote Players (2 points)

---

# 6. Full Project Development Plan

The project will be built in structured phases.

---

## Phase 1 – Project Setup

* Repository creation
* Docker setup
* Backend setup
* Frontend setup
* Database setup

---

## Phase 2 – Authentication System

* User model
* Register/login system
* Basic profile

---

## Phase 3 – Game Development (Local Version)

* Build game logic locally
* Test game mechanics
* Create game UI

---

## Phase 4 – Real-Time Multiplayer

* Implement WebSockets
* Connect two players
* Synchronize game state

---

## Phase 5 – Database Integration

* Store matches
* Store match history
* Store game results

---

## Phase 6 – Tournament System

* Multiple matches
* Tournament logic
* Winner determination

---

## Phase 7 – Extra Module + Final Improvements

* Add leaderboard or statistics
* UI improvements
* Bug fixing
* Testing

---

# 7. Final Goal of This Project

This project is not only for validation.

The goal is to prove that we can:

* Build a real full‑stack web application
* Work as a real development team
* Implement real‑time multiplayer systems
* Design a clean and scalable architecture

---
