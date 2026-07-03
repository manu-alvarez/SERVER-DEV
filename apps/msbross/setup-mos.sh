#!/usr/bin/env bash
# ===========================================================================
# MSBrOSs - Main Installation Orchestrator
# Mobile System Based on Ubuntu + XFCE4 + macOS Aesthetics
# ===========================================================================
# This script orchestrates the complete installation of MSBrOSs.
# Run: bash setup-mos.sh [--step N] [--mode minimal|full]
#
# Usage:
#   bash setup-mos.sh             - Run full installation
#   bash setup-mos.sh --step 1    - Run only step 1 (core deps)
#   bash setup-mos.sh --step 2-4  - Run steps 2 through 4
#   bash setup-mos.sh --mode minimal - Install minimal setup
#
# ===========================================================================

set -o errexit
set -o pipefail
set -o nounset

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export MOS_ROOT="${MOS_ROOT:-${HOME}/msbross}"
export MOS_DISTRO_NAME="${MOS_DISTRO_NAME:-msbross-ubuntu}"

source "${SCRIPT_DIR}/scripts/lib/common.sh"

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
readonly STEPS_DIR="${SCRIPT_DIR}/scripts"
readonly START_STEP="${MOS_START_STEP:-1}"
readonly END_STEP="${MOS_END_STEP:-6}"
readonly INSTALL_MODE="${MOS_INSTALL_MODE:-full}"

declare -A STEP_NAMES=(
    [1]="Core Dependencies (PRoot + XFCE4 + VNC)"
    [2]="macOS-Style UI Themes"
    [3]="VNC Server Configuration"
    [4]="XFCE4 Panel & Desktop Customization"
    [5]="Mobile Performance Optimization"
    [6]="Application Installation"
)

declare -A STEP_SCRIPTS=(
    [1]="01-core-deps.sh"
    [2]="02-ui-themes.sh"
    [3]="03-vnc-setup.sh"
    [4]="04-xfce-config.sh"
    [5]="05-optimize.sh"
    [6]="06-apps.sh"
)

# ---------------------------------------------------------------------------
# Parse arguments
# ---------------------------------------------------------------------------
parse_args() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --step|-s)
                if [[ "$2" =~ ^([0-9]+)-([0-9]+)$ ]]; then
                    export MOS_START_STEP="${BASH_REMATCH[1]}"
                    export MOS_END_STEP="${BASH_REMATCH[2]}"
                elif [[ "$2" =~ ^[0-9]+$ ]]; then
                    export MOS_START_STEP="$2"
                    export MOS_END_STEP="$2"
                else
                    log_error "Invalid step format. Use: --step N or --step N-M"
                    exit 1
                fi
                shift 2
                ;;
            --mode|-m)
                export MOS_INSTALL_MODE="$2"
                if [[ ! "${MOS_INSTALL_MODE}" =~ ^(minimal|dev|full)$ ]]; then
                    log_error "Invalid mode '${MOS_INSTALL_MODE}'. Use: minimal, dev, or full"
                    exit 1
                fi
                shift 2
                ;;
            --list|-l)
                echo "Available installation steps:"
                for i in $(seq 1 6); do
                    echo "  ${i}. ${STEP_NAMES[$i]}"
                done
                exit 0
                ;;
            --help|-h)
                echo "MSBrOSs Installer"
                echo ""
                echo "Usage: bash setup-mos.sh [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --step N, -s N       Run only step N"
                echo "  --step N-M, -s N-M   Run steps N through M"
                echo "  --mode MODE, -m MODE  Installation mode: minimal, dev, full"
                echo "  --list, -l           List available steps"
                echo "  --help, -h           Show this help"
                echo ""
                echo "Examples:"
                echo "  bash setup-mos.sh                Full installation"
                echo "  bash setup-mos.sh --step 1        Only install core deps"
                echo "  bash setup-mos.sh --step 1-3      Steps 1 through 3"
                echo "  bash setup-mos.sh --mode minimal  Minimal installation"
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                echo "Use --help for usage information."
                exit 1
                ;;
        esac
    done

    # Apply parsed values
    START_STEP="${MOS_START_STEP:-1}"
    END_STEP="${MOS_END_STEP:-6}"
}

