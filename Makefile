.PHONY: help dev prod build-dev build-prod up-dev up-prod down-dev down-prod logs clean build-frontend build-frontend-fresh prod-services setup-env build-backend up-backend down-backend logs-backend build-mongo up-mongo down-mongo logs-mongo build-backend-dev up-backend-dev down-backend-dev up-mongo-dev down-mongo-dev

# Default target
help:
	@echo "Available commands:"
	@echo "  dev          - Start development environment"
	@echo "  prod         - Start production environment"
	@echo "  build-dev    - Build development containers"
	@echo "  build-prod   - Build production containers"
	@echo "  build-frontend - Build frontend and extract to ./client/dist/"
	@echo "  build-frontend-fresh - Build frontend without cache (force rebuild)"
	@echo "  prod-services - Start only backend services (mongo + backend)"
	@echo "  setup-env    - Copy .env.example to .env for client and server"
	@echo ""
	@echo "Individual Service Commands:"
	@echo "  build-backend - Build only backend container"
	@echo "  up-backend   - Start only backend service"
	@echo "  down-backend - Stop only backend service"
	@echo "  logs-backend - Show backend logs"
	@echo "  build-mongo  - Pull/prepare MongoDB container"
	@echo "  up-mongo     - Start only MongoDB service"
	@echo "  down-mongo   - Stop only MongoDB service"
	@echo "  logs-mongo   - Show MongoDB logs"
	@echo ""
	@echo "Development Service Commands:"
	@echo "  build-backend-dev - Build backend container for development"
	@echo "  up-backend-dev   - Start backend service (development)"
	@echo "  down-backend-dev - Stop backend service (development)"
	@echo "  up-mongo-dev     - Start MongoDB service (development)"
	@echo "  down-mongo-dev   - Stop MongoDB service (development)"
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
	@rm -rf ./client/dist
	@mkdir -p ./client/dist
	podman-compose -f docker-compose.prod.yml up --force-recreate frontend-builder
	@echo "Frontend built and extracted to ./client/dist/"
	@echo "Files ready to serve from Apache HTTPD at /negces/ path"

# Build frontend without cache (force rebuild)
build-frontend-fresh:
	@echo "Building frontend without cache and extracting to ./client/dist/..."
	@rm -rf ./client/dist
	@mkdir -p ./client/dist
	podman-compose -f docker-compose.prod.yml build --no-cache frontend-builder
	podman-compose -f docker-compose.prod.yml up frontend-builder
	@echo "Frontend built and extracted to ./client/dist/"
	@echo "Files ready to serve from Apache HTTPD at /negces/ path"

# Start only backend services (mongo + backend)
prod-services:
	@echo "Starting production backend services..."
	podman-compose -f docker-compose.prod.yml up mongo backend -d
	@echo "Services started: MongoDB (port 27018), Backend (port 5001)"

# Setup environment files for first-time use
setup-env:
	@echo "Setting up environment files..."
	@if [ ! -f client/.env ]; then \
		cp client/.env.example client/.env; \
		echo "✅ Created client/.env from example"; \
	else \
		echo "client/.env already exists"; \
	fi
	@if [ ! -f server/.env ]; then \
		cp server/.env.example server/.env; \
		echo "✅ Created server/.env from example"; \
	else \
		echo "server/.env already exists"; \
	fi
	@if [ ! -f server/config/serviceAccountKey.json ]; then \
		echo "⚠️  Firebase service account key not found!"; \
		echo "Please copy your Firebase service account key to:"; \
		echo "   server/config/serviceAccountKey.json"; \
		echo "You can use server/config/serviceAccountKey.json.example as a template"; \
	else \
		echo "✅ Firebase service account key found"; \
	fi
	@echo ""
	@echo "🎯 NEXT STEPS:"
	@echo "1. Edit client/.env with your configuration"
	@echo "2. Edit server/.env with your configuration" 
	@echo "3. Replace environment variables with your actual values"
	@echo "4. Start the build process with: make build-frontend && make prod-services"

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

# Individual Backend Commands (Production)
build-backend:
	@echo "Building backend container..."
	podman-compose -f docker-compose.prod.yml build backend
	@echo "Backend container built successfully"

up-backend:
	@echo "Starting backend service..."
	podman-compose -f docker-compose.prod.yml up backend -d
	@echo "Backend service started"

