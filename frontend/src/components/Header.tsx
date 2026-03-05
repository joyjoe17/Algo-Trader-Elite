import { Activity, Wifi, WifiOff, TrendingUp } from 'lucide-react';
import type { BrokerStatus, Funds, TradeSummary } from '../types';

interface HeaderProps {
  wsConnected: boolean;
  brokerStatus: BrokerStatus | null;
  funds: Funds | null;
  summary: TradeSummary | null;
}

export default function Header({ wsConnected, brokerStatus, funds, summary }: HeaderProps) {
  const totalPnl = (summary?.total_realized_pnl || 0) + (summary?.total_unrealized_pnl || 0);

  return (
    <header className="bg-dark-800 border-b border-dark-600 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="text-blue-400" size={24} />
            <span className="text-xl font-bold text-white">AlgoTrader</span>
            <span className="text-xs text-gray-500 mt-1">Options Platform</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {funds?.availablecash !== undefined && (
            <div className="text-right">
              <div className="text-xs text-gray-400">Available Funds</div>
              <div className="text-sm font-semibold text-white">
                ₹{(funds.availablecash || 0).toLocaleString('en-IN')}
              </div>
            </div>
          )}

          {summary && (
            <div className="text-right">
              <div className="text-xs text-gray-400">Total P&L</div>
              <div className={`text-sm font-bold ${totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {totalPnl >= 0 ? '+' : ''}₹{totalPnl.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
              brokerStatus?.connected
                ? 'bg-green-900/40 text-green-400 border border-green-700/50'
                : 'bg-red-900/40 text-red-400 border border-red-700/50'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${brokerStatus?.connected ? 'bg-green-400 blink' : 'bg-red-400'}`} />
              {brokerStatus?.connected ? 'mStock Live' : 'mStock Offline'}
            </div>

            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
              wsConnected
                ? 'bg-blue-900/40 text-blue-400 border border-blue-700/50'
                : 'bg-gray-800 text-gray-500 border border-gray-700/50'
            }`}>
              {wsConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
              {wsConnected ? 'Live' : 'Disconnected'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
