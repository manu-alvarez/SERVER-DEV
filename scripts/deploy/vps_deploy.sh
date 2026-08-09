#!/bin/bash
# Main VPS deployment script. Runs entirely on the VPS host to sync, build, and deploy.
set -e

export PATH=$PATH:/home/ubuntu/.bun/bin:/usr/local/bin

ROOT_DIR="/home/ubuntu/MSBrossAI"
cd "$ROOT_DIR"

echo "🔄 1. Sincronizando con GitHub (main)..."
git fetch origin
git reset --hard origin/main

echo "⚙️ 2. Copiando configuración limpia de docker-compose..."
cp infrastructure/docker-compose.yml docker-compose.yml

# Check and copy iaprod-os .env if needed
if [ -f "iaprod-os/.env" ] && [ ! -f "apps/iaprod-os/.env" ]; then
  echo "🔑 Copiando iaprod-os .env desde el directorio de respaldo..."
  cp iaprod-os/.env apps/iaprod-os/.env
fi

echo "🛠️ 3. Compilando frontends en el host..."
bash scripts/build/vps_build_all.sh

echo "🐳 4. Reconstruyendo imágenes de backend y personalizadas de Docker..."
bash scripts/build/vps_build_backends.sh
docker build -t msbross-fitness:latest apps/txa-fitness-pro || echo "⚠️ Build skipped: txa-fitness-pro"
docker build -t msbross-mapfre:latest apps/mapfre/frontend || echo "⚠️ Build skipped: mapfre"
docker build -t msbross-perfume:latest apps/perfume-trading/erp || echo "⚠️ Build skipped: perfume-trading"

echo "🚦 5. Iniciando Traefik..."
if [ -d "infrastructure/traefik" ]; then
  cd infrastructure/traefik
  docker compose up -d
  cd "$ROOT_DIR"
else
  echo "⚠️ No se encontró la carpeta de Traefik en infrastructure/traefik"
fi

echo "🚀 6. Iniciando servicios en Docker Compose..."
docker compose up -d

echo "🔄 7. Recargando procesos en PM2..."
pm2 reload ecosystem.config.js --update-env || pm2 start ecosystem.config.js
pm2 save

echo "🧹 8. Limpiando imágenes huérfanas de Docker..."
docker image prune -f

echo "✅ ¡DESPLIEGUE COMPLETADO EXITOSAMENTE DESDE EL VPS!"
