#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLIST_NAME="com.user.litellm-proxy.plist"
PLIST_DEST="$HOME/Library/LaunchAgents/$PLIST_NAME"

echo "=== Uninstall LiteLLM Auto-Start Service ==="
echo ""

# Stop and unload
if launchctl list | grep -q "com.user.litellm-proxy"; then
    echo "Stopping service..."
    launchctl bootout gui/$(id -u)/com.user.litellm-proxy 2>/dev/null || \
    launchctl unload "$PLIST_DEST" 2>/dev/null || true
    echo "✅ Service stopped"
else
    echo "Service not running"
fi

# Remove plist
if [ -f "$PLIST_DEST" ]; then
    rm -f "$PLIST_DEST"
    echo "✅ Service removed: $PLIST_DEST"
fi

# Stop proxy if running
if docker ps --format '{{.Names}}' | grep -q "litellm-proxy"; then
    echo "Stopping proxy container..."
    (cd "$SCRIPT_DIR" && docker compose down) 2>/dev/null || true
    echo "✅ Proxy stopped"
fi

echo ""
echo "Service uninstalled. To reinstall: ./install-service.sh"
