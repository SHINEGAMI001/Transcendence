# Docker Compose — Complete Ready-to-Use Cheat Sheet

> Works with modern `docker compose` (Docker CLI plugin)

---

# Full Production-Ready Example

```yaml
version: "3.9"

services:
  app:
    image: nginx:1.25-alpine
    container_name: app
    build:
      context: .
      dockerfile: Dockerfile
      args:
        APP_ENV: production

    ports:
      - "8080:80"
    expose:
      - "3000"

    volumes:
      - ./app:/usr/share/nginx/html
      - app_data:/data
      - type: bind
        source: ./logs
        target: /var/log/nginx

    environment:
      APP_ENV: production
      DEBUG: "false"

    env_file:
      - .env

    command: ["nginx", "-g", "daemon off;"]
    working_dir: /app

    depends_on:
      db:
        condition: service_healthy

    networks:
      - frontend
      - backend

    restart: unless-stopped
    user: "1000:1000"

    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s

    mem_limit: 512m
    cpus: 0.5

    stdin_open: true
    tty: true

  db:
    image: postgres:15-alpine
    container_name: postgres
    restart: always

    environment:
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: password
      POSTGRES_DB: appdb

    volumes:
      - db_data:/var/lib/postgresql/data

    networks:
      - backend

    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U admin"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  app_data:
  db_data:

networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
```

---

# Core Commands

## Start / Stop

```bash
docker compose up
docker compose up -d
docker compose down
docker compose down -v
docker compose stop
docker compose start
docker compose restart
```

## Build

```bash
docker compose build
docker compose build --no-cache
docker compose up --build
```

## Logs

```bash
docker compose logs
docker compose logs -f
docker compose logs app
```

## Exec Into Container

```bash
docker compose exec app bash
docker compose exec db psql -U admin
```

## Status & Debugging

```bash
docker compose ps
docker compose config
docker compose top
docker compose images
docker compose events
```

## Scaling

```bash
docker compose up --scale app=3
```

## Multiple Compose Files

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

# Networking

```yaml
ports:
  - "8080:80"
  - "127.0.0.1:3306:3306"

expose:
  - "3000"

networks:
  - frontend
  - backend

networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
```

---

# Volumes

```yaml
volumes:
  - ./local:/container/path
  - named_volume:/data
  - /host/path:/container/path:ro
  - type: bind
    source: ./data
    target: /app/data

volumes:
  named_volume:
    driver: local
```

---

# Environment Variables

```yaml
environment:
  KEY: value
  DEBUG: "true"

env_file:
  - .env
```

### `.env` Example

```
POSTGRES_USER=admin
POSTGRES_PASSWORD=strongpassword
POSTGRES_DB=appdb
APP_ENV=production
```

---

# Restart Policies

```yaml
restart: "no"
restart: always
restart: on-failure
restart: unless-stopped
```

---

# Healthchecks & Dependencies

```yaml
depends_on:
  db:
    condition: service_healthy

healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost"]
  interval: 30s
  timeout: 10s
  retries: 5
  start_period: 10s
```

---

# Deploy (Docker Swarm Only)

```yaml
deploy:
  replicas: 3
  restart_policy:
    condition: on-failure
  resources:
    limits:
      cpus: "0.50"
      memory: 512M
    reservations:
      memory: 256M
```

---

# Security & Permissions

```yaml
user: "1000:1000"
privileged: true
read_only: true
cap_add:
  - NET_ADMIN
cap_drop:
  - ALL
```

---

# Labels

```yaml
labels:
  traefik.enable: "true"
  com.example.description: "Example Service"
```

---

# Cleanup

```bash
docker compose down --rmi all
docker compose rm
docker volume prune
docker network prune
docker system prune -a
```

---

# Override Order

1. docker-compose.yml
2. docker-compose.override.yml
3. Additional `-f` files
4. `.env`
5. CLI flags

---

# Best Practices

* Do NOT use `latest` in production
* Always define a restart policy
* Use named volumes for databases
* Use healthchecks
* Separate dev and prod configs
* Keep secrets out of git
* Use `.dockerignore`
* Validate config with:

```bash
docker compose config
```

---

# Fast Dev Workflow

```bash
docker compose up --build -d && docker compose logs -f
```

---

# Minimal Production Template

```yaml
services:
  app:
    build: .
    restart: unless-stopped
    ports:
      - "80:3000"
    env_file:
      - .env
    depends_on:
      - db

  db:
    image: postgres:15-alpine
    restart: unless-stopped
    volumes:
      - db_data:/var/lib/postgresql/data

volumes:
  db_data:
```

---

**END OF FILE**
