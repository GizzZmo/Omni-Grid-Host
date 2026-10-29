// public/plugins/phase7-heal/index.tsx
import React from 'react';
import { OmniWidgetHostProps } from '../../../src/types/plugin-sdk';
import { usePhase7 } from '../../../src/services/phase7';

export default function Phase7HealWidget({ bus }: OmniWidgetHostProps) {
  const { services, breakers, faults, selfHealingEnabled, setSelfHealing, injectFault, forceRecover, probeAll } = usePhase7();

  const statusColor = (s: string) =>
    s === 'healthy' ? 'text-emerald-400' : s === 'degraded' ? 'text-amber-400' : 'text-rose-400';

  return (
    <div className="flex flex-col h-full p-3 bg-slate-950 text-slate-100 font-mono text-xs gap-3 select-none overflow-auto">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <span className="text-amber-400 font-bold tracking-widest">PHASE 7 // SELF-HEALING</span>
        <span className={`px-2 py-0.5 rounded text-[10px] border ${selfHealingEnabled ? 'bg-amber-950 text-amber-300 border-amber-500/50' : 'bg-slate-900 text-slate-400 border-slate-700'}`}>
          {selfHealingEnabled ? 'AUTO-HEAL ON' : 'MANUAL'}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setSelfHealing(!selfHealingEnabled)} className={`px-2.5 py-1 rounded border text-[10px] ${selfHealingEnabled ? 'bg-amber-500/20 border-amber-400 text-amber-200' : 'bg-slate-900 border-slate-700 text-slate-300'}`}>
          {selfHealingEnabled ? 'Disable Auto-Heal' : 'Enable Auto-Heal'}
        </button>
        <button onClick={probeAll} className="px-2.5 py-1 rounded border border-cyan-500/40 bg-cyan-500/10 text-cyan-300 text-[10px]">Probe Now</button>
      </div>

      <div className="space-y-1.5">
        <div className="text-[10px] text-slate-400 uppercase tracking-wider">Service Health</div>
        <div className="space-y-1">
          {services.map(svc => {
            const breaker = breakers.find(b => b.serviceId === svc.id);
            return (
              <div key={svc.id} className="bg-slate-900/70 border border-slate-800 rounded p-1.5 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={statusColor(svc.status)}>●</span>
                    <span className="truncate">{svc.name}</span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {svc.latencyMs.toFixed(0)}ms · fails:{svc.consecutiveFailures} · recovers:{svc.recoveryAttempts} · cb:{breaker?.state}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => injectFault(svc.id)} className="px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/40 text-rose-300 text-[10px]">Fault</button>
                  <button onClick={() => forceRecover(svc.id)} className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 text-[10px]">Heal</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-[10px] text-slate-400 uppercase tracking-wider">Fault Log</div>
        <div className="h-24 overflow-auto bg-black/60 border border-slate-800 rounded p-1.5 space-y-0.5">
          {faults.length === 0 && <div className="text-slate-600">No faults. Probes run every 5s.</div>}
          {faults.slice(0, 10).map(f => (
            <div key={f.id} className="text-[10px] truncate">
              <span className={f.type === 'recovery' ? 'text-emerald-400' : f.type === 'circuit-open' ? 'text-amber-400' : 'text-rose-400'}>{f.type}</span>{' '}
              <span className="text-slate-400">{f.serviceId}</span> {f.detail}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
