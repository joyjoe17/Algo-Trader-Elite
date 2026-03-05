import requests
import logging
from backend.config import Config

logger = logging.getLogger(__name__)


class OpenAlgoService:
    def __init__(self):
        self.api_key = Config.OPENALGO_API_KEY
        self.host = Config.OPENALGO_HOST
        self.headers = {
            "Content-Type": "application/json",
            "x-api-key": self.api_key
        }
        self._connected = False
        self._broker_info = {}

    def _get(self, endpoint, params=None):
        try:
            url = f"{self.host}{endpoint}"
            resp = requests.get(url, headers=self.headers, params=params, timeout=10)
            resp.raise_for_status()
            return resp.json()
        except requests.exceptions.ConnectionError:
            logger.warning("OpenAlgo not reachable – using mock data")
            return None
        except Exception as e:
            logger.error(f"GET {endpoint} error: {e}")
            return None

    def _post(self, endpoint, data=None):
        try:
            url = f"{self.host}{endpoint}"
            resp = requests.post(url, headers=self.headers, json=data, timeout=10)
            resp.raise_for_status()
            return resp.json()
        except requests.exceptions.ConnectionError:
            logger.warning("OpenAlgo not reachable – using mock data")
            return None
        except Exception as e:
            logger.error(f"POST {endpoint} error: {e}")
            return None

    def test_connection(self):
        result = self._get("/api/v1/funds")
        if result and result.get("status") == "success":
            self._connected = True
            return True
        self._connected = False
        return False

    def is_connected(self):
        return self._connected

    def get_funds(self):
        result = self._get("/api/v1/funds")
        if result:
            return result.get("data", {})
        return {"availablecash": 0, "collateral": 0, "m2mrealized": 0, "m2munrealized": 0, "utiliseddebits": 0}

    def get_quote(self, symbol, exchange="NSE"):
        data = {"symbol": symbol, "exchange": exchange}
        result = self._post("/api/v1/quotes", data)
        if result and result.get("status") == "success":
            return result.get("data", {})
        return None

    def get_option_chain(self, symbol, expiry=None):
        params = {"symbol": symbol}
        if expiry:
            params["expiry"] = expiry
        result = self._get("/api/v1/optionchain", params)
        if result and result.get("status") == "success":
            return result.get("data", [])
        return []

    def place_order(self, symbol, exchange, action, quantity, order_type="MARKET",
                    product="NRML", price=0.0, trigger_price=0.0):
        data = {
            "apikey": self.api_key,
            "strategy": "AlgoTrader",
            "symbol": symbol,
            "action": action.upper(),
            "exchange": exchange,
            "pricetype": order_type,
            "product": product,
            "quantity": str(quantity),
            "price": str(price),
            "trigger_price": str(trigger_price),
            "disclosed_quantity": "0",
            "stoploss": "0",
            "squareoff": "0",
            "trailing_stoploss": "0"
        }
        result = self._post("/api/v1/placeorder", data)
        return result

    def place_smartorder(self, symbol, exchange, action, quantity, position_size,
                         order_type="MARKET", product="NRML", price=0.0):
        data = {
            "apikey": self.api_key,
            "strategy": "AlgoTrader",
            "symbol": symbol,
            "action": action.upper(),
            "exchange": exchange,
            "pricetype": order_type,
            "product": product,
            "quantity": str(quantity),
            "position_size": str(position_size),
            "price": str(price)
        }
        result = self._post("/api/v1/smartorder", data)
        return result

    def close_position(self, symbol, exchange, quantity, product="NRML"):
        data = {
            "apikey": self.api_key,
            "strategy": "AlgoTrader",
            "symbol": symbol,
            "exchange": exchange,
            "product": product,
            "quantity": str(quantity),
            "pricetype": "MARKET"
        }
        result = self._post("/api/v1/closeposition", data)
        return result

    def get_positions(self):
        result = self._post("/api/v1/positionbook", {"apikey": self.api_key})
        if result and result.get("status") == "success":
            return result.get("data", [])
        return []

    def get_orderbook(self):
        result = self._post("/api/v1/orderbook", {"apikey": self.api_key})
        if result and result.get("status") == "success":
            return result.get("data", [])
        return []


openalgo_service = OpenAlgoService()
