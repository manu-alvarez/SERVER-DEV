#!/usr/bin/env bash
# ===========================================================================
# MSBrOSs - Step 03: VNC Server Configuration
# Sets up TigerVNC with mobile-optimized resolution, xstartup, security
# ===========================================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/lib/common.sh"

MOS_DISTRO_NAME="msbross-ubuntu"
MOS_ROOT="${MOS_ROOT:-${HOME}/msbross}"
VNC_DIR="${MOS_ROOT}/.vnc"
VNC_PORT="${VNC_PORT:-5901}"
VNC_DISPLAY="${VNC_DISPLAY:-:1}"
VNC_RESOLUTION="${VNC_RESOLUTION:-1920x1080}"
VNC_DEPTH="${VNC_DEPTH:-24}"
VNC_PASSWORD="${VNC_PASSWORD:-msbross}"

setup_vnc_directory() {
    log_step "[1/5] Creating VNC directory structure"

    proot-distro login "${MOS_DISTRO_NAME}" -- bash -c "mkdir -p ${VNC_DIR}"
    log_success "VNC directory created at ${VNC_DIR}"
}

create_xstartup() {
    log_step "[2/5] Creating VNC xstartup script"

    proot-distro login "${MOS_DISTRO_NAME}" -- bash << 'XSTARTEOF'
        local vnc_dir="${HOME}/.vnc"
        mkdir -p "${vnc_dir}"

        cat > "${vnc_dir}/xstartup" << 'XSRIPT'
#!/bin/bash
# ===========================================================================
# MSBrOSs - VNC xstartup
# Launches XFCE4 session with mobile-optimized settings
# ===========================================================================

export XKL_XMODMAP_DISABLE=1
export XDG_SESSION_TYPE=x11
export XDG_SESSION_DESKTOP=XFCE
export XDG_CURRENT_DESKTOP=XFCE
export DESKTOP_SESSION=XFCE
export SHELL=/bin/bash

# Fix missing D-BUS session
if [ -z "${DBUS_SESSION_BUS_ADDRESS:-}" ]; then
    eval "$(dbus-launch --sh-syntax --exit-with-session)" 2>/dev/null || true
fi

# Set mobile-optimized environment
export QT_QPA_PLATFORMTHEME=gtk2
export GDK_SCALE=1
export GDK_DPI_SCALE=1.5
export ELM_SCALE=1.5
export QT_AUTO_SCREEN_SET_SCALE_FACTOR=1
export QT_SCREEN_SCALE_FACTORS=1.5

# Disable screen blanking and power saving
xset s off
xset s noblank
xset -dpms

# Set cursor theme
xsetroot -cursor_name left_ptr

# Start XFCE4 session
startxfce4 &
XFCE_PID=$!

# Start Plank dock
sleep 3
plank &
PLANK_PID=$!

# Wait for session to finish
wait ${XFCE_PID}
XSRIPT

        chmod +x "${vnc_dir}/xstartup"
        echo "xstartup created successfully"
XSTARTEOF
    log_success "VNC xstartup script created"
}

set_vnc_password() {
    log_step "[3/5] Setting VNC password"

    local password="${1:-msbross}"

    proot-distro login "${MOS_DISTRO_NAME}" -- bash << PWDEOF
        mkdir -p "${HOME}/.vnc"
        # Use expect-like approach to set password
        echo "${password}" | vncpasswd -f > "${HOME}/.vnc/passwd" 2>/dev/null || {
            # Fallback: use python to generate password hash
            python3 -c "
import subprocess, os
pwd = '${password}'
proc = subprocess.Popen(['vncpasswd', '-f'], stdin=subprocess.PIPE, stdout=subprocess.PIPE)
out, _ = proc.communicate(pwd.encode())
with open(os.path.expanduser('~/.vnc/passwd'), 'wb') as f:
    f.write(out)
" 2>/dev/null || {
                # Last resort: expect
                expect -c "
spawn vncpasswd
expect \"Password:\"
send \"${password}\r\"
expect \"Verify:\"
send \"${password}\r\"
expect eof
" 2>/dev/null || echo "Using default VNC password method"
            }
        }
        chmod 600 "${HOME}/.vnc/passwd"
        echo "VNC password configured"
PWDEOF
    log_success "VNC password set"
}

