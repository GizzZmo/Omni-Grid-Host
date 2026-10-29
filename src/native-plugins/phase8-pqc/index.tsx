// public/plugins/phase8-pqc/index.tsx
import React, { useState } from 'react';
import { OmniWidgetHostProps } from '../../../src/types/plugin-sdk';
import { usePhase8 } from '../../../src/services/phase8';

export default function Phase8PqcWidget({ bus }: OmniWidgetHostProps) {
  const {
    keyPairs, envelopes, events, activeAlgo, hybridMode,
    setAlgo, setHybrid, generateKeyPair, rotateKeys, encrypt, decrypt, clearEvents,
  } = usePhase8();

  const [plaintext, setPlaintext] = useState('Quantum-resistant payload');
  const [decrypted, setDecrypted] = useState<string | null>(null);

  return (
    <div className="flex flex-col h-full p-3 bg-slate-950 text-slate-100 font-mono text-xs gap-3 select-none overflow-auto">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <span className="text-violet-400 font-bold tracking-widest">PHASE 8 // QUANTUM-RESISTANT</span>
        <span className="px-2 py-0.5 rounded text-[10px] border bg-violet-950 text-violet-300 border-violet-500/50">
          {activeAlgo.toUpperCase()}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <select
          value={activeAlgo}
          onChange={e => setAlgo(e.target.value as any)}
          className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-violet-300"
        >
          <option value="kyber-hybrid">Kyber Hybrid</option>
          <option value="dilithium-hybrid">Dilithium Hybrid</option>
          <option value="sphincs-hybrid">SPHINCS+ Hybrid</option>
        </select>
        <label className="flex items-center gap-1 text-[10px]">
          <input type="checkbox" checked={hybridMode} onChange={e => setHybrid(e.target.checked)} className="accent-violet-400" />
          Hybrid (PQC + AES-GCM)
        </label>
        <button onClick={generateKeyPair} className="px-2 py-1 rounded bg-violet-500/20 border border-violet-400/50 text-violet-300">Gen Keys</button>
        <button onClick={rotateKeys} className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300">Rotate</button>
      </div>

      <div className="text-[10px] text-slate-500">
        Active key: {keyPairs[0] ? `${keyPairs[0].id.slice(0, 12)}… (${keyPairs[0].algo})` : 'none — generate a keypair'}
      </div>

      <div className="space-y-1.5">
        <div className="text-[10px] text-slate-400 uppercase tracking-wider">Encrypt</div>
        <div className="flex gap-1.5">
          <input
            value={plaintext}
            onChange={e => setPlaintext(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-cyan-300"
          />
          <button
            onClick={() => encrypt(plaintext)}
            disabled={!keyPairs.length}
            className="px-2 py-1 rounded bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 disabled:opacity-40"
          >
            Encrypt
          </button>
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-[10px] text-slate-400 uppercase tracking-wider">Envelopes</div>
        <div className="max-h-20 overflow-auto space-y-1">
          {envelopes.length === 0 && <div className="text-slate-600">No envelopes yet.</div>}
          {envelopes.slice(0, 5).map(env => (
            <div key={env.id} className="flex items-center justify-between bg-slate-900/70 border border-slate-800 rounded px-2 py-1">
              <span className="truncate text-[10px]">{env.id.slice(0, 16)}… · {env.algo}</span>
              <button
                onClick={() => setDecrypted(decrypt(env.id))}
                className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 text-[10px]"
              >
                Decrypt
              </button>
            </div>
          ))}
        </div>
        {decrypted !== null && (
          <div className="bg-black/50 border border-slate-800 rounded p-1.5 text-[10px] text-emerald-300">
            Decrypted: {decrypted || '(failed)'}
          </div>
        )}
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Crypto Events</div>
          <button onClick={clearEvents} className="text-[10px] text-slate-500 hover:text-slate-300">Clear</button>
        </div>
        <div className="h-20 overflow-auto bg-black/60 border border-slate-800 rounded p-1.5 space-y-0.5">
          {events.length === 0 && <div className="text-slate-600">No events.</div>}
          {events.slice(0, 8).map(ev => (
            <div key={ev.id} className="text-[10px] truncate">
              <span className={ev.success ? 'text-emerald-400' : 'text-rose-400'}>{ev.type}</span>{' '}
              <span className="text-violet-300">{ev.algo}</span> {ev.detail}
            </div>
          ))}
        </div>
      </div>

      <div className="text-[10px] text-slate-500">
        Educational hybrid model: classical AES-GCM + simulated PQC KEM/signature. Replace with real Kyber/Dilithium WASM for production.
      </div>
    </div>
  );
}
