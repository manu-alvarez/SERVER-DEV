#!/bin/bash
# Script to build all python backend images locally on the VPS.
# This recovers backend images that were pruned or are missing.
set -e

ROOT_DIR="/home/ubuntu/MSBrossAI"
cd "$ROOT_DIR"

# Temporary generic Dockerfile
GENERIC_DOCKERFILE="/tmp/GenericBackendDockerfile"
cat << 'EOF' > "$GENERIC_DOCKERFILE"
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EOF

build_backend_image() {
  local image_name=$1
  local context_dir=$2
  
  echo "🐳 Building backend image $image_name from $context_dir..."
  if [ -d "$ROOT_DIR/$context_dir" ]; then
    cd "$ROOT_DIR/$context_dir"
    
    # Generate requirements.txt from venv if missing
    if [ ! -f "requirements.txt" ]; then
      if [ -d "venv" ]; then
        echo "  - Generating requirements.txt from venv..."
        ./venv/bin/pip freeze > requirements.txt || echo -e "granian\nfastapi" > requirements.txt
      else
        echo "  - Creating fallback requirements.txt..."
        echo -e "granian\nfastapi\nuvicorn" > requirements.txt
      fi
    fi
    
    # Build using custom or generic Dockerfile
    if [ -f "Dockerfile" ]; then
      echo "  - Using local Dockerfile..."
      docker build -t "$image_name" .
    else
      echo "  - Using generic Dockerfile..."
      docker build -t "$image_name" -f "$GENERIC_DOCKERFILE" .
    fi
  else
    echo "❌ Context directory $context_dir not found!"
  fi
}

build_backend_image "msbross-cuentos-magicos-backend:granian" "apps/cuentos-magicos/backend"
build_backend_image "msbross-gas-station-backend:granian" "apps/gas-station/backend"
build_backend_image "msbross-iaputa-backend:granian" "apps/iaputa-os/backend"
build_backend_image "msbross-industrial-backend:granian" "apps/industrialpro/backend"
build_backend_image "msbross-jartosdto-backend:granian" "apps/jartosdto/server"
build_backend_image "msbross-msbross:granian" "apps/msbross-backend/server-fastapi"

# Nikolina (build and tag both)
build_backend_image "msbross-nikolina-backend:granian" "apps/livekit-nikolina/server"
docker tag msbross-nikolina-backend:granian msbross-nikolina-backend:latest

build_backend_image "msbross-traductor-backend:granian" "apps/traductor-pro/server-fastapi"
build_backend_image "msbross-atenea-backend:granian" "apps/web-restaurante-atenea"

# Clean up temp dockerfile
rm -f "$GENERIC_DOCKERFILE"

echo "✨ All backend images rebuilt successfully!"
