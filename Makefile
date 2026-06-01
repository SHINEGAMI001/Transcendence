.PHONY: help build up start stop restart down logs clean static

help:
	@echo "Rarcade Project - Available Commands"
	@echo "===================================="
	@echo "  make static         - Build frontend static files (npm install + build)"
	@echo "  make build          - Build all Docker images"
	@echo "  make up             - Start all services (with build if needed)"
	@echo "  make start          - Start all services (no rebuild)"
	@echo "  make stop           - Stop all services"
	@echo "  make restart        - Restart all services"
	@echo "  make down           - Stop and remove containers"
	@echo "  make logs           - View live logs from all services"
	@echo "  make clean          - Remove containers, volumes, and build cache"
	@echo "  make migrate        - Run Django database migrations"
	@echo "  make superuser      - Create Django superuser"

static:
	@echo "Building frontend static files..."
	cd frontend && npm install && npm run build && cd ..
	@echo "✓ Frontend static files built successfully"

build: static
	docker compose build

up:
	docker compose up --build -d
	@echo "✓ All services are running"

start:
	docker compose up -d
	@echo "✓ All services are running"

stop:
	docker compose stop
	@echo "✓ All services stopped"

restart: stop start
	@echo "✓ All services restarted"

down:
	docker compose down
	@echo "✓ All services stopped and removed"

logs:
	docker compose logs -f

clean:
	docker compose down -v
	docker system prune -f
	@echo "✓ Cleaned up containers and volumes"

migrate:
	docker exec backend python manage.py migrate
	@echo "✓ Migrations completed"

superuser:
	docker exec -it backend python manage.py createsuperuser

# Quick command: make all (build, start, migrate)
.PHONY: all
all: build up migrate
	@echo "✓ Project setup complete!"
