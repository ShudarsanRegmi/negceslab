#!/bin/bash
# NEGCES Lab - Start Local Jenkins Controller Container

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "======================================================"
echo " 🚀 NEGCES Lab - Starting Local Jenkins Controller"
echo "======================================================"

# Check Docker installation
if ! command -v docker >/dev/null 2>&1; then
    echo "[ERROR] Docker is not installed. Please install Docker to run Jenkins."
    exit 1
fi

# Start Jenkins container
echo "Starting Jenkins container via Docker Compose..."
docker compose -f docker-compose.jenkins.yml up -d

echo ""
echo "[INFO] Jenkins Controller is starting in background."
echo "[INFO] Access Web UI at: http://localhost:8080"
echo ""
echo "To get the initial Admin Setup Password, run:"
echo "  docker exec negceslab-jenkins cat /var/jenkins_home/secrets/initialAdminPassword"
echo ""
echo "To view Jenkins logs, run:"
echo "  docker compose -f docker-compose.jenkins.yml logs -f"
