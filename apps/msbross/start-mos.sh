#!/usr/bin/env bash
# ===========================================================================
# MSBrOSs - Launch Script
# Starts D-BUS, XFCE4, and VNC server for mobile access
# ===========================================================================
# Usage:
#   bash start-mos.sh              - Launch with default settings
#   bash start-mos.sh --res 2340x1080 - Custom resolution (portrait)
#   bash start-mos.sh --port 5902  - Custom port
#   bash start-mos.sh --novnc      - Start only noVNC web server
#   bash start-mos.sh --stop       - Stop running instance
#   bash start-mos.sh --status     - Check status
#
# ===========================================================================

set -o errexit
set -o pipefail
# nounset disabled for safety with optional env vars

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/scripts/lib/common.sh"

# ---------------------------------------------------------------------------
# Defaults
# ---------------------------------------------------------------------------
MOS_DISTRO_NAME="${MOS_DISTRO_NAME:-msbross-ubuntu}"
MOS_DISPLAY="${MOS_DISPLAY:-:1}"
MOS_VNC_PORT="${MOS_VNC_PORT:-5901}"
MOS_RESOLUTION="${MOS_RESOLUTION:-1920x1080}"
MOS_DEPTH="${MOS_DEPTH:-24}"
MOS_VNC_PASSWORD="${MOS_VNC_PASSWORD:-msbross}"
MOS_LOG_DIR="${MOS_LOG_DIR:-${HOME}/.msbross/logs}"

# ---------------------------------------------------------------------------
# Parse arguments
# ---------------------------------------------------------------------------
parse_args() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --res|--resolution)
                MOS_RESOLUTION="$2"
                shift 2
                ;;
            --port)
                MOS_VNC_PORT="$2"
                MOS_DISPLAY=":$((MOS_VNC_PORT - 5900))"
                shift 2
                ;;
            --password)
                MOS_VNC_PASSWORD="$2"
                shift 2
                ;;
            --novnc)
                MODE="novnc"
                shift
                ;;
            --stop)
                MODE="stop"
                shift
                ;;
            --restart)
                MODE="restart"
                shift
                ;;
            --status)
                MODE="status"
                shift
                ;;
            --help|-h)
                echo "MSBrOSs Launcher v1.0.0"
                echo ""
                echo "Usage: bash start-mos.sh [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --res WxH            Resolution (default: 1920x1080)"
                echo "  --port N             VNC port (default: 5901)"
                echo "  --password PWD       VNC password (default: msbross)"
                echo "  --novnc              Start noVNC web server"
                echo "  --stop               Stop running instance"
                echo "  --restart            Restart everything"
                echo "  --status             Show status"
                echo "  --help, -h           Show this help"
                echo ""
                echo "Examples:"
                echo "  bash start-mos.sh                              # Default launch"
                echo "  bash start-mos.sh --res 2340x1080              # Portrait mode"
                echo "  bash start-mos.sh --port 5902                  # Custom port"
                echo "  bash start-mos.sh --res 2560x1600 --port 5903  # Tablet resolution"
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                echo "Use --help for usage information."
                exit 1
                ;;
        esac
    done
}

# ---------------------------------------------------------------------------
# Check if already running
# ---------------------------------------------------------------------------
check_running() {
    if proot-distro login "${MOS_DISTRO_NAME}" -- bash -c "pgrep -x Xvnc >/dev/null 2>&1"; then
        return 0
    fi
    return 1
}

# ---------------------------------------------------------------------------
# Status display
# ---------------------------------------------------------------------------
show_status() {
    log_step "MSBrOSs Status"

    echo -e "Distro:       ${MOS_DISTRO_NAME}"
    echo -e "VNC Display:  ${MOS_DISPLAY}"
    echo -e "VNC Port:     ${MOS_VNC_PORT}"

    if check_running; then
        echo -e "Status:       ${GREEN}Running${RESET}"
        echo ""
        proot-distro login "${MOS_DISTRO_NAME}" -- bash -c "
            echo 'VNC Processes:'
            vncserver -list 2>&1
            echo ''
            echo 'Memory Usage:'
            free -h | head -2
        "
    else
        echo -e "Status:       ${YELLOW}Not running${RESET}"
    fi
}

