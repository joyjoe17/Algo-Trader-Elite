#!/usr/bin/env bash
set -euo pipefail

APP_DIR=${1:-"$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"}
APP_USER=${2:-"$USER"}
APP_GROUP=${3:-"$APP_USER"}
ENV_FILE=${4:-"$APP_DIR/.env"}

if [[ ! -f "$APP_DIR/deploy/algotrader-backend.service" ]]; then
  echo "Service template not found: $APP_DIR/deploy/algotrader-backend.service"
  exit 1
fi

if [[ ! -x "$APP_DIR/.venv/bin/gunicorn" ]]; then
  echo "Gunicorn not found at $APP_DIR/.venv/bin/gunicorn"
  echo "Run: source .venv/bin/activate && pip install gunicorn eventlet"
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  cat > "$ENV_FILE" <<'ENVEOF'
HOST=0.0.0.0
PORT=8000
SESSION_SECRET=change-me
# Optional broker integration
# OPENALGO_API_KEY=
# OPENALGO_HOST=http://127.0.0.1:5000
ENVEOF
  echo "Created default env file: $ENV_FILE"
fi

TMP_FILE=$(mktemp)
trap 'rm -f "$TMP_FILE"' EXIT

sed \
  -e "s|__APP_DIR__|$APP_DIR|g" \
  -e "s|__APP_USER__|$APP_USER|g" \
  -e "s|__APP_GROUP__|$APP_GROUP|g" \
  -e "s|__ENV_FILE__|$ENV_FILE|g" \
  "$APP_DIR/deploy/algotrader-backend.service" > "$TMP_FILE"

sudo cp "$TMP_FILE" /etc/systemd/system/algotrader-backend.service
sudo systemctl daemon-reload
sudo systemctl enable algotrader-backend
sudo systemctl restart algotrader-backend
sudo systemctl --no-pager --full status algotrader-backend || true

echo
echo "Service installed as algotrader-backend.service"
echo "Useful commands:"
echo "  sudo systemctl status algotrader-backend"
echo "  sudo journalctl -u algotrader-backend -f"

