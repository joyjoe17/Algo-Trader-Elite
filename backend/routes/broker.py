from flask import Blueprint, jsonify, request
from backend.services.openalgo_service import openalgo_service

broker_bp = Blueprint("broker", __name__)


@broker_bp.route("/status", methods=["GET"])
def broker_status():
    connected = openalgo_service.test_connection()
    return jsonify({
        "connected": connected,
        "broker": "mstock",
        "host": openalgo_service.host
    })


@broker_bp.route("/funds", methods=["GET"])
def get_funds():
    funds = openalgo_service.get_funds()
    return jsonify({"success": True, "data": funds})


@broker_bp.route("/quote", methods=["POST"])
def get_quote():
    data = request.get_json()
    symbol = data.get("symbol")
    exchange = data.get("exchange", "NSE")
    if not symbol:
        return jsonify({"success": False, "message": "symbol required"}), 400
    quote = openalgo_service.get_quote(symbol, exchange)
    return jsonify({"success": True, "data": quote})


@broker_bp.route("/positions", methods=["GET"])
def get_broker_positions():
    positions = openalgo_service.get_positions()
    return jsonify({"success": True, "data": positions})


@broker_bp.route("/orders", methods=["GET"])
def get_orders():
    orders = openalgo_service.get_orderbook()
    return jsonify({"success": True, "data": orders})
