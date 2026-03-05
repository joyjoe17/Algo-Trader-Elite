from flask import Blueprint, jsonify, request
from backend.services.scanner_service import ScannerService
from backend.services.openalgo_service import openalgo_service

scanner_bp = Blueprint("scanner", __name__)
scanner_service = ScannerService(openalgo_service)


@scanner_bp.route("/scan", methods=["POST"])
def run_scan():
    results = scanner_service.scan_market()
    return jsonify({
        "success": True,
        "data": results,
        "count": len(results)
    })


@scanner_bp.route("/results", methods=["GET"])
def get_results():
    data = scanner_service.get_last_results()
    return jsonify({"success": True, "data": data})


@scanner_bp.route("/quote", methods=["POST"])
def get_quote():
    body = request.get_json()
    symbol = body.get("symbol")
    exchange = body.get("exchange", "NFO")
    if not symbol:
        return jsonify({"success": False, "message": "symbol required"}), 400
    quote = scanner_service.get_live_quote(symbol, exchange)
    return jsonify({"success": True, "data": quote})
