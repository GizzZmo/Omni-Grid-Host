import { useState } from 'react';
import { Shield, Lock, Unlock } from '../icons';

export function CipherVault() {
  const [locked, setLocked] = useState(true);
  const [pin, setPin] = useState('');

  const tryUnlock = () => {
    if (pin === '1337' || pin.length >= 4) setLocked(false);
  };

  return (
    <div className="h-full flex flex-col gap-3 p-2 text-xs font-mono items-center justify-center">
      <Shield size={28} className={locked ? 'text-red-400' : 'text-emerald-400'} />
      <div className="text-fuchsia-400 font-bold tracking-widest">CIPHER VAULT</div>
      {locked ? (
        <>
          <input
            type="password"
            value={pin}
            onChange={e => setPin(e.target.value)}
            placeholder="PIN"
            className="bg-slate-900 border border-slate-700 rounded px-3 py-1 text-center tracking-[0.4em]"
          />
          <button onClick={tryUnlock} className="px-4 py-1 bg-red-900/40 border border-red-500/40 rounded flex items-center gap-1">
            <Lock size={12} /> Unlock
          </button>
        </>
      ) : (
        <>
          <div className="text-emerald-400">VAULT OPEN</div>
          <div className="text-slate-400 text-[10px]">Sensitive assets accessible</div>
          <button onClick={() => setLocked(true)} className="px-4 py-1 bg-slate-800 border border-slate-600 rounded flex items-center gap-1">
            <Unlock size={12} /> Lock
          </button>
        </>
      )}
    </div>
  );
}
