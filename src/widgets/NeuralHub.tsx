import { useState } from 'react';
import { Bot, Sparkles } from '../icons';
import { useOmniBus } from '../hooks/useOmniBus';
import { getGenAIClient } from '../og2/services/geminiService';

export function NeuralHub() {
  const [prompt, setPrompt] = useState('');
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const { connected, send, spawn, lastMessage } = useOmniBus('neural');

  const runAgent = async () => {
    const text = prompt.trim();
    if (!text || busy) return;
    send('ai/agent-task', { prompt: text });
    setPrompt('');
    const ai = getGenAIClient();
    if (!ai) {
      setReply('Task is on the bus. Add a provider key in Settings to get an answer in this tile.');
      return;
    }
    setBusy(true);
    setReply('');
    try {
      const response = await ai.models.generateContent({
        contents: text,
        config: { systemInstruction: 'You are the Omni-Grid neural core. Answer in a few practical sentences.' },
      });
      setReply(response.text || 'The model returned nothing.');
    } catch (err) {
      setReply(err instanceof Error ? err.message : 'The model did not answer.');
    } finally {
      setBusy(false);
    }
  };

  const startSidecar = () => {
    spawn('python-sidecar', 'python3', ['server/workers/unified_sidecar.py']);
  };

  return (
    <div className="h-full flex flex-col gap-2 min-h-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-cyan-300">
          <Bot size={16} /> Neural Hub
        </div>
        <span className={`text-[10px] px-1.5 py-0.5 rounded ${connected ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'}`}>
          {connected ? 'BUS LIVE' : 'local'}
        </span>
      </div>

      <textarea
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) void runAgent();
        }}
        placeholder="Ask the desk. Ctrl+Enter sends."
        className="w-full h-16 bg-black/50 border border-cyan-500/30 rounded p-2 text-xs resize-none outline-none focus:border-cyan-400"
      />

      <div className="flex gap-2">
        <button onClick={() => void runAgent()} disabled={busy} className="px-3 py-1 bg-fuchsia-500/30 hover:bg-fuchsia-500/50 disabled:opacity-50 rounded text-xs flex items-center gap-1">
          <Sparkles size={12} /> {busy ? 'Thinking' : 'Dispatch'}
        </button>
        <button onClick={startSidecar} className="px-3 py-1 bg-cyan-500/20 hover:bg-cyan-500/40 rounded text-xs">
          Spawn Sidecar
        </button>
      </div>

      {reply && (
        <div className="flex-1 min-h-0 overflow-auto text-[11px] leading-relaxed text-slate-100 bg-black/40 p-2 rounded border border-cyan-500/20 whitespace-pre-wrap">
          {reply}
        </div>
      )}

      {lastMessage && (
        <div className="text-[10px] text-cyan-200/70 bg-black/40 p-2 rounded border border-cyan-500/20 truncate">
          last: {lastMessage.type} ← {lastMessage.source}
        </div>
      )}
    </div>
  );
}
