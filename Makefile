.PHONY: help dev prod build-dev build-prod up-dev up-prod down-dev down-prod logs clean build-frontend prod-services

# Default target
help:
	@echo "Available commands:"
	@echo "  dev          - Start development environment"
	@echo "  prod         - Start production environment"
	@echo "  build-dev    - Build development containers"
	@echo "  build-prod   - Build production containers"
	@echo "  build-frontend - Build frontend and extract to ./client/dist/"
	@echo "  prod-services - Start only backend services (mongo + backend)"
	@echo "  up-dev       - Start development containers"
	@echo "  up-prod      - Start production containers"
	@echo "  down-dev     - Stop development containers"
	@echo "  down-prod    - Stop production containers"
	@echo "  logs         - Show logs for development environment"
	@echo "  logs-prod    - Show logs for production environment"
	@echo "  clean        - Clean up containers and images"

# Development commands
dev: build-dev up-dev

build-dev:
	podman-compose -f podman-compose.yml build

up-dev:
	podman-compose -f podman-compose.yml up -d

down-dev:
	podman-compose -f podman-compose.yml down

logs:
	podman-compose -f podman-compose.yml logs -f

# Production commands
prod: build-prod up-prod

build-prod:
	podman-compose -f docker-compose.prod.yml build

up-prod:
	podman-compose -f docker-compose.prod.yml up mongo backend -d

down-prod:
	podman-compose -f docker-compose.prod.yml down

logs-prod:
	podman-compose -f docker-compose.prod.yml logs -f mongo backend

# Build frontend and extract to host
build-frontend:
	@echo "Building frontend and extracting to ./client/dist/..."
	@mkdir -p ./client/dist
	podman-compose -f docker-compose.prod.yml up frontend-builder
	@echo "Frontend built and extracted to ./client/dist/"
	@echo "Files ready to serve from Apache HTTPD at /negces/ path"

# Start only backend services (mongo + backend)
prod-services:
	@echo "Starting production backend services..."
	podman-compose -f docker-compose.prod.yml up mongo backend -d
	@echo "Services started: MongoDB (port 27018), Backend (port 5001)"

# Cleanup commands
clean:
	@echo "Cleaning up containers..."
	-podman container prune -f
	@echo "Cleaning up images..."
	-podman image prune -f
	@echo "Cleaning up networks..."
	-podman network prune -f

# Health check
health-dev:
	@echo "Checking development services..."
	@curl -f http://localhost:5000/health 2>/dev/null || echo "Backend not responding"
	@curl -f http://localhost:5173 2>/dev/null || echo "Frontend not responding"

health-prod:
	@echo "Checking production services..."
	@echo "Backend (via container network): "
	@podman exec backend-prod wget --no-verbose --tries=1 --spider http://localhost:5000/ 2>/dev/null && echo "✅ Backend responding" || echo "❌ Backend not responding"
