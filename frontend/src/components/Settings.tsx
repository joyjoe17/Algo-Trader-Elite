import { useState } from 'react';
import { Settings as SettingsIcon, Save, AlertCircle, CheckCircle } from 'lucide-react';

interface SettingsConfig {
  openalgo_host: string;
  openalgo_api_key: string;
  broker: string;
  scan_interval: number;
  max_positions: number;
  default_target_pct: number;
  default_sl_pct: number;
  trailing_step_pct: number;
}

export default function Settings() {
  const [config, setConfig] = useState<SettingsConfig>({
    openalgo_host: 'http://127.0.0.1:5000',
    openalgo_api_key: '',
    broker: 'mstock',
    scan_interval: 60,
    max_positions: 5,
    default_target_pct: 2.0,
    default_sl_pct: 1.0,
    trailing_step_pct: 0.5,
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem('algotrader_settings', JSON.stringify(config));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const Field = ({ label, field, type = 'text', step, min }: {
    label: string; field: keyof SettingsConfig; type?: string; step?: number; min?: number;
  }) => (
    <div>
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      <input
        type={type}
        step={step}
        min={min}
        value={config[field]}
        onChange={e => setConfig(c => ({ ...c, [field]: type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value }))}
        className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 outline-none"
      />
    </div>
  );

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 mb-6">
        <SettingsIcon size={18} className="text-gray-400" />
        <h2 className="text-lg font-semibold text-white">Settings</h2>
      </div>

      <div className="space-y-6">
        <div className="bg-dark-800 border border-dark-600 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">OpenAlgo / Broker Configuration</h3>
          <div className="space-y-3">
            <Field label="OpenAlgo Host URL" field="openalgo_host" />
            <Field label="OpenAlgo API Key" field="openalgo_api_key" type="password" />
            <div>
              <label className="block text-xs text-gray-400 mb-1">Broker</label>
              <select
                value={config.broker}
                onChange={e => setConfig(c => ({ ...c, broker: e.target.value }))}
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 outline-none"
              >
                <option value="mstock">mStock</option>
                <option value="zerodha">Zerodha</option>
                <option value="angel">Angel One</option>
                <option value="upstox">Upstox</option>
                <option value="fyers">Fyers</option>
              </select>
            </div>
          </div>
          <div className="mt-3 p-3 bg-dark-700 rounded-lg border border-blue-800/40">
            <div className="flex gap-2">
              <AlertCircle size={14} className="text-blue-400 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-300">
                To configure OpenAlgo API credentials on the server, set the environment variables
                <strong> OPENALGO_API_KEY</strong> and <strong>OPENALGO_HOST</strong> in your Replit Secrets.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-dark-800 border border-dark-600 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Scanner Settings</h3>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Scan Interval (seconds)" field="scan_interval" type="number" min={30} step={10} />
            <Field label="Max Simultaneous Positions" field="max_positions" type="number" min={1} step={1} />
          </div>
        </div>

        <div className="bg-dark-800 border border-dark-600 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Default Trade Settings</h3>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Default Target %" field="default_target_pct" type="number" min={0.5} step={0.5} />
            <Field label="Default SL %" field="default_sl_pct" type="number" min={0.5} step={0.5} />
            <Field label="Trailing Step %" field="trailing_step_pct" type="number" min={0.1} step={0.1} />
          </div>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-colors"
        >
          {saved ? <CheckCircle size={16} /> : <Save size={16} />}
          {saved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
