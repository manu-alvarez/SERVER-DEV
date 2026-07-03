#!/usr/bin/env bash
# ===========================================================================
# MSBrOSs - Step 04: XFCE4 Panel & Desktop Customization
# Configures macOS-style top panel, desktop settings, keyboard shortcuts
# ===========================================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/lib/common.sh"

MOS_DISTRO_NAME="msbross-ubuntu"
MOS_CONFIG_DIR="${HOME}/.config/xfce4"

configure_xfce_panel() {
    log_step "[1/4] Configuring XFCE4 macOS-style panel"

    proot-distro login "${MOS_DISTRO_NAME}" -- bash << 'PANELEOF'
        local panel_dir="${HOME}/.config/xfce4/panel"
        local xfconf_dir="${HOME}/.config/xfce4/xfconf/xfce-perchannel-xml"

        mkdir -p "${panel_dir}" "${xfconf_dir}"

        # -------------------------------------------------------------------
        # Main panel configuration
        # -------------------------------------------------------------------
        cat > "${HOME}/.config/xfce4/xfconf/xfce-perchannel-xml/xfce4-panel.xml" << 'PANELXML'
<?xml version="1.0" encoding="UTF-8"?>
<channel name="xfce4-panel" version="1.0">
  <property name="configver" type="int" value="2"/>
  <property name="panels" type="array">
    <value type="int" value="1"/>
    <value type="int" value="2"/>
  </property>

  <!-- Panel 0: macOS-style Top Bar -->
  <property name="panel-1" type="empty">
    <property name="position" type="string" value="p=6;x=0;y=0"/>
    <property name="length" type="uint" value="100"/>
    <property name="position-north" type="int" value="0"/>
    <property name="position-south" type="int" value="0"/>
    <property name="position-east" type="int" value="0"/>
    <property name="position-west" type="int" value="0"/>
    <property name="size" type="uint" value="32"/>
    <property name="autohide-behavior" type="uint" value="0"/>
    <property name="span-monitors" type="bool" value="true"/>
    <property name="expand" type="bool" value="true"/>
    <property name="plugin-ids" type="array">
      <value type="int" value="1"/>  <!-- Whisker Menu -->
      <value type="int" value="2"/>  <!-- Separator -->
      <value type="int" value="3"/>  <!-- Window Buttons -->
      <value type="int" value="4"/>  <!-- Separator -->
      <value type="int" value="5"/>  <!-- PulseAudio -->
      <value type="int" value="6"/>  <!-- StatusNotifier -->
      <value type="int" value="7"/>  <!-- Clock -->
      <value type="int" value="8"/>  <!-- Action Buttons -->
    </property>
  </property>

  <!-- Panel 1: Bottom Dock (redundant with Plank, but fallback) -->
  <property name="panel-2" type="empty">
    <property name="position" type="string" value="p=6;x=0;y=0"/>
    <property name="length" type="uint" value="100"/>
    <property name="position-north" type="int" value="0"/>
    <property name="position-south" type="int" value="0"/>
    <property name="position-east" type="int" value="0"/>
    <property name="position-west" type="int" value="0"/>
    <property name="size" type="uint" value="48"/>
    <property name="autohide-behavior" type="uint" value="1"/>
    <property name="span-monitors" type="bool" value="true"/>
    <property name="expand" type="bool" value="false"/>
    <property name="plugin-ids" type="array">
      <value type="int" value="9"/>  <!-- Launcher -->
    </property>
  </property>

  <!-- Plugin definitions -->
  <property name="plugins" type="empty">
    <!-- Plugin 1: Whisker Menu (Apple logo style) -->
    <property name="plugin-1" type="empty">
      <property name="type" type="string" value="whiskermenu"/>
      <property name="active" type="bool" value="true"/>
      <property name="show-button-title" type="bool" value="true"/>
      <property name="show-button-icon" type="bool" value="true"/>
      <property name="title" type="string" value="MSBrOSs"/>
      <property name="button-icon" type="string" value="start-here"/>
      <property name="menu-opacity" type="uint" value="95"/>
    </property>

    <!-- Plugin 2: Separator -->
    <property name="plugin-2" type="empty">
      <property name="type" type="string" value="separator"/>
      <property name="expand" type="bool" value="false"/>
      <property name="style" type="uint" value="0"/>
    </property>

    <!-- Plugin 3: Window Buttons -->
    <property name="plugin-3" type="empty">
      <property name="type" type="string" value="windowbuttons"/>
      <property name="show-handle" type="bool" value="false"/>
      <property name="flat-buttons" type="bool" value="true"/>
      <property name="sorting-order" type="uint" value="1"/>
    </property>

    <!-- Plugin 4: Transparent Separator (spacer) -->
    <property name="plugin-4" type="empty">
      <property name="type" type="string" value="separator"/>
      <property name="expand" type="bool" value="true"/>
      <property name="style" type="uint" value="0"/>
    </property>

    <!-- Plugin 5: PulseAudio Plugin -->
    <property name="plugin-5" type="empty">
      <property name="type" type="string" value="pulseaudio"/>
      <property name="enable-keyboard-shortcuts" type="bool" value="true"/>
      <property name="show-notifications" type="bool" value="true"/>
    </property>

    <!-- Plugin 6: StatusNotifier (system tray) -->
    <property name="plugin-6" type="empty">
      <property name="type" type="string" value="statusnotifier"/>
      <property name="show-frame" type="bool" value="false"/>
    </property>

    <!-- Plugin 7: Clock -->
    <property name="plugin-7" type="empty">
      <property name="type" type="string" value="clock"/>
      <property name="mode" type="uint" value="2"/>
      <property name="digital-format" type="string" value="%I:%M %p"/>
      <property name="digital-time-font" type="string" value="Inter Semi Bold 11"/>
      <property name="show-frame" type="bool" value="false"/>
    </property>

    <!-- Plugin 8: Action Buttons (logout, lock) -->
    <property name="plugin-8" type="empty">
      <property name="type" type="string" value="actions"/>
      <property name="appearance" type="uint" value="0"/>
      <property name="items" type="array">
        <value type="string" value="logout"/>
        <value type="string" value="lock-screen"/>
      </property>
    </property>

    <!-- Plugin 9: Bottom launcher (fallback) -->
    <property name="plugin-9" type="empty">
      <property name="type" type="string" value="launcher"/>
      <property name="items" type="array">
        <value type="string" value="firefox-esr.desktop"/>
        <value type="string" value="thunar.desktop"/>
        <value type="string" value="xfce4-terminal.desktop"/>
      </property>
    </property>
  </property>
</channel>
PANELXML
        echo "Panel configuration applied"
PANELEOF
    log_success "macOS-style panel configured"
}

