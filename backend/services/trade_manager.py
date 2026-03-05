import logging
import random
from datetime import datetime
from threading import Lock

logger = logging.getLogger(__name__)


class TradeManager:
    def __init__(self, openalgo_service):
        self.openalgo = openalgo_service
        self.positions = {}
        self.trade_history = []
        self.lock = Lock()

    def open_position(self, instrument, quantity, entry_price, target_pct, sl_pct, trailing_step_pct):
        with self.lock:
            pos_id = f"pos_{datetime.now().strftime('%Y%m%d%H%M%S')}_{instrument['option_symbol']}"

            target_price = round(entry_price * (1 + target_pct / 100), 2)
            sl_price = round(entry_price * (1 - sl_pct / 100), 2)

            position = {
                "id": pos_id,
                "symbol": instrument["symbol"],
                "option_symbol": instrument["option_symbol"],
                "exchange": instrument["exchange"],
                "option_type": instrument["option_type"],
                "strike": instrument["strike"],
                "expiry": instrument["expiry"],
                "lot_size": instrument.get("lot_size", 1),
                "quantity": quantity,
                "entry_price": entry_price,
                "current_price": entry_price,
                "target_price": target_price,
                "initial_target": target_price,
                "sl_price": sl_price,
                "initial_sl": sl_price,
                "highest_price": entry_price,
                "target_pct": target_pct,
                "sl_pct": sl_pct,
                "trailing_step_pct": trailing_step_pct,
                "target_hits": 0,
                "sl_adjustments": 0,
                "unrealized_pnl": 0.0,
                "status": "OPEN",
                "entry_time": datetime.now().isoformat(),
                "exit_time": None,
                "exit_price": None,
                "realized_pnl": None,
                "exit_reason": None
            }

            order_result = self.openalgo.place_order(
                symbol=instrument["option_symbol"],
                exchange=instrument["exchange"],
                action="BUY",
                quantity=quantity * instrument.get("lot_size", 1),
                order_type="MARKET",
                product="NRML"
            )

            if order_result is None:
                position["order_id"] = f"MOCK_{pos_id}"
                position["order_status"] = "MOCK_PLACED"
            elif order_result.get("status") == "success":
                position["order_id"] = order_result.get("data", {}).get("orderid", "")
                position["order_status"] = "PLACED"
            else:
                logger.error(f"Order placement failed: {order_result}")
                return None

            self.positions[pos_id] = position
            logger.info(f"Position opened: {pos_id} {instrument['option_symbol']} @ {entry_price}")
            return position

    def update_positions(self, price_updates=None):
        with self.lock:
            closed = []
            for pos_id, pos in list(self.positions.items()):
                if pos["status"] != "OPEN":
                    continue

                if price_updates and pos["option_symbol"] in price_updates:
                    current_price = price_updates[pos["option_symbol"]]
                else:
                    current_price = self._get_simulated_price(pos)

                pos["current_price"] = current_price
                pos["unrealized_pnl"] = round(
                    (current_price - pos["entry_price"]) * pos["quantity"] * pos["lot_size"], 2
                )

                if current_price > pos["highest_price"]:
                    pos["highest_price"] = current_price
                    self._adjust_trailing_sl(pos)

                if current_price >= pos["target_price"]:
                    self._move_target_higher(pos)
                    logger.info(f"Target hit for {pos_id}. Moving target higher to {pos['target_price']}")

                if current_price <= pos["sl_price"]:
                    logger.info(f"SL hit for {pos_id} at {current_price}. Exiting position.")
                    self._close_position(pos_id, pos, current_price, "SL_HIT")
                    closed.append(pos_id)

            return {
                "positions": list(self.positions.values()),
                "closed_count": len(closed)
            }

    def _get_simulated_price(self, pos):
        current = pos["current_price"]
        change_pct = random.uniform(-0.8, 1.0)
        new_price = round(current * (1 + change_pct / 100), 2)
        return max(new_price, 0.05)

    def _adjust_trailing_sl(self, pos):
        new_sl = round(pos["highest_price"] * (1 - pos["sl_pct"] / 100), 2)
        if new_sl > pos["sl_price"]:
            pos["sl_price"] = new_sl
            pos["sl_adjustments"] += 1
            logger.debug(f"Trailing SL adjusted to {new_sl} for {pos['id']}")

    def _move_target_higher(self, pos):
        pos["target_hits"] += 1
        new_target = round(pos["target_price"] * (1 + pos["target_pct"] / 100), 2)
        pos["target_price"] = new_target

        new_sl = round(pos["current_price"] * (1 - pos["sl_pct"] / 2 / 100), 2)
        if new_sl > pos["sl_price"]:
            pos["sl_price"] = new_sl

    def _close_position(self, pos_id, pos, exit_price, reason):
        order_result = self.openalgo.place_order(
            symbol=pos["option_symbol"],
            exchange=pos["exchange"],
            action="SELL",
            quantity=pos["quantity"] * pos["lot_size"],
            order_type="MARKET",
            product="NRML"
        )

        pos["status"] = "CLOSED"
        pos["exit_price"] = exit_price
        pos["exit_time"] = datetime.now().isoformat()
        pos["exit_reason"] = reason
        pos["realized_pnl"] = round(
            (exit_price - pos["entry_price"]) * pos["quantity"] * pos["lot_size"], 2
        )
        pos["unrealized_pnl"] = 0.0

        self.trade_history.append(dict(pos))
        del self.positions[pos_id]
        logger.info(f"Position closed: {pos_id} PnL: {pos['realized_pnl']}")

    def manual_exit(self, pos_id):
        with self.lock:
            if pos_id not in self.positions:
                return {"success": False, "message": "Position not found"}
            pos = self.positions[pos_id]
            exit_price = pos["current_price"]
            self._close_position(pos_id, pos, exit_price, "MANUAL_EXIT")
            return {"success": True, "message": "Position exited", "realized_pnl": pos["realized_pnl"]}

    def update_sl_target(self, pos_id, new_sl=None, new_target=None):
        with self.lock:
            if pos_id not in self.positions:
                return {"success": False, "message": "Position not found"}
            pos = self.positions[pos_id]
            if new_sl is not None:
                pos["sl_price"] = new_sl
            if new_target is not None:
                pos["target_price"] = new_target
            return {"success": True, "position": pos}

    def get_open_positions(self):
        with self.lock:
            return list(self.positions.values())

    def get_trade_history(self):
        return list(self.trade_history)

    def get_summary(self):
        open_pos = list(self.positions.values())
        history = list(self.trade_history)
        total_realized = sum(t.get("realized_pnl", 0) for t in history)
        total_unrealized = sum(p.get("unrealized_pnl", 0) for p in open_pos)
        winning = [t for t in history if t.get("realized_pnl", 0) > 0]
        return {
            "open_positions": len(open_pos),
            "total_trades": len(history),
            "total_realized_pnl": round(total_realized, 2),
            "total_unrealized_pnl": round(total_unrealized, 2),
            "win_rate": round(len(winning) / len(history) * 100, 2) if history else 0,
            "winning_trades": len(winning),
            "losing_trades": len(history) - len(winning)
        }
