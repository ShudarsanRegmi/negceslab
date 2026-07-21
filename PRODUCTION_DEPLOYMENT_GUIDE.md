# Negces Lab — Automated Agent Installer & Systemd/Windows Service Setup Guide

This guide describes how to install and automatically register the **Negces Lab Agent Daemon** across lab computers on **Linux** and **Windows**.

Instead of manually editing JSON files or manually writing systemd unit files, automated installer scripts (`install.sh` for Linux and `install.ps1` for Windows) perform the complete setup, register with the backend using the system's MongoDB `systemId` or `hostname`, and register the agent daemon to start automatically on system boot.

---

## 1. System ID Registration Model

Every computer created or configured in the **Admin Panel** has a unique 24-character MongoDB ID (`systemId`), for example: `691fe35ec53cad8661a2a918`.

When installing an agent on a machine:
1. The installer prompts for the **Target System ID** (obtained from the Admin Panel).
2. The agent queries the backend API (`POST /api/agent/register`) using this `systemId`.
3. The server resolves the exact **System Name** (e.g. `System1`, `System2`) from MongoDB, saves the hardware specifications, and returns the machine's authentication token.
4. The agent caches `machineId` and `authToken` locally in `/opt/negceslab-agent/agent_db.json`.

---

## 2. Linux Automated Installation (`install.sh`)

### Automated Setup Steps
1. Copy the `agent` folder (or binary) to the target Linux PC.
2. Open a terminal and run the installer script with root privileges:

```bash
sudo ./agent/install.sh
```

### What the Installer Does Automatically:
1. **Prompts for Backend Server URL:** (e.g. `http://192.168.1.100:5000`)
2. **Prompts for Target System ID:** Enter `691fe35ec53cad8661a2a918` (or hit Enter to fall back to OS hostname).
3. **Creates System Directory:** Copies the compiled binary to `/opt/negceslab-agent/` and writes `agent_config.json`.
4. **Performs Initial Server Registration:** Executes `./negceslab-agent-linux --systemid=691fe35ec53cad8661a2a918` to retrieve the System Name and cache auth credentials.
5. **Registers Systemd Service:** Generates `/etc/systemd/system/negceslab-agent.service`, enables it for system startup, and starts the service daemon immediately.

---

## 3. Windows Automated Installation (`install.ps1`)

### Automated Setup Steps
1. Copy the `agent` folder to the target Windows PC.
2. Open **PowerShell as Administrator** and execute:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force
.\agent\install.ps1
```

### What the PowerShell Installer Does Automatically:
1. **Prompts for Backend Server URL:** (e.g. `http://192.168.1.100:5000`).
2. **Prompts for Target System ID:** Enter the 24-character MongoDB `systemId`.
3. **Creates Program Files Directory:** Copies `negceslab-agent-windows.exe` to `C:\Program Files\NegcesLab-Agent\` and generates `agent_config.json`.
4. **Executes Registration:** Queries the server to fetch the machine name and store auth credentials in `agent_db.json`.
5. **Registers Windows Service:** Calls `New-Service` to register **Negces Lab Agent Telemetry** as an automatic Windows Service and starts it immediately.

---

## 4. Unattended Headless Installation Commands

If deploying via Ansible, SSH, or IT deployment scripts, pass environment variables directly:

### Linux Non-Interactive Setup:
```bash
sudo BACKEND_URL="http://192.168.1.100:5000" SYSTEM_ID="691fe35ec53cad8661a2a918" ./agent/install.sh
```

---

## 5. Verification & Service Operations

### Linux Service Commands:
```bash
# Check service status
sudo systemctl status negceslab-agent

# Restart agent service
sudo systemctl restart negceslab-agent
```

### Windows Service Commands:
```powershell
# Check service status
Get-Service NegcesLabAgent

# Restart agent service
Restart-Service NegcesLabAgent
```
