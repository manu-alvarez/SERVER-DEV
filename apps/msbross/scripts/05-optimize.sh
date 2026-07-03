#!/usr/bin/env bash
# ===========================================================================
# MSBrOSs - Step 05: Mobile Performance Optimization
# Disables unnecessary services, reduces memory usage, optimizes for battery
# ===========================================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/lib/common.sh"

MOS_DISTRO_NAME="msbross-ubuntu"
MOS_ROOT="${MOS_ROOT:-${HOME}/msbross}"

disable_unnecessary_services() {
    log_step "[1/5] Disabling unnecessary XFCE services"

    proot-distro login "${MOS_DISTRO_NAME}" -- bash << 'SERVEOF'
        local config_dir="${HOME}/.config/xfce4/xfconf/xfce-perchannel-xml"

        # Disable screensaver
        if [[ -f "${config_dir}/xfce4-screensaver.xml" ]]; then
            xmlstarlet ed -L \
                -u "/channel/property[@name='screensaver']/property[@name='saver']/property[@name='enabled']" \
                -v "false" "${config_dir}/xfce4-screensaver.xml" 2>/dev/null || true
        fi

        # Disable compositing for performance
        if [[ -f "${config_dir}/xfwm4.xml" ]]; then
            xmlstarlet ed -L \
                -u "/channel/property[@name='general']/property[@name='use_compositing']" \
                -v "false" "${config_dir}/xfwm4.xml" 2>/dev/null || \
            echo "Compositing will be disabled via xfconf-query"
        fi

        # Use xfconf-query as fallback
        xfconf-query -c xfwm4 -p /general/use_compositing -s false 2>/dev/null || true
        xfconf-query -c xfce4-power-manager -p /xfce4-power-manager/dpms-enabled -s false 2>/dev/null || true

        echo "Unnecessary services disabled"
SERVEOF
    log_success "Unnecessary XFCE services disabled"
}

configure_memory_optimizations() {
    log_step "[2/5] Configuring memory optimizations"

    proot-distro login "${MOS_DISTRO_NAME}" -- bash << 'MEMEOF'
        local sysctl_conf="/etc/sysctl.d/99-msbross-mobile.conf"
        mkdir -p /etc/sysctl.d

        cat > "${sysctl_conf}" << SYSCTL
# MSBrOSs - Memory optimizations for mobile devices
# Reduce swappiness for flash storage
vm.swappiness=10

# Increase cache pressure to free more memory
vm.vfs_cache_pressure=200

# Reduce dirty page limits to avoid I/O spikes
vm.dirty_background_ratio=5
vm.dirty_ratio=10

# Enable memory compaction
vm.compact_memory=1

# Reduce overcommit
vm.overcommit_memory=0
vm.overcommit_ratio=50

# Optimize page-cluster
vm.page-cluster=0
SYSCTL

        # Apply immediately if possible
        sysctl -p "${sysctl_conf}" 2>/dev/null || echo "sysctl applied on next boot"

        # Configure .bashrc with memory-saving aliases
        cat >> "${HOME}/.bashrc" << 'BASHRC'

# MSBrOSs - Performance settings
export MOZ_DISABLE_CONTENT_SANDBOX=1
export MOZ_DISABLE_GPU_SANDBOX=1
export LIBGL_ALWAYS_SOFTWARE=1
export GALLIUM_DRIVER=llvmpipe
export PULSE_SERVER=127.0.0.1

# Memory-saving aliases
alias ram-report='free -h && echo "" && vmstat -s 2>/dev/null | head -10'
alias ram-kill='sudo -k 2>/dev/null; sync && echo 3 > /proc/sys/vm/drop_caches 2>/dev/null; echo "Cache cleared"'
BASHRC
        echo "Memory optimizations applied"
MEMEOF
    log_success "Memory optimizations configured"
}

optimize_xfce_settings() {
    log_step "[3/5] Optimizing XFCE4 settings for mobile"

    proot-distro login "${MOS_DISTRO_NAME}" -- bash << 'XFCEOPT'
        local xfconf_dir="${HOME}/.config/xfce4/xfconf/xfce-perchannel-xml"

        # Reduce animation and visual effects
        cat > "${xfconf_dir}/xfwm4.xml" << 'XFWMOPT'
<?xml version="1.0" encoding="UTF-8"?>
<channel name="xfwm4" version="1.0">
  <property name="general" type="empty">
    <property name="theme" type="string" value="WhiteSur-light"/>
    <property name="title_font" type="string" value="Inter 10"/>
    <property name="button_layout" type="string" value="O|HMC"/>
    <property name="borderless_maximize" type="bool" value="true"/>
    <property name="click_to_focus" type="bool" value="true"/>
    <property name="raise_on_click" type="bool" value="true"/>
    <property name="focus_delay" type="int" value="0"/>
    <property name="prevent_focus_stealing" type="bool" value="false"/>
    <property name="scroll_workspaces" type="bool" value="false"/>
    <property name="workspace_count" type="int" value="2"/>
    <property name="wrap_workspaces" type="bool" value="true"/>
    <property name="shadow_style" type="int" value="0"/>
    <property name="use_compositing" type="bool" value="false"/>
    <property name="popup_opacity" type="int" value="100"/>
    <property name="frame_opacity" type="int" value="100"/>
    <property name="show_dock_shadow" type="bool" value="false"/>
    <property name="show_frame_shadow" type="bool" value="false"/>
    <property name="show_popup_shadow" type="bool" value="false"/>
    <property name="snap_to_border" type="bool" value="true"/>
    <property name="snap_width" type="int" value="5"/>
    <property name="vblank_mode" type="string" value="off"/>
    <property name="double_click_action" type="string" value="maximize"/>
    <property name="triple_click_action" type="string" value="shade"/>
  </property>
</channel>
XFWMOPT

        # Disable compositor
        xfconf-query -c xfwm4 -p /general/use_compositing -s false 2>/dev/null || true

        # Disable session auto-save (saves writes on flash)
        xfconf-query -c xfce4-session -p /general/AutoSave -s false 2>/dev/null || true
        xfconf-query -c xfce4-session -p /general/SaveOnExit -s false 2>/dev/null || true

        # Reduce icon sizes in panel
        xfconf-query -c xfce4-panel -p /panels/panel-1/icon-size -s 16 2>/dev/null || true

        echo "XFCE optimized for mobile"
XFCEOPT
    log_success "XFCE settings optimized for mobile"
}

