#!/usr/bin/env bash
# ===========================================================================
# MSBrOSs - Step 02: macOS-Style UI Customization
# Downloads and applies WhiteSur GTK theme, icons, cursors, Plank dock
# ===========================================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/lib/common.sh"

MOS_ROOT="${MOS_ROOT:-${HOME}/msbross}"
MOS_DISTRO_NAME="msbross-ubuntu"
MOS_THEME_DIR="/usr/share/themes"
MOS_ICON_DIR="/usr/share/icons"
MOS_FONT_DIR="/usr/share/fonts"

install_themes_packages() {
    log_step "[1/5] Installing theme dependencies"

    proot-distro login "${MOS_DISTRO_NAME}" -- bash << 'THEME_PKGS'
        DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
            plank \
            gtk2-engines-murrine \
            gtk2-engines-pixbuf \
            sassc \
            optipng \
            inkscape \
            libglib2.0-dev-bin \
            librsvg2-dev \
            parallel \
            --no-install-recommends 2>&1 | tail -3
        echo "Theme packages installed"
THEME_PKGS
    log_success "Theme dependencies installed"
}

install_whitesur_gtk() {
    log_step "[2/5] Installing WhiteSur GTK theme"

    proot-distro login "${MOS_DISTRO_NAME}" -- bash << 'GTKEOF'
        local temp_dir
        temp_dir=$(mktemp -d)
        cd "${temp_dir}"

        git clone --depth=1 https://github.com/vinceliuice/WhiteSur-gtk-theme.git 2>/dev/null
        cd WhiteSur-gtk-theme

        # Install with mobile-optimized options
        bash ./install.sh \
            --theme orange \
            --color light \
            --size 160 \
            --normal \
            --round 15px \
            --firefox \
            --dashboard \
            --wallpaper 2>&1 | tail -5

        # Also install dark variant for compatibility
        bash ./install.sh \
            --theme orange \
            --color dark \
            --size 160 \
            --normal \
            --round 15px 2>&1 | tail -5

        cd /
        rm -rf "${temp_dir}"
        echo "WhiteSur GTK theme installed"
GTKEOF
    log_success "WhiteSur GTK theme applied"
}

