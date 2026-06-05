*This project has been created as part of the 42 curriculum by youtakhs, hlachhab, yobourai, and aatbir.*

# Rarcade

Rarcade is a full-stack web platform that combines a competitive 2D football game with a social network. Players can register, customize their profiles, connect with friends, chat in real time, and compete in 2D football matches through public lobbies or private rooms. The platform features a matchmaking queue system supporting up to 6 players per match (varying team compositions such as 3v3, 5v1, etc.), in-game communication, and a complete notification system.

## Description

Rarcade delivers an online multiplayer arcade experience built on a client-server architecture. Users start by registering and personalizing their profiles with avatars, then level up by accumulating XP through wins. The social layer includes a friend system with status indicators, real-time one-on-one chat, and a notification center for friend requests, game invites, and unread messages. The competitive layer revolves around a 2D football game rendered on HTML5 Canvas, controlled by keyboard input, with WebSocket-driven server-authoritative physics, scoring (first to 5 goals wins), and up to 6 players per match with varying team compositions. Both public join queues and private invite-only rooms are supported. The entire stack is containerized with Docker and served through Nginx with HTTPS termination and WebSocket proxying.

Key features:
- User authentication and profile management with avatars and progression (XP, level, wins, losses)
- Friend system with online status and last-seen timestamps
- Real-time chat between friends with message history and unread tracking
- Notification system for friend requests, game invites, and unread messages
- Public and private game rooms with queue-based matchmaking
- Team selection supporting varying team compositions (up to 6 players per match)
- Server-authoritative 2D football game with realistic physics and first-to-5-goals win condition
- In-game chat, sound effects, match point indicators, and live ping/FPS metrics
- Responsive UI with a synthwave-styled design system

## Instructions

### Prerequisites

- Docker and Docker Compose
- Node.js and npm (only if running the frontend outside of Docker)
- Git

### Environment Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd trandanince
```

2. Configure the `.env` file at the project root (a `.env.example` is provided):
```env
POSTGRES_DB=dbdb
POSTGRES_HOST=db
POSTGRES_USER=admin
POSTGRES_PASSWORD=changeme
POSTGRES_PORT=5432
DOMAIN_HOST=localhost
FRONTEND_HOST=https://localhost
BACKEND_HOST=https://localhost
VITE_API_URL=
SECRET_KEY=your-secret-key-here
DEBUG=False
```

### Running with Docker Compose

1. Build static files manually for nginx to find
```bash
docker compose run --rm frontend npm run build
```

2. Build and start all services in detached mode:
```bash
docker compose up --build -d
```

3. Create a Django superuser (optional, for admin panel access):
```bash
docker exec -it backend bash
python manage.py createsuperuser
exit
```

4. Run database migrations (Optional, if you changed anything in database structure ):
```bash
docker exec -it backend python manage.py migrate
```

5. Access the application:
- Frontend (via Nginx): `https://localhost` or `http://localhost`
- Backend API: `http://localhost:8000`
- Admin panel: `http://localhost:8000/admin`

6. To stop the stack:
```bash
docker compose down
```

### Running with Makefile (Recommended)

1. Build static files for nginx first
```bash
make static
```

2. Build the containers in detach mode
```bash
make up
```

3. Restart the containers
```bash
make restart
```

3. Stop and remove the containers the containers
```bash
make down
```

4. Clean all cashe and images
```bash
make clean
```

5. More usefull commands
```bash
make #for more commands
```

## Resources

### Documentation and References
- Django: https://docs.djangoproject.com/
- Django REST Framework: https://www.django-rest-framework.org/
- PostgreSQL: https://www.postgresql.org/docs/
- Django Channels: https://channels.readthedocs.io/
- React: https://react.dev/
- Vite: https://vitejs.dev/
- TailwindCSS: https://tailwindcss.com/
- Nginx: https://nginx.org/en/docs/
- Docker Compose: https://docs.docker.com/compose/

### AI Usage

AI tools were used for the following tasks:
- Explaining Django Channels WebSocket consumer patterns and async consumer architecture
- Debugging WebSocket routing and proxy configuration between Nginx and the ASGI server
- Clarifying the physics engine implementation for player-ball and player-player collisions
- Reviewing TailwindCSS class usage and responsive layout patterns in React
- Generating boilerplate for Dockerfile configurations and nginx SSL setup
- Assisting with error handling patterns for real-time notifications and game state synchronization

