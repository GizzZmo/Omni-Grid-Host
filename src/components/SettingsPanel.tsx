// src/components/SettingsPanel.tsx
import { useState } from 'react';
import { useSettingsStore, type AiProvider } from '../store/settingsStore';

const PROVIDERS: { id: AiProvider; label: string; placeholder: string; defaultModel: string; color: string }[] = [
  { id: 'openai', label: 'OpenAI', placeholder: 'sk-...', defaultModel: 'gpt-4o-mini', color: '#10a37f' },
  { id: 'anthropic', label: 'Anthropic', placeholder: 'sk-ant-...', defaultModel: 'claude-3-5-sonnet-latest', color: '#d4a373' },
  { id: 'gemini', label: 'Google Gemini', placeholder: 'AIza...', defaultModel: 'gemini-2.0-flash', color: '#8ab4f8' },
  { id: 'groq', label: 'Groq', placeholder: 'gsk_...', defaultModel: 'llama-3.3-70b-versatile', color: '#f55036' },
  { id: 'ollama', label: 'Ollama (local)', placeholder: 'http://localhost:11434', defaultModel: 'llama3.2', color: '#ffffff' },
  { id: 'custom', label: 'Custom OpenAI-compatible', placeholder: 'https://api.example.com/v1', defaultModel: '', color: '#22d3ee' },
];

function ProviderLogo({ id, size = 20 }: { id: AiProvider; size?: number }) {
  const s = size;
  switch (id) {
    case 'openai':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" fill="#10a37f" />
          <path d="M12 6.5a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11zm0 2a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z" fill="#fff" />
        </svg>
      );
    case 'anthropic':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="4" fill="#d4a373" />
          <path d="M7 17V7h2.2l2.8 6.5L14.8 7H17v10h-1.8V9.5L12.2 17H11.8L8.8 9.5V17H7z" fill="#1a1a1a" />
        </svg>
      );
    case 'gemini':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <defs>
            <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#8ab4f8" />
              <stop offset="50%" stopColor="#c58af9" />
              <stop offset="100%" stopColor="#f28b82" />
            </linearGradient>
          </defs>
          <circle cx="12" cy="12" r="10" fill="url(#g)" />
          <path d="M12 7l1.5 3.5L17 12l-3.5 1.5L12 17l-1.5-3.5L7 12l3.5-1.5z" fill="#fff" />
        </svg>
      );
    case 'groq':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="4" fill="#f55036" />
          <path d="M6 16V8h2.5l2.5 5.2L13.5 8H16v8h-1.8v-5.2L12 16h-1.5l-2.2-5.2V16H6z" fill="#fff" />
        </svg>
      );
    case 'ollama':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" fill="#1a1a1a" stroke="#fff" strokeWidth="1" />
          <circle cx="9" cy="11" r="1.5" fill="#fff" />
          <circle cx="15" cy="11" r="1.5" fill="#fff" />
          <path d="M8 15c1 1.5 2.5 2 4 2s3-.5 4-2" stroke="#fff" strokeWidth="1.2" fill="none" />
        </svg>
      );
    default:
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="4" fill="#22d3ee" />
          <path d="M8 8h8v2H8zm0 4h8v2H8zm0 4h5v2H8z" fill="#0f172a" />
        </svg>
      );
  }
}

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
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Provider</span>
            <div className="mt-1.5 grid grid-cols-1 gap-1.5">
              {PROVIDERS.map(p => (
                <button key={p.id} type="button" onClick={() => setProvider(p.id)} className={`flex items-center gap-2.5 w-full text-left px-3 py-2 rounded border transition ${
                  provider === p.id
                    ? 'bg-cyan-500/15 border-cyan-400/60 text-cyan-200'
                    : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:border-slate-600'
                }`}>
                  <ProviderLogo id={p.id} size={22} />
                  <span className="font-medium">{p.label}</span>
                  {provider === p.id && <span className="ml-auto text-[10px] text-cyan-400">selected</span>}
                </button>
              ))}
            </div>
          </div>
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
