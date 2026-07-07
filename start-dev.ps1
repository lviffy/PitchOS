Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "[BOOTING] Booting PitchOS Monorepo Dev Environment..." -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# 1. Load root .env variables into current process environment
$envFile = Join-Path $PSScriptRoot ".env"
$envVars = @{}
if (Test-Path $envFile) {
    Write-Host "[INFO] Loading environment variables from root .env..." -ForegroundColor Gray
    Get-Content $envFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#")) {
            $parts = $line -split '=', 2
            if ($parts.Length -eq 2) {
                $name  = $parts[0].Trim()
                $value = $parts[1].Trim().Trim('"').Trim("'")
                # Set on current process (inherited by child Start-Process calls)
                Set-Item -Path "Env:\$name" -Value $value
                $envVars[$name] = $value
            }
        }
    }
}

# 1b. Write .env.local to each Next.js app so vars are available at build time
# (Next.js reads .env.local from its own directory, not the monorepo root)
foreach ($appDir in @("apps/client", "apps/next-app")) {
    $localEnv = Join-Path (Join-Path $PSScriptRoot $appDir) ".env.local"
    $lines = @()
    foreach ($kv in $envVars.GetEnumerator()) {
        $lines += "$($kv.Key)=$($kv.Value)"
    }
    $lines | Set-Content -Path $localEnv -Encoding UTF8
}

# 2. Ensure PORT is defined (default to 3001 for relay-service)
if (-not $env:PORT) {
    $env:PORT = "3001"
}

# 3. Check dependencies
if (-not (Get-Command bun -ErrorAction SilentlyContinue)) {
    Write-Error "[ERROR] bun is not installed or not in PATH. Please install Bun first."
    exit 1
}

# 4. Start dev servers in background (using node directly to bypass Device Guard next.exe blocks)
Write-Host "[STARTING] Starting Next.js frontend, next-app backend, and signaling relay..." -ForegroundColor Green

# Apps/Client: node node_modules/next/dist/bin/next dev apps/client --webpack -p 3000
$clientProcess = Start-Process node -ArgumentList "node_modules/next/dist/bin/next dev apps/client --webpack -p 3000" -WorkingDirectory $PSScriptRoot -NoNewWindow -PassThru

# Apps/Next-App: node node_modules/next/dist/bin/next dev apps/next-app --webpack -p 3002
$nextAppProcess = Start-Process node -ArgumentList "node_modules/next/dist/bin/next dev apps/next-app --webpack -p 3002" -WorkingDirectory $PSScriptRoot -NoNewWindow -PassThru

# Apps/Relay-Service: bun src/index.ts (run via cmd wrapper)
$relayProcess = Start-Process cmd -ArgumentList "/c bun run dev" -WorkingDirectory (Join-Path $PSScriptRoot "apps/relay-service") -NoNewWindow -PassThru

# Register cleanup on exit
Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action {
    Write-Host "[STOP] Shutting down dev servers..." -ForegroundColor Yellow
    Stop-Process -Id $clientProcess.Id -Force -ErrorAction SilentlyContinue
    Stop-Process -Id $relayProcess.Id -Force -ErrorAction SilentlyContinue
    Stop-Process -Id $nextAppProcess.Id -Force -ErrorAction SilentlyContinue
}

Write-Host "[WAIT] Waiting for port 3000 to become available..." -ForegroundColor Yellow
while ($true) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        break
    } catch {
        Start-Sleep -Seconds 1
    }
}

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "[LAUNCHING] Launching Pear Desktop Application Shell..." -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# Run Pear desktop app
if (Get-Command pear -ErrorAction SilentlyContinue) {
    pear run ./apps/pear-desktop
} else {
    Write-Warning "[WARN] 'pear' command not found. You can run Option B: standard browser at http://localhost:3000"
}

# Clean up processes upon pear application closure
Write-Host "[STOP] Shutting down dev servers..." -ForegroundColor Yellow
Stop-Process -Id $clientProcess.Id -Force -ErrorAction SilentlyContinue
Stop-Process -Id $relayProcess.Id -Force -ErrorAction SilentlyContinue
Stop-Process -Id $nextAppProcess.Id -Force -ErrorAction SilentlyContinue