configure_desktop_settings() {
    log_step "[2/4] Configuring desktop preferences"

    proot-distro login "${MOS_DISTRO_NAME}" -- bash << 'DESKTOPEOF'
        local xfconf_dir="${HOME}/.config/xfce4/xfconf/xfce-perchannel-xml"
        mkdir -p "${xfconf_dir}"

        # XFCE Window Manager settings
        cat > "${xfconf_dir}/xfwm4.xml" << 'XFWMXML'
<?xml version="1.0" encoding="UTF-8"?>
<channel name="xfwm4" version="1.0">
  <property name="general" type="empty">
    <property name="theme" type="string" value="WhiteSur-light"/>
    <property name="title_font" type="string" value="Inter Semi Bold 10"/>
    <property name="title_alignment" type="string" value="center"/>
    <property name="button_layout" type="string" value="O|HMC"/>
    <property name="button_offset" type="int" value="2"/>
    <property name="wrap_windows" type="bool" value="false"/>
    <property name="wrap_cycle" type="bool" value="true"/>
    <property name="cycle_draw_frame" type="bool" value="false"/>
    <property name="click_to_focus" type="bool" value="true"/>
    <property name="raise_on_click" type="bool" value="true"/>
    <property name="activate_action" type="string" value="bring"/>
    <property name="borderless_maximize" type="bool" value="true"/>
    <property name="zoom_desktop" type="bool" value="false"/>
    <property name="easy_click" type="string" value="Alt"/>
    <property name="focus_delay" type="int" value="250"/>
    <property name="focus_hint" type="bool" value="true"/>
    <property name="full_width_title" type="bool" value="true"/>
    <property name="max_new_window_width" type="int" value="100"/>
    <property name="prevent_focus_stealing" type="bool" value="true"/>
    <property name="scroll_workspaces" type="bool" value="true"/>
    <property name="shadow_delta_height" type="int" value="2"/>
    <property name="shadow_delta_width" type="int" value="2"/>
    <property name="shadow_delta_x" type="int" value="0"/>
    <property name="shadow_delta_y" type="int" value="-3"/>
    <property name="shadow_opacity" type="int" value="50"/>
    <property name="show_dock_shadow" type="bool" value="true"/>
    <property name="show_frame_shadow" type="bool" value="true"/>
    <property name="show_popup_shadow" type="bool" value="true"/>
    <property name="snap_to_border" type="bool" value="true"/>
    <property name="snap_to_windows" type="bool" value="false"/>
    <property name="snap_width" type="int" value="10"/>
    <property name="vblank_mode" type="string" value="auto"/>
    <property name="workspace_count" type="int" value="4"/>
    <property name="workspace_names" type="array">
      <value type="string" value="Desktop 1"/>
      <value type="string" value="Desktop 2"/>
      <value type="string" value="Desktop 3"/>
      <value type="string" value="Desktop 4"/>
    </property>
  </property>
</channel>
XFWMXML

        # XFCE Desktop settings
        cat > "${xfconf_dir}/xfce4-desktop.xml" << 'DESKTOPXML'
<?xml version="1.0" encoding="UTF-8"?>
<channel name="xfce4-desktop" version="1.0">
  <property name="backdrop" type="empty">
    <property name="screen0" type="empty">
      <property name="monitor0" type="empty">
        <property name="workspace0" type="empty">
          <property name="color-style" type="uint" value="0"/>
          <property name="image-style" type="uint" value="5"/>
          <property name="last-image" type="string" value="/usr/share/backgrounds/xfce/msbross-default.jpg"/>
          <property name="image-show" type="bool" value="true"/>
          <property name="rgba1" type="double" value="0.12549019607843137"/>
          <property name="rgba2" type="double" value="0.12549019607843137"/>
          <property name="rgba3" type="double" value="0.12549019607843137"/>
          <property name="rgba4" type="double" value="1"/>
        </property>
      </property>
    </property>
  </property>
</channel>
DESKTOPXML

        # XFCE Settings (appearance, etc.)
        cat > "${xfconf_dir}/xsettings.xml" << 'XSETXML'
<?xml version="1.0" encoding="UTF-8"?>
<channel name="xsettings" version="1.0">
  <property name="Net" type="empty">
    <property name="ThemeName" type="string" value="WhiteSur-light"/>
    <property name="IconThemeName" type="string" value="WhiteSur"/>
    <property name="CursorThemeName" type="string" value="WhiteSur-cursors"/>
    <property name="CursorThemeSize" type="int" value="24"/>
    <property name="DoubleClickTime" type="int" value="400"/>
    <property name="DoubleClickDistance" type="int" value="5"/>
    <property name="DndDragThreshold" type="int" value="8"/>
    <property name="IconThemeChanged" type="bool" value="false"/>
    <property name="ToolbarStyle" type="string" value="icons"/>
    <property name="ToolbarIconSize" type="int" value="1"/>
    <property name="FontName" type="string" value="Inter, 10"/>
    <property name="MonospaceFontName" type="string" value="Noto Mono, 10"/>
  </property>
  <property name="Xft" type="empty">
    <property name="DPI" type="int" value="144"/>
    <property name="Antialias" type="int" value="1"/>
    <property name="Hinting" type="int" value="1"/>
    <property name="HintStyle" type="string" value="hintslight"/>
    <property name="RGBA" type="string" value="rgb"/>
  </property>
  <property name="Gtk" type="empty">
    <property name="EnableEventSounds" type="bool" value="false"/>
    <property name="EnableInputFeedbackSounds" type="bool" value="false"/>
    <property name="DecorationLayout" type="string" value="O|HMC"/>
    <property name="DialogsUseHeader" type="bool" value="false"/>
    <property name="PrimaryButtonWarpsSlider" type="bool" value="false"/>
    <property name="ShellShowsAppMenu" type="bool" value="true"/>
    <property name="ShellShowsMenubar" type="bool" value="true"/>
    <property name="CanChangeAccels" type="bool" value="false"/>
    <property name="ColorScheme" type="string" value="default"/>
    <property name="DndAutostart" type="bool" value="false"/>
    <property name="EnableAnimations" type="bool" value="true"/>
    <property name="EnablePrimaryPaste" type="bool" value="true"/>
    <property name="FallbackIconTheme" type="string" value="gnome"/>
    <property name="IMPreeditStyle" type="string" value="callback"/>
    <property name="IMStatusStyle" type="string" value="callback"/>
    <property name="KeyThemeName" type="string" value="/usr/share/themes/WhiteSur-light/gtk-2.0/keybindings"/>
    <property name="MenuImages" type="bool" value="true"/>
    <property name="MenuBarAccel" type="string" value="F10"/>
    <property name="ScrolledWindowPlacement" type="uint" value="0"/>
    <property name="ShowInputMethodMenu" type="bool" value="false"/>
    <property name="ShowUnicodeMenu" type="bool" value="false"/>
    <property name="ToolbarStyle" type="string" value="both-horiz"/>
    <property name="Tooltips" type="bool" value="true"/>
  </property>
</channel>
XSETXML

        # XFCE Power Manager settings (optimized for mobile)
        cat > "${xfconf_dir}/xfce4-power-manager.xml" << 'POWERXML'
<?xml version="1.0" encoding="UTF-8"?>
<channel name="xfce4-power-manager" version="1.0">
  <property name="xfce4-power-manager" type="empty">
    <property name="power-button-action" type="uint" value="3"/>
    <property name="lid-action-on-ac" type="uint" value="1"/>
    <property name="lid-action-on-battery" type="uint" value="1"/>
    <property name="dpms-on-ac-sleep" type="uint" value="0"/>
    <property name="dpms-on-ac-off" type="uint" value="0"/>
    <property name="dpms-on-battery-sleep" type="uint" value="0"/>
    <property name="dpms-on-battery-off" type="uint" value="0"/>
    <property name="blank-on-ac" type="int" value="0"/>
    <property name="blank-on-battery" type="int" value="0"/>
    <property name="brightness-switch-restore-on-startup" type="int" value="1"/>
    <property name="brightness-switch" type="int" value="1"/>
    <property name="inactivity-on-ac" type="uint" value="0"/>
    <property name="inactivity-on-battery" type="uint" value="0"/>
    <property name="brightness-level-on-battery" type="uint" value="60"/>
    <property name="brightness-level-on-ac" type="uint" value="80"/>
    <property name="show-tray-icon" type="bool" value="false"/>
    <property name="handle-brightness-keys" type="bool" value="true"/>
    <property name="event-slider-left" type="string" value="brightness-up"/>
  </property>
</channel>
POWERXML

        echo "Desktop settings configured"
DESKTOPEOF
    log_success "Desktop preferences configured"
}

