export interface ScanResult {
  id: string;
  symbol: string;
  option_symbol: string;
  exchange: string;
  underlying_exchange: string;
  option_type: 'CE' | 'PE';
  strike: number;
  expiry: string;
  ltp: number;
  underlying_ltp: number;
  premium: number;
  premium_change_pct: number;
  underlying_change_pct: number;
  volume: number;
  oi: number;
  oi_change_pct: number;
  iv: number;
  lot_size: number;
  score: number;
  scan_time: string;
}

export interface Position {
  id: string;
  symbol: string;
  option_symbol: string;
  exchange: string;
  option_type: 'CE' | 'PE';
  strike: number;
  expiry: string;
  lot_size: number;
  quantity: number;
  entry_price: number;
  current_price: number;
  target_price: number;
  initial_target: number;
  sl_price: number;
  initial_sl: number;
  highest_price: number;
  target_pct: number;
  sl_pct: number;
  trailing_step_pct: number;
  target_hits: number;
  sl_adjustments: number;
  unrealized_pnl: number;
  realized_pnl: number | null;
  status: 'OPEN' | 'CLOSED';
  entry_time: string;
  exit_time: string | null;
  exit_price: number | null;
  exit_reason: string | null;
  order_id?: string;
}

export interface TradeSummary {
  open_positions: number;
  total_trades: number;
  total_realized_pnl: number;
  total_unrealized_pnl: number;
  win_rate: number;
  winning_trades: number;
  losing_trades: number;
}

export interface TradeConfig {
  quantity: number;
  target_pct: number;
  sl_pct: number;
  trailing_step_pct: number;
}

export interface BrokerStatus {
  connected: boolean;
  broker: string;
  host: string;
}

export interface Funds {
  availablecash?: number;
  collateral?: number;
  m2mrealized?: number;
  m2munrealized?: number;
  utiliseddebits?: number;
}
