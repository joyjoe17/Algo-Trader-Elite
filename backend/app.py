import eventlet
eventlet.monkey_patch()

import logging
from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from apscheduler.schedulers.background import BackgroundScheduler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config.from_object("backend.config.Config")

CORS(app, resources={r"/api/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="eventlet")

from backend.routes.broker import broker_bp
from backend.routes.scanner import scanner_bp, scanner_service
from backend.routes.trades import trades_bp, trade_manager

app.register_blueprint(broker_bp, url_prefix="/api/broker")
app.register_blueprint(scanner_bp, url_prefix="/api/scanner")
app.register_blueprint(trades_bp, url_prefix="/api/trades")


def position_updater():
    with app.app_context():
        try:
            result = trade_manager.update_positions()
            if result["closed_count"] > 0:
                socketio.emit("positions_update", {
                    "positions": result["positions"],
                    "summary": trade_manager.get_summary()
                })
        except Exception as e:
            logger.error(f"Position updater error: {e}")


def auto_scanner():
    with app.app_context():
        try:
            results = scanner_service.scan_market()
            socketio.emit("scan_results", {"results": results})
        except Exception as e:
            logger.error(f"Auto scanner error: {e}")


scheduler = BackgroundScheduler()
scheduler.add_job(position_updater, "interval", seconds=5, id="position_updater")
scheduler.add_job(auto_scanner, "interval", seconds=60, id="auto_scanner")
scheduler.start()


@socketio.on("connect")
def on_connect():
    logger.info("Client connected")
    emit("connected", {"message": "Connected to AlgoTrader"})


@socketio.on("disconnect")
def on_disconnect():
    logger.info("Client disconnected")


@socketio.on("request_positions")
def on_request_positions():
    positions = trade_manager.get_open_positions()
    summary = trade_manager.get_summary()
    emit("positions_update", {"positions": positions, "summary": summary})


@socketio.on("request_scan")
def on_request_scan():
    results = scanner_service.scan_market()
    emit("scan_results", {"results": results})


@app.route("/api/health")
def health():
    return {"status": "ok", "service": "AlgoTrader Backend"}


if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=8000, debug=False)
