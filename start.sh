#!/bin/bash
set -e

echo "Starting AlgoTrader Backend..."
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

if [ -x "$PROJECT_ROOT/.venv/bin/python" ]; then
  PYTHON_BIN="$PROJECT_ROOT/.venv/bin/python"
elif command -v python >/dev/null 2>&1; then
  PYTHON_BIN="python"
elif command -v python3 >/dev/null 2>&1; then
  PYTHON_BIN="python3"
else
  echo "Error: Python is not installed. Install Python 3 and retry."
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm is not installed. Install Node.js (which includes npm) and retry."
  exit 1
fi

"$PYTHON_BIN" -m backend.app &
BACKEND_PID=$!

echo "Installing frontend dependencies..."
cd "$PROJECT_ROOT/frontend"
npm install --silent

echo "Starting AlgoTrader Frontend..."
npm run dev
