// public/plugins/phase6-autonomy/index.tsx
import React from 'react';
import { OmniWidgetHostProps } from '../../../src/types/plugin-sdk';
import { usePhase6 } from '../../../src/services/phase6';

export default function Phase6AutonomyWidget({ bus }: OmniWidgetHostProps) {
  const { autonomyEnabled, learningEnabled, signals, weights, lastAutonomousAction, setAutonomy, setLearning, resetLearning } = usePhase6();
  const roles = Array.from(new Set(weights.map(w => w.agentRole)));
  return (
    <div className="flex flex-col h-full p-3 bg-slate-950 text-slate-100 font-mono text-xs gap-3 select-none overflow-auto">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <span className="text-fuchsia-400 font-bold tracking-widest">PHASE 6 // AUTONOMY + LEARNING</span>
        <span className={`px-2 py-0.5 rounded text-[10px] border ${autonomyEnabled ? 'bg-fuchsia-950 text-fuchsia-300 border-fuchsia-500/50 animate-pulse' : 'bg-slate-900 text-slate-400 border-slate-700'}`}>{autonomyEnabled ? 'AUTONOMOUS' : 'MANUAL'}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setAutonomy(!autonomyEnabled)} className={`px-2.5 py-1 rounded border text-[10px] ${autonomyEnabled ? 'bg-fuchsia-500/20 border-fuchsia-400 text-fuchsia-200' : 'bg-slate-900 border-slate-700 text-slate-300'}`}>{autonomyEnabled ? 'Disable Autonomy' : 'Enable Autonomy'}</button>
        <button onClick={() => setLearning(!learningEnabled)} className={`px-2.5 py-1 rounded border text-[10px] ${learningEnabled ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200' : 'bg-slate-900 border-slate-700 text-slate-300'}`}>Learning {learningEnabled ? 'ON' : 'OFF'}</button>
        <button onClick={resetLearning} className="px-2.5 py-1 rounded border border-rose-500/40 bg-rose-500/10 text-rose-300 text-[10px]">Reset Weights</button>
      </div>
      {lastAutonomousAction && <div className="text-[10px] text-slate-400">Last auto: <span className="text-fuchsia-300">{lastAutonomousAction}</span></div>}
      <div className="space-y-1.5">
        <div className="text-[10px] text-slate-400 uppercase tracking-wider">Adaptive Weights</div>
        <div className="space-y-1 max-h-32 overflow-auto">
          {roles.map(role => (
            <div key={role} className="bg-slate-900/70 border border-slate-800 rounded p-1.5">
              <div className="text-emerald-400 text-[10px] mb-1">{role}</div>
              <div className="space-y-0.5">
                {weights.filter(w => w.agentRole === role).map(w => (
                  <div key={w.action} className="flex items-center gap-2 text-[10px]">
                    <span className="w-28 truncate text-slate-400">{w.action}</span>
                    <div className="flex-1 h-1 bg-slate-800 rounded"><div className="h-1 bg-fuchsia-400 rounded" style={{ width: `${w.weight * 100}%` }} /></div>
                    <span className="w-10 text-right text-slate-500">{(w.successRate * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-1">
        <div className="text-[10px] text-slate-400 uppercase tracking-wider">Learning Signals</div>
        <div className="h-24 overflow-auto bg-black/60 border border-slate-800 rounded p-1.5 space-y-0.5">
          {signals.length === 0 && <div className="text-slate-600">No signals yet. Enable autonomy or complete agent tasks.</div>}
          {signals.slice(0, 10).map(s => (
            <div key={s.id} className="text-[10px] truncate">
              <span className={s.outcome === 'success' ? 'text-emerald-400' : s.outcome === 'fail' ? 'text-rose-400' : 'text-slate-500'}>{s.outcome}</span>{' '}
              <span className="text-fuchsia-300">{s.agentRole}</span> {s.action}<span className="text-slate-500"> r={s.reward.toFixed(1)}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="text-[10px] text-slate-500">Autonomy ticks every ~8s when enabled. Weights adapt via EMA on reward. Operator-completed tasks also reinforce learning.</div>
    </div>
  );
}
