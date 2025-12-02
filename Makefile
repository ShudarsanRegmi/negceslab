.PHONY: help dev prod build-dev build-prod up-dev up-prod down-dev down-prod logs clean build-frontend build-frontend-fresh prod-services setup-env build-backend up-backend down-backend logs-backend build-mongo up-mongo down-mongo logs-mongo build-backend-dev up-backend-dev down-backend-dev up-mongo-dev down-mongo-dev systemd-install systemd-enable systemd-start systemd-stop systemd-restart systemd-status systemd-logs systemd-logs-mongodb systemd-logs-backend systemd-update-backend systemd-uninstall

# Default target
help:
	@echo "Available commands:"
	@echo ""
	@echo "Frontend:"
	@echo "  build-frontend       - Build frontend and extract to ./client/dist/"
	@echo "  build-frontend-fresh - Build frontend without cache (force rebuild)"
	@echo ""
	@echo "Backend Services:"
	@echo "  build-backend - Build only backend container"
	@echo "  up-backend    - Start only backend service"
	@echo "  down-backend  - Stop only backend service"
	@echo "  logs-backend  - Show backend logs"
	@echo ""
	@echo "MongoDB Services:"
	@echo "  build-mongo  - Pull/prepare MongoDB container"
	@echo "  up-mongo     - Start only MongoDB service"
	@echo "  down-mongo   - Stop only MongoDB service"
	@echo "  logs-mongo   - Show MongoDB logs"
	@echo ""
	@echo "Systemd Services:"
	@echo "  systemd-install        - Install systemd services"
	@echo "  systemd-enable         - Enable systemd services"
	@echo "  systemd-start          - Start systemd services"
	@echo "  systemd-stop           - Stop systemd services"
	@echo "  systemd-restart        - Restart systemd services"
	@echo "  systemd-status         - Show systemd services status"
	@echo "  systemd-logs           - Show systemd services logs"
	@echo "  systemd-logs-mongodb   - Show MongoDB logs"
	@echo "  systemd-logs-backend   - Show backend logs"
	@echo "  systemd-update-backend - Update backend after rebuild"
	@echo "  systemd-uninstall      - Uninstall systemd services"
	@echo ""
	@echo "Setup & Utils:"
	@echo "  setup-env - Setup environment files from examples"
	@echo "  health    - Check service health"
	@echo "  clean     - Clean up containers and images"

# Build frontend and extract to host
build-frontend:
	@echo "Building frontend and extracting to ./client/dist/..."
	@rm -rf ./client/dist
	@mkdir -p ./client/dist
	podman-compose -f docker-compose.yml up --force-recreate frontend-builder
	@echo "Frontend built and extracted to ./client/dist/"
	@echo "Files ready to serve from Apache HTTPD at /negces/ path"

# Build frontend without cache (force rebuild)
build-frontend-fresh:
	@echo "Building frontend without cache and extracting to ./client/dist/..."
	@rm -rf ./client/dist
	@mkdir -p ./client/dist
	@echo "Cleaning up existing frontend-builder containers and images..."
	-podman rm -f frontend-builder 2>/dev/null || true
	-podman rmi $$(podman images -q "*frontend-builder*") 2>/dev/null || true
	podman-compose -f docker-compose.yml build --no-cache frontend-builder
	podman-compose -f docker-compose.yml up --force-recreate frontend-builder
	@echo "Frontend built and extracted to ./client/dist/"
	@echo "Files ready to serve from Apache HTTPD at /negces/ path"


# Setup environment files for first-time use
setup-env:
	@echo "Setting up environment files..."
	@echo ""
	@if [ ! -f client/.env ]; then \
		cp client/.env.example client/.env; \
		echo "Created client/.env from example"; \
	else \
		echo "client/.env already exists"; \
	fi
	@if [ ! -f server/.env ]; then \
		cp server/.env.example server/.env; \
		echo "Created server/.env from example"; \
	else \
		echo "server/.env already exists"; \
	fi
	@if [ ! -f server/config/serviceAccountKey.json ]; then \
		if [ -f server/config/serviceAccountKey.json.example ]; then \
			cp server/config/serviceAccountKey.json.example server/config/serviceAccountKey.json; \
			echo "Created serviceAccountKey.json from example"; \
		else \
			echo " serviceAccountKey.json.example not found!"; \
		fi \
	else \
		echo "serviceAccountKey.json already exists"; \
	fi
	@echo ""
	@echo "NEXT STEPS:"
	@echo "1. Edit client/.env with your Firebase and API configuration"
	@echo "2. Edit server/.env with your MongoDB and JWT configuration"
	@echo "3. Edit server/config/serviceAccountKey.json with your actual Firebase service account"
	@echo "4. Run: make build-frontend && make up-mongo && make up-backend"

