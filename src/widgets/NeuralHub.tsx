import { useState } from 'react';
import { Bot, Sparkles } from '../icons';
import { useOmniBus } from '../hooks/useOmniBus';

export function NeuralHub() {
  const [prompt, setPrompt] = useState('');
  const { connected, send, spawn, lastMessage } = useOmniBus('neural');

  const runAgent = () => {
    if (!prompt.trim()) return;
    send('ai/agent-task', { prompt });
    setPrompt('');
  };

  const startSidecar = () => {
    spawn('python-sidecar', 'python3', ['server/workers/unified_sidecar.py']);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-cyan-300">
          <Bot size={16} /> Neural Hub · Phase 1 Bus
        </div>
        <span className={`text-[10px] px-1.5 py-0.5 rounded ${connected ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'}`}>
          {connected ? 'BUS LIVE' : 'local'}
        </span>
      </div>

      <textarea
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        placeholder="Issue agent task or prompt..."
        className="w-full h-16 bg-black/50 border border-cyan-500/30 rounded p-2 text-xs resize-none"
      />

      <div className="flex gap-2">
        <button onClick={runAgent} className="px-3 py-1 bg-magenta-500/40 hover:bg-magenta-500/60 rounded text-xs flex items-center gap-1">
          <Sparkles size={12} /> Dispatch
        </button>
        <button onClick={startSidecar} className="px-3 py-1 bg-cyan-500/30 hover:bg-cyan-500/50 rounded text-xs">
          Spawn Sidecar
        </button>
      </div>

      {lastMessage && (
        <div className="text-[10px] text-cyan-200/70 bg-black/40 p-2 rounded border border-cyan-500/20">
          last: {lastMessage.type} ← {lastMessage.source}
        </div>
      )}

      <div className="text-[10px] text-white/50">
        Connected to Phase 1 daemon. Spawn starts the Python sidecar.
      </div>
    </div>
  );
}