No AI tool wrote production code directly; all AI outputs were reviewed, adapted, and integrated into the existing architecture by the team.

## Team Information

| Member | Login | Role(s) | Responsibilities |
|--------|-------|---------|------------------|
| youtakhs | youtakhs | Developer, Project Manager | All frontend development including pages, components, context providers, routing, UI/UX, and React integration |
| hlachhab | hlachhab | Product Owner, Technical Lead, Developer | Backend architecture, REST API design, WebSocket infrastructure, chat system, real-time notifications, DevOps |
| yobourai | yobourai | Developer | Game engine physics and logic, WebSocket game consumers, in-game chat integration |
| aatbir | aatbir | Developer | Nginx configuration, HTTPS/SSL setup, reverse proxy routing for static files, APIs, WebSockets, and media |

## Project Management

### Work Organization

The project was organized in sprints with weekly check-ins. The team used a Kanban-style task board on GitHub Projects to track progress across frontend, backend, game logic, and infrastructure work streams. Tasks were broken down by feature, assigned to individual owners, and reviewed through pull requests.

### Tools

- **GitHub**: Version control, issue tracking, pull requests, and project board
- **Docker Compose**: Local orchestration of frontend, backend, database, and reverse proxy
- **Discord**: Daily communication, screen sharing for pair programming, and async discussion

### Communication Channels

- Discord voice and text channels for real-time communication
- GitHub Discussions and issue comments for asynchronous task updates and planning

## Technical Stack

### Frontend
- **React 19** — Component-based UI library
- **Vite 8** — Build tool and dev server
- **TailwindCSS 4** — Utility-first CSS framework for styling
- **React Router DOM 7** — Client-side routing
- **Axios** — HTTP client for REST API requests
- **Plain JavaScript** — No TypeScript was used

The frontend uses a context-based state management pattern (`AuthContext`, `NotificationContext`) to avoid external state libraries. The game canvas is rendered with HTML5 Canvas inside a React wrapper (`GameCanvas.jsx`), with game state managed via custom hooks (`useGameSocket`, `useGameSounds`).

**Justification**: React and TailwindCSS were chosen for rapid UI development and consistent design. Vite provided fast hot module replacement during development. React Router enabled clean multi-page navigation with protected routes. Avoiding a heavy state library kept the bundle small and the learning curve low.

### Backend
- **Django** — Web framework and ORM
- **Django REST Framework** — REST API serialization and viewsets
- **Django Channels** — WebSocket support with an ASGI interface
- **Uvicorn** — ASGI server for Channels
- **PostgreSQL** (via `psycopg2-binary`) — Primary relational database
- **Pillow** — Image processing for user avatars
- **Whitenoise** — Serving static files in production

**Justification**: Django was selected for its mature auth ecosystem, built-in admin panel, and ORM. Channels extends Django to support real-time communication, which is essential for chat and game WebSockets. PostgreSQL was chosen for its reliability, JSON support, and seamless Django integration. Using Uvicorn with Channels allows the same process to serve both HTTP and WebSocket traffic without proxying to a second server.

### Database
- **PostgreSQL** — Relational database for all persistent data

**Justification**: PostgreSQL provides strong ACID compliance, excellent performance for complex queries (friend of friend, matchmaking joins), and native support for Django's ORM. The schema evolved around a single relational graph connecting users, friendships, conversations, game queues, and matches.

### Infrastructure
- **Docker Compose** — Multi-container orchestration (frontend, backend, Nginx, PostgreSQL)
- **Nginx** — Reverse proxy with HTTPS, static file serving, and WebSocket proxying
- **Self-signed SSL/TLS certificates** — HTTPS termination for production-like deployment locally

**Justification**: Docker Compose ensures environments are reproducible. Nginx handles SSL termination, serves the static frontend build with caching headers, and proxies WebSocket upgrades with the correct headers. This architecture mirrors a real-world production deployment.

## Database Schema

### Tables Overview

| Table | Purpose |
|-------|---------|
| `users_user` | Extended user profiles (auth, XP, level, avatar, online status) |
| `users_friendrequest` | Pending/accepted/rejected friend requests |
| `users_conversation` | Chat conversations between two friends |
| `users_message` | Individual chat messages with read status |
| `game_queue` | Matchmaking queues (public or private) |
| `game_gameinvites` | Invitations sent to specific users to join a queue |
| `game_game` | Completed or active game sessions with scores |

