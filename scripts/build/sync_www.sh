#!/bin/bash
# Re-generates www/app/ from the LOCAL dist/out folders that are already built!

echo "Syncing compiled static apps to www/app/..."

# Remove old app directories to ensure clean sync without nesting
rm -rf www/app/*

mkdir -p www/app

# Helper function for copying
sync_app() {
  local src=$1
  local dest="www/app/$2"
  if [ -d "$src" ]; then
    mkdir -p "$dest"
    cp -R "$src"/* "$dest"/
  else
    echo "Warning: $src not found, skipping $2"
  fi
}

sync_app "apps/app-generator/dist" "app-generator"
sync_app "apps/cuentos-magicos/frontend/out" "cuentos-magicos"
sync_app "apps/combipro/dist" "combipro"
sync_app "apps/industrialpro/dist" "industrialpro"
sync_app "apps/edelweiss/dist" "edelweiss"
sync_app "apps/expositator-rte/dist" "expositator-rte"
sync_app "apps/iaprod-os/frontend/dist" "iaprod-os"
sync_app "apps/jartosdto/client/out" "jartosdto"
sync_app "apps/logisearch/dist" "logisearch"
sync_app "apps/moko-tools/dist" "moko-tools"
sync_app "apps/msbross-frontend/dist" "msbross"

# MSBross frontend is also the root domain, sync it to root www/
if [ -d "apps/msbross-frontend/dist" ]; then
  cp -R apps/msbross-frontend/dist/* www/
fi

sync_app "apps/gas-station/dist" "gas-station"
sync_app "apps/livekit-nikolina/frontend/dist" "livekit-nikolina"
sync_app "apps/taskflow-pro/dist" "taskflow"
sync_app "apps/traductor-pro/client/dist" "traductor-pro"
sync_app "apps/it-english-coach/dist" "it-english-coach"
sync_app "apps/cv-portfolio/dist" "cv"

# Special apps (no build, just raw frontend or index.html)
mkdir -p www/app/web-restaurante-atenea
rm -rf www/app/web-restaurante-atenea/*
cp apps/web-restaurante-atenea/frontend/* www/app/web-restaurante-atenea/

mkdir -p www/app/assistant
cp -R apps/msbross-assistant/dist/* www/app/assistant/

mkdir -p www/app/logitrack
echo "Logitrack coming soon" > www/app/logitrack/index.html

mkdir -p www/app/maya
echo "Maya coming soon" > www/app/maya/index.html

echo "Sync complete!"
