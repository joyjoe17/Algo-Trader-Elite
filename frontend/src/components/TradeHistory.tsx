import { History, TrendingUp, TrendingDown } from 'lucide-react';
import type { Position } from '../types';
import clsx from 'clsx';

interface TradeHistoryProps {
  history: Position[];
}

export default function TradeHistory({ history }: TradeHistoryProps) {
  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-500">
        <History size={48} className="mb-3 opacity-20" />
        <p className="text-sm">No closed trades yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-dark-800">
          <tr className="text-gray-400 text-xs">
            <th className="text-left py-2 px-3">Symbol</th>
            <th className="text-left py-2 px-3">Type</th>
            <th className="text-right py-2 px-3">Strike</th>
            <th className="text-right py-2 px-3">Entry</th>
            <th className="text-right py-2 px-3">Exit</th>
            <th className="text-right py-2 px-3">P&L</th>
            <th className="text-left py-2 px-3">Reason</th>
            <th className="text-right py-2 px-3">SL Adj</th>
            <th className="text-right py-2 px-3">Tgt Hits</th>
          </tr>
        </thead>
        <tbody>
          {[...history].reverse().map(trade => (
            <tr key={trade.id} className="border-t border-dark-700 hover:bg-dark-700/30 transition-colors">
              <td className="py-2 px-3 font-semibold text-white">{trade.symbol}</td>
              <td className="py-2 px-3">
                <span className={clsx('px-2 py-0.5 rounded text-xs font-bold',
                  trade.option_type === 'CE' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                )}>
                  {trade.option_type}
                </span>
              </td>
              <td className="py-2 px-3 text-right text-gray-300">{trade.strike}</td>
              <td className="py-2 px-3 text-right text-gray-300">₹{trade.entry_price.toFixed(2)}</td>
              <td className="py-2 px-3 text-right text-gray-300">₹{(trade.exit_price || 0).toFixed(2)}</td>
              <td className={clsx('py-2 px-3 text-right font-bold',
                (trade.realized_pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'
              )}>
                {(trade.realized_pnl || 0) >= 0 ? '+' : ''}₹{(trade.realized_pnl || 0).toFixed(2)}
              </td>
              <td className="py-2 px-3">
                <span className={clsx('text-xs px-1.5 py-0.5 rounded', {
                  'bg-red-900/40 text-red-400': trade.exit_reason === 'SL_HIT',
                  'bg-gray-800 text-gray-400': trade.exit_reason === 'MANUAL_EXIT',
                  'bg-green-900/40 text-green-400': trade.exit_reason === 'TARGET_HIT',
                })}>
                  {trade.exit_reason?.replace('_', ' ')}
                </span>
              </td>
              <td className="py-2 px-3 text-right text-blue-400">{trade.sl_adjustments}</td>
              <td className="py-2 px-3 text-right text-yellow-400">{trade.target_hits}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
