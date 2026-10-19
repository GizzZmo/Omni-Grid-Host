import { useOmniStore } from './store';
import { GridContainer } from './components/GridContainer';
import { Launcher } from './components/Launcher';
import { StatusBar } from './components/StatusBar';

export default function App() {
  const theme = useOmniStore(s => s.theme);
  const locked = useOmniStore(s => s.locked);

  return (
    <div className={`h-screen w-screen flex flex-col bg-cyber-bg text-white ${theme}`}>
      <div className="scanline absolute inset-0 z-50 pointer-events-none" />
      <header className="h-14 flex items-center justify-between px-6 border-b border-cyan-500/30 bg-black/40 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-cyan-400 rounded-sm flex items-center justify-center font-bold text-black">OG</div>
          <h1 className="text-xl font-bold tracking-widest text-cyan-400">OMNI-GRID <span className="text-magenta-400">HOST 3.0</span></h1>
        </div>
        <Launcher />
      </header>
      <main className="flex-1 relative overflow-hidden">
        <div className={locked ? 'blur-md pointer-events-none select-none' : ''}>
          <GridContainer />
        </div>
        {locked && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="text-center">
              <div className="text-red-400 text-2xl font-bold tracking-widest mb-2">BIOMETRIC LOCK</div>
              <div className="text-xs text-cyan-300/70">Face-Recon active — sensitive widgets blurred</div>
            </div>
          </div>
        )}
      </main>
      <StatusBar />
    </div>
  );
}
