#!/usr/bin/env bash
set -euo pipefail

# Install the Cloudflare Tunnel connector and register it as a system service.
# Create the named tunnel in Cloudflare first and pass its tunnel token as the
# first argument. The token is written only to the VM's root-owned env file.

TOKEN="${1:-}"
if [[ -z "$TOKEN" ]]; then
  echo "Usage: sudo bash install-cloudflared.sh '<CLOUDFLARE_TUNNEL_TOKEN>'"
  exit 2
fi

ARCH="$(uname -m)"
case "$ARCH" in
  x86_64) BIN="cloudflared-linux-amd64" ;;
  aarch64|arm64) BIN="cloudflared-linux-arm64" ;;
  *) echo "Unsupported architecture: $ARCH"; exit 1 ;;
esac

apt-get update
apt-get install -y --no-install-recommends ca-certificates curl
curl -fsSL -o /usr/local/bin/cloudflared "https://github.com/cloudflare/cloudflared/releases/latest/download/${BIN}"
chmod 0755 /usr/local/bin/cloudflared
/usr/local/bin/cloudflared --version

install -d -m 0700 /etc/smartvibe
umask 077
cat > /etc/smartvibe/cloudflared.env <<EOF
TUNNEL_TOKEN=$TOKEN
EOF
chmod 0600 /etc/smartvibe/cloudflared.env

cat > /etc/systemd/system/smartvibe-mt5-tunnel.service <<'EOF'
[Unit]
Description=SmartVibe MT5 Cloudflare Tunnel
After=network-online.target smartvibe-mt5-bridge.service
Wants=network-online.target
Requires=smartvibe-mt5-bridge.service

[Service]
Type=simple
EnvironmentFile=/etc/smartvibe/cloudflared.env
ExecStart=/usr/local/bin/cloudflared tunnel --no-autoupdate run --token ${TUNNEL_TOKEN}
Restart=always
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/lib/cloudflared

[Install]
WantedBy=multi-user.target
EOF

mkdir -p /var/lib/cloudflared
systemctl daemon-reload
systemctl enable --now smartvibe-mt5-tunnel.service
systemctl --no-pager --full status smartvibe-mt5-tunnel.service || true

printf '%s\n' 'Cloudflare Tunnel connector installed.'
printf '%s\n' 'The named tunnel must route its hostname to http://127.0.0.1:8787.'
printf '%s\n' 'Do not open OCI port 8787; the tunnel is outbound-only.'
