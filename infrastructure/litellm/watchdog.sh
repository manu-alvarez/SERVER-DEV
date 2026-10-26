#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.yml"
CONTAINER_NAME="litellm-proxy"
PORT=4000

# Config
IDLE_TIMEOUT="${IDLE_TIMEOUT:-600}"  # 10 minutes default
CHECK_INTERVAL="${CHECK_INTERVAL:-60}"  # Check every minute
AUTO_START="${AUTO_START:-true}"

STATE_FILE="$SCRIPT_DIR/.litellm-idle"
touch "$STATE_FILE"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$SCRIPT_DIR/watchdog.log"
}

get_request_count() {
    if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        docker logs "$CONTAINER_NAME" --since "${CHECK_INTERVAL}s" 2>/dev/null | \
            grep -cE "POST.*(v1/chat/completions|v1/completions|v1/embeddings)" || echo 0
    else
        echo 0
    fi
}

is_container_running() {
    docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"
}

start_proxy() {
    log "Starting LiteLLM proxy..."
    cd "$SCRIPT_DIR" && docker compose up -d
    sleep 5
    
    # Verify health
    for i in {1..10}; do
        if curl -sf "http://localhost:${PORT}/health" >/dev/null 2>&1; then
            log "Proxy is healthy and ready"
            return 0
        fi
        sleep 2
    done
    
    log "WARNING: Proxy started but health check failed"
    return 1
}

stop_proxy() {
    log "Stopping LiteLLM proxy (idle for ${IDLE_TIMEOUT}s)"
    cd "$SCRIPT_DIR" && docker compose down
    log "Proxy stopped to save resources"
}

update_idle_timestamp() {
    date +%s > "$STATE_FILE"
}

get_idle_seconds() {
    if [ -f "$STATE_FILE" ]; then
        local last=$(cat "$STATE_FILE" 2>/dev/null || echo 0)
        local now=$(date +%s)
        echo $((now - last))
    else
        echo 0
    fi
}

# Main loop
log "Watchdog started (timeout=${IDLE_TIMEOUT}s, check=${CHECK_INTERVAL}s, auto-start=${AUTO_START})"

# Auto-start on boot if enabled
if [ "$AUTO_START" = "true" ]; then
    if ! is_container_running; then
        log "Auto-starting proxy..."
        start_proxy
    fi
    update_idle_timestamp
fi

while true; do
    if is_container_running; then
        requests=$(get_request_count)
        
        if [ "$requests" -gt 0 ]; then
            update_idle_timestamp
            log "Active: ${requests} requests in last ${CHECK_INTERVAL}s"
        else
            idle=$(get_idle_seconds)
            
            if [ "$idle" -ge "$IDLE_TIMEOUT" ]; then
                stop_proxy
            else
                log "Idle: ${idle}s/${IDLE_TIMEOUT}s"
            fi
        fi
    else
        # Proxy is stopped - stay quiet until manually started or auto-start triggers
        # We don't auto-restart here to avoid loops; only start_proxy() does that
        log "Proxy is stopped"
    fi
    
    sleep "$CHECK_INTERVAL"
done
