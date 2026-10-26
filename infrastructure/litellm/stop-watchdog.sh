#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=== Stopping LiteLLM Watchdog ==="

# Stop watchdog processes
pkill -f "watchdog.sh" 2>/dev/null || true
pkill -f "liteLLM.*watchdog" 2>/dev/null || true

# Stop proxy
cd "$SCRIPT_DIR" && docker compose down 2>/dev/null || true

echo "✅ Watchdog and proxy stopped"
