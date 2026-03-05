import axios from 'axios';
import type { ScanResult, Position, TradeSummary, BrokerStatus, Funds, TradeConfig } from '../types';

const api = axios.create({ baseURL: '/api' });

export const brokerApi = {
  getStatus: () => api.get<{ connected: boolean; broker: string; host: string }>('/broker/status'),
  getFunds: () => api.get<{ success: boolean; data: Funds }>('/broker/funds'),
  getPositions: () => api.get<{ success: boolean; data: any[] }>('/broker/positions'),
};

export const scannerApi = {
  runScan: () => api.post<{ success: boolean; data: ScanResult[]; count: number }>('/scanner/scan'),
  getResults: () => api.get<{ success: boolean; data: { results: ScanResult[]; last_scan_time: string; count: number } }>('/scanner/results'),
};

export const tradesApi = {
  openTrade: (instrument: ScanResult, config: TradeConfig, entryPrice: number) =>
    api.post<{ success: boolean; data: Position }>('/trades/open', {
      instrument,
      quantity: config.quantity,
      entry_price: entryPrice,
      target_pct: config.target_pct,
      sl_pct: config.sl_pct,
      trailing_step_pct: config.trailing_step_pct,
    }),
  getPositions: () => api.get<{ success: boolean; data: Position[] }>('/trades/positions'),
  updatePositions: () => api.post<{ success: boolean; data: any }>('/trades/positions/update', {}),
  exitTrade: (posId: string) => api.post<{ success: boolean; message: string; realized_pnl: number }>(`/trades/exit/${posId}`),
  modifyTrade: (posId: string, sl_price?: number, target_price?: number) =>
    api.put<{ success: boolean; position: Position }>(`/trades/modify/${posId}`, { sl_price, target_price }),
  getHistory: () => api.get<{ success: boolean; data: Position[] }>('/trades/history'),
  getSummary: () => api.get<{ success: boolean; data: TradeSummary }>('/trades/summary'),
};
