# NegcesLab Agent Installer & Service Registry (Windows PowerShell)

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   Negces Lab Agent Production Installer (Windows)     " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

# 1. Require Administrator Permissions
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Error "Please run this script from an Administrator PowerShell prompt."
    Exit
}

$InstallDir = "C:\Program Files\NegcesLab-Agent"
$BinaryName = "NegcesLab.exe"
$BinaryPath = Join-Path $InstallDir $BinaryName

# Prompt for Backend Server URL if not provided
$BackendUrl = Read-Host "Enter NegcesLab Backend Server URL [http://localhost:5000]"
if ([string]::IsNullOrEmpty($BackendUrl)) {
    $BackendUrl = "http://localhost:5000"
}

# Prompt for Target System ID
$SystemId = Read-Host "Enter Target System ID (MongoDB _id from Admin Panel) [leave empty to use OS hostname]"

# Prompt for Server Registration Secret
$RegSecret = Read-Host -AsSecureString "Enter Server Registration Secret Passcode"
$RegSecretText = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($RegSecret))

Write-Host ""
Write-Host "[1/4] Creating installation directory at $InstallDir..."
if (-not (Test-Path $InstallDir)) {
    New-Item -ItemType Directory -Path $InstallDir | Out-Null
}

# Copy Agent Binary & Config template from current folder
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$SourceBinary = Join-Path $ScriptDir "bin\prod\windows\NegcesLab.exe"
if (-not (Test-Path $SourceBinary)) {
    $SourceBinary = Join-Path $ScriptDir "bin\dev\windows\NegcesLab.exe"
}
if (-not (Test-Path $SourceBinary)) {
    $SourceBinary = Join-Path $ScriptDir "bin\windows\NegcesLab.exe"
}
if (-not (Test-Path $SourceBinary)) {
    $SourceBinary = Join-Path $ScriptDir "NegcesLab.exe"
}
if (-not (Test-Path $SourceBinary)) {
    $SourceBinary = Join-Path $ScriptDir "negceslab-agent-windows.exe"
}

if (-not (Test-Path $SourceBinary)) {
    Write-Error "Could not find NegcesLab.exe binary in $ScriptDir."
    Exit
}

Copy-Item $SourceBinary $BinaryPath -Force

# Generate agent_config.json
$WsUrl = $BackendUrl -replace "http", "ws"
$ConfigJson = @{
    backend_url = $BackendUrl
    ws_url = $WsUrl
    poll_interval_sec = 10
    offline_sync_interval_sec = 60
    retry_attempts = 5
    registration_secret = $RegSecretText
} | ConvertTo-Json

Set-Content -Path (Join-Path $InstallDir "agent_config.json") -Value $ConfigJson

Write-Host ""
Write-Host "[2/4] Registering Machine with Backend Server..."
Set-Location $InstallDir

if (-not [string]::IsNullOrEmpty($SystemId)) {
    Write-Host "Registering with target system ID: $SystemId..."
    & $BinaryPath --systemid=$SystemId --secret=$RegSecretText
} else {
    Write-Host "Registering using OS Hostname..."
    & $BinaryPath --register --secret=$RegSecretText
}

Write-Host ""
Write-Host "[3/4] Configuring Machine-Wide HKLM Autostart for All Student Logins..."

# Set HKLM Registry Run Key for all user accounts on this Windows computer
$HklmPath = "HKLM:\Software\Microsoft\Windows\CurrentVersion\Run"
Set-ItemProperty -Path $HklmPath -Name "NegcesLabAgent" -Value "`"$BinaryPath`"" -Force

# Configure Task Scheduler ONLOGON task for Authenticated Users
schtasks /Create /TN "NegcesLabAgent" /TR "`"$BinaryPath`"" /SC ONLOGON /RU "Authenticated Users" /RL HIGHEST /F | Out-Null

Write-Host ""
Write-Host "[4/4] Launching Interactive Agent App..."
Start-Process -FilePath $BinaryPath

Write-Host ""
Write-Host "========================================================" -ForegroundColor Green
Write-Host " [SUCCESS] NegcesLab Agent Installed Successfully!" -ForegroundColor Green
Write-Host " Autostart is configured for ALL USER ACCOUNTS on startup" -ForegroundColor Green
Write-Host " Installation Location: $InstallDir" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
