import { useState } from 'react';
import { Bot, Send } from 'lucide-react';

const AGENTS = [
  { id: 'secops', name: 'AutoSec Responder', color: 'text-red-400', icon: '🛡️' },
  { id: 'audio', name: 'Sonic Architect', color: 'text-fuchsia-400', icon: '🎵' },
  { id: 'dev', name: 'Code Forger', color: 'text-cyan-400', icon: '⚡' },
  { id: 'research', name: 'Research Oracle', color: 'text-emerald-400', icon: '🔭' },
];

export function MultiAgentHub() {
  const [agent, setAgent] = useState(AGENTS[0].id);
  const [prompt, setPrompt] = useState('');
  const [tasks, setTasks] = useState<{ id: string; agent: string; prompt: string; status: string }[]>([]);

  const submit = () => {
    if (!prompt.trim()) return;
    setTasks(prev => [
      { id: crypto.randomUUID().slice(0, 6), agent: AGENTS.find(a => a.id === agent)?.name ?? agent, prompt, status: 'queued' },
      ...prev,
    ]);
    setPrompt('');
  };

  return (
    <div className="h-full flex flex-col gap-2 p-2 text-xs font-mono">
      <div className="flex items-center gap-2 text-fuchsia-400 font-bold">
        <Bot size={14} /> Multi-Agent Hub
      </div>

      <div className="grid grid-cols-2 gap-1">
        {AGENTS.map(a => (
          <button
            key={a.id}
            onClick={() => setAgent(a.id)}
            className={`p-1.5 rounded border text-left ${agent === a.id ? 'border-fuchsia-500 bg-slate-800' : 'border-slate-700 bg-slate-900/50'}`}
          >
            <span className={a.color}>{a.icon} {a.name}</span>
          </button>
        ))}
      </div>

      <textarea
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        placeholder="Dispatch a task to the selected agent…"
        className="flex-1 min-h-[60px] bg-slate-900 border border-slate-700 rounded p-2 resize-none text-slate-200"
      />

      <button onClick={submit} className="flex items-center justify-center gap-1 py-1.5 bg-fuchsia-900/40 border border-fuchsia-500/50 rounded text-fuchsia-300">
        <Send size={12} /> Dispatch
      </button>

      <div className="max-h-24 overflow-auto space-y-1">
        {tasks.map(t => (
          <div key={t.id} className="bg-slate-900/60 border border-slate-800 rounded p-1.5">
            <span className="text-cyan-400">{t.agent}</span> · {t.status}<br />
            <span className="text-slate-400">{t.prompt}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
