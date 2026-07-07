#!/bin/bash

echo "=================================================="
echo "🛑 Shutting down PitchOS Dev Services in WSL..."
echo "=================================================="

for port in 3000 3001 3002; do
    PID=$(lsof -t -i:$port 2>/dev/null)
    if [ -n "$PID" ]; then
        echo "Stopping service on port $port (PID: $PID)..."
        kill -15 $PID 2>/dev/null
        sleep 0.5
        # Force kill if still active
        kill -9 $PID 2>/dev/null
    else
        echo "No service found running on port $port."
    fi
done

echo "=================================================="
echo "✅ All PitchOS dev services stopped."
