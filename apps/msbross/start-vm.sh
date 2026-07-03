#!/bin/bash
# MSBrOSs - QEMU VM Launcher
# Boots Ubuntu VM with MSBrOSs configuration
# VNC accessible on port 5901, Web noVNC on port 6080

QEMU_DIR="/Users/manu/Desktop/MaybePRO/MSBrOSs/qemu"
DISK="$QEMU_DIR/msbross-disk.qcow2"
SEED="$QEMU_DIR/seed.iso"
BASE="$QEMU_DIR/ubuntu-22.04-base.img"
MEMORY="2G"
CPUS="2"
VNC_PORT="5901"
NOVNC_PORT="6080"
SSH_PORT="2222"
LOG_DIR="$QEMU_DIR/logs"

mkdir -p "$LOG_DIR"

echo ""
echo "=============================================="
echo " MSBrOSs - Starting VM"
echo "=============================================="
echo ""
echo " First boot: cloud-init will install XFCE4 + VNC"
echo " This takes 5-10 minutes on first boot."
echo ""

# Kill any existing VM
pkill -f "qemu-system-x86_64.*msbross" 2>/dev/null || true
sleep 2

# Re-create overlay if base changed
if [ ! -f "$DISK" ]; then
    qemu-img create -f qcow2 -b "$BASE" -F qcow2 "$DISK" 20G
fi

# Start QEMU VM
qemu-system-x86_64 \
    -machine q35,accel=tcg \
    -cpu max \
    -m "$MEMORY" \
    -smp "$CPUS" \
    -drive file="$DISK",format=qcow2,if=virtio \
    -cdrom "$SEED" \
    -vga virtio \
    -display none \
    -vnc ":1" \
    -netdev user,id=net0,hostfwd=tcp::"$SSH_PORT"-:22 \
    -device virtio-net,netdev=net0 \
    -audiodev none,id=noaudio \
    -serial file:"$LOG_DIR/serial.log" \
    -daemonize \
    -name msbross

VM_PID=$!
echo "VM PID: $VM_PID"
echo "VNC: localhost:$VNC_PORT"
echo "SSH: localhost:$SSH_PORT (user: ubuntu, pass: msbross)"
echo ""

# Wait for boot
echo "Waiting for VM to boot..."
sleep 10

# Set up noVNC for web access
if [ ! -d "$QEMU_DIR/novnc" ]; then
    echo "Setting up noVNC for web access..."
    git clone --depth=1 https://github.com/novnc/noVNC.git "$QEMU_DIR/novnc" 2>/dev/null
    git clone --depth=1 https://github.com/novnc/websockify.git "$QEMU_DIR/novnc/utils/websockify" 2>/dev/null || true
fi

# Kill existing noVNC
pkill -f "novnc_proxy.*$NOVNC_PORT" 2>/dev/null || true
sleep 1

# Start noVNC
cd "$QEMU_DIR/novnc"
./utils/novnc_proxy --vnc localhost:"$VNC_PORT" --listen "$NOVNC_PORT" &
NOVNC_PID=$!
cd - >/dev/null

echo ""
echo "=============================================="
echo " MSBrOSs VM IS BOOTING"
echo "=============================================="
echo ""
echo " First boot: wait 5-10 min for cloud-init"
echo " Then connect:"
echo ""
echo " VNC:  localhost:$VNC_PORT  (pass: msbross)"
echo " WEB:  http://localhost:$NOVNC_PORT/vnc.html"
echo " SSH:  ssh ubuntu@localhost -p $SSH_PORT"
echo ""
echo " To check progress:"
echo "   tail -f $LOG_DIR/serial.log"
echo ""
echo " To stop:"
echo "   pkill -f 'qemu-system.*msbross'"
echo "=============================================="
