#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# UIEP data backup (Fase 4.2 — hardening operativo)
#
# Backup diario del VOLUMEN de datos de UIEP (specs + runtime JSON) usando el
# tar del propio contenedor vivo (sin imágenes nuevas ni dependencias extra):
# los datos solo existen en el volumen docker, nunca en la imagen.
#
# Instalación (cron del usuario, VPS):
#   crontab -l 2>/dev/null | { cat; echo "17 4 * * * /home/ubuntu/MSBrossAI/infrastructure/backup/uiep-backup.sh >> /home/ubuntu/backups/uiep/backup.log 2>&1"; } | crontab -
#
# Restauración (entorno aislado, ver apps/uiep/docs/PHASE42-HARDENING.md):
#   docker exec -i uiep-restore-test sh -c 'tar xzf - -C /app/data' < backup.tgz
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

CONTAINER="${CONTAINER:-uiep-backend}"
BACKUP_DIR="${BACKUP_DIR:-/home/ubuntu/backups/uiep}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
MIN_BYTES=1000

STAMP="$(date +%F-%H%M)"
OUT="$BACKUP_DIR/uiep-data-$STAMP.tgz"

mkdir -p "$BACKUP_DIR"

# Backup consistente: tar dentro del contenedor (el store escribe atómicamente
# con tmp+rename, así que un snapshot instantáneo nunca parte un documento).
docker exec "$CONTAINER" tar czf - -C /app/data . > "$OUT"

# Integridad: el tar se lee de vuelta y pesa más que un umbral mínimo.
if ! tar tzf "$OUT" >/dev/null 2>&1; then
  echo "[uiep-backup] ERROR: el backup no es legible ($OUT)" >&2
  rm -f "$OUT"
  exit 1
fi
SIZE=$(stat -c%s "$OUT")
if [ "$SIZE" -lt "$MIN_BYTES" ]; then
  echo "[uiep-backup] ERROR: backup demasiado pequeño ($SIZE bytes)" >&2
  rm -f "$OUT"
  exit 1
fi

# Retención: borrar backups más antiguos que RETENTION_DAYS.
find "$BACKUP_DIR" -name 'uiep-data-*.tgz' -mtime "+$RETENTION_DAYS" -delete

echo "[uiep-backup] ok: $(basename "$OUT") ($SIZE bytes, $(tar tzf "$OUT" | wc -l) ficheros)"
