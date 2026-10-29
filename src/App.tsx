import { useState, useEffect } from 'react';
import { useOmniStore } from './store';
import { MatrixRain } from './components/MatrixRain';
import { GridContainer } from './components/GridContainer';
import { PluginLauncher } from './components/PluginLauncher';
import { StatusBar } from './components/StatusBar';
import { SettingsPanel } from './components/SettingsPanel';
import { useSettingsStore } from './store/settingsStore';
import { usePluginRegistry } from './store/pluginRegistryStore';

const NAW_MANIFEST = {
  id: 'gizzzmo.audio.naw',
  name: 'NAW // Neural Audio Workstation',
  version: '2.0.0',
  repository: 'https://github.com/GizzZmo/NAW',
  category: 'AUDIO' as const,
  isolation: 'native-esm' as const,
  entryPoint: '/plugins/naw/index.js',
  defaultLayout: { w: 8, h: 4, minW: 6, minH: 4 },
  sidecar: {
    type: 'python-sidecar' as const,
    endpoint: 'ws://localhost:8001/ws/sidecar',
    permissions: ['usb-audio', 'web-midi', 'gemini-api'] as ('usb-audio' | 'web-midi' | 'gemini-api')[],
  },
  crossTalk: {
    accepts: ['audio/midi', 'ai/agent-task', 'ai/prompt'] as ('audio/midi' | 'ai/agent-task' | 'ai/prompt')[],
    emits: ['audio/midi', 'audio/pcm-stream', 'ai/prompt'] as ('audio/midi' | 'audio/pcm-stream' | 'ai/prompt')[],
  },
};

export default function App() {
  const theme = useOmniStore(s => s.theme);
  const locked = useOmniStore(s => s.locked);
  const setLocked = useOmniStore(s => s.setLocked);
  const gridLocked = useOmniStore(s => s.gridLocked);
  const setGridLocked = useOmniStore(s => s.setGridLocked);
  const provider = useSettingsStore(s => s.provider);
  const hasKey = useSettingsStore(s => !!s.apiKey);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const registerManifest = usePluginRegistry(s => s.registerManifest);

  useEffect(() => {
    registerManifest(NAW_MANIFEST);

    const placeAudioChain = () => {
      const reg = usePluginRegistry.getState();
      const bottom = useOmniStore.getState().layouts.reduce((max, item) => Math.max(max, item.y + item.h), 0);
      const has = (id: string) => reg.activeInstances.some((inst) => inst.pluginId === id);
      if (!has('gizzzmo.audio.naw')) reg.spawnWidget('gizzzmo.audio.naw', { x: 0, y: bottom }, { w: 8, h: 5 });
      if (!has('gizzzmo.audio.tabfret')) reg.spawnWidget('gizzzmo.audio.tabfret', { x: 8, y: bottom }, { w: 4, h: 2 });
      if (!has('gizzzmo.audio.dsp4guitar')) reg.spawnWidget('gizzzmo.audio.dsp4guitar', { x: 8, y: bottom + 2 }, { w: 4, h: 3 });
    };

    if (usePluginRegistry.persist.hasHydrated()) {
      placeAudioChain();
    }
    return usePluginRegistry.persist.onFinishHydration(placeAudioChain);
  }, [registerManifest]);

  return (
    <div className={`h-screen w-screen flex flex-col bg-cyber-bg text-white ${theme} scanlines relative`}>
      <MatrixRain />
      <div className="scanline absolute inset-0 z-50 pointer-events-none" />
      <header className="h-14 min-h-14 flex items-center justify-between gap-3 px-4 sm:px-6 border-b border-cyan-500/30 bg-black/40 backdrop-blur overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-cyan-400 rounded-sm flex items-center justify-center font-bold text-black">OG</div>
          <h1 className="text-xl font-bold tracking-widest text-cyan-400">OMNI-GRID <span className="text-magenta-400">HOST 3.0</span></h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setGridLocked(!gridLocked)}
            className={`px-2 py-1 rounded text-xs font-bold tracking-wide border ${
              gridLocked
                ? 'bg-fuchsia-500 text-black border-fuchsia-300'
                : 'bg-slate-900/80 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/10'
            }`}
            title={gridLocked ? 'Grid is locked. Click to move tiles.' : 'Lock the grid so tiles stay put.'}
          >
            {gridLocked ? 'Grid locked' : 'Grid lock'}
          </button>
          <a
            href="/download/Omni-Grid-Host.zip"
            download="Omni-Grid-Host.zip"
            className="px-2 py-1 rounded bg-cyan-400 text-black text-xs font-bold tracking-wide hover:bg-cyan-300"
            title="Download Omni-Grid Host"
          >
            Download
          </a>
          <PluginLauncher />
          <button
            onClick={() => setSettingsOpen(true)}
            className="px-2 py-1 rounded bg-slate-900/80 border border-cyan-500/30 text-cyan-300 text-xs hover:bg-cyan-500/10"
            title="AI Provider & API Key"
          >
            {hasKey ? `⚙ ${provider}` : '⚙ Settings'}
          </button>
        </div>
      </header>
      <main className="flex-1 relative overflow-hidden min-h-0">
        <div className={`h-full min-h-0 ${locked ? 'blur-md pointer-events-none select-none' : ''}`}>
          <GridContainer />
        </div>
        {locked && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="text-center">
              <div className="text-red-400 text-2xl font-bold tracking-widest mb-2">BIOMETRIC LOCK</div>
              <div className="text-xs text-cyan-300/70 mb-4">Face-Recon active — sensitive widgets blurred</div>
              <button
                onClick={() => setLocked(false)}
                className="px-3 py-1.5 rounded border border-cyan-400/60 text-cyan-200 text-xs tracking-widest hover:bg-cyan-500/20"
              >
                Release lock
              </button>
            </div>
          </div>
        )}
      </main>
      <StatusBar />
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