install_icons_cursors() {
    log_step "[3/5] Installing WhiteSur icon and cursor themes"

    proot-distro login "${MOS_DISTRO_NAME}" -- bash << 'ICONEOF'
        local temp_dir
        temp_dir=$(mktemp -d)
        cd "${temp_dir}"

        # Install WhiteSur icon theme
        git clone --depth=1 https://github.com/vinceliuice/WhiteSur-icon-theme.git 2>/dev/null
        cd WhiteSur-icon-theme
        bash ./install.sh --theme orange 2>&1 | tail -5
        cd ..

        # Install WhiteSur cursor theme
        git clone --depth=1 https://github.com/vinceliuice/WhiteSur-cursors.git 2>/dev/null
        mkdir -p /usr/share/icons/WhiteSur-cursors
        cp -rf WhiteSur-cursors/dist/* /usr/share/icons/WhiteSur-cursors/ 2>/dev/null || true

        cd /
        rm -rf "${temp_dir}"
        echo "Icons and cursors installed"
ICONEOF
    log_success "Icon and cursor themes applied"
}

install_san_francisco_font() {
    log_step "[4/5] Installing San Francisco (Inter) font"

    proot-distro login "${MOS_DISTRO_NAME}" -- bash << 'FONTEOF'
        # Install Inter font as San Francisco replacement
        DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
            fonts-inter \
            fonts-noto \
            fonts-noto-cjk \
            fonts-font-awesome \
            --no-install-recommends 2>&1 | tail -3

        # Configure system fonts - prioritize Inter
        mkdir -p /etc/fonts
        cat > /etc/fonts/local.conf << 'FONTCONF'
<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
    <alias>
        <family>sans-serif</family>
        <prefer>
            <family>Inter</family>
            <family>Noto Sans</family>
            <family>Noto Sans CJK SC</family>
        </prefer>
    </alias>
    <alias>
        <family>monospace</family>
        <prefer>
            <family>Noto Mono</family>
        </prefer>
    </alias>
    <match target="pattern">
        <test qual="any" name="family">
            <string>San Francisco</string>
        </test>
        <edit name="family" mode="assign" binding="same">
            <string>Inter</string>
        </edit>
    </match>
    <!-- Subpixel rendering for mobile screens -->
    <match target="font">
        <edit name="rgba" mode="assign">
            <const>rgb</const>
        </edit>
    </match>
    <match target="font">
        <edit name="antialias" mode="assign">
            <bool>true</bool>
        </edit>
    </match>
    <match target="font">
        <edit name="hinting" mode="assign">
            <bool>true</bool>
        </edit>
    </match>
    <match target="font">
        <edit name="hintstyle" mode="assign">
            <const>hintslight</const>
        </edit>
    </match>
</fontconfig>
FONTCONF
        echo "Fonts configured"
FONTEOF
    log_success "San Francisco / Inter fonts installed"
}

setup_plank_dock() {
    log_step "[5/5] Configuring Plank dock"

    proot-distro login "${MOS_DISTRO_NAME}" -- bash << 'PLANKEOF'
        local user_home="${HOME}"
        local plank_dir="${user_home}/.config/plank"
        local dock_dir="${plank_dir}/docks/macOS"

        mkdir -p "${dock_dir}/launchers"

        # Create Plank dock preferences
        cat > "${dock_dir}/settings" << DOCKCONF
[PlankDockPreferences]
# MSBrOSs macOS-style dock
DockItems=firefox-ESR.dockitem|thunar.dockitem|mousepad.dockitem|xterm.dockitem|neofetch.dockitem
IconSize=48
ZoomEnabled=true
ZoomPercent=140
Position=bottom
Alignment=center
AutoHide=true
PinnedOnly=false
HideDelay=500
ShowDelay=0
PressureDelay=1500
DockOffset=0
Monitor=
DockName=macOS
Theme=Gtk+
DOCKCONF

        # Create Plank preferences
        mkdir -p "${plank_dir}"
        cat > "${plank_dir}/settings" << PLANKCONF
[PlankPrefs]
# MSBrOSs Plank Configuration
WindowManager=xfwm4
Dock1=macOS
PLANKCONF

        # Create launchers
        cat > "${dock_dir}/launchers/firefox-ESR.dockitem" << LAUNCHER
[PlankDockItemPreferences]
Launcher=file:///usr/share/applications/firefox-esr.desktop
LAUNCHER

        cat > "${dock_dir}/launchers/thunar.dockitem" << LAUNCHER
[PlankDockItemPreferences]
Launcher=file:///usr/share/applications/thunar.desktop
LAUNCHER

        cat > "${dock_dir}/launchers/mousepad.dockitem" << LAUNCHER
[PlankDockItemPreferences]
Launcher=file:///usr/share/applications/mousepad.desktop
LAUNCHER

        cat > "${dock_dir}/launchers/xterm.dockitem" << LAUNCHER
[PlankDockItemPreferences]
Launcher=file:///usr/share/applications/xfce4-terminal.desktop
LAUNCHER

        cat > "${dock_dir}/launchers/neofetch.dockitem" << LAUNCHER
[PlankDockItemPreferences]
Launcher=file:///usr/share/applications/neofetch.desktop
LAUNCHER

        echo "Plank dock configured"
PLANKEOF
    log_success "Plank dock configured with macOS layout"
}

main() {
    log_banner

    log_info "Starting macOS-style UI customization..."

    install_themes_packages
    install_whitesur_gtk
    install_icons_cursors
    install_san_francisco_font
    setup_plank_dock

    log_success "UI theming complete!"
    echo ""
    log_info "Next step: Run 'bash scripts/03-vnc-setup.sh' to configure VNC"
}

if [[ "${BASH_SOURCE[0]:-}" == "${0}" ]]; then
    main "$@"
fi
