# AlgoTrader - Options Trading Platform

## Architecture

**Stack:** Python Flask (backend) + React/Vite (frontend)

**Backend** (`/backend/`) runs on port 8000:
- `app.py` — Flask entrypoint with SocketIO, APScheduler, Blueprint registration
- `config.py` — Environment-based configuration
- `routes/broker.py` — OpenAlgo/mStock broker API endpoints
- `routes/scanner.py` — Market scanner endpoints
- `routes/trades.py` — Trade management (open, exit, modify, history)
- `services/openalgo_service.py` — OpenAlgo unified API client
- `services/scanner_service.py` — Market scanning logic (scores options by IV, OI change, volume)
- `services/trade_manager.py` — Position tracking with trailing SL and dynamic target logic

**Frontend** (`/frontend/`) runs on port 5000 (Vite dev server):
- React + TypeScript + Tailwind CSS
- Vite proxies `/api` and `/socket.io` to backend on port 8000
- Real-time updates via Socket.IO
- Components: Dashboard, Scanner, Positions, TradeConfirmation, TradeHistory, Settings

## Startup

`bash start.sh` — starts Python backend and Vite frontend

## Key Features

1. **Market Scanner** — Scans NSE indices and top stocks for high-opportunity option instruments, scoring by volatility, OI change, volume, and price movement
2. **Trade Confirmation** — User reviews scanned instrument, sets lots, target%, SL%, trailing step% before placing
3. **Trailing Stop Loss** — SL automatically moves up as price rises; never moves down
4. **Dynamic Target** — When target is reached, it moves higher by the same %—position only exits at SL hit
5. **Manual Exit** — Exit any open position at market price anytime
6. **Modify SL/Target** — Update active SL or target levels on any open position
7. **Real-time Updates** — WebSocket pushes position updates and scan results every 5 seconds

## Environment Variables (Secrets)

- `SESSION_SECRET` — Flask secret key (configured)
- `OPENALGO_API_KEY` — OpenAlgo API key for mStock broker (required for live trading)
- `OPENALGO_HOST` — URL of your OpenAlgo instance (default: `http://127.0.0.1:5000`)

## Broker Integration

Uses OpenAlgo as a unified broker API layer. When OpenAlgo is not reachable, the app runs in **mock mode** — scanner returns simulated data and trades are tracked in-memory without real orders.

To enable live trading:
1. Run your OpenAlgo instance separately
2. Set `OPENALGO_API_KEY` and `OPENALGO_HOST` in Replit Secrets
3. Configure mStock broker in your OpenAlgo instance

## Dependencies

**Python:** flask, flask-cors, flask-socketio, apscheduler, pandas, numpy, requests, python-dotenv, eventlet, openalgo

**Node:** react, react-dom, socket.io-client, recharts, axios, lucide-react, clsx, vite, tailwindcss
