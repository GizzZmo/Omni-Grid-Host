import { useOmniStore } from '../store';
import { Music, Activity } from 'lucide-react';

export function SonicRack() {
  const emit = useOmniStore(s => s.emitCrossTalk);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-green-400">
        <Music size={16} /> NAW · DSP4Guitar · TABFRET · Frequalizer
      </div>
      <div className="grid grid-cols-4 gap-1 h-16">
        {[1,2,3,4].map(i => (
          <div key={i} className="bg-green-500/20 border border-green-500/40 rounded flex items-end p-1">
            <div className="w-full bg-green-400/60" style={{ height: `${20 + i*15}%` }} />
          </div>
        ))}
      </div>
      <button
        onClick={() => emit({ type: 'audio/pcm', data: { stems: 4 }, source: 'sonic' })}
        className="px-3 py-1 bg-green-500/30 hover:bg-green-500/50 rounded text-xs flex items-center gap-1"
      >
        <Activity size={12} /> Emit Audio Buffer
      </button>
      <div className="text-[10px] text-white/50">
        C++ JUCE → WASM AudioWorklet · WebMIDI · Native ASIO bridge ready
      </div>
    </div>
  );
}
