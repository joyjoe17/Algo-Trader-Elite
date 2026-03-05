#!/bin/bash
set -e

echo "Starting AlgoTrader Backend..."
cd /home/runner/workspace
python -m backend.app &
BACKEND_PID=$!

echo "Installing frontend dependencies..."
cd /home/runner/workspace/frontend
npm install --silent

echo "Starting AlgoTrader Frontend..."
npm run dev
