import { useState } from 'react';
import { useOmniStore } from '../store';
import { Bot, Sparkles } from 'lucide-react';

export function NeuralHub() {
  const [prompt, setPrompt] = useState('');
  const emit = useOmniStore(s => s.emitCrossTalk);

  const runAgent = () => {
    emit({ type: 'ai/agent-task', data: { prompt }, source: 'neural' });
    setPrompt('');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-cyan-300">
        <Bot size={16} /> MultiAgentHub · HoverMind · Ai_shell
      </div>
      <textarea
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        placeholder="Issue agent task or prompt..."
        className="w-full h-20 bg-black/50 border border-cyan-500/30 rounded p-2 text-xs resize-none"
      />
      <button onClick={runAgent} className="px-3 py-1 bg-magenta-500/40 hover:bg-magenta-500/60 rounded text-xs flex items-center gap-1">
        <Sparkles size={12} /> Dispatch Agent
      </button>
      <div className="text-[10px] text-white/50">
        Python Sidecar · Gemini API · OS Accessibility Hooks active
      </div>
    </div>
  );
}
