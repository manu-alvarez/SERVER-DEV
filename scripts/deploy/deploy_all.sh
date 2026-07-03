#!/bin/bash
set -e

VPS_USER="ubuntu"
VPS_HOST="84.247.186.126"
SSH_KEY="~/.ssh/contabo_key"
VPS_DIR="~/MSBrossAI"

echo "🚀 Iniciando despliegue masivo a Contabo VPS ($VPS_HOST)..."

# 1. Sync apps directory
echo "📦 Sincronizando código fuente (apps/)..."
rsync -avz --exclude 'node_modules' --exclude 'dist' --exclude '.git' --exclude '__pycache__' --exclude 'venv' --exclude '.env' -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" ./apps/ $VPS_USER@$VPS_HOST:$VPS_DIR/apps/

# 2. Sync infrastructure files
echo "⚙️ Sincronizando infraestructura (docker-compose y ecosystem)..."
rsync -avz -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" ./infrastructure/docker-compose.yml $VPS_USER@$VPS_HOST:$VPS_DIR/docker-compose.yml
rsync -avz -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" ./infrastructure/ecosystem.config.js $VPS_USER@$VPS_HOST:$VPS_DIR/ecosystem.config.js

# 3. Reload PM2 and Docker
echo "🔄 Recargando servicios en el servidor..."
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST << 'EOF'
  cd ~/MSBrossAI
  
  echo "Reiniciando contenedores Docker..."
  docker compose up -d --build
  
  echo "Recargando PM2..."
  pm2 reload ecosystem.config.js --update-env || pm2 start ecosystem.config.js
  pm2 save
  
  echo "✅ ¡Despliegue finalizado exitosamente en el servidor!"
EOF

echo "🎉 Proceso local completado."
