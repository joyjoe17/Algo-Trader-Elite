import random
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class ScannerService:
    def __init__(self, openalgo_service):
        self.openalgo = openalgo_service
        self.scan_results = []
        self.last_scan_time = None

    def _get_near_expiry(self):
        today = datetime.now()
        days_ahead = 3 - today.weekday()
        if days_ahead <= 0:
            days_ahead += 7
        expiry = today + timedelta(days=days_ahead)
        return expiry.strftime("%d%b%Y").upper()

    def _generate_mock_scan_results(self):
        instruments = []
        symbols = [
            {"symbol": "NIFTY", "exchange": "NSE", "base_price": 22500},
            {"symbol": "BANKNIFTY", "exchange": "NSE", "base_price": 48000},
            {"symbol": "RELIANCE", "exchange": "NSE", "base_price": 2850},
            {"symbol": "TCS", "exchange": "NSE", "base_price": 3900},
            {"symbol": "INFY", "exchange": "NSE", "base_price": 1750},
            {"symbol": "HDFC", "exchange": "NSE", "base_price": 1650},
            {"symbol": "ICICIBANK", "exchange": "NSE", "base_price": 1100},
            {"symbol": "SBIN", "exchange": "NSE", "base_price": 780},
        ]

        for sym in symbols:
            base = sym["base_price"]
            ltp = round(base * (1 + random.uniform(-0.02, 0.03)), 2)
            change_pct = round((ltp - base) / base * 100, 2)
            volume = random.randint(50000, 500000)
            oi = random.randint(100000, 2000000)
            iv = round(random.uniform(12, 35), 2)

            strike_step = 50 if sym["symbol"] in ["NIFTY", "BANKNIFTY"] else 50
            atm_strike = round(ltp / strike_step) * strike_step

            for option_type in ["CE", "PE"]:
                if option_type == "CE":
                    strike = atm_strike + strike_step
                    premium = round(random.uniform(50, 300), 2)
                else:
                    strike = atm_strike - strike_step
                    premium = round(random.uniform(50, 300), 2)

                prev_premium = premium * (1 - random.uniform(0.05, 0.25))
                premium_change_pct = round((premium - prev_premium) / prev_premium * 100, 2)

                lot_size = 50 if sym["symbol"] == "NIFTY" else (15 if sym["symbol"] == "BANKNIFTY" else 500)

                option_volume = random.randint(10000, 200000)
                option_oi = random.randint(50000, 1000000)
                oi_change_pct = round(random.uniform(-10, 20), 2)

                score = self._calculate_score(
                    abs(change_pct), abs(premium_change_pct), iv, oi_change_pct, option_volume
                )

                expiry = self._get_near_expiry()
                option_symbol = f"{sym['symbol']}{expiry}{strike}{option_type}"

                instruments.append({
                    "id": f"{option_symbol}_{datetime.now().timestamp()}",
                    "symbol": sym["symbol"],
                    "option_symbol": option_symbol,
                    "exchange": "NFO",
                    "underlying_exchange": sym["exchange"],
                    "option_type": option_type,
                    "strike": strike,
                    "expiry": expiry,
                    "ltp": ltp,
                    "underlying_ltp": ltp,
                    "premium": premium,
                    "premium_change_pct": premium_change_pct,
                    "underlying_change_pct": change_pct,
                    "volume": option_volume,
                    "oi": option_oi,
                    "oi_change_pct": oi_change_pct,
                    "iv": iv,
                    "lot_size": lot_size,
                    "score": score,
                    "scan_time": datetime.now().isoformat()
                })

        instruments.sort(key=lambda x: x["score"], reverse=True)
        return instruments[:10]

    def _calculate_score(self, underlying_change_pct, premium_change_pct, iv, oi_change_pct, volume):
        score = 0
        score += min(underlying_change_pct * 10, 30)
        score += min(premium_change_pct * 2, 25)
        if iv > 20:
            score += 15
        if oi_change_pct > 5:
            score += min(oi_change_pct * 0.5, 15)
        score += min(volume / 10000, 15)
        return round(score, 2)

    def scan_market(self):
        try:
            logger.info("Starting market scan...")
            results = self._generate_mock_scan_results()
            self.scan_results = results
            self.last_scan_time = datetime.now().isoformat()
            logger.info(f"Market scan complete. Found {len(results)} opportunities.")
            return results
        except Exception as e:
            logger.error(f"Market scan error: {e}")
            return []

    def get_last_results(self):
        return {
            "results": self.scan_results,
            "last_scan_time": self.last_scan_time,
            "count": len(self.scan_results)
        }

    def get_live_quote(self, symbol, exchange="NFO"):
        quote = self.openalgo.get_quote(symbol, exchange)
        if quote:
            return quote
        return {
            "ltp": round(random.uniform(50, 500), 2),
            "bid": round(random.uniform(50, 500), 2),
            "ask": round(random.uniform(50, 500), 2),
            "volume": random.randint(1000, 100000),
            "oi": random.randint(10000, 500000)
        }
