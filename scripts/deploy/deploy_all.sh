#!/bin/bash
set -e

VPS_USER="${VPS_USER:-ubuntu}"
VPS_HOST="${VPS_HOST:-84.247.186.126}"
SSH_KEY="${SSH_KEY:-~/.ssh/contabo_key}"
VPS_DIR="~/MSBrossAI"

echo "🚀 Iniciando despliegue masivo a Contabo VPS ($VPS_HOST)..."

# 1. Sync apps directory
echo "📦 Sincronizando código fuente (apps/)..."
rsync -avz --delete \
  --exclude 'node_modules' --exclude 'dist' --exclude '.next' \
  --exclude '.git' --exclude '__pycache__' --exclude 'venv' --exclude '.venv' \
  --exclude '.env' --exclude '*.log' --exclude '*.error.log' \
  -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" \
  ./apps/ $VPS_USER@$VPS_HOST:$VPS_DIR/apps/

# 2. Sync infrastructure files
echo "⚙️ Sincronizando infraestructura (docker-compose, ecosystem, proxy)..."
rsync -avz -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" ./www/ $VPS_USER@$VPS_HOST:$VPS_DIR/www/
rsync -avz -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" ./infrastructure/docker-compose.yml $VPS_USER@$VPS_HOST:$VPS_DIR/docker-compose.yml
rsync -avz -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" ./infrastructure/msbross-proxy/ $VPS_USER@$VPS_HOST:$VPS_DIR/infrastructure/msbross-proxy/
rsync -avz -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" ./ecosystem.config.js $VPS_USER@$VPS_HOST:$VPS_DIR/ecosystem.config.js

# 3. Reload Docker containers and PM2 processes
echo "🔄 Recargando servicios en el servidor..."
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST << 'EOF'
  cd ~/MSBrossAI
  
  echo "Levantando contenedores Docker (sin rebuild)..."
  docker compose up -d
  
  echo "Recargando PM2..."
  pm2 reload ecosystem.config.js --update-env || pm2 start ecosystem.config.js
  pm2 save
  
  echo "✅ ¡Despliegue finalizado exitosamente en el servidor!"
EOF

echo "🎉 Proceso local completado."
