import { useState } from 'react';
import { useOmniStore } from '../store';
import { Shield, Camera } from 'lucide-react';

export function SecOpsCommand() {
  const [locked, setLocked] = useState(false);
  const emit = useOmniStore(s => s.emitCrossTalk);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-red-400">
        <Shield size={16} /> AutoSec · Face-Recon · Network-Analyzer
      </div>
      <div className={`p-2 rounded border ${locked ? 'border-red-500 bg-red-900/20' : 'border-green-500/40 bg-green-900/10'}`}>
        <div className="flex items-center justify-between text-xs">
          <span>Biometric Lock</span>
          <button onClick={() => setLocked(!locked)} className="px-2 py-0.5 bg-white/10 rounded">
            <Camera size={12} className="inline" /> {locked ? 'LOCKED' : 'UNLOCKED'}
          </button>
        </div>
      </div>
      <button
        onClick={() => emit({ type: 'sec/alert', data: { anomaly: 'outbound spike' }, source: 'secops' })}
        className="px-3 py-1 bg-red-500/30 hover:bg-red-500/50 rounded text-xs"
      >
        Simulate pcap Alert
      </button>
      <div className="text-[10px] text-white/50">
        C++ libpcap Daemon · ONNX Runtime · Docker API bridge
      </div>
    </div>
  );
}
