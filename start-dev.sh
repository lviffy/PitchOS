#!/bin/bash

# 1. Export Pear binary path
export PATH="$HOME/.config/pear/bin:$PATH"

echo "=================================================="
echo "🚀 Booting PitchOS Monorepo Dev Environment..."
echo "=================================================="

# 2. Check if the dev servers are already running, otherwise boot them
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚡ Local Next.js dev server already running on port 3000."
else
    echo "🟢 Starting Next.js frontend, next-app backend, and signaling relay in background..."
    # Start dev environment using monorepo bun script
    bun run dev &
    DEV_PID=$!
    # Graceful shutdown of servers on exit
    trap "kill $DEV_PID" EXIT
    
    echo "⏳ Waiting for port 3000 to become available..."
    until curl -s http://localhost:3000 > /dev/null; do
      sleep 1
    done
fi

echo "=================================================="
echo "🖥️ Launching Pear Desktop Application Shell..."
echo "=================================================="

# 3. Boot Pear desktop window with Wayland/GBM GPU driver bypass flags
export PEAR_FLAGS="--disable-gpu --disable-gpu-compositing --ozone-platform=x11"
pear run ./apps/pear-desktop 2> >(grep -v "Fontconfig warning" >&2)