### Relationships

- **User** — Self-referential many-to-many via `friends` field
- **FriendRequest** — Foreign keys `from_user` and `to_user` pointing to `User`
- **Conversation** — Many-to-many with `User` through `participants` (always 2 users)
- **Message** — Foreign key to `Conversation` and `User` (sender), ordered by `created_at`
- **Queue** — Foreign key `owner` to `User`; many-to-many `participants`, `team_a`, `team_b`
- **GameInvites** — Foreign keys `inviter`, `invitee`, and `queue`
- **Game** — Foreign key `created_by` to `User`; foreign key `queue` to `Queue`; many-to-many `team_a` and `team_b`; stores final scores and winner

### Key Fields

- **xp** (IntegerField): Experience points used for level progression
- **level** (IntegerField): Computed display level
- **avatar** (ImageField): Stored under `media/avatars/`
- **last_seen** (DateTimeField): Updated automatically on login/profile update
- **status** (CharField on FriendRequest): Tracks pending/accepted/rejected states
- **is_read** (BooleanField on Message): Tracks unread messages for notifications
- **status** (CharField on Queue): Tracks waiting/launched match states
- **type** (CharField on Game): Distinguishes public vs private matches
- **winner_team** (CharField on Game): Stores "left" or "right" when match ends

## Features List

- User Registration & Login — Secure session-based authentication with Django's built-in auth system and CSRF protection
- Profile Management — Edit username, avatar upload with automatic cropping/resizing, and view personal stats (XP, level, wins, losses)
- Avatar Upload — Image upload and processing via Pillow with a default avatar fallback
- XP & Leveling System — Players earn XP from wins and losses; level increases automatically based on XP thresholds
- Friend System — Send, accept, reject, and remove friends; maintain a persistent friends list
- Online Status & Last Seen — Real-time presence indicators showing who is currently online and when users were last active
- One-on-One Chat — Real-time messaging between friends via Django Channels WebSockets with persistent message history
- Unread Message Tracking — Conversation-level unread counts displayed in the notifications sidebar and chat list
- Notification Center — Bell icon sidebar consolidating pending friend requests, game invites, and unread messages
- User Search — Advanced search with username partial matching, XP range filters, and sorting by wins in ascending or descending order
- Public Game Rooms — Browse and join open matchmaking queues where games are automatically created when enough players are present
- Private Game Rooms — Create invite-only matches and send direct game invites to specific friends via the friend list
- Team Selection — Choose preferred team (left or right) before joining a queue; auto-balancing ensures fair team sizes
- 2D Football Game — Canvas-based multiplayer football game with server-authoritative physics, first-to-5-goals win condition, and dynamic player positioning

## Modules

### Major Modules (2 points each)

| Module | Justification | Implementation |
|--------|---------------|----------------|
| Real-Time Features (WebSockets) | Core platform requirement enabling live chat, notifications, and multiplayer gameplay with low latency | Django Channels with `ChatConsumer`, `NotificationConsumer`, and `GameConsumer`; Channels-Redis for group broadcasting and connection lifecycle management |
| User Interaction (Chat, Profile, Friends) | Essential social layer allowing players to connect, communicate, and maintain relationships within the platform | One-on-one chat with WebSocket + REST fallback; profile viewing with public/private routes; friend requests with accept/reject/remove flows and online status indicators |
| User Management & Authentication | Foundational identity system required for all personalized features, progression, and access control | Extended Django `AbstractUser` with XP, level, avatar, and last-seen; secure registration/login with session-based auth and CSRF protection; protected frontend routes via `AuthContext` |
| Complete Web-Based Game | Central gameplay feature delivering the competitive 2D football experience that defines the platform | Canvas-based football game (`GameCanvas.jsx`) with server-authoritative physics engine (`engine.py`); first-to-5-goals win condition, timer, match point detection, and winner overlay with auto-restart logic |
| Remote Players (Real-Time Multiplayer) | Enables users on separate machines to play live matches with synchronized state and responsive controls | WebSocket-driven input synchronization; server-authoritative tick loop broadcasting state at ~60Hz; reconnection handling and graceful disconnect overlays in `GameRoom.jsx` |
| Multiplayer Game (>2 Players) | Supports ensemble competition beyond one-on-one, accommodating up to 6 players per match with varying team compositions (e.g., 3v3, 5v1) | Matchmaking queue system with configurable team assignments (`team_a` / `team_b`); `Game` model many-to-many relationships storing up to 6 total players; consumers broadcast full room state to all connected clients |