down-backend:
	@echo "Stopping backend service..."
	podman-compose -f docker-compose.prod.yml stop backend
	podman-compose -f docker-compose.prod.yml rm -f backend
	@echo "Backend service stopped"

logs-backend:
	@echo "Showing backend logs..."
	podman-compose -f docker-compose.prod.yml logs -f backend

# Individual MongoDB Commands (Production)
build-mongo:
	@echo "Preparing MongoDB container..."
	podman-compose -f docker-compose.prod.yml pull mongo
	@echo "MongoDB container ready"

up-mongo:
	@echo "Starting MongoDB service..."
	podman-compose -f docker-compose.prod.yml up mongo -d
	@echo "MongoDB service started (port 27018)"

down-mongo:
	@echo "Stopping MongoDB service..."
	podman-compose -f docker-compose.prod.yml stop mongo
	podman-compose -f docker-compose.prod.yml rm -f mongo
	@echo "MongoDB service stopped"

logs-mongo:
	@echo "Showing MongoDB logs..."
	podman-compose -f docker-compose.prod.yml logs -f mongo

# Individual Backend Commands (Development)
build-backend-dev:
	@echo "Building backend container for development..."
	podman-compose -f podman-compose.yml build backend
	@echo "Backend development container built successfully"

up-backend-dev:
	@echo "Starting backend service (development)..."
	podman-compose -f podman-compose.yml up backend -d
	@echo "Backend development service started"

down-backend-dev:
	@echo "Stopping backend service (development)..."
	podman-compose -f podman-compose.yml stop backend
	podman-compose -f podman-compose.yml rm -f backend
	@echo "Backend development service stopped"

# Individual MongoDB Commands (Development)
up-mongo-dev:
	@echo "Starting MongoDB service (development)..."
	podman-compose -f podman-compose.yml up mongo -d
	@echo "MongoDB development service started (port 27017)"

down-mongo-dev:
	@echo "Stopping MongoDB service (development)..."
	podman-compose -f podman-compose.yml stop mongo
	podman-compose -f podman-compose.yml rm -f mongo
	@echo "MongoDB development service stopped"

# Individual Backend Commands
build-backend:
	@echo "Building backend container..."
	podman-compose -f docker-compose.prod.yml build backend
	@echo "Backend container built successfully"

up-backend:
	@echo "Starting backend service..."
	podman-compose -f docker-compose.prod.yml up backend -d
	@echo "Backend service started"

down-backend:
	@echo "Stopping backend service..."
	podman-compose -f docker-compose.prod.yml stop backend
	podman-compose -f docker-compose.prod.yml rm -f backend
	@echo "Backend service stopped"

logs-backend:
	@echo "Showing backend logs..."
	podman-compose -f docker-compose.prod.yml logs -f backend

# Individual MongoDB Commands  
build-mongo:
	@echo "Preparing MongoDB container..."
	podman-compose -f docker-compose.prod.yml pull mongo
	@echo "MongoDB container ready"

up-mongo:
	@echo "Starting MongoDB service..."
	podman-compose -f docker-compose.prod.yml up mongo -d
	@echo "MongoDB service started (port 27018)"

down-mongo:
	@echo "Stopping MongoDB service..."
	podman-compose -f docker-compose.prod.yml stop mongo
	podman-compose -f docker-compose.prod.yml rm -f mongo
	@echo "MongoDB service stopped"

logs-mongo:
	@echo "Showing MongoDB logs..."
	podman-compose -f docker-compose.prod.yml logs -f mongo

# Development versions (for completeness)
build-backend-dev:
	@echo "Building backend container for development..."
	podman-compose -f podman-compose.yml build backend

up-backend-dev:
	@echo "Starting backend service (development)..."
	podman-compose -f podman-compose.yml up backend -d

down-backend-dev:
	@echo "Stopping backend service (development)..."
	podman-compose -f podman-compose.yml stop backend
	podman-compose -f podman-compose.yml rm -f backend

up-mongo-dev:
	@echo "Starting MongoDB service (development)..."
	podman-compose -f podman-compose.yml up mongo -d

down-mongo-dev:
	@echo "Stopping MongoDB service (development)..."
	podman-compose -f podman-compose.yml stop mongo
	podman-compose -f podman-compose.yml rm -f mongo
