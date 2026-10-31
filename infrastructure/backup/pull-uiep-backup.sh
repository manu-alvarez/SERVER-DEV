#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# pull-uiep-backup.sh — copia EXTERNA al VPS de los backups de UIEP (Fase 1.0).
#
# Ejecutar DESDE EL MAC: trae el último backup UIEP del VPS a la carpeta local
# (sincronizada por iCloud → copia fuera del servidor). El repo (GitHub) ya es
# la copia externa del CÓDIGO; esto cubre los DATOS (specs/knowledge/runs).
#
# Uso:        ./pull-uiep-backup.sh [opcional: número de copias a conservar]
# Cron local (opcional, si el Mac está encendido a esa hora):
#   30 6 * * * /ruta/a/SERVER-DEV/infrastructure/backup/pull-uiep-backup.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

VPS="${VPS:-ubuntu@84.247.186.126}"
KEY="${KEY:-$HOME/.ssh/contabo_key}"
DEST="${DEST:-$HOME/Library/Mobile Documents/com~apple~CloudDocs/Desktop/SERVER-DEV/backups-local/uiep}"
KEEP="${1:-7}"

mkdir -p "$DEST"

# Genera un backup fresco en el VPS y trae el más reciente
ssh -i "$KEY" -o StrictHostKeyChecking=no "$VPS" '/home/ubuntu/MSBrossAI/infrastructure/backup/uiep-backup.sh' > /dev/null
LATEST=$(ssh -i "$KEY" -o StrictHostKeyChecking=no "$VPS" 'ls -t /home/ubuntu/backups/uiep/uiep-data-*.tgz | head -1')
scp -i "$KEY" -o StrictHostKeyChecking=no -q "$VPS:$LATEST" "$DEST/"

# Retención local
ls -t "$DEST"/uiep-data-*.tgz | tail -n +"$((KEEP + 1))" | xargs rm -f 2>/dev/null || true

# Verificación de integridad local
LOCAL=$(ls -t "$DEST"/uiep-data-*.tgz | head -1)
if tar tzf "$LOCAL" > /dev/null 2>&1; then
  echo "copia externa OK: $(basename "$LOCAL") ($(du -h "$LOCAL" | cut -f1)) → iCloud"
else
  echo "ERROR: la copia local está corrupta" >&2
  exit 1
fi
