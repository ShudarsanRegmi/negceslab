#!/bin/bash
set -e

echo "========================================================"
echo "    Negces Lab Agent Production Installer (Linux)       "
echo "========================================================"

# Require Root for Systemd Service Installation
if [ "$EUID" -ne 0 ]; then
  echo "[ERROR] Please run installer as root (e.g., sudo ./install.sh)"
  exit 1
fi

INSTALL_DIR="/opt/negceslab-agent"
SERVICE_PATH="/etc/systemd/system/negceslab-agent.service"

# Prompt for Backend Server URL if not passed as env
if [ -z "$BACKEND_URL" ]; then
  read -p "Enter NegcesLab Backend Server URL [http://localhost:5000]: " BACKEND_URL
  BACKEND_URL=${BACKEND_URL:-http://localhost:5000}
fi

# Prompt for Target System ID (MongoDB _id) or Hostname
if [ -z "$SYSTEM_ID" ]; then
  read -p "Enter Target System ID (MongoDB _id from Admin Panel) [leave empty to use OS hostname]: " SYSTEM_ID
fi

# Prompt for Server Registration Secret
if [ -z "$REG_SECRET" ]; then
  read -sp "Enter Server Registration Secret Passcode: " REG_SECRET
  echo ""
fi

echo ""
echo "[1/4] Preparing installation directory: $INSTALL_DIR..."
mkdir -p "$INSTALL_DIR"

# Copy Agent Binary & Configuration
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
if [ -f "$SCRIPT_DIR/bin/negceslab-agent-linux" ]; then
  cp "$SCRIPT_DIR/bin/negceslab-agent-linux" "$INSTALL_DIR/"
elif [ -f "$SCRIPT_DIR/negceslab-agent-linux" ]; then
  cp "$SCRIPT_DIR/negceslab-agent-linux" "$INSTALL_DIR/"
else
  echo "[ERROR] Could not find 'negceslab-agent-linux' binary."
  exit 1
fi

chmod +x "$INSTALL_DIR/negceslab-agent-linux"

# Write agent_config.json
WS_URL=$(echo "$BACKEND_URL" | sed 's/http/ws/')
cat <<EOF > "$INSTALL_DIR/agent_config.json"
{
  "backend_url": "$BACKEND_URL",
  "ws_url": "$WS_URL",
  "poll_interval_sec": 10,
  "offline_sync_interval_sec": 60,
  "retry_attempts": 5,
  "registration_secret": "$REG_SECRET"
}
EOF

echo "[2/4] Registering Machine with Backend Server..."
if [ -n "$SYSTEM_ID" ]; then
  echo "Registering with Target System ID: $SYSTEM_ID..."
  "$INSTALL_DIR/negceslab-agent-linux" --systemid="$SYSTEM_ID" --secret="$REG_SECRET"
else
  echo "Registering using OS Hostname..."
  "$INSTALL_DIR/negceslab-agent-linux" --register --secret="$REG_SECRET"
fi

echo ""
echo "[3/4] Registering Systemd Service for Startup..."
cat <<EOF > "$SERVICE_PATH"
[Unit]
Description=Negces Lab System Agent Daemon & Telemetry Streamer
After=network.target network-online.target
Wants=network-online.target

[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_DIR
ExecStart=$INSTALL_DIR/negceslab-agent-linux
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable negceslab-agent.service
systemctl restart negceslab-agent.service

echo ""
echo "[4/4] Installation Verification:"
systemctl status negceslab-agent.service --no-pager

echo ""
echo "========================================================"
echo " [SUCCESS] NegcesLab Agent Installed & Running!"
echo " Service Status: Active & Enabled on Startup"
echo " Installation Location: $INSTALL_DIR"
echo "========================================================"
