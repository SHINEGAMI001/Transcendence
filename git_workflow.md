# Git Workflow

This Document focuses on The team workflow (Git structure, branches, and collaboration rules)

---

To avoid conflicts and confusion, the team must follow a clear workflow during development.

---

## 1. Branch Structure

We will use the following Git structure:

main → stable version of the project

feature branches:

* feature/frontend-auth
* feature/backend-auth
* feature/game-engine
* feature/websocket-system
* feature/match-history
* feature/tournament-system

No one pushes directly to main.

---

## 2. Feature Development Process

Every feature must follow these steps:

Step 1: Create a new branch from main
Step 2: Implement the feature
Step 3: Test locally
Step 4: Push the branch
Step 5: Open a pull request
Step 6: Code review by the team leader
Step 7: Merge into main

---

## 3. Commit Message Rules

Commit messages must be short and clear.

### Examples

* add login API
* implement game loop
* add WebSocket connection
* fix score bug
* add match history endpoint

---

## 4. Responsibilities During Development

### Team Leader

* Reviews pull requests
* Makes sure the architecture is respected
* Prevents merge conflicts

### Frontend Developer

* Works only inside frontend feature branches

### Game Developer

* Works inside the game-engine branch

### Real-Time Developer

* Works inside the websocket-system branch

---

 Git Workflow (MANDATORY)

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