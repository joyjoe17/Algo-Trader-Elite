import { useState, useEffect, useCallback } from 'react';
import { LayoutDashboard, Search, Briefcase, History, Settings as SettingsIcon, Activity } from 'lucide-react';
import Header from './components/Header';
import Scanner from './components/Scanner';
import Positions from './components/Positions';
import TradeConfirmation from './components/TradeConfirmation';
import TradeHistory from './components/TradeHistory';
import Settings from './components/Settings';
import { useWebSocket } from './hooks/useWebSocket';
import { brokerApi, tradesApi } from './services/api';
import type { ScanResult, BrokerStatus, Funds, Position, TradeSummary } from './types';
import clsx from 'clsx';

type Tab = 'dashboard' | 'scanner' | 'positions' | 'history' | 'settings';

export default function App() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [selectedInstrument, setSelectedInstrument] = useState<ScanResult | null>(null);
  const [brokerStatus, setBrokerStatus] = useState<BrokerStatus | null>(null);
  const [funds, setFunds] = useState<Funds | null>(null);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [history, setHistory] = useState<Position[]>([]);
  const [summary, setSummary] = useState<TradeSummary | null>(null);

  const ws = useWebSocket();

  useEffect(() => {
    if (ws.positions.length > 0) setPositions(ws.positions);
    if (ws.scanResults.length > 0) setScanResults(ws.scanResults);
    if (ws.summary) setSummary(ws.summary);
  }, [ws.positions, ws.scanResults, ws.summary]);

  const loadData = useCallback(async () => {
    try {
      const [statusRes, fundsRes, posRes, histRes, sumRes] = await Promise.allSettled([
        brokerApi.getStatus(),
        brokerApi.getFunds(),
        tradesApi.getPositions(),
        tradesApi.getHistory(),
        tradesApi.getSummary(),
      ]);

      if (statusRes.status === 'fulfilled') setBrokerStatus(statusRes.value.data);
      if (fundsRes.status === 'fulfilled') setFunds(fundsRes.value.data.data);
      if (posRes.status === 'fulfilled') setPositions(posRes.value.data.data);
      if (histRes.status === 'fulfilled') setHistory(histRes.value.data.data);
      if (sumRes.status === 'fulfilled') setSummary(sumRes.value.data.data);
    } catch (err) {
      console.error('Data load error', err);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [loadData]);

  const navItems: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'scanner', label: 'Scanner', icon: <Search size={18} />, badge: scanResults.length },
    { id: 'positions', label: 'Positions', icon: <Briefcase size={18} />, badge: positions.length },
    { id: 'history', label: 'History', icon: <History size={18} />, badge: history.length },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon size={18} /> },
  ];

  const totalPnl = (summary?.total_realized_pnl || 0) + (summary?.total_unrealized_pnl || 0);

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col">
      <Header wsConnected={ws.connected} brokerStatus={brokerStatus} funds={funds} summary={summary} />

      <div className="flex flex-1 overflow-hidden">
        <nav className="w-52 bg-dark-800 border-r border-dark-600 flex flex-col py-4">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={clsx(
                'flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all relative',
                tab === item.id
                  ? 'text-white bg-blue-600/20 border-r-2 border-blue-500'
                  : 'text-gray-400 hover:text-white hover:bg-dark-700'
              )}
            >
              {item.icon}
              {item.label}
              {item.badge !== undefined && item.badge > 0 && (
                <span className="ml-auto bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </button>
          ))}

          <div className="mt-auto px-4 py-3 border-t border-dark-600">
            <div className="text-xs text-gray-500 mb-1">Session P&L</div>
            <div className={`text-base font-bold ${totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {totalPnl >= 0 ? '+' : ''}₹{totalPnl.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {summary?.open_positions || 0} open | {summary?.total_trades || 0} total
            </div>
          </div>
        </nav>

        <main className="flex-1 overflow-auto">
          {tab === 'dashboard' && (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: 'Open Positions', value: summary?.open_positions || 0, color: 'text-blue-400' },
                  { label: 'Unrealized P&L', value: `₹${(summary?.total_unrealized_pnl || 0).toFixed(2)}`, color: (summary?.total_unrealized_pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400' },
                  { label: 'Realized P&L', value: `₹${(summary?.total_realized_pnl || 0).toFixed(2)}`, color: (summary?.total_realized_pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400' },
                  { label: 'Win Rate', value: `${summary?.win_rate || 0}%`, color: 'text-yellow-400' },
                ].map(card => (
                  <div key={card.label} className="bg-dark-800 border border-dark-600 rounded-xl p-4">
                    <div className="text-xs text-gray-400 mb-1">{card.label}</div>
                    <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-dark-800 border border-dark-600 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Briefcase size={16} className="text-blue-400" />
                    <h3 className="text-sm font-semibold text-white">Active Positions</h3>
                  </div>
                  <Positions positions={positions} onPositionChanged={loadData} />
                </div>
                <div className="bg-dark-800 border border-dark-600 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Activity size={16} className="text-yellow-400" />
                    <h3 className="text-sm font-semibold text-white">Top Scan Results</h3>
                  </div>
                  <div className="space-y-2">
                    {scanResults.slice(0, 5).map(item => (
                      <div key={item.id} className="flex items-center justify-between py-2 px-3 bg-dark-700 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white text-sm">{item.symbol}</span>
                          <span className={clsx('px-1.5 py-0.5 rounded text-xs font-bold',
                            item.option_type === 'CE' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                          )}>{item.option_type}</span>
                          <span className="text-xs text-gray-400">{item.strike}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-white">₹{item.premium.toFixed(2)}</span>
                          <span className={`text-xs ${item.premium_change_pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {item.premium_change_pct >= 0 ? '+' : ''}{item.premium_change_pct.toFixed(1)}%
                          </span>
                          <button onClick={() => { setSelectedInstrument(item); setTab('scanner'); }}
                            className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded">Trade</button>
                        </div>
                      </div>
                    ))}
                    {scanResults.length === 0 && (
                      <p className="text-xs text-gray-500 text-center py-4">Run scanner to see results</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'scanner' && (
            <div className="p-6 h-full flex flex-col">
              <Scanner
                results={scanResults}
                onSelectInstrument={setSelectedInstrument}
                onScanComplete={setScanResults}
              />
            </div>
          )}

          {tab === 'positions' && (
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Briefcase size={18} className="text-blue-400" />
                <h2 className="text-lg font-semibold text-white">Open Positions</h2>
                <span className="text-xs text-gray-500">({positions.length} active)</span>
              </div>
              <Positions positions={positions} onPositionChanged={loadData} />
            </div>
          )}

          {tab === 'history' && (
            <div className="p-6 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <History size={18} className="text-gray-400" />
                  <h2 className="text-lg font-semibold text-white">Trade History</h2>
                </div>
                {summary && (
                  <div className="flex gap-4 text-xs">
                    <span className="text-green-400">{summary.winning_trades} Wins</span>
                    <span className="text-red-400">{summary.losing_trades} Losses</span>
                    <span className="text-yellow-400">{summary.win_rate}% Win Rate</span>
                  </div>
                )}
              </div>
              <div className="flex-1 bg-dark-800 border border-dark-600 rounded-xl overflow-hidden">
                <TradeHistory history={history} />
              </div>
            </div>
          )}

          {tab === 'settings' && (
            <div className="p-6">
              <Settings />
            </div>
          )}
        </main>
      </div>

      {selectedInstrument && (
        <TradeConfirmation
          instrument={selectedInstrument}
          onClose={() => setSelectedInstrument(null)}
          onTradeOpened={loadData}
        />
      )}
    </div>
  );
}
