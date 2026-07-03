#!/usr/bin/env bash
# ===========================================================================
# MSBrOSs - Step 01: Core Dependencies Installation
# Installs proot-distro, XFCE4, TigerVNC, and essential utilities
# ===========================================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/lib/common.sh"

MOS_ROOT="${MOS_ROOT:-${HOME}/msbross}"
MOS_DISTRO_NAME="msbross-ubuntu"
MOS_UBUNTU_VERSION="${MOS_UBUNTU_VERSION:-22.04}"

install_termux_deps() {
    log_step "[1/6] Installing Termux base dependencies"

    pkg update -y -o Dpkg::Options::="--force-confold"
    pkg upgrade -y -o Dpkg::Options::="--force-confold"

    local termux_pkgs=(
        proot-distro
        x11-repo
        tur-repo
        pulseaudio
        openssl-tool
        git
        wget
        curl
        nano
        bash-completion
        termux-api
        resolv-conf
        tsu
    )

    pkg install -y "${termux_pkgs[@]}"
    log_success "Termux dependencies installed"
}

install_proot_ubuntu() {
    log_step "[2/6] Installing Ubuntu ${MOS_UBUNTU_VERSION} via PRoot"

    if proot-distro list | grep -q "${MOS_DISTRO_NAME}"; then
        log_info "PRoot distro '${MOS_DISTRO_NAME}' already exists. Skipping install."
        return 0
    fi

    ensure_dir "${HOME}/.proot-distro"

    local distro_conf="${HOME}/.proot-distro/conf/${MOS_DISTRO_NAME}.conf"
    ensure_dir "$(dirname "${distro_conf}")"

    cat > "${distro_conf}" << PROOTEOF
DISTRO_NAME="${MOS_DISTRO_NAME}"
DISTRO_COMMENT="MSBrOSs Ubuntu ${MOS_UBUNTU_VERSION} optimized for mobile"
TARBALL_URL="https://partner-images.canonical.com/core/${MOS_UBUNTU_VERSION}/current/ubuntu-${MOS_UBUNTU_VERSION}-core-cloudimg-arm64-root.tar.gz"
TARBALL_SHA256="skip"
PROOT_EXTRA_ARGS="-b /proc -b /sys -b /dev -b /dev/pts -b /sdcard:/mnt/sdcard -b /storage:/mnt/storage"
DISTRO_ARCH="arm64"
PROOTEOF

    proot-distro install "${MOS_DISTRO_NAME}"
    log_success "Ubuntu ${MOS_UBUNTU_VERSION} installed in PRoot"
}

setup_proot_network() {
    log_step "[3/6] Configuring network inside PRoot"

    proot-distro login "${MOS_DISTRO_NAME}" -- bash << 'NETEOF'
        # Fix DNS resolution
        mkdir -p /run/dbus
        echo "nameserver 8.8.8.8" > /etc/resolv.conf
        echo "nameserver 1.1.1.1" >> /etc/resolv.conf

        # Update apt sources
        apt-get update -qq
        apt-get install -y -qq --no-install-recommends \
            ca-certificates \
            curl \
            gnupg \
            software-properties-common \
            apt-transport-https 2>/dev/null || true

        # Install core system (non-interactive)
        DEBIAN_FRONTEND=noninteractive apt-get upgrade -y -qq
NETEOF
    log_success "Network configured inside PRoot"
}

install_xfce4() {
    log_step "[4/6] Installing XFCE4 desktop environment"

    proot-distro login "${MOS_DISTRO_NAME}" -- bash << 'XFCEEOF'
        DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
            xfce4 \
            xfce4-goodies \
            dbus-x11 \
            libnotify-bin \
            --no-install-recommends 2>&1 | tail -5

        # Install additional XFCE components
        DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
            xfce4-whiskermenu-plugin \
            xfce4-pulseaudio-plugin \
            xfce4-statusnotifier-plugin \
            xfce4-clipman-plugin \
            xfce4-screenshooter \
            thunar-archive-plugin \
            file-roller \
            --no-install-recommends 2>&1 | tail -5

        echo "XFCE4 installed successfully"
XFCEEOF
    log_success "XFCE4 desktop environment installed"
}

install_vnc() {
    log_step "[5/6] Installing TigerVNC server"

    proot-distro login "${MOS_DISTRO_NAME}" -- bash << 'VNCEOF'
        DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
            tigervnc-standalone-server \
            tigervnc-common \
            tigervnc-xorg-extension \
            --no-install-recommends 2>&1 | tail -5

        echo "TigerVNC installed successfully"
VNCEOF
    log_success "TigerVNC server installed"
}

install_essential_apps() {
    log_step "[6/6] Installing essential applications"

    proot-distro login "${MOS_DISTRO_NAME}" -- bash << 'APPSEOF'
        DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
            firefox-esr \
            mousepad \
            ristretto \
            xarchiver \
            htop \
            neofetch \
            nano \
            vim \
            zip \
            unzip \
            tar \
            gdebi-core \
            --no-install-recommends 2>&1 | tail -5

        echo "Applications installed successfully"
APPSEOF
    log_success "Essential applications installed"
}

main() {
    log_banner

    local platform
    platform=$(detect_platform)
    log_info "Detected platform: ${platform}"

    if [[ "${platform}" == "termux" ]]; then
        install_termux_deps
    elif [[ "${platform}" == "android" ]]; then
        log_warn "Detected Android without Termux. Please install Termux first."
        log_info "Download from: https://f-droid.org/packages/com.termux/"
        exit 1
    fi

    install_proot_ubuntu
    setup_proot_network
    install_xfce4
    install_vnc
    install_essential_apps

    log_success "Core dependencies installation complete!"
    echo ""
    log_info "Next step: Run 'bash scripts/02-ui-themes.sh' to apply macOS styling"
}

if [[ "${BASH_SOURCE[0]:-}" == "${0}" ]]; then
    main "$@"
fi
