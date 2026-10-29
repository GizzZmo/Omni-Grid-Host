import { useEffect, useState } from 'react';
import { useOmniStore } from '../store';
import { useSettingsStore } from '../store/settingsStore';
import { sidecarBridge } from '../services/sidecarBridge';
import { isTauri, getHostInfo } from '../lib/desktop';

export function StatusBar() {
  const bus = useOmniStore(s => s.crossTalkBus);
  const last = bus[bus.length - 1];
  const provider = useSettingsStore(s => s.provider);
  const hasKey = useSettingsStore(s => !!s.apiKey);
  const [mode, setMode] = useState('browser');
  const [link, setLink] = useState(sidecarBridge.getLinkState());

  useEffect(() => sidecarBridge.onLink(setLink), []);

  useEffect(() => {
    if (isTauri()) {
      getHostInfo().then(info => {
        setMode(info?.mode ?? 'tauri');
      });
    }
  }, []);

  return (
    <footer className="h-8 flex items-center justify-between gap-2 px-3 sm:px-6 text-[10px] bg-black/60 border-t border-cyan-500/20 text-cyan-300/70 overflow-hidden">
      <div className="truncate">
        <span className="hidden sm:inline">PROTOCOL: LOCAL-FIRST | POLYGLUT MICROKERNEL | </span>
        CROSS-TALK BUS ACTIVE
      </div>
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <span className={hasKey ? 'text-emerald-400' : 'text-amber-400'}>
          AI: {provider}{hasKey ? ' ✓' : ' (no key)'}
        </span>
        <span className={link.cpp ? 'text-emerald-400' : 'text-slate-500'}>
          C++ {link.cpp ? 'LINKED' : 'OFF'}
        </span>
        <span className={link.python ? 'text-emerald-400' : 'text-slate-500'}>
          PY {link.python ? 'LINKED' : 'OFF'}
        </span>
        {last && <span className="text-green-400">LAST: {last.type} from {last.source}</span>}
      </div>
    </footer>
  );
}
