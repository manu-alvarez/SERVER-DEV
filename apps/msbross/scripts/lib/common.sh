#!/usr/bin/env bash
# ===========================================================================
# MSBrOSs - Common Library
# Shared functions, colors, logging, and error handling
# ===========================================================================

set -o errexit
set -o pipefail
set -o nounset

# ---------------------------------------------------------------------------
# Color definitions
# ---------------------------------------------------------------------------
readonly RESET='\033[0m'
readonly BOLD='\033[1m'
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[0;33m'
readonly BLUE='\033[0;34m'
readonly MAGENTA='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly WHITE='\033[0;37m'

# ---------------------------------------------------------------------------
# Logging functions
# ---------------------------------------------------------------------------
log_info() {
    echo -e "${BLUE}[INFO]${RESET} $*"
}

log_success() {
    echo -e "${GREEN}[OK]${RESET} $*"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${RESET} $*"
}

log_error() {
    echo -e "${RED}[ERROR]${RESET} $*" >&2
}

log_step() {
    echo ""
    echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════════${RESET}"
    echo -e "${BOLD}${CYAN}  $*${RESET}"
    echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════════${RESET}"
    echo ""
}

log_banner() {
    echo ""
    echo -e "${BOLD}${MAGENTA}"
    echo '  __  __ ____  _____            ____   ___  '
    echo ' |  \/  / __|| __\ \    /\    /|___ \ / _ \ '
    echo ' | |\/| \__ \| _| \ \  /  \  / | __) | (_) |'
    echo ' |_|  |_|___/|_|   \_\/\_\/\_\_|____/ \___/ '
    echo ""
    echo -e "  ${WHITE}Mobile System Based on Ubuntu + XFCE4${RESET}"
    echo -e "  ${CYAN}v1.0.0${RESET}"
    echo -e "${RESET}"
    echo ""
}

# ---------------------------------------------------------------------------
# Error handling
# ---------------------------------------------------------------------------
handle_error() {
    local exit_code=$?
    local line_no=$1
    log_error "Fatal error on line ${line_no}. Exit code: ${exit_code}"
    log_error "Check logs above for details."
    exit "${exit_code}"
}

trap 'handle_error $LINENO' ERR

# ---------------------------------------------------------------------------
# System detection
# ---------------------------------------------------------------------------
detect_arch() {
    case "$(uname -m)" in
        aarch64|arm64)
            echo "arm64"
            ;;
        x86_64|amd64)
            echo "amd64"
            ;;
        armv7l|armhf)
            echo "armhf"
            ;;
        *)
            echo "unknown"
            ;;
    esac
}

detect_platform() {
    if [[ -n "${TERMUX_VERSION:-}" ]]; then
        echo "termux"
    elif [[ "$(uname -s)" == "Darwin" ]]; then
        echo "ios"
    elif [[ -f "/proc/sys/kernel/osrelease" ]] && grep -qi "android" "/proc/sys/kernel/osrelease" 2>/dev/null; then
        echo "android"
    else
        echo "linux"
    fi
}

# ---------------------------------------------------------------------------
# File helpers
# ---------------------------------------------------------------------------
ensure_dir() {
    mkdir -p "$1"
}

backup_file() {
    local file="$1"
    if [[ -f "${file}" ]]; then
        cp "${file}" "${file}.bak.$(date +%Y%m%d%H%M%S)"
        log_info "Backed up ${file}"
    fi
}

# ---------------------------------------------------------------------------
# Progress / Spinner
# ---------------------------------------------------------------------------
spinner() {
    local pid=$1
    local delay=0.1
    local spinstr='|/-\'
    while ps a | awk '{print $1}' | grep -q "${pid}" 2>/dev/null; do
        local temp=${spinstr#?}
        printf " [%c]  " "${spinstr}"
        local spinstr=${temp}${spinstr%"${temp}"}
        sleep ${delay}
        printf "\b\b\b\b\b\b"
    done
    printf "    \b\b\b\b"
}

# ---------------------------------------------------------------------------
# Dependency check
# ---------------------------------------------------------------------------
check_dependency() {
    if ! command -v "$1" &>/dev/null; then
        log_warn "Missing dependency: $1"
        return 1
    fi
    return 0
}

require_root_or_proot() {
    if [[ "${EUID:-$(id -u)}" -eq 0 ]]; then
        log_info "Running as root"
        return 0
    fi
    if [[ -n "${PROOT_ROOT:-}" ]]; then
        log_info "Running inside PRoot environment"
        return 0
    fi
    log_warn "Running without root. Some operations may fail."
    return 1
}
