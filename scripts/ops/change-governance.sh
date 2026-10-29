#!/bin/bash
# Change Governance: Validates system changes against baseline
set -euo pipefail

LOG="/var/log/msbross_change_governance.log"
ALERT_CONTACT="manu-alvarez"

log() { echo "$(date -Iseconds) $*" | tee -a "$LOG"; }

check_aide() {
    log "Running AIDE integrity check..."
    local result
    result=$(sudo aide --check 2>&1)
    local changes=$(echo "$result" | grep -c 'Missing\|Changed\|Added' || true)
    
    if [ "$changes" -gt 0 ]; then
        log "[ALERT] $changes file integrity changes detected!"
        echo "$result" | grep -E 'Missing|Changed|Added' >> "$LOG"
        # In production: send alert via webhook/email
        return 1
    else
        log "AIDE check passed: no integrity violations"
        return 0
    fi
}

check_immutable() {
    log "Checking immutable flag status..."
    local files=(
        "/etc/ssh/sshd_config"
        "/etc/nginx/nginx.conf"
        "/home/ubuntu/MSBrossAI/docker-compose.yml"
        "/home/ubuntu/.ssh/authorized_keys"
    )
    
    for f in "${files[@]}"; do
        if [ -f "$f" ]; then
            local attrs=$(lsattr "$f" 2>/dev/null | awk '{print $1}')
            if [[ ! $attrs == *i* ]]; then
                log "[WARNING] Immutable flag missing on: $f"
            fi
        fi
    done
}

check_auditd() {
    log "Checking auditd status..."
    if [ "$(sudo systemctl is-active auditd)" != "active" ]; then
        log "[ALERT] Auditd is not running!"
        return 1
    fi
}

case "${1:-full}" in
    full)
        check_auditd
        check_aide
        check_immutable
        ;;
    aide) check_aide ;;
    immutable) check_immutable ;;
    audit) check_auditd ;;
    *) echo "Usage: change-governance.sh {full|aide|immutable|audit}" ;;
esac
