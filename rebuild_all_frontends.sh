#!/bin/bash
# ==============================================================================
# MSBrossAI - LOCAL NATIVE FRONTEND REBUILDER (BYPASS ICLOUD)
# ==============================================================================
# set -e removed to allow continuing on errors

BASE_DIR="/Users/manu/Desktop/SERVER-DEV"
WWW_APP="$BASE_DIR/www/app"

echo "🧹 1. Eliminando symlink/carpetas de iCloud en www/app..."
rm -rf "$WWW_APP"
mkdir -p "$WWW_APP"

echo "🚀 2. Iniciando reconstrucción masiva de frontends en LOCAL..."

build_vite() {
    local APP_PATH=$1
    local DEST_NAME=$2
    echo "   [Vite] Construyendo $DEST_NAME..."
    cd "$APP_PATH" || { echo "   [!] Directorio no encontrado: $APP_PATH"; return; }
    npm install --no-audit --no-fund --loglevel=error || true
    npm run build --loglevel=error
    cp -R dist/ "$WWW_APP/$DEST_NAME/"
}

build_next() {
    local APP_PATH=$1
    local DEST_NAME=$2
    echo "   [Next.js] Construyendo $DEST_NAME..."
    cd "$APP_PATH" || { echo "   [!] Directorio no encontrado: $APP_PATH"; return; }
    if [ ! -s package.json ]; then
      echo "   [!] $DEST_NAME package.json is missing or 0 bytes! Skipping..."
      return
    fi
    npm install --no-audit --no-fund --loglevel=error || true
    npm run build --loglevel=error
    if [ -d "out" ]; then
        cp -R out/ "$WWW_APP/$DEST_NAME/"
    elif [ -d "dist" ]; then
        cp -R dist/ "$WWW_APP/$DEST_NAME/"
    fi
}

# --- APPS ---
echo "▶ Procesando Cuentos Mágicos..."
build_next "$BASE_DIR/apps/cuentos-magicos/frontend" "cuentos-magicos"

echo "▶ Procesando App Generator..."
build_vite "$BASE_DIR/apps/app-generator" "app-generator"

echo "▶ Procesando CombiPro..."
build_vite "$BASE_DIR/apps/combipro" "combipro"

echo "▶ Procesando IndustrialPro..."
build_vite "$BASE_DIR/apps/industrialpro" "industrialpro"

echo "▶ Procesando Edelweiss..."
build_vite "$BASE_DIR/apps/edelweiss" "edelweiss"

echo "▶ Procesando Expositator RTE..."
build_vite "$BASE_DIR/apps/expositator-rte" "expositator"

echo "▶ Procesando IAPuta..."
build_vite "$BASE_DIR/apps/iaputa-os/frontend" "iaputa-os"

echo "▶ Procesando JartosDTO..."
build_next "$BASE_DIR/apps/jartosdto/client" "jartosdto"

echo "▶ Procesando Logisearch..."
build_vite "$BASE_DIR/apps/logisearch" "logisearch"
mkdir -p "$WWW_APP/logitrack"
cp "$BASE_DIR/apps/logisearch/logitrack_trello.html" "$WWW_APP/logitrack/index.html"

echo "▶ Procesando CV Portfolio..."
build_vite "$BASE_DIR/apps/cv-portfolio" "cv"

echo "▶ Procesando Moko Tools..."
build_vite "$BASE_DIR/apps/moko-tools" "moko-tools"

echo "▶ Procesando MSBross (Core)..."
echo "   [Vite] Construyendo msbross en la raiz..."
cd "$BASE_DIR/apps/msbross-frontend"
npm install --no-audit --no-fund --loglevel=error || true
npm run build --loglevel=error
cp -R dist/* "$BASE_DIR/www/"

echo "▶ Procesando Gas Station..."
build_vite "$BASE_DIR/apps/gas-station" "gas-station"

echo "▶ Procesando Nikolina (LiveKit)..."
build_vite "$BASE_DIR/apps/livekit-nikolina/frontend" "livekit-nikolina"

echo "▶ Procesando Taskflow..."
build_vite "$BASE_DIR/apps/taskflow-pro" "taskflow"

echo "▶ Procesando Traductor Pro..."
build_vite "$BASE_DIR/apps/traductor-pro/client" "traductor-pro"

echo "▶ Procesando Atenea..."
mkdir -p "$WWW_APP/web-restaurante-atenea" && cp -r "$BASE_DIR/apps/web-restaurante-atenea/frontend/"* "$WWW_APP/web-restaurante-atenea/"

echo "▶ Procesando IT English Coach..."
build_vite "$BASE_DIR/apps/it-english-coach-frontend" "it-english-coach"

# Special cases:
echo "▶ Procesando EliteScout (Standalone Next.js)..."
cd "$BASE_DIR/apps/elitescout"
if [ -s package.json ]; then
    npm install --no-audit --no-fund --loglevel=error || true
    npm run build --loglevel=error
fi

echo "=============================================================================="
echo "✅ TODOS LOS FRONTENDS RECONSTRUIDOS EN LOCAL FÍSICO."
echo "=============================================================================="
echo "▶ Procesando MSBrOSs Assistant..."
mkdir -p "$WWW_APP/assistant"
cp -r "$BASE_DIR/apps/msbross-assistant/"* "$WWW_APP/assistant/"
