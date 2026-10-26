#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

show_help() {
    echo "LiteLLM Proxy - Control Script"
    echo ""
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Commands:"
    echo "  install          Install auto-start service (launchd)"
    echo "  uninstall        Remove auto-start service"
    echo "  start            Start the proxy"
    echo "  stop             Stop the proxy (and watchdog)"
    echo "  restart          Restart the proxy"
    echo "  status           Show proxy and watchdog status"
    echo "  wake             Wake the proxy from idle"
    echo "  sleep            Stop the proxy (idle mode)"
    echo "  logs             Show proxy logs"
    echo "  watchdog-logs    Show watchdog logs"
    echo "  health           Run health check"
    echo "  test             Test completion"
    echo "  models           List available models"
    echo "  setup            Run setup (extract keys from vault)"
    echo "  migrate          Migrate apps to use LiteLLM"
    echo "  help             Show this help"
    echo ""
    echo "Options:"
    echo "  --timeout N      Idle timeout in seconds (default: 600)"
    echo "  --interval N     Check interval in seconds (default: 60)"
    echo ""
    echo "Examples:"
    echo "  $0 install                    # Install auto-start"
    echo "  $0 start                      # Start proxy now"
    echo "  $0 status                     # Check status"
    echo "  $0 wake                       # Wake from idle"
    echo "  $0 --timeout 300 start        # Start with 5min idle timeout"
}

log_info() { echo -e "${BLUE}ℹ${NC} $*"; }
log_ok() { echo -e "${GREEN}✅${NC} $*"; }
log_warn() { echo -e "${YELLOW}⚠️${NC} $*"; }
log_error() { echo -e "${RED}❌${NC} $*"; }

get_api_key() {
    grep LITELLM_API_KEY "$SCRIPT_DIR/.env" 2>/dev/null | cut -d= -f2 || echo ""
}

cmd_install() {
    log_info "Installing auto-start service..."
    "$SCRIPT_DIR/install-service.sh"
}

cmd_uninstall() {
    log_info "Removing auto-start service..."
    "$SCRIPT_DIR/uninstall-service.sh"
}

cmd_start() {
    log_info "Starting LiteLLM proxy..."
    (cd "$SCRIPT_DIR" && docker compose up -d)
    sleep 3
    
    if docker ps --format '{{.Names}}' | grep -q "litellm-proxy"; then
        log_ok "Proxy started"
        
        # Wait for health
        for i in {1..10}; do
            if curl -sf "http://localhost:4000/health" >/dev/null 2>&1; then
                log_ok "Proxy is healthy"
                return 0
            fi
            sleep 1
        done
        log_warn "Proxy started but health check pending"
    else
        log_error "Failed to start proxy"
        return 1
    fi
}

cmd_stop() {
    log_info "Stopping LiteLLM proxy..."
    (cd "$SCRIPT_DIR" && docker compose down)
    log_ok "Proxy stopped"
}

cmd_restart() {
    cmd_stop
    sleep 2
    cmd_start
}

cmd_status() {
    echo "=== LiteLLM Proxy Status ==="
    echo ""
    
    # Container status
    if docker ps --format '{{.Names}}' | grep -q "litellm-proxy"; then
        echo -e "Container: ${GREEN}Running${NC}"
        docker ps --filter "name=litellm-proxy" --format "   ID: {{.ID}}\n   Image: {{.Image}}\n   Uptime: {{.Status}}\n   Ports: {{.Ports}}"
    else
        echo -e "Container: ${YELLOW}Stopped${NC}"
    fi
    
    # Health
    echo ""
    if curl -sf "http://localhost:4000/health" >/dev/null 2>&1; then
        echo -e "Health: ${GREEN}OK${NC}"
    else
        echo -e "Health: ${YELLOW}Unreachable${NC}"
    fi
    
    # Watchdog
    echo ""
    if pgrep -f "watchdog.sh" >/dev/null 2>&1; then
        echo -e "Watchdog: ${GREEN}Running${NC} (PID: $(pgrep -f 'watchdog.sh' | head -1))"
    else
        echo -e "Watchdog: ${YELLOW}Not running${NC}"
    fi
    
    # Service
    echo ""
    if launchctl list | grep -q "com.user.litellm-proxy"; then
        echo -e "Auto-start: ${GREEN}Installed${NC}"
    else
        echo -e "Auto-start: ${YELLOW}Not installed${NC}"
    fi
    
    # Endpoint
    echo ""
    API_KEY=$(get_api_key)
    if [ -n "$API_KEY" ]; then
        echo "Endpoint: http://localhost:4000/v1"
        echo "API Key: ${API_KEY:0:20}..."
    else
        echo -e "API Key: ${RED}Not configured${NC}"
    fi
}

cmd_wake() {
    log_info "Waking proxy..."
    "$SCRIPT_DIR/wake.sh" wake
}

cmd_sleep() {
    log_info "Stopping proxy (idle mode)..."
    cmd_stop
}

cmd_logs() {
    docker logs litellm-proxy -f --tail 100
}

cmd_watchdog_logs() {
    if [ -f "$SCRIPT_DIR/logs/watchdog.log" ]; then
        tail -f "$SCRIPT_DIR/logs/watchdog.log"
    else
        log_warn "No watchdog logs found"
    fi
}

cmd_health() {
    "$SCRIPT_DIR/verify.sh"
}

cmd_test() {
    API_KEY=$(get_api_key)
    if [ -z "$API_KEY" ]; then
        log_error "API key not configured. Run ./setup.sh first"
        return 1
    fi
    
    log_info "Testing proxy..."
    curl -s http://localhost:4000/v1/chat/completions \
        -H "Authorization: Bearer $API_KEY" \
        -H "Content-Type: application/json" \
        -d '{"model":"openai/gpt-4o-mini","messages":[{"role":"user","content":"ping"}],"max_tokens":1}' | jq .
}

cmd_models() {
    API_KEY=$(get_api_key)
    if [ -z "$API_KEY" ]; then
        log_error "API key not configured"
        return 1
    fi
    
    curl -s http://localhost:4000/v1/models \
        -H "Authorization: Bearer $API_KEY" | jq '.data[].id'
}

cmd_setup() {
    "$SCRIPT_DIR/setup.sh"
}

cmd_migrate() {
    "$SCRIPT_DIR/migrate-apps.sh"
}

# Parse options
while [[ $# -gt 0 ]]; do
    case $1 in
        --timeout)
            IDLE_TIMEOUT="$2"
            export IDLE_TIMEOUT
            shift 2
            ;;
        --interval)
            CHECK_INTERVAL="$2"
            export CHECK_INTERVAL
            shift 2
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            COMMAND="$1"
            shift
            ;;
    esac
done

# Execute command
case "${COMMAND:-help}" in
    install) cmd_install ;;
    uninstall) cmd_uninstall ;;
    start) cmd_start ;;
    stop) cmd_stop ;;
    restart) cmd_restart ;;
    status) cmd_status ;;
    wake) cmd_wake ;;
    sleep) cmd_sleep ;;
    logs) cmd_logs ;;
    watchdog-logs) cmd_watchdog_logs ;;
    health) cmd_health ;;
    test) cmd_test ;;
    models) cmd_models ;;
    setup) cmd_setup ;;
    migrate) cmd_migrate ;;
    help) show_help ;;
    *) 
        log_error "Unknown command: $COMMAND"
        show_help
        exit 1
        ;;
esac
