#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Allow override via environment or .env
IDLE_TIMEOUT="${IDLE_TIMEOUT:-600}"  # 10 minutes
CHECK_INTERVAL="${CHECK_INTERVAL:-60}"
AUTO_START="${AUTO_START:-true}"

echo "=== LiteLLM Watchdog Daemon ==="
echo "Idle timeout: ${IDLE_TIMEOUT}s ($((IDLE_TIMEOUT/60))min)"
echo "Check interval: ${CHECK_INTERVAL}s"
echo "Auto-start: ${AUTO_START}"
echo ""

# Check dependencies
for cmd in docker curl python3; do
    if ! command -v "$cmd" >/dev/null 2>&1; then
        echo "❌ Required command not found: $cmd"
        exit 1
    fi
done

# Check if already running
if pgrep -f "watchdog.sh" | grep -v $$ >/dev/null 2>&1; then
    echo "⚠️  Watchdog already running (PID: $(pgrep -f 'watchdog.sh' | head -1))"
    echo "   Use './stop-watchdog.sh' to stop it first"
    exit 1
fi

# Create logs directory
mkdir -p "$SCRIPT_DIR/logs"

# Start watchdog in background
nohup bash "$SCRIPT_DIR/watchdog.sh" > "$SCRIPT_DIR/logs/watchdog-stdout.log" 2>&1 &
WATCHDOG_PID=$!

echo "✅ Watchdog started (PID: $WATCHDOG_PID)"
echo "   Logs: $SCRIPT_DIR/logs/watchdog.log"
echo "   Stop: ./stop-watchdog.sh"
echo ""
echo "Status:"
sleep 2
if docker ps --format '{{.Names}}' | grep -q "litellm-proxy"; then
    echo "   Proxy: ✅ Running"
    curl -sf "http://localhost:4000/health" >/dev/null 2>&1 && echo "   Health: ✅ OK" || echo "   Health: ⚠️  Starting..."
else
    echo "   Proxy: ⏸️  Idle/Stopped"
fi
