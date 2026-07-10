#!/usr/bin/env bash

PROXY_FILE="/Users/manu/Desktop/SERVER-DEV/infrastructure/msbross-proxy/proxy_server.js"
APPS_DIR="/Users/manu/Desktop/SERVER-DEV/apps"
WWW_DIR="/Users/manu/Desktop/SERVER-DEV/www/app"
DOCKER_FILE="/Users/manu/Desktop/SERVER-DEV/infrastructure/docker-compose.yml"

echo "=== DEEP AUDIT OF SERVER-DEV ==="
echo "--------------------------------"

# 1. Extract apps defined in proxy_server.js DOMAIN_APP_MAP
echo "[1] Mapped Apps in Proxy DOMAIN_APP_MAP:"
MAPPED_APPS=$(grep -E "^  '[a-z0-9.-]+': '[a-z0-9-]+',$" $PROXY_FILE | awk -F"'" '{print $4}' | sort -u)

for app in $MAPPED_APPS; do
  echo " - Proxy expects: $app"
  
  # Check if frontend exists in www/app/
  if [ -d "$WWW_DIR/$app" ]; then
    echo "   [OK] Frontend found in www/app/$app"
  else
    echo "   [ERROR] Missing frontend directory: www/app/$app"
  fi
  
  # Check if backend container is mapped for this app in BACKEND_MAP
  # e.g. 'industrialpro-backend':  ['industrialpro-backend',     8002],
  # This is a bit manual to parse, we will check if the app name appears in BACKEND_MAP keys or values
  if grep -qi "$app" $PROXY_FILE; then
    # Could be partial match, just a sanity check
    true
  fi
done

echo ""
echo "[2] Orphaned apps in apps/ directory?"
# Check what exists in apps/
for d in $APPS_DIR/*; do
  if [ -d "$d" ]; then
    appname=$(basename "$d")
    
    echo " - Checking source code folder: $appname"
    # Does it exist in proxy?
    if echo "$MAPPED_APPS" | grep -q "^$appname$"; then
      echo "   [OK] Found in proxy DOMAIN_APP_MAP"
    else
      echo "   [WARN] NOT found in DOMAIN_APP_MAP. Is it dead code?"
    fi
    
    # Check if there is a backend in this directory
    if [ -d "$d/backend" ] || [ -d "$d/server" ] || [ -d "$d/api" ]; then
      # Does docker-compose know about this?
      if grep -q "build: \.\./apps/$appname" "$DOCKER_FILE"; then
         echo "   [OK] Backend container defined in docker-compose.yml"
      else
         echo "   [ERROR] Backend exists in apps/$appname but NO container in docker-compose.yml!"
      fi
    fi
  fi
done

echo ""
echo "[3] Frontend verification in www/app"
for d in $WWW_DIR/*; do
  if [ -d "$d" ]; then
    appname=$(basename "$d")
    if ! echo "$MAPPED_APPS" | grep -q "^$appname$"; then
      echo "   [WARN] Frontend www/app/$appname exists but NOT in proxy DOMAIN_APP_MAP"
    fi
    if [ ! -f "$d/index.html" ]; then
      echo "   [ERROR] Frontend www/app/$appname missing index.html!"
    fi
  fi
done

echo ""
echo "=== AUDIT COMPLETE ==="
