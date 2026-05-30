# Update Notes

This document explains what was changed and added to set up Nginx as a reverse proxy that serves the frontend build and forwards backend traffic.

## Files added

### `nginx/default.conf`
- Nginx server configuration.
- Serves the frontend static build from `/usr/share/nginx/html`.
- Proxies backend routes:
  - `/api/` -> `backend:8000`
  - `/ws/` -> `backend:8000` (WebSocket upgrade headers included)
  - `/admin/` -> `backend:8000`
  - `/static/` -> `backend:8000`
  - `/media/` -> `backend:8000`
- `try_files` fallback to `/index.html` for SPA routing.

### `.env.production`
- Production environment file to ensure `VITE_API_URL` is empty, so the frontend defaults to same-origin when served by Nginx.

## Files changed

### `docker-compose.yaml`
- Added an `nginx` service:
  - Uses `nginx:alpine`.
  - Exposes port `80:80`.
  - Mounts `nginx/default.conf` into the container.
  - Mounts the frontend build output `frontend/dist` into Nginx.
  - Depends on `backend`.

### `frontend/src/api.js`
- Updated API origin selection:
  - Prefer `VITE_API_URL` if set.
  - Otherwise use `window.location.origin` to support same-origin when served by Nginx.
  - Fallback to `http://localhost:8000` for local dev.

### `.gitignore`
- Ignore the frontend build output directory: `frontend/dist/`.

### `README.md`
- Added a short section describing the Nginx reverse proxy setup and the basic commands to build and run it.

## How to use

1) Build the frontend so Nginx can serve it:

```bash
docker compose run --rm frontend npm run build
```

2) Start Nginx, backend, and database:

```bash
docker compose up -d nginx backend db
```

3) Open the app:

- Frontend: `http://localhost`
- Backend API: `http://localhost/api/`

## Notes

- If you keep using the Vite dev server (port 5173), keep `FRONTEND_HOST=http://localhost:5173` in `.env` and do not rely on Nginx for static files.
- If you use Nginx locally, set `FRONTEND_HOST=http://localhost` in `.env` so Django trusts the origin for CSRF and CORS.
