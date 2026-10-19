// src/components/SettingsPanel.tsx
import { useState } from 'react';
import { useSettingsStore, type AiProvider } from '../store/settingsStore';

const PROVIDERS: { id: AiProvider; label: string; placeholder: string; defaultModel: string }[] = [
  { id: 'openai', label: 'OpenAI', placeholder: 'sk-...', defaultModel: 'gpt-4o-mini' },
  { id: 'anthropic', label: 'Anthropic', placeholder: 'sk-ant-...', defaultModel: 'claude-3-5-sonnet-latest' },
  { id: 'gemini', label: 'Google Gemini', placeholder: 'AIza...', defaultModel: 'gemini-2.0-flash' },
  { id: 'groq', label: 'Groq', placeholder: 'gsk_...', defaultModel: 'llama-3.3-70b-versatile' },
  { id: 'ollama', label: 'Ollama (local)', placeholder: 'http://localhost:11434', defaultModel: 'llama3.2' },
  { id: 'custom', label: 'Custom OpenAI-compatible', placeholder: 'https://api.example.com/v1', defaultModel: '' },
];

export function SettingsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { provider, apiKey, baseUrl, model, setProvider, setApiKey, setBaseUrl, setModel, clearApiKey, reset } = useSettingsStore();
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!open) return null;

  const current = PROVIDERS.find(p => p.id === provider) ?? PROVIDERS[0];

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 1500); };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md bg-slate-950 border border-cyan-500/40 rounded-lg p-5 shadow-2xl font-mono text-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <span className="text-cyan-400 font-bold tracking-widest">SETTINGS // AI PROVIDER</span>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-lg leading-none">&times;</button>
        </div>
        <div className="space-y-3">
          <label className="block">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Provider</span>
            <select value={provider} onChange={e => setProvider(e.target.value as AiProvider)} className="mt-1 w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-cyan-300 focus:border-cyan-500 outline-none">
              {PROVIDERS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </label>
          {provider !== 'ollama' && (
            <label className="block">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">API Key</span>
              <div className="mt-1 flex gap-2">
                <input type={showKey ? 'text' : 'password'} value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder={current.placeholder} className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-emerald-300 focus:border-cyan-500 outline-none" autoComplete="off" />
                <button type="button" onClick={() => setShowKey(!showKey)} className="px-2 py-1 rounded border border-slate-700 text-slate-400 hover:text-white text-xs">{showKey ? 'Hide' : 'Show'}</button>
              </div>
              {apiKey && <button onClick={clearApiKey} className="mt-1 text-[10px] text-rose-400 hover:text-rose-300">Clear key</button>}
            </label>
          )}
          {(provider === 'custom' || provider === 'ollama') && (
            <label className="block">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Base URL</span>
              <input value={baseUrl} onChange={e => setBaseUrl(e.target.value)} placeholder={provider === 'ollama' ? 'http://localhost:11434' : 'https://api.example.com/v1'} className="mt-1 w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-cyan-300 focus:border-cyan-500 outline-none" />
            </label>
          )}
          <label className="block">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Model (optional)</span>
            <input value={model} onChange={e => setModel(e.target.value)} placeholder={current.defaultModel || 'model-name'} className="mt-1 w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-cyan-300 focus:border-cyan-500 outline-none" />
          </label>
        </div>
        <div className="mt-5 flex items-center justify-between">
          <button onClick={reset} className="text-[10px] text-slate-500 hover:text-slate-300">Reset defaults</button>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-3 py-1.5 rounded border border-slate-700 text-slate-300 hover:bg-slate-900">Close</button>
            <button onClick={handleSave} className="px-3 py-1.5 rounded bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 hover:bg-cyan-500/30">{saved ? 'Saved' : 'Save'}</button>
          </div>
        </div>
        <p className="mt-3 text-[10px] text-slate-500">Keys are stored locally in your browser (Zustand persist). They are never sent to Omni-Grid servers.</p>
      </div>
    </div>
  );
}
