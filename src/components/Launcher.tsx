import { useState } from 'react';
import { useOmniStore } from '../store';
import { Grid3x3, Zap } from 'lucide-react';

export function Launcher() {
  const [open, setOpen] = useState(false);
  const { extensions, visibleWidgets, toggleWidget } = useOmniStore();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/40 border border-cyan-400/50 rounded text-cyan-300 text-sm font-bold"
      >
        <Grid3x3 size={16} /> LAUNCHER
      </button>
      {open && (
        <div className="absolute right-0 top-12 w-80 bg-cyber-panel border border-cyan-500/40 rounded-lg shadow-2xl z-50 p-4">
          <h3 className="text-cyan-400 font-bold mb-3 flex items-center gap-2"><Zap size={14} /> EXTENSION PACKS</h3>
          <div className="space-y-2 max-h-96 overflow-auto">
            {extensions.map(ext => (
              <div key={ext.id} className="flex items-center justify-between p-2 bg-black/40 rounded border border-white/10">
                <div>
                  <div className="text-xs font-bold text-white">{ext.name}</div>
                  <div className="text-[10px] text-cyan-300/70">{ext.category}</div>
                </div>
                <button
                  onClick={() => toggleWidget(ext.uiEntry.toLowerCase().replace(/[^a-z]/g, ''))}
                  className="text-[10px] px-2 py-1 bg-magenta-500/30 hover:bg-magenta-500/50 rounded"
                >
                  {visibleWidgets.includes(ext.uiEntry.toLowerCase().slice(0,6)) ? 'OPEN' : 'ADD'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
