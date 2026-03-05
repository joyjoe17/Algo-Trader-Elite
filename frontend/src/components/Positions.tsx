import { useState } from 'react';
import { LogOut, Edit2, TrendingUp, TrendingDown, Shield, Target, ChevronUp } from 'lucide-react';
import type { Position } from '../types';
import { tradesApi } from '../services/api';
import clsx from 'clsx';

interface PositionsProps {
  positions: Position[];
  onPositionChanged: () => void;
}

export default function Positions({ positions, onPositionChanged }: PositionsProps) {
  const [editPos, setEditPos] = useState<string | null>(null);
  const [editSL, setEditSL] = useState('');
  const [editTarget, setEditTarget] = useState('');
  const [exiting, setExiting] = useState<string | null>(null);

  const handleExit = async (posId: string) => {
    if (!window.confirm('Exit this position at market price?')) return;
    setExiting(posId);
    try {
      await tradesApi.exitTrade(posId);
      onPositionChanged();
    } catch (err) {
      console.error('Exit failed', err);
    } finally {
      setExiting(null);
    }
  };

  const handleModify = async (posId: string) => {
    try {
      await tradesApi.modifyTrade(
        posId,
        editSL ? parseFloat(editSL) : undefined,
        editTarget ? parseFloat(editTarget) : undefined
      );
      setEditPos(null);
      onPositionChanged();
    } catch (err) {
      console.error('Modify failed', err);
    }
  };

  const getPnlClass = (pnl: number) => pnl >= 0 ? 'text-green-400' : 'text-red-400';

  if (positions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-500">
        <TrendingUp size={48} className="mb-3 opacity-20" />
        <p className="text-sm">No open positions</p>
        <p className="text-xs text-gray-600 mt-1">Place a trade from the scanner to see positions here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {positions.map(pos => {
        const pnlPct = ((pos.current_price - pos.entry_price) / pos.entry_price) * 100;
        const slFromCurrent = ((pos.current_price - pos.sl_price) / pos.current_price) * 100;
        const targetFromCurrent = ((pos.target_price - pos.current_price) / pos.current_price) * 100;

        return (
          <div key={pos.id} className="bg-dark-700 border border-dark-600 rounded-xl p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{pos.symbol}</span>
                  <span className={clsx('px-2 py-0.5 rounded text-xs font-bold',
                    pos.option_type === 'CE' ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'
                  )}>
                    {pos.option_type}
                  </span>
                  <span className="text-gray-400 text-xs">{pos.strike} | {pos.expiry}</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {pos.quantity} lot(s) × {pos.lot_size} | Entry: ₹{pos.entry_price.toFixed(2)}
                </p>
                {pos.target_hits > 0 && (
                  <span className="text-xs text-yellow-400 flex items-center gap-1 mt-0.5">
                    <ChevronUp size={12} /> Target moved {pos.target_hits} time(s)
                  </span>
                )}
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-white">₹{pos.current_price.toFixed(2)}</div>
                <div className={`text-sm font-semibold ${getPnlClass(pos.unrealized_pnl)}`}>
                  {pos.unrealized_pnl >= 0 ? '+' : ''}₹{pos.unrealized_pnl.toFixed(2)}
                  <span className="text-xs ml-1 opacity-70">({pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%)</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-dark-800 rounded-lg p-2">
                <div className="flex items-center gap-1 text-xs text-green-400 mb-1">
                  <Target size={10} /> Target
                </div>
                <div className="text-sm font-semibold text-white">₹{pos.target_price.toFixed(2)}</div>
                <div className="text-xs text-green-500">+{targetFromCurrent.toFixed(1)}% away</div>
              </div>
              <div className="bg-dark-800 rounded-lg p-2">
                <div className="flex items-center gap-1 text-xs text-red-400 mb-1">
                  <Shield size={10} /> Trailing SL
                </div>
                <div className="text-sm font-semibold text-white">₹{pos.sl_price.toFixed(2)}</div>
                <div className="text-xs text-red-500">-{slFromCurrent.toFixed(1)}% buffer</div>
              </div>
              <div className="bg-dark-800 rounded-lg p-2">
                <div className="flex items-center gap-1 text-xs text-blue-400 mb-1">
                  <TrendingUp size={10} /> High
                </div>
                <div className="text-sm font-semibold text-white">₹{pos.highest_price.toFixed(2)}</div>
                <div className="text-xs text-gray-500">{pos.sl_adjustments} SL adj.</div>
              </div>
            </div>

            {editPos === pos.id ? (
              <div className="flex gap-2 mb-3">
                <div className="flex-1">
                  <input
                    placeholder={`SL (current: ${pos.sl_price.toFixed(2)})`}
                    value={editSL}
                    onChange={e => setEditSL(e.target.value)}
                    className="w-full bg-dark-800 border border-red-800 rounded-lg px-2 py-1.5 text-white text-xs focus:border-red-500 outline-none"
                  />
                </div>
                <div className="flex-1">
                  <input
                    placeholder={`Target (current: ${pos.target_price.toFixed(2)})`}
                    value={editTarget}
                    onChange={e => setEditTarget(e.target.value)}
                    className="w-full bg-dark-800 border border-green-800 rounded-lg px-2 py-1.5 text-white text-xs focus:border-green-500 outline-none"
                  />
                </div>
                <button onClick={() => handleModify(pos.id)} className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg">Save</button>
                <button onClick={() => setEditPos(null)} className="px-3 py-1.5 bg-dark-600 text-gray-400 text-xs rounded-lg">Cancel</button>
              </div>
            ) : null}

            <div className="flex gap-2 mt-2">
              <button
                onClick={() => { setEditPos(pos.id); setEditSL(''); setEditTarget(''); }}
                className="flex items-center gap-1 px-3 py-1.5 border border-dark-600 hover:border-blue-500 text-gray-400 hover:text-blue-400 text-xs rounded-lg transition-colors"
              >
                <Edit2 size={12} /> Modify
              </button>
              <button
                onClick={() => handleExit(pos.id)}
                disabled={exiting === pos.id}
                className="flex items-center gap-1 px-3 py-1.5 bg-red-900/40 hover:bg-red-800/50 border border-red-800/50 text-red-400 text-xs rounded-lg transition-colors disabled:opacity-50"
              >
                <LogOut size={12} /> {exiting === pos.id ? 'Exiting...' : 'Exit Position'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
