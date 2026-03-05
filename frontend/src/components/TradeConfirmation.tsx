import { useState } from 'react';
import { X, CheckCircle, AlertTriangle, TrendingUp, TrendingDown, Target, Shield } from 'lucide-react';
import type { ScanResult, TradeConfig } from '../types';
import { tradesApi } from '../services/api';

interface TradeConfirmationProps {
  instrument: ScanResult;
  onClose: () => void;
  onTradeOpened: () => void;
}

export default function TradeConfirmation({ instrument, onClose, onTradeOpened }: TradeConfirmationProps) {
  const [config, setConfig] = useState<TradeConfig>({
    quantity: 1,
    target_pct: 2.0,
    sl_pct: 1.0,
    trailing_step_pct: 0.5,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const entryPrice = instrument.premium;
  const targetPrice = entryPrice * (1 + config.target_pct / 100);
  const slPrice = entryPrice * (1 - config.sl_pct / 100);
  const investmentValue = entryPrice * config.quantity * instrument.lot_size;

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await tradesApi.openTrade(instrument, config, entryPrice);
      if (res.data.success) {
        onTradeOpened();
        onClose();
      } else {
        setError('Failed to place order');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Order placement failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-dark-800 border border-dark-600 rounded-2xl w-full max-w-lg slide-up">
        <div className="flex items-center justify-between p-5 border-b border-dark-600">
          <div>
            <h2 className="text-lg font-bold text-white">Confirm Trade</h2>
            <p className="text-xs text-gray-400 mt-0.5">Review details before placing order</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-dark-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-white">{instrument.symbol}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    instrument.option_type === 'CE' ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'
                  }`}>
                    {instrument.option_type}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">{instrument.expiry} | Strike: {instrument.strike} | {instrument.exchange}</p>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-white">₹{entryPrice.toFixed(2)}</div>
                <div className={`text-xs font-medium ${instrument.premium_change_pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {instrument.premium_change_pct >= 0 ? '+' : ''}{instrument.premium_change_pct.toFixed(2)}%
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-dark-800 rounded-lg p-2 text-center">
                <div className="text-gray-400">IV</div>
                <div className="font-semibold text-white">{instrument.iv.toFixed(1)}%</div>
              </div>
              <div className="bg-dark-800 rounded-lg p-2 text-center">
                <div className="text-gray-400">OI Chg</div>
                <div className={`font-semibold ${instrument.oi_change_pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {instrument.oi_change_pct >= 0 ? '+' : ''}{instrument.oi_change_pct.toFixed(1)}%
                </div>
              </div>
              <div className="bg-dark-800 rounded-lg p-2 text-center">
                <div className="text-gray-400">Score</div>
                <div className="font-semibold text-yellow-400">{instrument.score}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Lots (1 lot = {instrument.lot_size} qty)</label>
              <input
                type="number"
                min={1}
                value={config.quantity}
                onChange={e => setConfig(c => ({ ...c, quantity: Math.max(1, parseInt(e.target.value) || 1) }))}
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Trailing SL Step %</label>
              <input
                type="number"
                min={0.1}
                step={0.1}
                value={config.trailing_step_pct}
                onChange={e => setConfig(c => ({ ...c, trailing_step_pct: parseFloat(e.target.value) || 0.5 }))}
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                <Target size={12} className="text-green-400" /> Target % (Move Higher on Hit)
              </label>
              <input
                type="number"
                min={0.5}
                step={0.5}
                value={config.target_pct}
                onChange={e => setConfig(c => ({ ...c, target_pct: parseFloat(e.target.value) || 2 }))}
                className="w-full bg-dark-700 border border-green-800 rounded-lg px-3 py-2 text-white text-sm focus:border-green-500 outline-none"
              />
              <p className="text-xs text-green-500 mt-1">Target: ₹{targetPrice.toFixed(2)}</p>
            </div>
            <div>
              <label className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                <Shield size={12} className="text-red-400" /> Stop Loss % (Trailing)
              </label>
              <input
                type="number"
                min={0.5}
                step={0.5}
                value={config.sl_pct}
                onChange={e => setConfig(c => ({ ...c, sl_pct: parseFloat(e.target.value) || 1 }))}
                className="w-full bg-dark-700 border border-red-800 rounded-lg px-3 py-2 text-white text-sm focus:border-red-500 outline-none"
              />
              <p className="text-xs text-red-500 mt-1">Initial SL: ₹{slPrice.toFixed(2)}</p>
            </div>
          </div>

          <div className="bg-blue-900/20 border border-blue-800/50 rounded-xl p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle size={14} className="text-blue-400 mt-0.5 shrink-0" />
              <div className="text-xs text-blue-300 space-y-0.5">
                <p><strong>Trailing SL:</strong> SL moves up automatically as price rises — never moves down.</p>
                <p><strong>Dynamic Target:</strong> When target is hit, it moves higher — position only exits at SL.</p>
                <p><strong>Investment:</strong> ≈ ₹{investmentValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-700 rounded-lg px-3 py-2 text-red-400 text-xs">
              {error}
            </div>
          )}
        </div>

        <div className="flex gap-3 p-5 border-t border-dark-600">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-dark-600 text-gray-400 hover:text-white hover:border-gray-500 rounded-xl text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 ${
              instrument.option_type === 'CE'
                ? 'bg-green-600 hover:bg-green-500 disabled:bg-green-900'
                : 'bg-red-600 hover:bg-red-500 disabled:bg-red-900'
            } text-white`}
          >
            <CheckCircle size={16} />
            {loading ? 'Placing Order...' : `Buy ${instrument.quantity || config.quantity} Lot ${instrument.option_type}`}
          </button>
        </div>
      </div>
    </div>
  );
}
