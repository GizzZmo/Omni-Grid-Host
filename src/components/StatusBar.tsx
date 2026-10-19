import { useOmniStore } from '../store';

export function StatusBar() {
  const bus = useOmniStore(s => s.crossTalkBus);
  const last = bus[bus.length - 1];

  return (
    <footer className="h-8 flex items-center justify-between px-6 text-[10px] bg-black/60 border-t border-cyan-500/20 text-cyan-300/70">
      <div>PROTOCOL: LOCAL-FIRST | POLYGLUT MICROKERNEL | CROSS-TALK BUS ACTIVE</div>
      <div className="flex items-center gap-4">
        <span>RUNTIME: React 19 + Zustand + C++ Daemon + Python Sidecar</span>
        {last && <span className="text-green-400">LAST: {last.type} from {last.source}</span>}
      </div>
    </footer>
  );
}
