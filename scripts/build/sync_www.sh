#!/bin/bash
# Re-generates www/app/ from the LOCAL dist/out folders that are already built!

echo "Syncing compiled static apps to www/app/..."

mkdir -p www/app

cp -R apps/app-generator/dist www/app/app-generator
cp -R apps/cuentos-magicos/frontend/out www/app/cuentos-magicos
cp -R apps/combipro/dist www/app/combipro
cp -R apps/industrialpro/dist www/app/industrialpro
cp -R apps/edelweiss/dist www/app/edelweiss
cp -R apps/expositator-rte/dist www/app/expositator-rte
cp -R apps/iaputa-os/frontend/dist www/app/iaputa-os
cp -R apps/jartosdto/client/out www/app/jartosdto
cp -R apps/logisearch/dist www/app/logisearch
cp -R apps/moko-tools/dist www/app/moko-tools
cp -R apps/msbross-frontend/dist www/app/msbross
cp -R apps/gas-station/dist www/app/gas-station
cp -R apps/livekit-nikolina/frontend/dist www/app/livekit-nikolina
cp -R apps/taskflow-pro/dist www/app/taskflow
cp -R apps/traductor-pro/client/dist www/app/traductor-pro
cp -R apps/it-english-coach-frontend/dist www/app/it-english-coach
cp -R apps/cv-portfolio/dist www/app/cv

# Special apps (no build, just raw frontend or index.html)
mkdir -p www/app/web-restaurante-atenea
rm -rf www/app/web-restaurante-atenea/*
cp apps/web-restaurante-atenea/frontend/* www/app/web-restaurante-atenea/

mkdir -p www/app/assistant
cp -R apps/msbross-assistant/* www/app/assistant/
rm -rf www/app/assistant/node_modules

mkdir -p www/app/logitrack
echo "Logitrack coming soon" > www/app/logitrack/index.html

mkdir -p www/app/maya
echo "Maya coming soon" > www/app/maya/index.html

echo "Sync complete!"
