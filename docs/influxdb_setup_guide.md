# InfluxDB v3 / v2.7 Podman Container Setup Guide

This guide describes how to deploy, run, and configure an **InfluxDB** container using **Podman** on a remote Linux server. InfluxDB acts as the time-series storage engine for the Negces Lab Telemetry system, storing high-frequency system metrics (CPU, RAM, GPU, network, disk, and temperatures).

---

## 1. Prerequisites
*   **Podman** installed on the remote Linux server.
*   **Podman-compose** (optional, if running as part of the compose stack).
*   Port **8086** open on the firewall (if accessing the InfluxDB UI externally).

---

## 2. Option A: Standalone InfluxDB Container Deployment

Run this standalone container using Podman command-line tools. This includes a persistent data volume to ensure metrics are not lost when the container is stopped or recreated.

### Step 1: Create a Persistent Podman Volume
```bash
podman volume create influxdb_data
```

### Step 2: Start the InfluxDB Container
Run the following command to pull the official InfluxDB image (v2.7 is standard for local setups) and run it in the background:

```bash
podman run -d \
  --name influxdb \
  -p 8086:8086 \
  -v influxdb_data:/var/lib/influxdb2 \
  -e DOCKER_INFLUXDB_INIT_MODE=setup \
  -e DOCKER_INFLUXDB_INIT_USERNAME=admin \
  -e DOCKER_INFLUXDB_INIT_PASSWORD=SecureAdminPassword123 \
  -e DOCKER_INFLUXDB_INIT_ORG=negceslab-org \
  -e DOCKER_INFLUXDB_INIT_BUCKET=system_metrics \
  -e DOCKER_INFLUXDB_INIT_RETENTION=30d \
  docker.io/library/influxdb:2.7
```

*   `DOCKER_INFLUXDB_INIT_MODE=setup`: Automatically initializes the instance on startup.
*   `DOCKER_INFLUXDB_INIT_RETENTION=30d`: Automatically discards raw data points older than 30 days to protect host disk space.

---

## 3. Option B: Unified Compose Stack (Recommended)

To run InfluxDB alongside MongoDB and your Express backend, add it directly to your `docker-compose.yml` file.

### Step 1: Append InfluxDB Service to `docker-compose.yml`
Open `docker-compose.yml` and add the service and volume:

```yaml
  influxdb:
    image: docker.io/library/influxdb:2.7
    container_name: influxdb
    restart: unless-stopped
    ports:
      - "8086:8086"
    environment:
      - DOCKER_INFLUXDB_INIT_MODE=setup
      - DOCKER_INFLUXDB_INIT_USERNAME=admin
      - DOCKER_INFLUXDB_INIT_PASSWORD=SecureAdminPassword123
      - DOCKER_INFLUXDB_INIT_ORG=negceslab-org
      - DOCKER_INFLUXDB_INIT_BUCKET=system_metrics
    volumes:
      - influxdb_data:/var/lib/influxdb2

volumes:
  mongo_data:
    driver: local
  influxdb_data:
    driver: local
```

### Step 2: Start the Stack
```bash
podman-compose -f docker-compose.yml up -d influxdb
```

---

## 4. Configuring Auto-start on System Boot (Systemd)

To ensure InfluxDB boots automatically if the remote server restarts, register it as a user-level Systemd service:

### Step 1: Generate the Service File
Ensure the container is running, then generate the file:
```bash
podman generate systemd --new --files --name influxdb
```

### Step 2: Move Service to Systemd Config Directory
```bash
mkdir -p ~/.config/systemd/user/
mv container-influxdb.service ~/.config/systemd/user/
```

### Step 3: Enable and Start the Systemd Service
```bash
systemctl --user daemon-reload
systemctl --user enable container-influxdb.service
systemctl --user start container-influxdb.service
```

---

## 5. Fetching the API Token for the Node.js Backend

To allow your Express backend server to write data points to InfluxDB, it requires a secure access token.

### Method 1: Via the Web UI
1.  Navigate to `http://<server-ip>:8086` in your browser.
2.  Log in using the configured username (`admin`) and password.
3.  Go to **Load Data** -> **API Tokens**.
4.  Copy the **Admin Token** (or create a new custom token with write permissions for the `system_metrics` bucket).

### Method 2: Via Container CLI
Run this command on the server to list all active tokens:
```bash
podman exec -it influxdb influx auth list
```

---

## 6. Update Backend Environment (`server/.env`)

Add the retrieved details to your Node.js backend's `.env` configuration file on the remote server:

```env
# InfluxDB Ingestion Config
INFLUXDB_URL="http://localhost:8086"
INFLUXDB_TOKEN="PASTE_YOUR_COPIED_API_TOKEN_HERE"
INFLUXDB_ORG="negceslab-org"
INFLUXDB_BUCKET="system_metrics"
```

After updating the `.env` file, restart your backend server:
```bash
systemctl --user restart container-backend.service
```