# ---------------------------------------------------------------------------
# Stop
# ---------------------------------------------------------------------------
stop_msbross() {
    log_step "Stopping MSBrOSs"

    log_info "Stopping VNC server..."
    proot-distro login "${MOS_DISTRO_NAME}" -- bash -c "
        vncserver -kill '${MOS_DISPLAY}' 2>/dev/null || true
        killall -q xfce4-session 2>/dev/null || true
        killall -q xfdesktop 2>/dev/null || true
        killall -q plank 2>/dev/null || true
    " 2>/dev/null || true

    sleep 1
    log_success "MSBrOSs stopped"
}

# ---------------------------------------------------------------------------
# Start
# ---------------------------------------------------------------------------
start_msbross() {
    log_step "Starting MSBrOSs"

    # Ensure log directory
    ensure_dir "${MOS_LOG_DIR}"

    local log_file="${MOS_LOG_DIR}/msbross-$(date +%Y%m%d-%H%M%S).log"

    log_info "Launching Ubuntu PRoot environment..."

    # -----------------------------------------------------------------------
    # Launch inside PRoot
    # -----------------------------------------------------------------------
    proot-distro login "${MOS_DISTRO_NAME}" -- bash -s << LAUNCHSCRIPT
set -o errexit
set -o pipefail

export DISPLAY="${MOS_DISPLAY}"
export MOS_LOG_FILE="${log_file}"

echo "[MSBrOSs] Initializing environment..."

# ---------------------------------------------------------------------------
# Step 1: Start D-BUS
# ---------------------------------------------------------------------------
echo "[MSBrOSs] Starting D-BUS session..."
if [ -z "\${DBUS_SESSION_BUS_ADDRESS:-}" ]; then
    eval "\$(dbus-launch --sh-syntax --exit-with-session)" 2>/dev/null || {
        dbus-daemon --session --address="\${DBUS_SESSION_BUS_ADDRESS:-unix:path=/run/dbus/session}" --fork 2>/dev/null || true
    }
fi
sleep 1

# ---------------------------------------------------------------------------
# Step 2: Environment
# ---------------------------------------------------------------------------
echo "[MSBrOSs] Setting environment variables..."
export XKL_XMODMAP_DISABLE=1
export XDG_SESSION_TYPE=x11
export XDG_SESSION_DESKTOP=XFCE
export XDG_CURRENT_DESKTOP=XFCE
export DESKTOP_SESSION=XFCE
export SHELL=/bin/bash
export QT_QPA_PLATFORMTHEME=gtk2
export GDK_SCALE=1
export GDK_DPI_SCALE=1.5
export ELM_SCALE=1.5
export QT_AUTO_SCREEN_SET_SCALE_FACTOR=1

# ---------------------------------------------------------------------------
# Step 3: Kill existing session
# ---------------------------------------------------------------------------
echo "[MSBrOSs] Cleaning previous session..."
vncserver -kill "${MOS_DISPLAY}" 2>/dev/null || true
sleep 1

# ---------------------------------------------------------------------------
# Step 4: Start VNC Server
# ---------------------------------------------------------------------------
echo "[MSBrOSs] Starting VNC server..."
echo "  Display:  ${MOS_DISPLAY}"
echo "  Resolution: ${MOS_RESOLUTION}"
echo "  Depth:    ${MOS_DEPTH}"

vncserver "${MOS_DISPLAY}" \
    -geometry "${MOS_RESOLUTION}" \
    -depth "${MOS_DEPTH}" \
    -localhost no \
    -alwaysshared \
    -SecurityTypes VncAuth \
    -MaxFPS 30 \
    -FrameRate 30 2>&1 | tee -a /tmp/vnc-startup.log

VNC_EXIT=\${PIPESTATUS[0]}
if [ \${VNC_EXIT} -ne 0 ]; then
    echo "[MSBrOSs] ERROR: VNC server failed to start (exit code: \${VNC_EXIT})"
    echo "[MSBrOSs] Check /tmp/vnc-startup.log for details"
    exit 1
fi

# Give it a moment
sleep 2

# Verify VNC is running
vncserver -list 2>&1
echo ""

# ---------------------------------------------------------------------------
# Step 5: Set VNC password if not set
# ---------------------------------------------------------------------------
if [ ! -f "\${HOME}/.vnc/passwd" ]; then
    echo "[MSBrOSs] Setting default VNC password..."
    echo "${MOS_VNC_PASSWORD}" | vncpasswd -f > "\${HOME}/.vnc/passwd" 2>/dev/null
    chmod 600 "\${HOME}/.vnc/passwd"
fi

# ---------------------------------------------------------------------------
# Step 6: Start XFCE4
# ---------------------------------------------------------------------------
echo "[MSBrOSs] Launching XFCE4 desktop environment..."
echo "[MSBrOSs] Desktop session should appear in 5-15 seconds"

# Disable XFCE power management and screensaver
xset s off 2>/dev/null || true
xset s noblank 2>/dev/null || true
xset -dpms 2>/dev/null || true

# Start desktop session
startxfce4 &
XFCE_PID=\$!
echo "[MSBrOSs] XFCE4 PID: \${XFCE_PID}"

# Wait for XFCE to initialize
sleep 5

# Start Plank dock
if command -v plank &>/dev/null; then
    echo "[MSBrOSs] Starting Plank dock..."
    plank &
    PLANK_PID=\$!
    echo "[MSBrOSs] Plank PID: \${PLANK_PID}"
fi

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------
echo ""
echo "========================================================"
echo " MSBrOSs is RUNNING"
echo "========================================================"
echo ""
echo " Connect via VNC:"
echo "   Address:   localhost:${MOS_VNC_PORT}"
echo "   Display:   ${MOS_DISPLAY}"
echo "   Password:  ${MOS_VNC_PASSWORD}"
echo "   Resolution: ${MOS_RESOLUTION}"
echo ""
echo " Access from:"
echo "   Android:   bVNC / RealVNC Viewer"
echo "   iOS:       VNC Viewer / Screens"
echo "   Desktop:   Remmina / TigerVNC"
echo ""
echo " Commands:"
echo "   vnc-start     - Start VNC"
echo "   vnc-stop      - Stop VNC"
echo "   mos-cleanup   - Clean memory"
echo ""
echo "========================================================"

# Keep session alive
wait \${XFCE_PID}
LAUNCHSCRIPT

    local exit_code=$?
    if [[ ${exit_code} -eq 0 ]]; then
        log_success "MSBrOSs session ended cleanly"
    else
        log_warn "MSBrOSs session ended with exit code ${exit_code}"
    fi
}

