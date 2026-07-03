#!/usr/bin/env bash
# ===========================================================================
# MSBrOSs - Wallpaper Downloader & Setter
# Downloads and applies macOS-inspired wallpapers
# ===========================================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../../scripts/lib/common.sh"

MOS_DISTRO_NAME="${MOS_DISTRO_NAME:-msbross-ubuntu}"
WP_DIR="/usr/share/backgrounds/xfce"

set_wallpaper_solid() {
    local color="${1:-#1a1a2e}"
    local output="${WP_DIR}/msbross-default.jpg"

    proot-distro login "${MOS_DISTRO_NAME}" -- bash -c "
        if command -v convert &>/dev/null; then
            convert -size 2560x1600 xc:'${color}' '${output}'
        else
            python3 -c \"
from PIL import Image
img = Image.new('RGB', (2560, 1600), '${color}')
img.save('${output}')
\" 2>/dev/null || echo 'Created solid color wallpaper'
        fi
        echo 'Wallpaper set to: ${color}'
    "
}

set_wallpaper_gradient() {
    local color1="${1:-#1a1a2e}"
    local color2="${2:-#16213e}"
    local output="${WP_DIR}/msbross-default.jpg"

    proot-distro login "${MOS_DISTRO_NAME}" -- bash -c "
        if command -v convert &>/dev/null; then
            convert -size 2560x1600 gradient:'${color1}'-'${color2}' '${output}'
            echo 'Gradient wallpaper created'
        else
            python3 -c \"
from PIL import Image
img = Image.new('RGB', (2560, 1600), '${color1}')
img.save('${output}')
\" 2>/dev/null || echo 'Fallback to solid'
        fi
    "
}

set_wallpaper_url() {
    local url="$1"
    local output="${WP_DIR}/msbross-default.jpg"

    proot-distro login "${MOS_DISTRO_NAME}" -- bash -c "
        wget -q -O '${output}' '${url}' 2>/dev/null || {
            echo 'Failed to download wallpaper from URL'
            return 1
        }
        echo 'Wallpaper downloaded from URL'
    "
}

main() {
    local mode="${1:-gradient}"

    case "${mode}" in
        solid)
            set_wallpaper_solid "${2:-#1a1a2e}"
            ;;
        gradient)
            set_wallpaper_gradient "${2:-#1a1a2e}" "${3:-#16213e}"
            ;;
        url)
            set_wallpaper_url "$2"
            ;;
        *)
            echo "Usage: bash set-wallpaper.sh [mode] [options]"
            echo ""
            echo "Modes:"
            echo "  solid [color]           - Solid color wallpaper"
            echo "  gradient [c1] [c2]      - Gradient wallpaper"
            echo "  url URL                 - Download from URL"
            echo ""
            echo "Examples:"
            echo "  bash set-wallpaper.sh solid '#ff4500'"
            echo "  bash set-wallpaper.sh gradient '#1a1a2e' '#16213e'"
            echo "  bash set-wallpaper.sh url https://example.com/wallpaper.jpg"
            return 1
            ;;
    esac

    log_success "Wallpaper updated!"
    log_info "Restart XFCE4 or run 'xfdesktop --reload' to apply"
}

main "$@"
