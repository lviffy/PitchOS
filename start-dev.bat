@echo off
setlocal enabledelayedexpansion

echo ==================================================
echo 🚀 Booting PitchOS Monorepo Dev Environment...
echo ==================================================

:: 1. Check if bun is installed
where bun >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ bun is not installed or not in PATH. Please install Bun first.
    exit /b 1
)

:: 2. Check if pear is installed
where pear >nul 2>nul
if %errorlevel% neq 0 (
    echo ⚠️ 'pear' command not found in PATH. Please ensure 'npm i -g pear' has been run.
)

:: 3. Start dev servers in background
echo 🟢 Starting Next.js frontend, next-app backend, and signaling relay in background...
start "PitchOS Client" /B bun run dev:client
start "PitchOS Relay" /B bun run dev:relay
start "PitchOS NextApp" /B bun run dev:next-app

echo ⏳ Waiting for port 3000 to become available...
:wait_loop
powershell -NoProfile -Command "try { $response = Invoke-WebRequest -Uri http://localhost:3000 -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop; exit 0 } catch { exit 1 }" >nul 2>&1
if %errorlevel% neq 0 (
    timeout /t 1 /nobreak >nul
    goto wait_loop
)

echo ==================================================
echo 🖥️ Launching Pear Desktop Application Shell...
echo ==================================================

:: Run Pear desktop app
call pear run ./apps/pear-desktop

echo.
echo Dev environment shutdown.
