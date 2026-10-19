import { useEffect, useState } from 'react';
import { useOmniStore } from '../store';
import { useSettingsStore } from '../store/settingsStore';
import { isTauri, getHostInfo } from '../lib/desktop';

export function StatusBar() {
  const bus = useOmniStore(s => s.crossTalkBus);
  const last = bus[bus.length - 1];
  const provider = useSettingsStore(s => s.provider);
  const hasKey = useSettingsStore(s => !!s.apiKey);
  const [mode, setMode] = useState('browser');

  useEffect(() => {
    if (isTauri()) {
      getHostInfo().then(info => { setMode(info?.mode ?? 'tauri'); });
    }
  }, []);

  return (
    <footer className="h-8 flex items-center justify-between px-6 text-[10px] bg-black/60 border-t border-cyan-500/20 text-cyan-300/70">
      <div>PROTOCOL: LOCAL-FIRST | POLYGLUT MICROKERNEL | CROSS-TALK BUS ACTIVE</div>
      <div className="flex items-center gap-4">
        <span className={hasKey ? 'text-emerald-400' : 'text-amber-400'}>AI: {provider}{hasKey ? ' ✓' : ' (no key)'}</span>
        <span className={mode === 'tauri' ? 'text-magenta-300' : ''}>RUNTIME: {mode === 'tauri' ? 'Tauri Desktop' : 'Browser'} · React 19 · Zustand</span>
        {last && <span className="text-green-400">LAST: {last.type} from {last.source}</span>}
      </div>
    </footer>
  );
}
