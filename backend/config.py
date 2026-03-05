import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get("SESSION_SECRET", "algo-trading-secret-key")
    
    OPENALGO_API_KEY = os.environ.get("OPENALGO_API_KEY", "")
    OPENALGO_HOST = os.environ.get("OPENALGO_HOST", "http://127.0.0.1:5000")
    
    BROKER = os.environ.get("BROKER", "mstock")
    
    SCAN_INTERVAL = int(os.environ.get("SCAN_INTERVAL", "60"))
    
    NSE_INDICES = ["NIFTY", "BANKNIFTY", "FINNIFTY", "MIDCPNIFTY"]
    
    TOP_STOCKS = [
        "RELIANCE", "TCS", "INFY", "HDFC", "ICICIBANK",
        "SBIN", "KOTAKBANK", "BAJFINANCE", "BHARTIARTL", "ITC",
        "AXISBANK", "WIPRO", "LT", "HCLTECH", "MARUTI",
        "TITAN", "ASIANPAINT", "NESTLEIND", "POWERGRID", "NTPC"
    ]
    
    MAX_POSITIONS = int(os.environ.get("MAX_POSITIONS", "5"))
    DEFAULT_LOT_SIZE = int(os.environ.get("DEFAULT_LOT_SIZE", "1"))
    
    DEFAULT_TARGET_PCT = float(os.environ.get("DEFAULT_TARGET_PCT", "2.0"))
    DEFAULT_SL_PCT = float(os.environ.get("DEFAULT_SL_PCT", "1.0"))
    TRAILING_SL_STEP_PCT = float(os.environ.get("TRAILING_SL_STEP_PCT", "0.5"))
    TARGET_MOVE_PCT = float(os.environ.get("TARGET_MOVE_PCT", "2.0"))