create_cpu_governor_script() {
    log_step "[4/5] Creating CPU governor management"

    proot-distro login "${MOS_DISTRO_NAME}" -- bash << 'CPUEOF'
        local bin_dir="${HOME}/.local/bin"

        cat > "${bin_dir}/cpu-performance" << 'CPUPERF'
#!/bin/bash
# MSBrOSs - Set CPU to performance mode
echo "Setting CPU governor to performance..."
for cpu in /sys/devices/system/cpu/cpu[0-9]*/cpufreq/scaling_governor; do
    echo "performance" > "${cpu}" 2>/dev/null || true
done
echo "CPU in performance mode"
CPUPERF

        cat > "${bin_dir}/cpu-powersave" << 'CPUSAVE'
#!/bin/bash
# MSBrOSs - Set CPU to powersave mode
echo "Setting CPU governor to powersave..."
for cpu in /sys/devices/system/cpu/cpu[0-9]*/cpufreq/scaling_governor; do
    echo "powersave" > "${cpu}" 2>/dev/null || true
done
echo "CPU in powersave mode"
CPUSAVE

        chmod +x "${bin_dir}/cpu-performance" "${bin_dir}/cpu-powersave"
        echo "CPU governor scripts created"
CPUEOF
    log_success "CPU management scripts created"
}

create_cleanup_script() {
    log_step "[5/5] Creating memory cleanup utility"

    proot-distro login "${MOS_DISTRO_NAME}" -- bash << 'CLEANEOF'
        local bin_dir="${HOME}/.local/bin"

        cat > "${bin_dir}/mos-cleanup" << 'CLEANUP'
#!/bin/bash
# ===========================================================================
# MSBrOSs - Memory and Cache Cleanup Utility
# Run this when the system feels sluggish or before launching heavy apps
# ===========================================================================
echo "MSBrOSs - System Cleanup"
echo "========================"
echo ""

# Memory status before
echo "Memory before cleanup:"
free -h | head -2
echo ""

# Clean package cache
echo "[1/4] Cleaning APT cache..."
apt-get clean -qq 2>/dev/null
apt-get autoclean -qq 2>/dev/null
echo "  Done"

# Clear thumbnail cache
echo "[2/4] Clearing thumbnail cache..."
rm -rf "${HOME}/.cache/thumbnails/"* 2>/dev/null
echo "  Done"

# Rotate logs
echo "[3/4] Truncating old logs..."
find /var/log -name "*.log" -size +1M -exec truncate -s 0 {} \; 2>/dev/null || true
find /var/log -name "*.gz" -delete 2>/dev/null || true
echo "  Done"

# Clear temporary files
echo "[4/4] Cleaning temporary files..."
rm -rf /tmp/* 2>/dev/null || true
rm -rf "${HOME}/.cache/mozilla/firefox"/*/cache2 2>/dev/null || true
echo "  Done"

# Drop filesystem caches (safe on Linux)
echo ""
echo "Dropping filesystem caches..."
sync
echo 3 > /proc/sys/vm/drop_caches 2>/dev/null || true
echo ""

# Memory status after
echo "Memory after cleanup:"
free -h | head -2
echo ""
echo "Cleanup complete!"
CLEANUP

        chmod +x "${bin_dir}/mos-cleanup"
        echo "Cleanup script created at ~/.local/bin/mos-cleanup"
CLEANEOF
    log_success "Memory cleanup utility created"
}

main() {
    log_banner

    log_info "Optimizing system for mobile hardware..."

    disable_unnecessary_services
    configure_memory_optimizations
    optimize_xfce_settings
    create_cpu_governor_script
    create_cleanup_script

    log_success "Mobile optimizations complete!"
    echo ""
    log_info "Next step: Run 'bash scripts/06-apps.sh' to install additional applications"
}

if [[ "${BASH_SOURCE[0]:-}" == "${0}" ]]; then
    main "$@"
fi
