#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLIST_NAME="com.user.litellm-proxy.plist"
PLIST_DEST="$HOME/Library/LaunchAgents/$PLIST_NAME"
PLIST_SRC="$SCRIPT_DIR/$PLIST_NAME"

echo "=== Install LiteLLM Auto-Start Service ==="
echo ""

# Check if already installed
if [ -f "$PLIST_DEST" ]; then
    echo "⚠️  Service already installed at:"
    echo "   $PLIST_DEST"
    echo ""
    read -p "Reinstall? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Cancelled"
        exit 0
    fi
    echo "Uninstalling existing service..."
    launchctl bootout gui/$(id -u)/com.user.litellm-proxy 2>/dev/null || true
    rm -f "$PLIST_DEST"
fi

# Create logs directory
mkdir -p "$SCRIPT_DIR/logs"

# Install plist
cp "$PLIST_SRC" "$PLIST_DEST"
echo "✅ Service installed: $PLIST_DEST"

# Load service
echo "Loading service..."
launchctl bootstrap gui/$(id -u) "$PLIST_DEST" 2>/dev/null || \
launchctl load "$PLIST_DEST" 2>/dev/null || true

sleep 2

# Verify
if launchctl list | grep -q "com.user.litellm-proxy"; then
    echo "✅ Service loaded and running"
else
    echo "⚠️  Service installed but may need manual start"
fi

echo ""
echo "Commands:"
echo "  Start:   launchctl start com.user.litellm-proxy"
echo "  Stop:    launchctl stop com.user.litellm-proxy"
echo "  Status:  launchctl list | grep litellm"
echo "  Logs:    tail -f $SCRIPT_DIR/logs/watchdog.log"
echo "  Uninstall: ./uninstall-service.sh"
