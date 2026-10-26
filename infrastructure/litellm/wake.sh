#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HEALTH_URL="http://localhost:4000/health"
PORT=4001

wake_proxy() {
    # Check if already running
    if curl -sf "$HEALTH_URL" >/dev/null 2>&1; then
        echo "✅ Proxy already awake"
        return 0
    fi
    
    echo "🔄 Waking proxy..."
    (cd "$SCRIPT_DIR" && docker compose up -d)
    
    # Wait for health
    for i in {1..20}; do
        if curl -sf "$HEALTH_URL" >/dev/null 2>&1; then
            echo "✅ Proxy awake and healthy"
            return 0
        fi
        sleep 1
    done
    
    echo "⚠️  Proxy started but not yet healthy"
    return 1
}

get_status() {
    if curl -sf "$HEALTH_URL" >/dev/null 2>&1; then
        echo "awake"
    elif docker ps --format '{{.Names}}' | grep -q "litellm-proxy"; then
        echo "starting"
    else
        echo "asleep"
    fi
}

case "${1:-status}" in
    wake)
        wake_proxy
        ;;
    status)
        echo "Proxy status: $(get_status)"
        ;;
    *)
        echo "Usage: $0 {wake|status}"
        exit 1
        ;;
esac