# Cleanup commands
clean:
	@echo "Cleaning up containers..."
	-podman container prune -f
	@echo "Cleaning up images..."
	-podman image prune -f
	@echo "Cleaning up networks..."
	-podman network prune -f

# Health check
health:
	@echo "Checking production services..."
	@echo "Backend (via container network): "
	@podman exec backend-prod wget --no-verbose --tries=1 --spider http://localhost:5000/ 2>/dev/null && echo "✅ Backend responding" || echo "❌ Backend not responding"

# Individual Backend Commands
build-backend:
	@echo "Building backend container..."
	podman-compose -f docker-compose.yml build backend
	@echo "Backend container built successfully"

up-backend:
	@echo "Starting backend service..."
	podman-compose -f docker-compose.yml up backend -d
	@echo "Backend service started"

down-backend:
	@echo "Stopping backend service..."
	podman-compose -f docker-compose.yml stop backend
	podman rm -f backend
	@echo "Backend service stopped"

logs-backend:
	@echo "Showing backend logs..."
	podman-compose -f docker-compose.yml logs -f backend

# Individual MongoDB Commands
build-mongo:
	@echo "Preparing MongoDB container..."
	podman-compose -f docker-compose.yml pull mongo
	@echo "MongoDB container ready"

up-mongo:
	@echo "Starting MongoDB service..."
	podman-compose -f docker-compose.yml --env-file server/.env up mongo -d
	@echo "MongoDB service started (port 27018)"

down-mongo:
	@echo "Stopping MongoDB service..."
	podman-compose -f docker-compose.yml stop mongo
	podman rm -f mongodb
	@echo "MongoDB service stopped"

logs-mongo:
	@echo "Showing MongoDB logs..."
	podman-compose -f docker-compose.yml logs -f mongo

# Systemd Service Commands
systemd-install:
	@echo "Installing systemd services..."
	@mkdir -p ~/.config/systemd/user
	@cp systemd/negces-mongodb.service ~/.config/systemd/user/
	@cp systemd/negces-backend.service ~/.config/systemd/user/
	@cp systemd/negces-stack.service ~/.config/systemd/user/
	@systemctl --user daemon-reload
	@echo "Systemd services installed successfully!"

systemd-enable:
	@echo "Enabling systemd services..."
	@systemctl --user enable negces-mongodb.service
	@systemctl --user enable negces-backend.service
	@systemctl --user enable negces-stack.service
	@echo "Systemd services enabled!"

systemd-start:
	@echo "Starting systemd services..."
	@systemctl --user start negces-stack.service
	@echo "Systemd services started!"

systemd-stop:
	@echo "Stopping systemd services..."
	@systemctl --user stop negces-backend.service negces-mongodb.service
	@echo "Systemd services stopped!"

systemd-restart:
	@echo "Restarting systemd services..."
	@systemctl --user restart negces-mongodb.service
	@sleep 5
	@systemctl --user restart negces-backend.service
	@echo "Systemd services restarted!"

systemd-status:
	@echo "=== NegCES Services Status ==="
	@systemctl --user status negces-mongodb.service --no-pager || true
	@echo ""
	@systemctl --user status negces-backend.service --no-pager || true

systemd-logs:
	@echo "Showing systemd services logs..."
	@journalctl --user -u negces-mongodb.service -u negces-backend.service -f

systemd-logs-mongodb:
	@echo "Showing MongoDB logs..."
	@journalctl --user -u negces-mongodb.service -f

systemd-logs-backend:
	@echo "Showing backend logs..."
	@journalctl --user -u negces-backend.service -f

systemd-update-backend:
	@echo "Updating backend after rebuild..."
	@systemctl --user stop negces-backend.service
	@podman rm -f backend 2>/dev/null || true
	@systemctl --user start negces-backend.service
	@echo "Backend updated successfully!"

systemd-uninstall:
	@echo "Uninstalling systemd services..."
	@systemctl --user stop negces-backend.service negces-mongodb.service 2>/dev/null || true
	@systemctl --user disable negces-mongodb.service negces-backend.service negces-stack.service 2>/dev/null || true
	@rm -f ~/.config/systemd/user/negces-mongodb.service
	@rm -f ~/.config/systemd/user/negces-backend.service
	@rm -f ~/.config/systemd/user/negces-stack.service
	@systemctl --user daemon-reload
	@echo "Systemd services uninstalled!"


