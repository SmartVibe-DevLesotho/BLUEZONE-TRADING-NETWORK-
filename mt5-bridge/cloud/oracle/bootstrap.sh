#!/usr/bin/env bash
set -euo pipefail

# SmartVibe Trading Network — Oracle Cloud Always Free MT5 node bootstrap.
# Target: x86_64 Ubuntu/Oracle Linux VM with Wine + Xvfb.
# This script installs the MT5 terminal and Windows Python environment needed
# by the official MetaTrader5 Python package. It never stores broker secrets
# in Git. Configure /etc/smartvibe/mt5-bridge.env after bootstrap.

if [[ "$(uname -m)" != "x86_64" ]]; then
  echo "ERROR: MT5 cloud node requires an x86_64 VM. Do not use an ARM A1 instance."
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
APP_USER="smartvibe"
BASE="/opt/smartvibe/mt5-bridge"
WINEPREFIX="/opt/smartvibe/wine"
PYTHON_INSTALLER="/tmp/python-3.11.9-amd64.exe"
MT5_INSTALLER="/tmp/mt5setup.exe"

apt-get update
apt-get install -y --no-install-recommends \
  wine64 wine32 winbind xvfb wget ca-certificates curl unzip procps \
  python3 python3-pip openssl

id -u "$APP_USER" >/dev/null 2>&1 || useradd --system --create-home --home-dir /home/$APP_USER --shell /usr/sbin/nologin "$APP_USER"
mkdir -p "$BASE" "$WINEPREFIX" /etc/smartvibe
chown -R "$APP_USER:$APP_USER" /opt/smartvibe /etc/smartvibe

# Install a Windows x86_64 Python runtime because the official MetaTrader5
# wheel is published for Windows x86_64, not native Linux.
wget -q --show-progress -O "$PYTHON_INSTALLER" \
  "https://www.python.org/ftp/python/3.11.9/python-3.11.9-amd64.exe"

install -d -o "$APP_USER" -g "$APP_USER" "$WINEPREFIX"
runuser -u "$APP_USER" -- env WINEPREFIX="$WINEPREFIX" WINEARCH=win64 \
  wineboot -u
runuser -u "$APP_USER" -- env WINEPREFIX="$WINEPREFIX" \
  wine64 "$PYTHON_INSTALLER" /quiet InstallAllUsers=1 PrependPath=1 Include_test=0

PYTHON_EXE="$WINEPREFIX/drive_c/Program Files/Python311/python.exe"
if [[ ! -x "$PYTHON_EXE" ]]; then
  echo "ERROR: Windows Python installation did not produce $PYTHON_EXE"
  exit 1
fi

runuser -u "$APP_USER" -- env WINEPREFIX="$WINEPREFIX" \
  wine64 "$PYTHON_EXE" -m pip install --upgrade pip setuptools wheel

# Install the official MetaTrader 5 terminal. The terminal is deliberately
# kept in a portable directory so the whole MT5 state lives on the VM disk.
wget -q --show-progress -O "$MT5_INSTALLER" \
  "https://download.mql5.com/cdn/web/metaquotes.software.corp/mt5/mt5setup.exe"

mkdir -p "$BASE/terminal"
chown -R "$APP_USER:$APP_USER" "$BASE"
runuser -u "$APP_USER" -- env WINEPREFIX="$WINEPREFIX" \
  wine64 "$MT5_INSTALLER" /portable /dir:"Z:\\opt\\smartvibe\\mt5-bridge\\terminal"

# Install the bridge dependencies into the Windows Python environment.
runuser -u "$APP_USER" -- env WINEPREFIX="$WINEPREFIX" \
  wine64 "$PYTHON_EXE" -m pip install \
  "fastapi>=0.115,<1" "uvicorn[standard]>=0.34,<1" "MetaTrader5>=5.0,<6"

# Keep the bridge source synchronized from this checkout. Run this script from
# the repository root, or copy mt5-bridge into BASE before enabling the service.
if [[ -d "$(dirname "$0")/.." ]]; then
  cp -a "$(dirname "$0")/.."/* "$BASE/"
  chown -R "$APP_USER:$APP_USER" "$BASE"
fi

cat > /etc/smartvibe/mt5-bridge.env <<'EOF'
# DO NOT COMMIT THIS FILE.
# Required before live trading:
MT5_BRIDGE_TOKEN=
MT5_LOGIN=
MT5_PASSWORD=
MT5_SERVER=
MT5_PATH=/opt/smartvibe/mt5-bridge/terminal/terminal64.exe
MT5_ALLOW_READ_ONLY=true
EOF
chmod 600 /etc/smartvibe/mt5-bridge.env
chown root:root /etc/smartvibe/mt5-bridge.env

cat > /etc/systemd/system/smartvibe-mt5-terminal.service <<'EOF'
[Unit]
Description=SmartVibe MT5 terminal
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=smartvibe
Group=smartvibe
Environment=WINEPREFIX=/opt/smartvibe/wine
Environment=WINEARCH=win64
Environment=DISPLAY=:99
ExecStartPre=/usr/bin/Xvfb :99 -screen 0 1024x768x24 -nolisten tcp
ExecStart=/bin/bash -lc 'exec /usr/bin/wine64 "/opt/smartvibe/mt5-bridge/terminal/terminal64.exe" /portable'
Restart=always
RestartSec=10
TimeoutStopSec=30

[Install]
WantedBy=multi-user.target
EOF

cat > /etc/systemd/system/smartvibe-mt5-bridge.service <<'EOF'
[Unit]
Description=SmartVibe MT5 live execution bridge
Requires=smartvibe-mt5-terminal.service
After=smartvibe-mt5-terminal.service network-online.target
Wants=network-online.target

[Service]
Type=simple
User=smartvibe
Group=smartvibe
Environment=WINEPREFIX=/opt/smartvibe/wine
Environment=WINEARCH=win64
Environment=DISPLAY=:99
EnvironmentFile=/etc/smartvibe/mt5-bridge.env
WorkingDirectory=/opt/smartvibe/mt5-bridge
ExecStart=/usr/bin/wine64 "/opt/smartvibe/wine/drive_c/Program Files/Python311/python.exe" -m uvicorn app:APP --host 127.0.0.1 --port 8787
Restart=always
RestartSec=5
TimeoutStopSec=30
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ProtectHome=true
ReadWritePaths=/opt/smartvibe

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable smartvibe-mt5-terminal.service smartvibe-mt5-bridge.service

echo
printf '%s\n' 'Bootstrap complete.'
printf '%s\n' '1. Edit /etc/smartvibe/mt5-bridge.env with the broker credentials and a strong MT5_BRIDGE_TOKEN.'
printf '%s\n' '2. Keep MT5_ALLOW_READ_ONLY=true until the bridge health/account checks pass.'
printf '%s\n' '3. Start the services: systemctl start smartvibe-mt5-terminal smartvibe-mt5-bridge'
printf '%s\n' '4. Verify locally: curl -H "Authorization: Bearer <token>" http://127.0.0.1:8787/health'
printf '%s\n' '5. Put Cloudflare Tunnel in front of 127.0.0.1:8787; do not open port 8787 publicly.'