# ---------------------------------------------------------------------------
# noVNC mode (optional - requires websockify)
# ---------------------------------------------------------------------------
start_novnc() {
    log_step "Starting noVNC Web Server"

    local novnc_dir="${MOS_ROOT}/noVNC"
    local vnc_port="${MOS_VNC_PORT}"
    local novnc_port="${1:-6080}"

    if [[ ! -d "${novnc_dir}" ]]; then
        log_info "Installing noVNC..."
        git clone --depth=1 https://github.com/novnc/noVNC.git "${novnc_dir}" 2>/dev/null
        git clone --depth=1 https://github.com/novnc/websockify.git "${novnc_dir}/utils/websockify" 2>/dev/null || true
    fi

    log_info "Starting noVNC proxy (port ${novnc_port} → VNC ${vnc_port})..."
    "${novnc_dir}/utils/novnc_proxy" \
        --vnc "localhost:${vnc_port}" \
        --listen "${novnc_port}" &
    NOVNC_PID=$!

    echo ""
    log_success "noVNC running!"
    echo "  Web Access: http://localhost:${novnc_port}/vnc.html"
    echo "  Connect to: localhost:${vnc_port}"
    echo ""
    log_warn "Open the URL above in your browser and click 'Connect'"
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
main() {
    parse_args "$@"

    case "${MODE:-}" in
        stop)
            stop_msbross
            exit 0
            ;;
        restart)
            stop_msbross
            sleep 2
            start_msbross
            ;;
        status)
            show_status
            exit 0
            ;;
        novnc)
            start_novnc
            exit 0
            ;;
        *)
            # Default: full launch
            log_banner
            log_info "MSBrOSs Launcher v1.0.0"
            log_info "Starting system (display=${MOS_DISPLAY}, port=${MOS_VNC_PORT}, res=${MOS_RESOLUTION})"

            # Check if already running
            if check_running; then
                log_warn "MSBrOSs is already running!"
                show_status
                echo ""
                echo "Use 'bash start-mos.sh --restart' to restart."
                echo "Use 'bash start-mos.sh --stop' to stop."
                exit 0
            fi

            start_msbross
            ;;
    esac
}

main "$@"