configure_keyboard_shortcuts() {
    log_step "[3/4] Configuring keyboard shortcuts"

    proot-distro login "${MOS_DISTRO_NAME}" -- bash << 'KBDEOF'
        local xfconf_dir="${HOME}/.config/xfce4/xfconf/xfce-perchannel-xml"

        cat > "${xfconf_dir}/xfce4-keyboard-shortcuts.xml" << 'KBXML'
<?xml version="1.0" encoding="UTF-8"?>
<channel name="xfce4-keyboard-shortcuts" version="1.0">
  <property name="commands" type="empty">
    <property name="custom" type="empty">
      <property name="&lt;Alt&gt;F1" type="string" value="xfce4-popup-whiskermenu"/>
      <property name="&lt;Alt&gt;F2" type="string" value="xfce4-appfinder"/>
      <property name="&lt;Alt&gt;F3" type="string" value="xfce4-terminal"/>
      <property name="&lt;Primary&gt;&lt;Alt&gt;t" type="string" value="xfce4-terminal"/>
      <property name="&lt;Primary&gt;&lt;Alt&gt;l" type="string" value="xflock4"/>
      <property name="&lt;Primary&gt;&lt;Alt&gt;d" type="string" value="showdesktop"/>
      <property name="&lt;Super&gt;e" type="string" value="thunar"/>
      <property name="&lt;Super&gt;f" type="string" value="firefox-esr"/>
      <property name="&lt;Super&gt;w" type="string" value="xfce4-terminal"/>
      <property name="&lt;Primary&gt;&lt;Shift&gt;Escape" type="string" value="xfce4-taskmanager"/>
      <property name="Print" type="string" value="xfce4-screenshooter"/>
      <property name="&lt;Super&gt;d" type="string" value="xfce4-popup-whiskermenu"/>
    </property>
  </property>
  <property name="xfwm4" type="empty">
    <property name="custom" type="empty">
      <property name="&lt;Primary&gt;&lt;Alt&gt;Right" type="string" value="next_workspace_key"/>
      <property name="&lt;Primary&gt;&lt;Alt&gt;Left" type="string" value="prev_workspace_key"/>
      <property name="&lt;Primary&gt;&lt;Alt&gt;Up" type="string" value="workspace_1_key"/>
      <property name="&lt;Primary&gt;&lt;Alt&gt;Down" type="string" value="workspace_2_key"/>
      <property name="&lt;Super&gt;Right" type="string" value="tile_right_key"/>
      <property name="&lt;Super&gt;Left" type="string" value="tile_left_key"/>
      <property name="&lt;Super&gt;Up" type="string" value="maximize_window_key"/>
      <property name="&lt;Super&gt;Down" type="string" value="minimize_window_key"/>
      <property name="&lt;Alt&gt;F4" type="string" value="close_window_key"/>
      <property name="&lt;Alt&gt;Tab" type="string" value="cycle_windows_key"/>
      <property name="&lt;Alt&gt;&lt;Shift&gt;Tab" type="string" value="cycle_reverse_windows_key"/>
    </property>
  </property>
</channel>
KBXML
        echo "Keyboard shortcuts configured"
KBDEOF
    log_success "Keyboard shortcuts configured"
}

