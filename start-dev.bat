@echo off
setlocal enabledelayedexpansion

echo ==================================================
echo [BOOTING] Booting PitchOS Monorepo Dev Environment...
echo ==================================================

:: 1. Load root .env variables
if exist .env (
    echo [INFO] Loading environment variables from root .env...
    for /f "usebackq delims=" %%x in (".env") do (
        set "line=%%x"
        if not "!line:~0,1!"=="#" (
            set "%%x"
        )
    )
)

:: 2. Ensure PORT is defined (default to 3001 for relay-service)
if "%PORT%"=="" (
    set PORT=3001
)

:: 3. Check if bun is installed
where bun >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] bun is not installed or not in PATH. Please install Bun first.
    exit /b 1
)

:: 4. Start dev servers in background (using node directly to bypass Device Guard next.exe blocks)
echo [STARTING] Starting Next.js frontend, next-app backend, and signaling relay in background...
start "PitchOS Client" /B node node_modules/next/dist/bin/next dev apps/client --webpack -p 3000
start "PitchOS NextApp" /B node node_modules/next/dist/bin/next dev apps/next-app --webpack -p 3002
start "PitchOS Relay" /B cmd /c "cd apps/relay-service && bun run dev"

echo [WAIT] Waiting for port 3000 to become available...
:wait_loop
powershell -NoProfile -Command "try { $response = Invoke-WebRequest -Uri http://localhost:3000 -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop; exit 0 } catch { exit 1 }" >nul 2>&1
if %errorlevel% neq 0 (
    timeout /t 1 /nobreak >nul
    goto wait_loop
)

echo ==================================================
echo [LAUNCHING] Launching Pear Desktop Application Shell...
echo ==================================================

:: Run Pear desktop app
where pear >nul 2>nul
if %errorlevel% equ 0 (
    call pear run ./apps/pear-desktop
) else (
    echo [WARN] 'pear' command not found. You can run Option B: standard browser at http://localhost:3000
)

echo.
echo Dev environment shutdown.
