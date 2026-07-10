#!/bin/bash

# ==============================================================================
# MSBROSS ECOSYSTEM - DATABASE AUTOMATED BACKUP SCRIPT
# ==============================================================================
# Este script extrae un dump de las bases de datos críticas alojadas en Docker,
# las comprime y elimina los backups con más de 7 días de antigüedad.
# 
# Uso recomendado en crontab (Diario a las 03:00 AM):
# 0 3 * * * /home/ubuntu/MSBrossAI/scripts/ops/backup_databases.sh >> /var/log/msbross_backups.log 2>&1
# ==============================================================================

BACKUP_DIR="/home/ubuntu/backups/databases"
DATE=$(date +"%Y-%m-%d_%H-%M-%S")
RETENTION_DAYS=7

# Crear el directorio de backups si no existe
mkdir -p "$BACKUP_DIR"

echo "=================================================="
echo "Iniciando Backup de BBDD: $DATE"
echo "=================================================="

# Función genérica para hacer backup de Postgres en Docker
backup_postgres() {
    local CONTAINER_NAME=$1
    local DB_USER=$2
    local DB_NAME=$3
    
    local FILENAME="${CONTAINER_NAME}_${DATE}.sql.gz"
    local FILEPATH="${BACKUP_DIR}/${FILENAME}"

    echo "[*] Iniciando volcado de contenedor: $CONTAINER_NAME..."
    
    # Se ejecuta pg_dump dentro del contenedor y se comprime al vuelo
    if docker exec -t "$CONTAINER_NAME" pg_dump -U "$DB_USER" -Fc "$DB_NAME" > "$FILEPATH"; then
        echo "[✓] Éxito: $FILENAME generado."
    else
        echo "[X] ERROR: Falló el backup de $CONTAINER_NAME"
        # Eliminar archivo corrupto o incompleto
        rm -f "$FILEPATH"
    fi
}

# 1. Cuentos Mágicos
backup_postgres "msbross-cuentos-db" "postgres" "postgres"

# 2. EliteScout
backup_postgres "msbross-elitescout-db" "postgres" "postgres"

# 3. JartosDTO
backup_postgres "jartosdto-postgres" "jartosdto" "jartosdto"

echo "--------------------------------------------------"
echo "Limpieza de backups antiguos (>${RETENTION_DAYS} días)..."

find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +$RETENTION_DAYS -exec rm -f {} \;

echo "[✓] Proceso de backup completado."
echo "=================================================="
