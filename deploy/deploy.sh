#!/usr/bin/env bash
# Build + assemble the standalone bundle, then (re)start via PM2.
# Run from the project root on the VPS: bash deploy/deploy.sh
set -euo pipefail

APP_DIR="/var/www/dashboard"
cd "$APP_DIR"

echo "→ Pulling latest"
git pull --ff-only

echo "→ Installing deps (prod + build needs dev deps)"
npm ci

echo "→ Building"
npm run build

# Standalone output needs static + public copied alongside server.js
echo "→ Assembling standalone bundle"
cp -r .next/static .next/standalone/.next/static
if [ -d public ]; then cp -r public .next/standalone/public; fi

echo "→ Restarting PM2"
mkdir -p /var/log/productivity-os
if pm2 describe productivity-os >/dev/null 2>&1; then
  pm2 reload ecosystem.config.js --update-env
else
  pm2 start ecosystem.config.js
fi
pm2 save

echo "→ Health check"
sleep 3
curl -fsS http://127.0.0.1:3000/api/healthz && echo " ✓ up"
