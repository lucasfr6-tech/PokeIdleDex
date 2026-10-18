#!/bin/bash
# Installe le serveur PokeIdleDex (Ubuntu). Usage : sudo bash install.sh api.pokeidledex.com
set -e
D="${1:-api.pokeidledex.com}"
apt-get update -y
apt-get install -y nodejs caddy curl
id -u pid >/dev/null 2>&1 || useradd -r -m -d /opt/pid pid
mkdir -p /opt/pid
curl -fsSL https://raw.githubusercontent.com/lucasfr6-tech/PokeIdleDex/main/server/server.js -o /opt/pid/server.js
chown -R pid:pid /opt/pid
cat >/etc/systemd/system/pid.service <<EOF
[Unit]
Description=PokeIdleDex serveur
After=network.target
[Service]
User=pid
WorkingDirectory=/opt/pid
Environment=PORT=3000
Environment=DATA_FILE=/opt/pid/data.json
Environment=ALLOWED_ORIGIN=https://pokeidledex.com
Environment=STATIC_DIR=/opt/pid/none
ExecStart=/usr/bin/node /opt/pid/server.js
Restart=always
[Install]
WantedBy=multi-user.target
EOF
cat >/etc/caddy/Caddyfile <<EOF
$D {
  reverse_proxy 127.0.0.1:3000
}
EOF
systemctl daemon-reload
systemctl enable --now pid
systemctl restart caddy
echo "OK : teste https://$D/api/health"
