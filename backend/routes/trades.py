from flask import Blueprint, jsonify, request
from backend.services.trade_manager import TradeManager
from backend.services.openalgo_service import openalgo_service

trades_bp = Blueprint("trades", __name__)
trade_manager = TradeManager(openalgo_service)


@trades_bp.route("/open", methods=["POST"])
def open_trade():
    data = request.get_json()
    required = ["instrument", "quantity", "entry_price", "target_pct", "sl_pct", "trailing_step_pct"]
    for field in required:
        if field not in data:
            return jsonify({"success": False, "message": f"Missing: {field}"}), 400

    position = trade_manager.open_position(
        instrument=data["instrument"],
        quantity=data["quantity"],
        entry_price=data["entry_price"],
        target_pct=data["target_pct"],
        sl_pct=data["sl_pct"],
        trailing_step_pct=data["trailing_step_pct"]
    )

    if position:
        return jsonify({"success": True, "data": position})
    return jsonify({"success": False, "message": "Failed to open position"}), 500


@trades_bp.route("/positions", methods=["GET"])
def get_positions():
    positions = trade_manager.get_open_positions()
    return jsonify({"success": True, "data": positions})


@trades_bp.route("/positions/update", methods=["POST"])
def update_positions():
    data = request.get_json() or {}
    result = trade_manager.update_positions(data.get("price_updates"))
    return jsonify({"success": True, "data": result})


@trades_bp.route("/exit/<pos_id>", methods=["POST"])
def exit_trade(pos_id):
    result = trade_manager.manual_exit(pos_id)
    return jsonify(result)


@trades_bp.route("/modify/<pos_id>", methods=["PUT"])
def modify_trade(pos_id):
    data = request.get_json()
    result = trade_manager.update_sl_target(
        pos_id,
        new_sl=data.get("sl_price"),
        new_target=data.get("target_price")
    )
    return jsonify(result)


@trades_bp.route("/history", methods=["GET"])
def trade_history():
    history = trade_manager.get_trade_history()
    return jsonify({"success": True, "data": history})


@trades_bp.route("/summary", methods=["GET"])
def trade_summary():
    summary = trade_manager.get_summary()
    return jsonify({"success": True, "data": summary})