download_wallpaper() {
    log_step "[4/4] Downloading MSBrOSs wallpaper"

    proot-distro login "${MOS_DISTRO_NAME}" -- bash << 'WALLEOF'
        local bg_dir="/usr/share/backgrounds/xfce"
        mkdir -p "${bg_dir}"

        # Download a macOS-inspired gradient wallpaper (fallback)
        # Generate a gradient wallpaper using ImageMagick if available
        if command -v convert &>/dev/null; then
            convert -size 2560x1600 \
                gradient:'#1a1a2e'-'#16213e' \
                -fill '#0f3460' \
                -draw "rectangle 0,0 2560,1600" \
                -fill '#1a1a2e' -draw "rectangle 0,1200 2560,1600" \
                -fill '#e94560' -draw "circle 2000,300 2000,350" \
                "${bg_dir}/msbross-default.jpg" 2>/dev/null || {
                # Fallback: create solid color
                convert -size 1x1 xc:'#1a1a2e' "${bg_dir}/msbross-default.jpg" 2>/dev/null || true
            }
        else
            # Create a minimal placeholder
            echo "MSBrOSs - Ubuntu Mobile OS" > "${bg_dir}/msbross-default.jpg" 2>/dev/null || true
        fi

        echo "Wallpaper configured"
WALLEOF
    log_success "Wallpaper set"
}

main() {
    log_banner

    log_info "Configuring XFCE4 desktop environment..."

    configure_xfce_panel
    configure_desktop_settings
    configure_keyboard_shortcuts
    download_wallpaper

    log_success "XFCE4 customization complete!"
    echo ""
    log_info "Next step: Run 'bash scripts/05-optimize.sh' for mobile optimizations"
}

if [[ "${BASH_SOURCE[0]:-}" == "${0}" ]]; then
    main "$@"
fi