### Minor Modules (1 point each)

| Module | Justification | Implementation |
|--------|---------------|----------------|
| Frontend Framework (React) | Provides a component-based architecture for building a reactive, maintainable UI with efficient rendering | React 19 with Vite 8; pages, components, and custom hooks organized under `frontend/src/`; context-based state management for auth and notifications |
| Backend Framework (Django) | Offers a mature, secure foundation for REST APIs, authentication, ORM, and admin tooling out of the box | Django 6 with Django REST Framework; app structure (`users`, `game`, `chat`); URL routing and view logic for all endpoints |
| ORM (Django ORM) | Eliminates raw SQL, provides model relationships, and integrates seamlessly with migrations for schema evolution | Django ORM models in `users/models.py`, `game/models.py`, and `chat/models.py`; PostgreSQL as the database backend with `psycopg2-binary` |
| Advanced Search | Allows users to discover other players with flexible filtering and sorting criteria | `advanced_search` endpoint supporting username partial match, XP range filters (`xp_lt`, `xp_gt`), and ordering by wins with descending flag |

### Point Calculation

- Major modules: 6 × 2 points = 12 points
- Minor modules: 4 × 1 point = 4 points
- **Total**: 16 points

## Individual Contributions

### hlachhab — Product Owner, Technical Lead & Backend Developer / DevOps

- Wrote Docker Compose setup, defining containers (frontend, backend, Nginx, PostgreSQL), inter-service networking, named volumes for database persistence (`db_data`), and bind mounts for live code reloading during development.
- Designed the backend architecture: URL routing, Django app structure, and database schema.
- Implemented the entire REST API (`users/` and `game/` apps): registration, login, profile CRUD, friend system, matchmaking queues, and game lifecycle.
- Built the chat WebSocket infrastructure with `ChatConsumer`, message persistence, and read-status tracking.
- Created the `NotificationConsumer` for real-time friend requests, game invites, and unread message alerts.
- Configured Django REST Framework, CORS, PostgreSQL connection, and media/static file handling.
- Acted as primary code reviewer and technical decision-maker.

### youtakhs (youtakhs) — Frontend Developer & Project Manager

- Designed and implemented the entire React frontend: routing, pages, components, and context providers.
- Built the lobby, profile pages, chat interface, public/private room selection, and game room canvas.
- Integrated TailwindCSS for the synthwave-styled UI with glassmorphic cards and responsive layouts.
- Developed custom hooks: `useGameSocket` for WebSocket game state and `useGameSounds` for audio playback.
- Created `GameCanvas.jsx` to render the arcade game inside a React component.
- Managed the project timeline, coordinated sprints, and facilitated code reviews.

### yobourai — Game Developer

- Built the server-authoritative game engine (`engine.py`) with realistic physics: player movement, ball friction, collision detection (player-player and player-ball), rounded corners, and goal detection.
- Implemented the `GameConsumer` WebSocket consumer for live state broadcasting, input application, and arcade auto-restart logic.
- Integrated in-game chat into the game WebSocket so players can communicate during matches.
- Managed game state transitions: score updates, match point detection, winner announcement.
- Implemented team-based state (team A vs team B) and reset mechanics between rounds.

### aatbir — Nginx & HTTPS Configuration

- Set up Nginx as a reverse proxy on top of the existing Docker Compose infrastructure.
- Configured Nginx with HTTPS (self-signed SSL), HTTP-to-HTTPS redirects, and static/media caching.
- Set up WebSocket proxying for `/ws/` and `/api/` endpoints with correct upgrade headers and timeouts.
- Built and maintained the Nginx Dockerfile and `default.conf` routing configuration.
- Integrated the frontend `dist/` build into Nginx for production serving.
- Verified end-to-end traffic flow: HTTPS → Nginx → backend (HTTP/WebSocket) → PostgreSQL.

## License

This project is part of the 1337 school curriculum and is intended for educational purposes.
