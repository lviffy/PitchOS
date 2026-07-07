#!/bin/bash

# 1. Load NVM environment if installed in home directory
if [ -s "$HOME/.nvm/nvm.sh" ]; then
    export NVM_DIR="$HOME/.nvm"
    \. "$NVM_DIR/nvm.sh"
fi

echo "=================================================="
echo "🚀 Booting PitchOS Monorepo Dev Environment in WSL..."
echo "=================================================="

# 2. Check if Bun is available
if ! command -v bun &> /dev/null; then
    echo "❌ Error: bun is not installed in WSL. Please install it first."
    exit 1
fi

# 3. Define port and export
export PORT=3001

# 4. Start servers in background
echo "🟢 Starting relay-service on port 3001..."
bun run dev:relay &
RELAY_PID=$!

echo "🟢 Starting client app on port 3000..."
bun run dev:client &
CLIENT_PID=$!

echo "🟢 Starting next-app on port 3002..."
bun run dev:next-app &
NEXT_PID=$!

# Cleanup function to kill all spawned processes on exit
cleanup() {
    echo "=================================================="
    echo "🛑 Shutting down dev servers..."
    echo "=================================================="
    kill $RELAY_PID $CLIENT_PID $NEXT_PID 2>/dev/null
    exit 0
}

# Trap Ctrl+C (SIGINT) and termination signals
trap cleanup SIGINT SIGTERM EXIT

# Keep script running and wait for child processes
wait
