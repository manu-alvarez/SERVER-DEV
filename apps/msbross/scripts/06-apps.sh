#!/usr/bin/env bash
# ===========================================================================
# MSBrOSs - Step 06: Application Installation
# Installs additional useful applications for the mobile OS
# ===========================================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/lib/common.sh"

MOS_DISTRO_NAME="msbross-ubuntu"
INSTALL_MODE="${1:-full}"

install_basic_apps() {
    log_step "[1/4] Installing basic applications"

    proot-distro login "${MOS_DISTRO_NAME}" -- bash << 'BASICEOF'
        DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
            firefox-esr \
            mousepad \
            ristretto \
            thunar \
            thunar-volman \
            thunar-archive-plugin \
            xfce4-terminal \
            xarchiver \
            galculator \
            atril \
            parole \
            --no-install-recommends 2>&1 | tail -3
        echo "Basic applications installed"
BASICEOF
    log_success "Basic applications installed"
}

install_dev_tools() {
    log_step "[2/4] Installing development tools"

    proot-distro login "${MOS_DISTRO_NAME}" -- bash << 'DEVTEOF'
        DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
            build-essential \
            python3 \
            python3-pip \
            nodejs \
            npm \
            git \
            curl \
            wget \
            nano \
            vim \
            htop \
            neofetch \
            tree \
            jq \
            ripgrep \
            fd-find \
            tmux \
            screen \
            --no-install-recommends 2>&1 | tail -3
        echo "Development tools installed"
DEVTEOF
    log_success "Development tools installed"
}

install_media_codecs() {
    log_step "[3/4] Installing media codecs and utilities"

    proot-distro login "${MOS_DISTRO_NAME}" -- bash << 'CODECEOF'
        DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
            ffmpeg \
            vlc \
            gstreamer1.0-plugins-base \
            gstreamer1.0-plugins-good \
            gstreamer1.0-plugins-bad \
            gstreamer1.0-libav \
            gstreamer1.0-tools \
            pulseaudio \
            pavucontrol \
            --no-install-recommends 2>&1 | tail -3
        echo "Media codecs installed"
CODECEOF
    log_success "Media codecs installed"
}

install_extra_apps() {
    log_step "[4/4] Installing extra utilities"

    proot-distro login "${MOS_DISTRO_NAME}" -- bash << 'EXTRAEOF'
        DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
            gimp \
            inkscape \
            evince \
            file-roller \
            gedit \
            gparted \
            gnome-disk-utility \
            gnome-system-monitor \
            cpu-x \
            neofetch \
            --no-install-recommends 2>&1 | tail -3
        echo "Extra applications installed"
EXTRAEOF
    log_success "Extra applications installed"
}

main() {
    log_banner

    log_info "Installing applications (mode: ${INSTALL_MODE})..."

    case "${INSTALL_MODE}" in
        minimal)
            install_basic_apps
            ;;
        dev)
            install_basic_apps
            install_dev_tools
            ;;
        full)
            install_basic_apps
            install_dev_tools
            install_media_codecs
            install_extra_apps
            ;;
        *)
            log_warn "Unknown mode '${INSTALL_MODE}'. Using 'full'."
            install_basic_apps
            install_dev_tools
            install_media_codecs
            install_extra_apps
            ;;
    esac

    log_success "Application installation complete!"
    echo ""
    log_info "Setup is now complete. Run 'bash start-mos.sh' to launch MSBrOSs!"
}

if [[ "${BASH_SOURCE[0]:-}" == "${0}" ]]; then
    main "$@"
fi
