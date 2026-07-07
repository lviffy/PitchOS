
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "🚀 Booting PitchOS Monorepo Dev Environment..." -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# 1. Check if bun is installed
if (-not (Get-Command bun -ErrorAction SilentlyContinue)) {
    Write-Error "❌ bun is not installed or not in PATH. Please install Bun first."
    exit 1
}

# 2. Check if pear is installed
if (-not (Get-Command pear -ErrorAction SilentlyContinue)) {
    Write-Warning "⚠️ 'pear' command not found in PATH. Please ensure 'npm i -g pear' has been run."
}

# 3. Start dev servers in background
Write-Host "🟢 Starting Next.js frontend, next-app backend, and signaling relay in background..." -ForegroundColor Green
$clientProcess = Start-Process bun -ArgumentList "run dev:client" -NoNewWindow -PassThru
$relayProcess = Start-Process bun -ArgumentList "run dev:relay" -NoNewWindow -PassThru
$nextAppProcess = Start-Process bun -ArgumentList "run dev:next-app" -NoNewWindow -PassThru

# Register cleanup on exit
Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action {
    Write-Host "🛑 Shutting down dev servers..." -ForegroundColor Yellow
    Stop-Process -Id $clientProcess.Id -Force -ErrorAction SilentlyContinue
    Stop-Process -Id $relayProcess.Id -Force -ErrorAction SilentlyContinue
    Stop-Process -Id $nextAppProcess.Id -Force -ErrorAction SilentlyContinue
}

Write-Host "⏳ Waiting for port 3000 to become available..." -ForegroundColor Yellow
while ($true) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        break
    }
    catch {
        Start-Sleep -Seconds 1
    }
}

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "🖥️ Launching Pear Desktop Application Shell..." -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# Run Pear desktop app
pear run ./apps/pear-desktop

# Clean up processes upon pear application closure
Write-Host "🛑 Shutting down dev servers..." -ForegroundColor Yellow
Stop-Process -Id $clientProcess.Id -Force -ErrorAction SilentlyContinue
Stop-Process -Id $relayProcess.Id -Force -ErrorAction SilentlyContinue
Stop-Process -Id $nextAppProcess.Id -Force -ErrorAction SilentlyContinue
