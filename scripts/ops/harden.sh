#!/bin/bash
# MSBROSS HARDENING MANAGEMENT
# Usage: harden.sh {lock|unlock|check|status} <file>

set -euo pipefail

LOG="/var/log/msbross_harden.log"
IMMUTABLE_DIRS=(
    "/etc/ssh"
    "/etc/nginx"
    "/etc/fail2ban"
    "/etc/docker"
    "/home/ubuntu/MSBrossAI"
    "/home/ubuntu/.ssh"
)

log() { echo "$(date -Iseconds) $*" | tee -a "$LOG"; }

check_immutable() {
    local file=$1
    if [ -f "$file" ]; then
        local attrs=$(lsattr "$file" 2>/dev/null | awk '{print $1}')
        if [[ $attrs == *i* ]]; then
            echo "[IMMUTABLE] $file"
        else
            echo "[MODIFIABLE] $file"
        fi
    else
        echo "[NOT FOUND] $file"
    fi
}

cmd_lock() {
    local file=$1
    if [ -z "$file" ]; then
        echo "Usage: harden.sh lock <file>"
        echo "Locking all hardened files..."
        for dir in "${IMMUTABLE_DIRS[@]}"; do
            find "$dir" -type f -exec sudo chattr +i {} \; 2>/dev/null || true
        done
        log "All files in hardened dirs locked"
    else
        sudo chattr +i "$file"
        log "Locked: $file"
        check_immutable "$file"
    fi
}

cmd_unlock() {
    local file=$1
    if [ -z "$file" ]; then
        echo "Usage: harden.sh unlock <file>"
        echo "UNLOCKING ALL - THIS IS DANGEROUS!"
        read -p "Type YES to confirm: " confirm
        [ "$confirm" = "YES" ] || exit 1
        for dir in "${IMMUTABLE_DIRS[@]}"; do
            find "$dir" -type f -exec sudo chattr -i {} \; 2>/dev/null || true
        done
        log "ALL files UNLOCKED - DANGER ZONE"
    else
        sudo chattr -i "$file"
        log "Unlocked: $file"
        check_immutable "$file"
    fi
}

cmd_check() {
    echo "=== IMMUTABLE FILE STATUS ==="
    for dir in "${IMMUTABLE_DIRS[@]}"; do
        echo "--- $dir ---"
        find "$dir" -type f 2>/dev/null | while read f; do
            check_immutable "$f"
        done
    done
}

cmd_status() {
    echo "=== SYSTEM HARDENING STATUS ==="
    echo "--- AIDE ---"
    sudo aide --check 2>&1 | tail -10 || echo "AIDE not initialized"
    echo "--- AUDITD ---"
    sudo systemctl is-active auditd
    echo "--- IMMUTABLE FLAGS ---"
    cmd_check
}

case "${1:-}" in
    lock) cmd_lock "${2:-}" ;;
    unlock) cmd_unlock "${2:-}" ;;
    check) cmd_check ;;
    status) cmd_status ;;
    *) echo "Usage: harden.sh {lock|unlock|check|status} [file]" ;;
esac
