#!/bin/bash
# Scripts to compile all frontends on the VPS host using Bun/Node.
set -e

export PATH=$PATH:/home/ubuntu/.bun/bin:/usr/local/bin

ROOT_DIR="/home/ubuntu/MSBrossAI"
cd "$ROOT_DIR"

# Helper function to build an app
build_app() {
  local app_path=$1
  local app_name=$(basename "$app_path")
  echo "🛠️ Building $app_name in $app_path..."
  if [ -d "$ROOT_DIR/$app_path" ]; then
    cd "$ROOT_DIR/$app_path"
    if [ -f "package.json" ]; then
      # Use bun if available, with npm fallback
      if command -v bun &> /dev/null; then
        echo "Trying Bun: bun install && bun run build"
        if bun install && bun run build; then
          echo "✅ Built successfully with Bun!"
        else
          echo "⚠️ Bun failed. Falling back to NPM..."
          npm install
          npm run build
        fi
      else
        echo "Running with NPM: npm install && npm run build"
        npm install
        npm run build
      fi
    else
      echo "⚠️ No package.json found in $app_path"
    fi
  else
    echo "❌ Directory $app_path not found"
  fi
}

# Compile each app listed in sync_www.sh
build_app "apps/app-generator"
build_app "apps/cuentos-magicos/frontend"
build_app "apps/combipro"
build_app "apps/industrialpro"
build_app "apps/edelweiss"
build_app "apps/expositator-rte"
build_app "apps/iaputa-os/frontend"
build_app "apps/jartosdto/client"
build_app "apps/logisearch"
build_app "apps/moko-tools"
build_app "apps/msbross-frontend"
build_app "apps/gas-station"
build_app "apps/livekit-nikolina/frontend"
build_app "apps/taskflow-pro"
build_app "apps/traductor-pro/client"
build_app "apps/it-english-coach-frontend"
build_app "apps/cv-portfolio"

# Compile Next.js SSR app: elitescout
build_app "apps/elitescout"

# Sync build outputs to www/app/
cd "$ROOT_DIR"
echo "🔄 Sincronizando compilados a www/app/..."
bash scripts/build/sync_www.sh

echo "✨ Compilación de todos los frontends completada con éxito en el VPS!"
