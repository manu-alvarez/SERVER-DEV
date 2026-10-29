#!/bin/bash

# ==============================================================================
# MSBROSS ECOSYSTEM - BACKUP COMPLETO (BBDD + ESTADO DE SERVICIOS)
# ==============================================================================
# Corregido 2026-09-07: pg_dump apuntaba a la BD "postgres" vacía en vez de
# las BDs reales. Ahora incluye además backups de estado (MinIO, Redis,
# Uptime-Kuma, Portainer, certs Traefik).
#
# Cron: 0 3 * * * /home/ubuntu/MSBrossAI/scripts/ops/backup_databases.sh >> /var/log/msbross_backups.log 2>&1
# ==============================================================================

BACKUP_DIR="/home/ubuntu/backups"
DB_DIR="$BACKUP_DIR/databases"
STATE_DIR="$BACKUP_DIR/state"
DATE=$(date +"%Y-%m-%d_%H-%M-%S")
RETENTION_DAYS=7
ERRORS=0

mkdir -p "$DB_DIR" "$STATE_DIR"

echo "=================================================="
echo "Iniciando Backup completo: $DATE"
echo "=================================================="

# ---------- 1. BASES DE DATOS POSTGRES ----------
backup_postgres() {
    local CONTAINER_NAME=$1
    local DB_USER=$2
    local DB_NAME=$3

    local FILENAME="${CONTAINER_NAME}_${DB_NAME}_${DATE}.dump"
    local FILEPATH="${DB_DIR}/${FILENAME}"

    echo "[*] pg_dump $CONTAINER_NAME -> BD: $DB_NAME ..."
    if docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" -Fc "$DB_NAME" > "$FILEPATH"; then
        local size=$(stat -c%s "$FILEPATH")
        echo "[OK] $FILENAME (${size} bytes)"
    else
        echo "[ERROR] Falló el backup de $CONTAINER_NAME/$DB_NAME"
        rm -f "$FILEPATH"
        ERRORS=$((ERRORS+1))
    fi
}

backup_postgres "msbross-cuentos-db"   "postgres"  "cuentos_magicos"
backup_postgres "msbross-elitescout-db" "postgres" "family_travel"
backup_postgres "jartosdto-postgres"   "jartosdto" "jartosdto"

# ---------- 2. ESTADO DE SERVICIOS ----------
backup_state() {
    local NAME=$1
    local CMD=$2
    local FILEPATH="${STATE_DIR}/${NAME}_${DATE}.tar.gz"
    echo "[*] Estado: $NAME ..."
    if eval "$CMD" > "$FILEPATH"; then
        local size=$(stat -c%s "$FILEPATH")
        echo "[OK] ${NAME}_${DATE}.tar.gz (${size} bytes)"
    else
        echo "[ERROR] Falló backup de estado: $NAME"
        rm -f "$FILEPATH"
        ERRORS=$((ERRORS+1))
    fi
}

# Redis: forzar save a disco antes de copiar
docker exec jartosdto-redis redis-cli BGSAVE >/dev/null 2>&1
sleep 2

backup_state "jartosdto-minio"   "tar czf - -C /var/lib/docker/volumes/jartosdto-minio-data/_data ."
backup_state "jartosdto-redis"   "tar czf - -C /var/lib/docker/volumes/jartosdto-redis-data/_data ."
backup_state "uptime-kuma"       "tar czf - -C /var/lib/docker/volumes/uptime-kuma-data/_data ."
backup_state "portainer"         "tar czf - -C /var/lib/docker/volumes/portainer_data/_data ."
backup_state "traefik-certs"     "tar czf - -C /opt/traefik acme.json"

# ---------- 3. LIMPIEZA ----------
echo "--------------------------------------------------"
echo "Limpieza (>${RETENTION_DAYS} días)..."
find "$DB_DIR"    -type f \( -name "*.dump" -o -name "*.sql.gz" \) -mtime +$RETENTION_DAYS -exec rm -f {} \;
find "$STATE_DIR" -type f -name "*.tar.gz" -mtime +$RETENTION_DAYS -exec rm -f {} \;

echo "=================================================="
if [ "$ERRORS" -eq 0 ]; then
    echo "[FIN] Backup completado sin errores."
else
    echo "[FIN] Backup completado con $ERRORS ERRORES (revisar arriba)."
fi
echo "=================================================="
exit $ERRORS
