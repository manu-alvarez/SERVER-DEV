#!/bin/bash
set -e

echo "====================================="
echo " MSBross - Build All Frontends"
echo "====================================="

# Base paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APPS_DIR="$(cd "$SCRIPT_DIR/../../apps" && pwd)"

# Define apps that need standard npm/bun build
# These should match the folders that actually require a build step
declare -a FRONTENDS=(
  "msbross-frontend"
  "gas-station"
  "industrialpro"
  "app-generator"
  "expositator-rte"
  "livekit-nikolina/frontend"
  "combipro"
  "edelweiss"
  "iaprod-os/frontend"
  "jartosdto/client"
  "logisearch"
  "moko-tools"
  "msbross-assistant"
  "taskflow-pro"
  "traductor-pro/client"
  "it-english-coach-frontend"
  "cv-portfolio"
  "cuentos-magicos/frontend"
)

for APP in "${FRONTENDS[@]}"; do
  echo ""
  echo ">>> Building $APP..."
  APP_PATH="$APPS_DIR/$APP"
  
  if [ ! -d "$APP_PATH" ]; then
    echo "Warning: Directory $APP_PATH not found. Skipping."
    continue
  fi

  cd "$APP_PATH"
  
  # Check if package.json exists to avoid errors on non-node apps
  if [ ! -f "package.json" ]; then
    echo "No package.json found in $APP. Skipping."
    continue
  fi

  # Prefer bun if available, fallback to npm
  if command -v bun &> /dev/null; then
    bun install
    bun run build
  else
    npm install
    npm run build
  fi
  
  echo "✓ Build complete for $APP"
done

echo ""
echo "====================================="
echo " All builds complete. Executing sync_www.sh..."
echo "====================================="

# Go back to workspace root to run sync_www.sh correctly
cd "$SCRIPT_DIR/../.."
bash "$SCRIPT_DIR/sync_www.sh"

echo "====================================="
echo " All done! Frontends are built and synced."
echo "====================================="
