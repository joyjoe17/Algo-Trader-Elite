import { useState } from 'react';
import { Search, RefreshCw, TrendingUp, TrendingDown, Zap, AlertCircle } from 'lucide-react';
import type { ScanResult } from '../types';
import { scannerApi } from '../services/api';
import clsx from 'clsx';

interface ScannerProps {
  results: ScanResult[];
  onSelectInstrument: (instrument: ScanResult) => void;
  onScanComplete: (results: ScanResult[]) => void;
}

export default function Scanner({ results, onSelectInstrument, onScanComplete }: ScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [lastScanTime, setLastScanTime] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'CE' | 'PE'>('ALL');

  const handleScan = async () => {
    setScanning(true);
    try {
      const res = await scannerApi.runScan();
      onScanComplete(res.data.data);
      setLastScanTime(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Scan failed', err);
    } finally {
      setScanning(false);
    }
  };

  const filtered = results.filter(r => filter === 'ALL' || r.option_type === filter);

  const getScoreBadge = (score: number) => {
    if (score >= 60) return 'bg-green-900/50 text-green-400 border-green-700/50';
    if (score >= 40) return 'bg-yellow-900/50 text-yellow-400 border-yellow-700/50';
    return 'bg-gray-800 text-gray-400 border-gray-700/50';
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className="text-yellow-400" size={18} />
          <h2 className="text-lg font-semibold text-white">Market Scanner</h2>
          {lastScanTime && (
            <span className="text-xs text-gray-500">Last scan: {lastScanTime}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg overflow-hidden border border-dark-600">
            {(['ALL', 'CE', 'PE'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={clsx(
                  'px-3 py-1.5 text-xs font-medium transition-colors',
                  filter === f
                    ? f === 'CE' ? 'bg-green-700 text-white' : f === 'PE' ? 'bg-red-700 text-white' : 'bg-blue-700 text-white'
                    : 'bg-dark-800 text-gray-400 hover:bg-dark-700'
                )}
              >
                {f}
              </button>
            ))}
          </div>
          <button
            onClick={handleScan}
            disabled={scanning}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <RefreshCw size={14} className={scanning ? 'animate-spin' : ''} />
            {scanning ? 'Scanning...' : 'Scan Market'}
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
          <Search size={48} className="mb-3 opacity-30" />
          <p className="text-sm">No scan results yet.</p>
          <p className="text-xs mt-1 text-gray-600">Click "Scan Market" to find opportunities</p>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-dark-800">
              <tr className="text-gray-400 text-xs">
                <th className="text-left py-2 px-3">Score</th>
                <th className="text-left py-2 px-3">Symbol</th>
                <th className="text-left py-2 px-3">Type</th>
                <th className="text-right py-2 px-3">Strike</th>
                <th className="text-right py-2 px-3">Expiry</th>
                <th className="text-right py-2 px-3">Premium</th>
                <th className="text-right py-2 px-3">Chg%</th>
                <th className="text-right py-2 px-3">IV</th>
                <th className="text-right py-2 px-3">OI Chg%</th>
                <th className="text-right py-2 px-3">Underlying</th>
                <th className="text-center py-2 px-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr
                  key={item.id}
                  className="border-t border-dark-700 hover:bg-dark-700/40 transition-colors"
                >
                  <td className="py-2 px-3">
                    <span className={clsx('px-2 py-0.5 rounded text-xs border font-semibold', getScoreBadge(item.score))}>
                      {item.score}
                    </span>
                  </td>
                  <td className="py-2 px-3 font-semibold text-white">{item.symbol}</td>
                  <td className="py-2 px-3">
                    <span className={clsx('px-2 py-0.5 rounded text-xs font-bold',
                      item.option_type === 'CE' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                    )}>
                      {item.option_type}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right text-gray-200">{item.strike}</td>
                  <td className="py-2 px-3 text-right text-gray-400 text-xs">{item.expiry}</td>
                  <td className="py-2 px-3 text-right font-medium text-white">₹{item.premium.toFixed(2)}</td>
                  <td className={clsx('py-2 px-3 text-right font-semibold',
                    item.premium_change_pct >= 0 ? 'text-green-400' : 'text-red-400'
                  )}>
                    {item.premium_change_pct >= 0 ? '+' : ''}{item.premium_change_pct.toFixed(2)}%
                  </td>
                  <td className="py-2 px-3 text-right text-gray-300">{item.iv.toFixed(1)}%</td>
                  <td className={clsx('py-2 px-3 text-right',
                    item.oi_change_pct >= 0 ? 'text-green-400' : 'text-red-400'
                  )}>
                    {item.oi_change_pct >= 0 ? '+' : ''}{item.oi_change_pct.toFixed(2)}%
                  </td>
                  <td className="py-2 px-3 text-right text-gray-300">₹{item.underlying_ltp.toFixed(2)}</td>
                  <td className="py-2 px-3 text-center">
                    <button
                      onClick={() => onSelectInstrument(item)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded transition-colors"
                    >
                      Trade
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