create_vnc_server_config() {
    log_step "[4/5] Creating VNC server configuration"

    proot-distro login "${MOS_DISTRO_NAME}" -- bash << 'CONFEOF'
        local vnc_dir="${HOME}/.vnc"

        # Main VNC server config
        cat > "${vnc_dir}/config" << VNCCONF
# MSBrOSs - TigerVNC Server Configuration
# Mobile-optimized settings

# Security
Authentication=VncAuth
PasswordFile=${HOME}/.vnc/passwd

# Session
Desktop=MSBrOSs
Session=xfce4
User=xfce4-session

# Geometry dimensions - optimized for mobile
Geometry=1920x1080
Depth=24
PixelFormat=RGB888

# Performance optimizations for mobile
FrameRate=30
MaxFPS=30
CompareFB=1
EnableRawFB=1
DisableDDT=1

# Accept connections
localhost=0
AlwaysShared=1
VNCCONF

        # Per-display config for display :1
        mkdir -p "${vnc_dir}/config.d"
        cat > "${vnc_dir}/config.d/XFCE" << DISPCONF
# Display :1 configuration
-desktop MSBrOSs
-localhost no
-alwaysshared
-nevershared
-FrameRate 30
-MaxFPS 30
DISPCONF

        echo "VNC configuration created"
CONFEOF
    log_success "VNC server configuration created"
}

create_vnc_start_stop_scripts() {
    log_step "[5/5] Creating VNC management scripts"

    proot-distro login "${MOS_DISTRO_NAME}" -- bash << 'MGMTEOF'
        local bin_dir="${HOME}/.local/bin"
        mkdir -p "${bin_dir}"

        # VNC Start script
        cat > "${bin_dir}/vnc-start" << 'STARTVNC'
#!/bin/bash
# MSBrOSs - Start VNC server
DISPLAY_NUM=${1:-1}
BASE_PORT=5900
VNC_PORT=$((BASE_PORT + DISPLAY_NUM))
RESOLUTION=${VNC_RESOLUTION:-1920x1080}
DEPTH=${VNC_DEPTH:-24}

echo "Starting MSBrOSs VNC on display :${DISPLAY_NUM} (port ${VNC_PORT})"
echo "Resolution: ${RESOLUTION} @ ${DEPTH}bit"

# Kill existing session on this display
vncserver -kill ":${DISPLAY_NUM}" 2>/dev/null || true
sleep 1

# Start new session
vncserver ":${DISPLAY_NUM}" \
    -geometry "${RESOLUTION}" \
    -depth "${DEPTH}" \
    -localhost no \
    -alwaysshared \
    -SecurityTypes VncAuth \
    -MaxFPS 30 \
    -FrameRate 30 2>&1

if [ $? -eq 0 ]; then
    echo ""
    echo "MSBrOSs is running!"
    echo "Connect to: localhost:${VNC_PORT}"
    echo "Password: [configured password]"
    echo ""
    echo "For Android: Use bVNC or RealVNC Viewer"
    echo "For iOS: Use noVNC via browser at http://localhost:${VNC_PORT}/vnc.html"
else
    echo "Failed to start VNC server"
    exit 1
fi
STARTVNC

        # VNC Stop script
        cat > "${bin_dir}/vnc-stop" << 'STOPVNC'
#!/bin/bash
# MSBrOSs - Stop VNC server
DISPLAY_NUM=${1:-1}
echo "Stopping MSBrOSs VNC on display :${DISPLAY_NUM}"
vncserver -kill ":${DISPLAY_NUM}" 2>/dev/null
echo "VNC server stopped"
STOPVNC

        # VNC Status script
        cat > "${bin_dir}/vnc-status" << 'STATVNC'
#!/bin/bash
# MSBrOSs - Check VNC server status
echo "MSBrOSs VNC Server Status"
echo "========================="
vncserver -list 2>&1
echo ""
echo "Active VNC processes:"
ps aux | grep -i vnc | grep -v grep || echo "No VNC processes running"
STATVNC

        chmod +x "${bin_dir}/vnc-start" "${bin_dir}/vnc-stop" "${bin_dir}/vnc-status"
        echo "VNC management scripts created"

        # Add to PATH if not already
        if ! grep -q ".local/bin" "${HOME}/.bashrc" 2>/dev/null; then
            echo 'export PATH="${HOME}/.local/bin:${PATH}"' >> "${HOME}/.bashrc"
            echo "Added ~/.local/bin to PATH"
        fi
MGMTEOF
    log_success "VNC management scripts created"
}

main() {
    log_banner

    log_info "Configuring VNC server for mobile access..."

    setup_vnc_directory
    create_xstartup
    set_vnc_password "${VNC_PASSWORD}"
    create_vnc_server_config
    create_vnc_start_stop_scripts

    log_success "VNC configuration complete!"
    echo ""
    log_info "Next step: Run 'bash scripts/04-xfce-config.sh' to customize XFCE panels"
}

if [[ "${BASH_SOURCE[0]:-}" == "${0}" ]]; then
    main "$@"
fi