# ---------------------------------------------------------------------------
# Pre-flight checks
# ---------------------------------------------------------------------------
pre_flight_check() {
    log_step "Pre-flight Checks"

    local platform
    platform=$(detect_platform)
    log_info "Detected platform: ${platform}"

    # Check for required tools on the host
    local required_tools=()
    case "${platform}" in
        termux)
            required_tools=(proot-distro pkg)
            ;;
        linux)
            required_tools=(wget curl)
            ;;
        ios)
            required_tools=(wget curl)
            log_warn "iOS detected. Some features may need VNC client."
            ;;
    esac

    local missing=0
    for tool in "${required_tools[@]}"; do
        if ! check_dependency "${tool}"; then
            missing=$((missing + 1))
        fi
    done

    if [[ ${missing} -gt 0 ]]; then
        log_warn "${missing} required tool(s) missing. Install them first."
        if [[ "${platform}" == "termux" ]]; then
            log_info "Run: pkg update && pkg install proot-distro"
        fi
    fi

    # Create MSBrOSs root directory
    ensure_dir "${MOS_ROOT}"
    log_info "Installation root: ${MOS_ROOT}"
    log_info "Installation mode: ${INSTALL_MODE}"
    log_info "Steps to run: ${START_STEP} → ${END_STEP}"

    log_success "Pre-flight checks complete"
}

# ---------------------------------------------------------------------------
# Run specific step
# ---------------------------------------------------------------------------
run_step() {
    local step_num=$1
    local script_name="${STEP_SCRIPTS[$step_num]}"
    local step_name="${STEP_NAMES[$step_num]}"
    local script_path="${STEPS_DIR}/${script_name}"

    log_info "Running Step ${step_num}: ${step_name}"

    if [[ ! -f "${script_path}" ]]; then
        log_error "Script not found: ${script_path}"
        return 1
    fi

    # Make executable
    chmod +x "${script_path}"

    # Run with mode parameter for step 6
    if [[ ${step_num} -eq 6 ]]; then
        bash "${script_path}" "${INSTALL_MODE}"
    else
        bash "${script_path}"
    fi

    local exit_code=$?
    if [[ ${exit_code} -eq 0 ]]; then
        log_success "Step ${step_num} completed successfully"
    else
        log_error "Step ${step_num} failed with exit code ${exit_code}"
        return 1
    fi
}

# ---------------------------------------------------------------------------
# Installation summary
# ---------------------------------------------------------------------------
print_summary() {
    log_step "Installation Complete!"

    echo ""
    echo -e "${BOLD}MSBrOSs has been installed successfully!${RESET}"
    echo ""
    echo "To launch your system:"
    echo ""
    echo -e "  ${CYAN}bash start-mos.sh${RESET}"
    echo ""
    echo "This will:"
    echo "  1. Start D-BUS session"
    echo "  2. Launch XFCE4 desktop environment"
    echo "  3. Start TigerVNC server"
    echo "  4. Show connection details"
    echo ""
    echo "Connection Information:"
    echo -e "  VNC Address:  ${GREEN}localhost:5901${RESET}"
    echo -e "  VNC Password: ${YELLOW}msbross${RESET}"
    echo ""
    echo "Quick Commands:"
    echo -e "  ${CYAN}~/.local/bin/vnc-start${RESET}   - Start VNC manually"
    echo -e "  ${CYAN}~/.local/bin/vnc-stop${RESET}    - Stop VNC server"
    echo -e "  ${CYAN}~/.local/bin/mos-cleanup${RESET} - Clean memory & cache"
    echo ""
    echo "Access Methods:"
    echo -e "  • ${BOLD}Android:${RESET} Install bVNC or RealVNC Viewer from Play Store"
    echo -e "  • ${BOLD}iOS:${RESET}     Use noVNC via browser or VNC Viewer app"
    echo -e "  • ${BOLD}Desktop:${RESET} Use any VNC client (Remmina, TigerVNC)"
    echo ""
    echo -e "${YELLOW}IMPORTANT:${RESET} Change the default VNC password after first login:"
    echo -e "  Run inside PRoot: ${CYAN}vncpasswd${RESET}"
    echo ""

    log_success "Enjoy your MSBrOSs virtual mobile OS!"
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
main() {
    parse_args "$@"

    log_banner

    log_info "MSBrOSs Installer v1.0.0"
    log_info "Starting installation (steps ${START_STEP}-${END_STEP}, mode: ${INSTALL_MODE})..."

    pre_flight_check

    local failed=0
    for step in $(seq "${START_STEP}" "${END_STEP}"); do
        echo ""
        if ! run_step "${step}"; then
            failed=$((failed + 1))
            log_error "Installation failed at step ${step}"
            log_info "You can resume from step ${step} by running:"
            echo -e "  ${CYAN}bash setup-mos.sh --step ${step}${RESET}"
            break
        fi
    done

    if [[ ${failed} -eq 0 ]]; then
        print_summary
    else
        log_error "Installation completed with ${failed} error(s)"
        exit 1
    fi
}

main "$@"
