#!/usr/bin/env bash
# =============================================================================
# setup-server.sh
# Idempotent bootstrap for an Ubuntu 22.04 EC2 instance hosting domain_info.
# Run once after the first SSH into the box. Safe to re-run.
# =============================================================================
set -euo pipefail

APP_NAME="domain_info"
APP_USER="domain_info"
APP_DIR="/opt/${APP_NAME}"
DATA_DIR="/var/lib/${APP_NAME}"
LOG_DIR="/var/log/${APP_NAME}"
DEPLOY_USER="ubuntu"

# ── sanity ───────────────────────────────────────────────────────────────────
if [[ $EUID -ne 0 ]]; then
  echo "Re-run as root:  sudo bash $0" >&2
  exit 1
fi

echo "==> Updating apt cache"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y

# ── runtime deps ─────────────────────────────────────────────────────────────
echo "==> Installing system packages"
apt-get install -y --no-install-recommends \
  curl ca-certificates gnupg ufw rsync nginx sqlite3

# ── Node.js 20 LTS (NodeSource) ──────────────────────────────────────────────
if ! command -v node >/dev/null 2>&1 || [[ "$(node -v | tr -d 'v' | cut -d. -f1)" -lt 20 ]]; then
  echo "==> Installing Node.js 20 LTS"
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
echo "    node: $(node -v)  npm: $(npm -v)"

# ── cloudflared ──────────────────────────────────────────────────────────────
if ! command -v cloudflared >/dev/null 2>&1; then
  echo "==> Installing cloudflared (via official .deb, not apt — apt repo only has LTS codenames)"
  curl -fsSL -o /tmp/cloudflared.deb \
    https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
  dpkg -i /tmp/cloudflared.deb
  rm -f /tmp/cloudflared.deb
fi
echo "    cloudflared: $(cloudflared --version 2>&1 | head -n1)"

# ── raw ICMP for traceroute ──────────────────────────────────────────────────
# Recent kernels (6.6+) ship with ping_group_range="1 0" which forbids raw
# ICMP sockets for all GIDs. This breaks nodejs-traceroute on the app and
# cloudflared's health-check ICMP proxy. Open it up to GID 0..1000 (covers
# both root and the default ubuntu user).
echo "==> Setting net.ipv4.ping_group_range=0 1000"
echo 'net.ipv4.ping_group_range = 0 1000' > /etc/sysctl.d/99-ping-group-range.conf
sysctl -w net.ipv4.ping_group_range="0 1000" >/dev/null

# ── directories ──────────────────────────────────────────────────────────────
echo "==> Creating app directories"
mkdir -p "${APP_DIR}" "${DATA_DIR}" "${LOG_DIR}"
chown -R "${DEPLOY_USER}:${DEPLOY_USER}" "${APP_DIR}" "${DATA_DIR}" "${LOG_DIR}"
chmod 750 "${DATA_DIR}"

# ── systemd units ────────────────────────────────────────────────────────────
echo "==> Installing systemd units"
install -m 0644 "$(dirname "$0")/${APP_NAME}.service" \
  "/etc/systemd/system/${APP_NAME}.service"
install -m 0644 "$(dirname "$0")/cloudflared-quick.service" \
  "/etc/systemd/system/cloudflared-quick.service"

# ── nginx site ───────────────────────────────────────────────────────────────
echo "==> Configuring nginx"
install -m 0644 "$(dirname "$0")/nginx.conf" "/etc/nginx/sites-available/${APP_NAME}"
ln -sf "/etc/nginx/sites-available/${APP_NAME}" "/etc/nginx/sites-enabled/${APP_NAME}"
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

# ── firewall ─────────────────────────────────────────────────────────────────
echo "==> Configuring UFW (only SSH + nginx HTTP)"
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# ── systemd daemon-reload ────────────────────────────────────────────────────
systemctl daemon-reload
systemctl enable nginx
systemctl enable "${APP_NAME}.service" || true   # enabled after first deploy
systemctl enable cloudflared-quick.service || true

echo
echo "==================================================================="
echo "  Bootstrap complete."
echo "==================================================================="
echo
echo "Next steps (run as 'ubuntu' or another non-root user):"
echo
echo "  1. Copy the repo into ${APP_DIR} and build it:"
echo "       rsync -avz --delete ./ ${DEPLOY_USER}@<host>:${APP_DIR}/"
echo "       ssh ${DEPLOY_USER}@<host> 'cd ${APP_DIR}/server && npm ci && npx prisma migrate deploy && npm run build'"
echo "       ssh ${DEPLOY_USER}@<host> 'cd ${APP_DIR}/client && npm ci && npm run build'"
echo
echo "  2. Create ${DATA_DIR}/.env from .env.example, set a real JWT_SECRET,"
echo "     then restart the service:"
echo "       ssh ${DEPLOY_USER}@<host> 'sudo systemctl restart ${APP_NAME}'"
echo
echo "  3. Start the Cloudflare quick tunnel:"
echo "       ssh ${DEPLOY_USER}@<host> 'sudo systemctl start cloudflared-quick'"
echo "       ssh ${DEPLOY_USER}@<host> 'sudo journalctl -u cloudflared-quick -f'"
echo "     The journal will print a https://<random>.trycloudflare.com URL."
echo
echo "GitHub Actions will take over from step 1 onward once secrets are set."
echo
