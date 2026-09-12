@echo off
:: Self-elevate to Administrator mode if not elevated
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Requesting Administrator permissions...
    powershell -Command "Start-Process '%~0' -Verb RunAs"
    exit /b
)

:: Run PowerShell automated installer script
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1"
pause
