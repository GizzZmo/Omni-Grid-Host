// public/plugins/phase9-netheal/index.tsx
import React, { useState } from 'react';
import { OmniWidgetHostProps } from '../../../src/types/plugin-sdk';
import { usePhase9 } from '../../../src/services/phase9';

export default function Phase9NetHealWidget({ bus }: OmniWidgetHostProps) {
  const { nodes, links, routes, selfHealNetwork, setSelfHealNetwork, probeNetwork, failLink, healLink, reroute } = usePhase9();
  const [src, setSrc] = useState('core');
  const [dst, setDst] = useState('sidecar-py');

  const statusColor = (s: string) =>
    s === 'up' || s === 'active' ? 'text-emerald-400' : s === 'degraded' ? 'text-amber-400' : 'text-rose-400';

  return (
    <div className="flex flex-col h-full p-3 bg-slate-950 text-slate-100 font-mono text-xs gap-3 select-none overflow-auto">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <span className="text-teal-400 font-bold tracking-widest">PHASE 9 // SELF-HEALING NETWORK</span>
        <span className={`px-2 py-0.5 rounded text-[10px] border ${selfHealNetwork ? 'bg-teal-950 text-teal-300 border-teal-500/50' : 'bg-slate-900 text-slate-400 border-slate-700'}`}>
          {selfHealNetwork ? 'NET-HEAL ON' : 'MANUAL'}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setSelfHealNetwork(!selfHealNetwork)} className={`px-2.5 py-1 rounded border text-[10px] ${selfHealNetwork ? 'bg-teal-500/20 border-teal-400 text-teal-200' : 'bg-slate-900 border-slate-700 text-slate-300'}`}>
          {selfHealNetwork ? 'Disable Net-Heal' : 'Enable Net-Heal'}
        </button>
        <button onClick={probeNetwork} className="px-2.5 py-1 rounded border border-cyan-500/40 bg-cyan-500/10 text-cyan-300 text-[10px]">Probe Network</button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <div className="text-[10px] text-slate-400 uppercase">Nodes</div>
          {nodes.map(n => (
            <div key={n.id} className="bg-slate-900/70 border border-slate-800 rounded px-2 py-1 flex justify-between">
              <span className={statusColor(n.status)}>● {n.name}</span>
              <span className="text-slate-500">{n.latencyMs.toFixed(0)}ms</span>
            </div>
          ))}
        </div>
        <div className="space-y-1">
          <div className="text-[10px] text-slate-400 uppercase">Links</div>
          {links.map(l => (
            <div key={l.id} className="bg-slate-900/70 border border-slate-800 rounded px-2 py-1 flex items-center justify-between gap-1">
              <span className={statusColor(l.status)}>{l.from}↔{l.to}</span>
              <div className="flex gap-1">
                <button onClick={() => failLink(l.id)} className="px-1 py-0.5 rounded bg-rose-500/10 border border-rose-500/40 text-rose-300 text-[9px]">Fail</button>
                <button onClick={() => healLink(l.id)} className="px-1 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 text-[9px]">Heal</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="text-[10px] text-slate-400 uppercase">Reroute</div>
        <div className="flex gap-1.5">
          <select value={src} onChange={e => setSrc(e.target.value)} className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-teal-300">
            {nodes.map(n => <option key={n.id} value={n.id}>{n.id}</option>)}
          </select>
          <span className="text-slate-500 self-center">→</span>
          <select value={dst} onChange={e => setDst(e.target.value)} className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-teal-300">
            {nodes.map(n => <option key={n.id} value={n.id}>{n.id}</option>)}
          </select>
          <button onClick={() => reroute(src, dst)} className="px-2 py-1 rounded bg-teal-500/20 border border-teal-400/50 text-teal-300">Compute</button>
        </div>
        {routes[0] && (
          <div className="bg-black/50 border border-slate-800 rounded p-1.5 text-[10px]">
            <span className={routes[0].success ? 'text-emerald-400' : 'text-rose-400'}>{routes[0].success ? 'PATH' : 'NO PATH'}</span>{' '}
            {routes[0].path.join(' → ') || routes[0].reason}
          </div>
        )}
      </div>
    </div>
  );
}
