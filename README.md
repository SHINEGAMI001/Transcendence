Transcendence — Complete 14-Point Web Game Plan (50 Days)

> Purpose: This defines the architecture, 14-point module plan, fair task distribution, Git workflow, and 50-day timeline for a Transcendence web game project.




---

1. Project Overview

Project type: Multiplayer web game with AI opponent
Core stack:

Frontend: Web framework (React / Vue)

Backend: Python (FastAPI / Django)

Game / AI: C++ service

Database: PostgreSQL

DevOps: Docker, HTTPS, CI


Goal: Reach 14 module points, ensure fair and visible contribution, and deliver a stable, evaluable project within 50 days.


---

2. High-Level Architecture

[ Browser / Frontend ]
          ↓ HTTP / WebSocket
[ Python Backend (API, Auth, Orchestration) ]
          ↓ Internal API
[ C++ Game / AI Engine ]
          ↓
[ PostgreSQL Database ]

Architecture Rules

Frontend NEVER talks directly to the database

C++ NEVER talks directly to the frontend

Python backend is the ONLY service that:

Handles authentication & users

Communicates with frontend

Communicates with C++ engine

Reads/writes database data




---

3. Module Plan — Exactly 14 Points

Module	Type	Points

Web Frontend Framework	Major	2
Web Backend Framework	Major	2
User Management	Major	2
Real-Time Features	Major	2
AI Opponent (C++)	Major	2
DevOps (Docker, HTTPS, CI)	Major	2
Database / ORM (Advanced DB usage)	Minor	1
Monitoring / Logging	Minor	1


TOTAL = 14 POINTS (VALIDATION SAFE)


---

4. Team Distribution (4 People — Rebalanced & Fair)

Each member has:

A clearly owned module set

Visible, defensible contributions

The ability to explain their work during evaluation



---

👤 Member 1 — DevOps + Database (TAKEN)

Owned modules (3 points total):

DevOps (Major – 2 pts)

Database / ORM (Minor – 1 pt)


Responsibilities:

Dockerfiles (frontend, backend, C++ engine)

docker-compose.yml (networking, volumes)

HTTPS setup (Nginx / reverse proxy)

Environment variables (.env / .env.example)

CI pipeline (GitHub / GitLab CI)

Database service configuration (PostgreSQL)

Database volumes & persistence

ORM integration support (with backend dev)

Logging & health checks

Infrastructure & database sections in README


Expected work areas:

docker-compose.yml

docker/

nginx/

.github/workflows/

database config

README.md (infra + DB)



---

👤 Member 2 — Backend Developer (Python)

Owned modules (6 points total):

Web Backend Framework (Major – 2 pts)

User Management (Major – 2 pts)

Real-Time Features (Major – 2 pts)


Responsibilities:

Python backend (FastAPI / Django)

REST API design

Authentication (JWT / sessions)

User profiles, match history

WebSockets for live gameplay

Backend validation & security

Database models (with ORM)


Expected work areas:

backend/

auth/

websocket/

API logic



---

👤 Member 3 — Frontend Developer

Owned modules (2 points total):

Web Frontend Framework (Major – 2 pts)


Responsibilities:

SPA frontend (React / Vue)

Routing & navigation

API integration

WebSocket client

Game UI & state rendering

Error handling & UX


Expected work areas:

frontend/

components/

pages/

game UI



---

👤 Member 4 — C++ Game / AI Developer

Owned modules (2 points total):

AI Opponent (Major – 2 pts)


Responsibilities:

C++ game engine or AI service

Game loop & rules

AI decision-making

Expose clean API for Python backend

Performance-critical logic


Expected work areas:

engine-cpp/

AI logic

algorithms



---

5. Git Workflow (MANDATORY)

Branch Structure

main        → stable / evaluation branch
 dev        → integration branch
 feature/*  → individual work branches

Rules

❌ No direct commits to main

❌ No direct commits to dev

✅ One task = one feature branch

✅ Pull Requests only → dev



---

Daily Workflow (Every Member)
```bash
git checkout dev
git pull origin dev
git checkout -b feature/short-description
```

Work Cycle

Work

Commit

Push

```bash
git add .
git commit -m "Clear and descriptive commit message"
git push origin feature/short-description
```

Open a Pull Request

Source: feature/short-description

Target: dev



---

Integration Workflow (DevOps / Integrator)

```bash
git checkout dev
git pull origin dev
docker-compose up --build
```

If Stable

```bash
git checkout main
git merge dev
git push origin main
```


---

Repository Structure

```bash
transcendence/
├── docker-compose.yml
├── .env.example
├── frontend/
│   └── Dockerfile
├── backend/
│   └── Dockerfile
├── engine-cpp/
│   └── Dockerfile
├── nginx/
├── .github/workflows/
└── README.md
```


---

50-Day Timeline

Days 1–5 — Planning & Setup

Project planning

Team role assignment

Repository initialization

CI/CD basic setup
```bash
Environment configuration
└── README.md
```


---

7. 50-Day Timeline

Days 1–5 — Planning & Setup

Confirm modules & responsibilities

Create repository & branches

Finalize architecture

Define Git rules



---

Days 6–15 — Core Foundations

Backend skeleton (Python)

Frontend skeleton

C++ service skeleton

Base Docker setup



---

Days 16–30 — Feature Development

Authentication & users

Game logic & AI

WebSockets

Frontend gameplay integration



---

Days 31–40 — Integration & Stability

Python ↔ C++ communication

Backend ↔ database persistence

Frontend ↔ backend integration

Bug fixing & refactoring



---

Days 41–47 — DevOps & Hardening

HTTPS & reverse proxy

CI/CD pipeline

Database persistence & backups

Logging & monitoring



---

Days 48–50 — Finalization

README & documentation

Module explanations

Full system test

Demo rehearsal



---

8. Evaluation Safety Checklist

[ ] 14 points clearly justified

[ ] You own DevOps + Database (3 points)

[ ] Visible commits from all members

[ ] Docker runs with ONE command

[ ] HTTPS enabled

[ ] No secrets in repository

[ ] README complete & accurate

[ ] Each member can explain their part



---

9. Golden Rule

> Every member owns a clear module and can defend it during evaluation.



This distribution avoids under-contribution risks.


---

10. Final Summary

This plan:

Reaches exactly 14 points

Gives you 3 solid points (DevOps + Database)

Uses Python + C++ correctly

Distributes work fairly across 4 people

Fits safely within 50 days.
