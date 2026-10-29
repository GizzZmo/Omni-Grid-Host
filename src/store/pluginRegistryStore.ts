// src/store/pluginRegistryStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { localPluginMap } from '../plugins';
import { useOmniStore } from '../store';
import { OmniPluginManifest, OmniWidgetHostProps } from '../types/plugin-sdk';

function nextOpenCell(w: number, h: number, taken: { x: number; y: number; w: number; h: number }[]) {
  const hits = (x: number, y: number) =>
    taken.some((item) => x < item.x + item.w && x + w > item.x && y < item.y + item.h && y + h > item.y);
  for (let y = 0; y < 80; y += 1) {
    for (let x = 0; x <= 12 - w; x += 1) {
      if (!hits(x, y)) return { x, y };
    }
  }
  const bottom = taken.reduce((max, item) => Math.max(max, item.y + item.h), 0);
  return { x: 0, y: bottom };
}

export interface ActiveWidgetInstance {
  instanceId: string;
  pluginId: string;
  layout: { x: number; y: number; w: number; h: number };
}

interface PluginRegistryState {
  manifests: Record<string, OmniPluginManifest>;
  activeInstances: ActiveWidgetInstance[];
  registerManifest: (manifest: OmniPluginManifest) => void;
  spawnWidget: (pluginId: string, coords?: { x: number; y: number }, size?: { w?: number; h?: number }) => string | null;
  closeWidget: (instanceId: string) => void;
  syncInstalledPlugins: () => Promise<void>;
}

const componentCache = new Map<string, React.ComponentType<OmniWidgetHostProps>>();

export async function loadNativePluginComponent(
  manifest: OmniPluginManifest
): Promise<React.ComponentType<OmniWidgetHostProps>> {
  // Option B: resolve from local plugin map first
  if (localPluginMap[manifest.id]) {
    const Component = localPluginMap[manifest.id];
    componentCache.set(manifest.id, Component);
    return Component;
  }

  if (componentCache.has(manifest.id)) {
    return componentCache.get(manifest.id)!;
  }

  const isLocalOrTrusted =
    manifest.entryPoint.startsWith('/plugins/') ||
    manifest.entryPoint.startsWith('./') ||
    manifest.entryPoint.startsWith('http://localhost:');

  if (!isLocalOrTrusted) {
    throw new Error(`[PluginLoader] Untrusted entryPoint blocked for native-esm: ${manifest.entryPoint}`);
  }

  const module = await import(/* @vite-ignore */ manifest.entryPoint);
  const Component = module.default || module.OmniWidget;

  if (!Component) {
    throw new Error(`[PluginLoader] Plugin "${manifest.id}" did not export a default React component.`);
  }

  componentCache.set(manifest.id, Component);
  return Component;
}

export const usePluginRegistry = create<PluginRegistryState>()(
  persist(
    (set, get) => ({
      manifests: {
        'gizzzmo.system.phase9': {
          id: 'gizzzmo.system.phase9',
          name: 'Phase 9 Self-Healing Network',
          version: '9.0.0',
          repository: 'https://github.com/GizzZmo/Omni-Grid-Host',
          category: 'SYSTEM',
          isolation: 'native-esm',
          entryPoint: '/plugins/phase9-netheal/index.js',
          defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 },
          crossTalk: { accepts: [], emits: [] },
        },
        'gizzzmo.system.phase8': {
          id: 'gizzzmo.system.phase8',
          name: 'Phase 8 Quantum-Resistant',
          version: '8.0.0',
          repository: 'https://github.com/GizzZmo/Omni-Grid-Host',
          category: 'SYSTEM',
          isolation: 'native-esm',
          entryPoint: '/plugins/phase8-pqc/index.js',
          defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 },
          crossTalk: { accepts: [], emits: [] },
        },
        'gizzzmo.system.phase7': {
          id: 'gizzzmo.system.phase7',
          name: 'Phase 7 Self-Healing',
          version: '7.0.0',
          repository: 'https://github.com/GizzZmo/Omni-Grid-Host',
          category: 'SYSTEM',
          isolation: 'native-esm',
          entryPoint: '/plugins/phase7-heal/index.js',
          defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 },
          crossTalk: { accepts: [], emits: [] },
        },
        'gizzzmo.system.phase6': {
          id: 'gizzzmo.system.phase6',
          name: 'Phase 6 Agent Autonomy',
          version: '6.0.0',
          repository: 'https://github.com/GizzZmo/Omni-Grid-Host',
          category: 'SYSTEM',
          isolation: 'native-esm',
          entryPoint: '/plugins/phase6-autonomy/index.js',
          defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 },
          crossTalk: { accepts: ['ai/agent-task'], emits: ['ai/agent-task'] },
        },
        'gizzzmo.system.phase5': {
          id: 'gizzzmo.system.phase5',
          name: 'Phase 5 Enterprise Mesh',
          version: '5.0.0',
          repository: 'https://github.com/GizzZmo/Omni-Grid-Host',
          category: 'SYSTEM',
          isolation: 'native-esm',
          entryPoint: '/plugins/phase5-command/index.js',
          defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 },
          crossTalk: {
            accepts: ['ai/agent-task', 'system/workspace'],
            emits: ['ai/agent-task', 'ai/prompt', 'system/workspace'],
          },
        },
        'gizzzmo.secops.sentinel': {
          id: 'gizzzmo.secops.sentinel',
          name: 'AutoSec + Face-Recon Sentinel',
          version: '2.4.0',
          repository: 'https://github.com/GizzZmo/AutoSec',
          category: 'SECOPS',
          isolation: 'native-esm',
          entryPoint: '/plugins/secops-sentinel/index.js',
          defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 },
          sidecar: {
            type: 'cpp-daemon',
            endpoint: 'ws://localhost:1234/ipc/pcap-stream',
            permissions: ['pcap-net', 'webcam', 'gemini-api'],
          },
          crossTalk: {
            accepts: ['sec/pcap-packet', 'sec/biometric-auth', 'ai/agent-task'],
            emits: ['ai/prompt', 'text/plain', 'sec/pcap-packet'],
          },
        },
        'gizzzmo.audio.dsp4guitar': {
          id: 'gizzzmo.audio.dsp4guitar',
          name: 'DSP4Guitar Studio Rack',
          version: '2.1.0',
          repository: 'https://github.com/GizzZmo/DSP4Guitar',
          category: 'AUDIO',
          isolation: 'native-esm',
          entryPoint: '/plugins/dsp4guitar/index.js',
          defaultLayout: { w: 6, h: 4, minW: 4, minH: 3 },
          sidecar: {
            type: 'cpp-wasm',
            endpoint: '/wasm/dsp4guitar_processor.wasm',
            permissions: ['usb-audio', 'web-midi'],
          },
          crossTalk: {
            accepts: ['audio/midi', 'audio/pcm-stream', 'ai/prompt'],
            emits: ['audio/pcm-stream'],
          },
        },
        'gizzzmo.audio.naw': {
          id: 'gizzzmo.audio.naw',
          name: 'NAW // Neural Audio Workstation',
          version: '2.0.0',
          repository: 'https://github.com/GizzZmo/NAW',
          category: 'AUDIO',
          isolation: 'native-esm',
          entryPoint: '/plugins/naw/index.js',
          defaultLayout: { w: 8, h: 4, minW: 6, minH: 4 },
          sidecar: {
            type: 'python-sidecar',
            endpoint: 'ws://localhost:8001/ws/sidecar',
            permissions: ['usb-audio', 'web-midi', 'gemini-api'],
          },
          crossTalk: {
            accepts: ['audio/midi', 'ai/agent-task', 'ai/prompt'],
            emits: ['audio/midi', 'audio/pcm-stream', 'ai/prompt'],
          },
        },
        'gizzzmo.audio.tabfret': {
          id: 'gizzzmo.audio.tabfret',
          name: 'TABFRET MIDI Visualizer',
          version: '1.4.0',
          repository: 'https://github.com/GizzZmo/TABFRET',
          category: 'AUDIO',
          isolation: 'native-esm',
          entryPoint: '/plugins/tabfret/index.js',
          defaultLayout: { w: 6, h: 3, minW: 4, minH: 2 },
          crossTalk: {
            accepts: ['audio/midi'],
            emits: ['audio/midi'],
          },
        },
        'gizzzmo.audio.sonic-architecture': {
          id: 'gizzzmo.audio.sonic-architecture',
          name: 'Sonic Architecture',
          version: '2.0.0',
          repository: 'https://github.com/GizzZmo/Omni-Grid-2.0',
          category: 'AUDIO',
          isolation: 'native-esm',
          entryPoint: '/plugins/sonic-architecture/index.js',
          defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 },
          crossTalk: { accepts: ['audio/midi'], emits: ['audio/midi'] },
        },
        'gizzzmo.neural.multi-agent': {
          id: 'gizzzmo.neural.multi-agent',
          name: 'Multi-Agent Hub',
          version: '2.0.0',
          repository: 'https://github.com/GizzZmo/Omni-Grid-2.0',
          category: 'NEURAL',
          isolation: 'native-esm',
          entryPoint: '/plugins/multi-agent/index.js',
          defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 },
          crossTalk: { accepts: ['ai/prompt', 'ai/agent-task'], emits: ['ai/agent-task'] },
        },
        'gizzzmo.system.aesthetic': { id: 'gizzzmo.system.aesthetic', name: 'Aesthetic Engine', version: '2.0.0', repository: 'https://github.com/GizzZmo/Omni-Grid-2.0', category: 'SYSTEM', isolation: 'native-esm', entryPoint: '/plugins/aesthetic/index.js', defaultLayout: { w: 4, h: 3 }, crossTalk: { accepts: [], emits: [] } },
        'gizzzmo.system.assets': { id: 'gizzzmo.system.assets', name: 'Asset Command', version: '2.0.0', repository: 'https://github.com/GizzZmo/Omni-Grid-2.0', category: 'SYSTEM', isolation: 'native-esm', entryPoint: '/plugins/assets/index.js', defaultLayout: { w: 4, h: 3 }, crossTalk: { accepts: [], emits: [] } },
        'gizzzmo.dev.browser': { id: 'gizzzmo.dev.browser', name: 'Browser', version: '2.0.0', repository: 'https://github.com/GizzZmo/Omni-Grid-2.0', category: 'DEV', isolation: 'native-esm', entryPoint: '/plugins/browser/index.js', defaultLayout: { w: 6, h: 4 }, crossTalk: { accepts: [], emits: [] } },
        'gizzzmo.finance.chain': { id: 'gizzzmo.finance.chain', name: 'Chain Pulse', version: '2.0.0', repository: 'https://github.com/GizzZmo/Omni-Grid-2.0', category: 'FINANCE', isolation: 'native-esm', entryPoint: '/plugins/chain/index.js', defaultLayout: { w: 4, h: 3 }, crossTalk: { accepts: [], emits: [] } },
        'gizzzmo.creative.chroma': { id: 'gizzzmo.creative.chroma', name: 'Chroma Lab', version: '2.0.0', repository: 'https://github.com/GizzZmo/Omni-Grid-2.0', category: 'CREATIVE', isolation: 'native-esm', entryPoint: '/plugins/chroma/index.js', defaultLayout: { w: 3, h: 3 }, crossTalk: { accepts: [], emits: [] } },
        'gizzzmo.secops.cipherpad': { id: 'gizzzmo.secops.cipherpad', name: 'Cipher Pad', version: '2.0.0', repository: 'https://github.com/GizzZmo/Omni-Grid-2.0', category: 'SECOPS', isolation: 'native-esm', entryPoint: '/plugins/cipherpad/index.js', defaultLayout: { w: 4, h: 3 }, crossTalk: { accepts: [], emits: [] } },
        'gizzzmo.system.clipboard': { id: 'gizzzmo.system.clipboard', name: 'Clipboard Stream', version: '2.0.0', repository: 'https://github.com/GizzZmo/Omni-Grid-2.0', category: 'SYSTEM', isolation: 'native-esm', entryPoint: '/plugins/clipboard/index.js', defaultLayout: { w: 4, h: 3 }, crossTalk: { accepts: [], emits: [] } },
        'gizzzmo.system.community': { id: 'gizzzmo.system.community', name: 'Community Portal', version: '2.0.0', repository: 'https://github.com/GizzZmo/Omni-Grid-2.0', category: 'SYSTEM', isolation: 'native-esm', entryPoint: '/plugins/community/index.js', defaultLayout: { w: 4, h: 3 }, crossTalk: { accepts: [], emits: [] } },
        'gizzzmo.dev.editor': { id: 'gizzzmo.dev.editor', name: 'Cyber Editor', version: '2.0.0', repository: 'https://github.com/GizzZmo/Omni-Grid-2.0', category: 'DEV', isolation: 'native-esm', entryPoint: '/plugins/editor/index.js', defaultLayout: { w: 6, h: 4 }, crossTalk: { accepts: ['code/patch'], emits: ['code/patch'] } },
        'gizzzmo.dev.optic': { id: 'gizzzmo.dev.optic', name: 'Dev Optic', version: '2.0.0', repository: 'https://github.com/GizzZmo/Omni-Grid-2.0', category: 'DEV', isolation: 'native-esm', entryPoint: '/plugins/optic/index.js', defaultLayout: { w: 4, h: 3 }, crossTalk: { accepts: [], emits: [] } },
        'gizzzmo.dev.docs': { id: 'gizzzmo.dev.docs', name: 'Docu Hub', version: '2.0.0', repository: 'https://github.com/GizzZmo/Omni-Grid-2.0', category: 'DEV', isolation: 'native-esm', entryPoint: '/plugins/docs/index.js', defaultLayout: { w: 4, h: 3 }, crossTalk: { accepts: [], emits: [] } },
        'gizzzmo.system.focus': { id: 'gizzzmo.system.focus', name: 'Focus HUD', version: '2.0.0', repository: 'https://github.com/GizzZmo/Omni-Grid-2.0', category: 'SYSTEM', isolation: 'native-esm', entryPoint: '/plugins/focus/index.js', defaultLayout: { w: 3, h: 3 }, crossTalk: { accepts: [], emits: [] } },
        'gizzzmo.system.ghost': { id: 'gizzzmo.system.ghost', name: 'Ghost Widget', version: '2.0.0', repository: 'https://github.com/GizzZmo/Omni-Grid-2.0', category: 'SYSTEM', isolation: 'native-esm', entryPoint: '/plugins/ghost/index.js', defaultLayout: { w: 3, h: 2 }, crossTalk: { accepts: [], emits: [] } },
        'gizzzmo.dev.git': { id: 'gizzzmo.dev.git', name: 'Git Pulse', version: '2.0.0', repository: 'https://github.com/GizzZmo/Omni-Grid-2.0', category: 'DEV', isolation: 'native-esm', entryPoint: '/plugins/git/index.js', defaultLayout: { w: 4, h: 3 }, crossTalk: { accepts: [], emits: [] } },
        'gizzzmo.system.help': { id: 'gizzzmo.system.help', name: 'Help Desk', version: '2.0.0', repository: 'https://github.com/GizzZmo/Omni-Grid-2.0', category: 'SYSTEM', isolation: 'native-esm', entryPoint: '/plugins/help/index.js', defaultLayout: { w: 4, h: 3 }, crossTalk: { accepts: [], emits: [] } },
        'gizzzmo.system.macro': { id: 'gizzzmo.system.macro', name: 'Macro Net', version: '2.0.0', repository: 'https://github.com/GizzZmo/Omni-Grid-2.0', category: 'SYSTEM', isolation: 'native-esm', entryPoint: '/plugins/macro/index.js', defaultLayout: { w: 4, h: 3 }, crossTalk: { accepts: [], emits: [] } },
        'gizzzmo.finance.market': { id: 'gizzzmo.finance.market', name: 'Market', version: '2.0.0', repository: 'https://github.com/GizzZmo/Omni-Grid-2.0', category: 'FINANCE', isolation: 'native-esm', entryPoint: '/plugins/market/index.js', defaultLayout: { w: 4, h: 3 }, crossTalk: { accepts: [], emits: [] } },
        'gizzzmo.neural.chat': { id: 'gizzzmo.neural.chat', name: 'Neural Chat', version: '2.0.0', repository: 'https://github.com/GizzZmo/Omni-Grid-2.0', category: 'NEURAL', isolation: 'native-esm', entryPoint: '/plugins/chat/index.js', defaultLayout: { w: 5, h: 4 }, crossTalk: { accepts: ['ai/prompt'], emits: ['ai/prompt'] } },
        'gizzzmo.neural.scratch': { id: 'gizzzmo.neural.scratch', name: 'Neural Scratchpad', version: '2.0.0', repository: 'https://github.com/GizzZmo/Omni-Grid-2.0', category: 'NEURAL', isolation: 'native-esm', entryPoint: '/plugins/scratch/index.js', defaultLayout: { w: 4, h: 3 }, crossTalk: { accepts: ['text/plain'], emits: ['text/plain'] } },
        'gizzzmo.system.news': { id: 'gizzzmo.system.news', name: 'News Feed', version: '2.0.0', repository: 'https://github.com/GizzZmo/Omni-Grid-2.0', category: 'SYSTEM', isolation: 'native-esm', entryPoint: '/plugins/news/index.js', defaultLayout: { w: 4, h: 3 }, crossTalk: { accepts: [], emits: [] } },
        'gizzzmo.dev.pdf': { id: 'gizzzmo.dev.pdf', name: 'PDF Viewer', version: '2.0.0', repository: 'https://github.com/GizzZmo/Omni-Grid-2.0', category: 'DEV', isolation: 'native-esm', entryPoint: '/plugins/pdf/index.js', defaultLayout: { w: 5, h: 4 }, crossTalk: { accepts: [], emits: [] } },
        'gizzzmo.system.polyglot': { id: 'gizzzmo.system.polyglot', name: 'Polyglot Box', version: '2.0.0', repository: 'https://github.com/GizzZmo/Omni-Grid-2.0', category: 'SYSTEM', isolation: 'native-esm', entryPoint: '/plugins/polyglot/index.js', defaultLayout: { w: 4, h: 3 }, crossTalk: { accepts: [], emits: [] } },
        'gizzzmo.dev.tracker': { id: 'gizzzmo.dev.tracker', name: 'Project Tracker', version: '2.0.0', repository: 'https://github.com/GizzZmo/Omni-Grid-2.0', category: 'DEV', isolation: 'native-esm', entryPoint: '/plugins/tracker/index.js', defaultLayout: { w: 4, h: 3 }, crossTalk: { accepts: [], emits: [] } },
        'gizzzmo.neural.prompt': { id: 'gizzzmo.neural.prompt', name: 'Prompt Lab', version: '2.0.0', repository: 'https://github.com/GizzZmo/Omni-Grid-2.0', category: 'NEURAL', isolation: 'native-esm', entryPoint: '/plugins/prompt/index.js', defaultLayout: { w: 4, h: 3 }, crossTalk: { accepts: ['ai/prompt'], emits: ['ai/prompt'] } },
        'gizzzmo.dev.calc': { id: 'gizzzmo.dev.calc', name: 'Quantum Calc', version: '2.0.0', repository: 'https://github.com/GizzZmo/Omni-Grid-2.0', category: 'DEV', isolation: 'native-esm', entryPoint: '/plugins/calc/index.js', defaultLayout: { w: 3, h: 3 }, crossTalk: { accepts: [], emits: [] } },
        'gizzzmo.system.radar': { id: 'gizzzmo.system.radar', name: 'Reg Radar', version: '2.0.0', repository: 'https://github.com/GizzZmo/Omni-Grid-2.0', category: 'SYSTEM', isolation: 'native-esm', entryPoint: '/plugins/radar/index.js', defaultLayout: { w: 4, h: 3 }, crossTalk: { accepts: [], emits: [] } },
        'gizzzmo.neural.research': { id: 'gizzzmo.neural.research', name: 'Research Browser', version: '2.0.0', repository: 'https://github.com/GizzZmo/Omni-Grid-2.0', category: 'NEURAL', isolation: 'native-esm', entryPoint: '/plugins/research/index.js', defaultLayout: { w: 4, h: 3 }, crossTalk: { accepts: [], emits: [] } },
        'gizzzmo.system.calendar': { id: 'gizzzmo.system.calendar', name: 'Secure Calendar', version: '2.0.0', repository: 'https://github.com/GizzZmo/Omni-Grid-2.0', category: 'SYSTEM', isolation: 'native-esm', entryPoint: '/plugins/calendar/index.js', defaultLayout: { w: 4, h: 3 }, crossTalk: { accepts: [], emits: [] } },
        'gizzzmo.system.radio': { id: 'gizzzmo.system.radio', name: 'Signal Radio', version: '2.0.0', repository: 'https://github.com/GizzZmo/Omni-Grid-2.0', category: 'SYSTEM', isolation: 'native-esm', entryPoint: '/plugins/radio/index.js', defaultLayout: { w: 4, h: 3 }, crossTalk: { accepts: [], emits: [] } },
        'gizzzmo.system.blueprint': { id: 'gizzzmo.system.blueprint', name: 'Strategic Blueprint', version: '2.0.0', repository: 'https://github.com/GizzZmo/Omni-Grid-2.0', category: 'SYSTEM', isolation: 'native-esm', entryPoint: '/plugins/blueprint/index.js', defaultLayout: { w: 4, h: 3 }, crossTalk: { accepts: [], emits: [] } },
        'gizzzmo.creative.sudoku': { id: 'gizzzmo.creative.sudoku', name: 'Sudoku Grid', version: '2.0.0', repository: 'https://github.com/GizzZmo/Omni-Grid-2.0', category: 'CREATIVE', isolation: 'native-esm', entryPoint: '/plugins/sudoku/index.js', defaultLayout: { w: 4, h: 4 }, crossTalk: { accepts: [], emits: [] } },
        'gizzzmo.audio.suno': { id: 'gizzzmo.audio.suno', name: 'Suno Player', version: '2.0.0', repository: 'https://github.com/GizzZmo/Omni-Grid-2.0', category: 'AUDIO', isolation: 'native-esm', entryPoint: '/plugins/suno/index.js', defaultLayout: { w: 4, h: 3 }, crossTalk: { accepts: ['audio/midi'], emits: [] } },
        'gizzzmo.system.core': { id: 'gizzzmo.system.core', name: 'System Core', version: '2.0.0', repository: 'https://github.com/GizzZmo/Omni-Grid-2.0', category: 'SYSTEM', isolation: 'native-esm', entryPoint: '/plugins/core/index.js', defaultLayout: { w: 4, h: 3 }, crossTalk: { accepts: [], emits: [] } },
        'gizzzmo.system.temporal': { id: 'gizzzmo.system.temporal', name: 'Temporal Nexus', version: '2.0.0', repository: 'https://github.com/GizzZmo/Omni-Grid-2.0', category: 'SYSTEM', isolation: 'native-esm', entryPoint: '/plugins/temporal/index.js', defaultLayout: { w: 3, h: 2 }, crossTalk: { accepts: [], emits: [] } },
        'gizzzmo.dev.transform': { id: 'gizzzmo.dev.transform', name: 'Universal Transformer', version: '2.0.0', repository: 'https://github.com/GizzZmo/Omni-Grid-2.0', category: 'DEV', isolation: 'native-esm', entryPoint: '/plugins/transform/index.js', defaultLayout: { w: 4, h: 3 }, crossTalk: { accepts: [], emits: [] } },
        'gizzzmo.finance.valuta': { id: 'gizzzmo.finance.valuta', name: 'Valuta Exchange', version: '2.0.0', repository: 'https://github.com/GizzZmo/Omni-Grid-2.0', category: 'FINANCE', isolation: 'native-esm', entryPoint: '/plugins/valuta/index.js', defaultLayout: { w: 3, h: 2 }, crossTalk: { accepts: [], emits: [] } },
        'gizzzmo.system.weather': { id: 'gizzzmo.system.weather', name: 'Weather Station', version: '2.0.0', repository: 'https://github.com/GizzZmo/Omni-Grid-2.0', category: 'SYSTEM', isolation: 'native-esm', entryPoint: '/plugins/weather/index.js', defaultLayout: { w: 3, h: 2 }, crossTalk: { accepts: [], emits: [] } },
        'gizzzmo.dev.terminal': { id: 'gizzzmo.dev.terminal', name: 'Web Terminal', version: '2.0.0', repository: 'https://github.com/GizzZmo/Omni-Grid-2.0', category: 'DEV', isolation: 'native-esm', entryPoint: '/plugins/terminal/index.js', defaultLayout: { w: 5, h: 4 }, crossTalk: { accepts: [], emits: [] } },
        'gizzzmo.system.architect': { id: 'gizzzmo.system.architect', name: 'Widget Architect', version: '2.0.0', repository: 'https://github.com/GizzZmo/Omni-Grid-2.0', category: 'SYSTEM', isolation: 'native-esm', entryPoint: '/plugins/architect/index.js', defaultLayout: { w: 4, h: 3 }, crossTalk: { accepts: [], emits: [] } },
        'gizzzmo.system.marketplace': { id: 'gizzzmo.system.marketplace', name: 'Widget Marketplace', version: '2.0.0', repository: 'https://github.com/GizzZmo/Omni-Grid-2.0', category: 'SYSTEM', isolation: 'native-esm', entryPoint: '/plugins/marketplace/index.js', defaultLayout: { w: 4, h: 3 }, crossTalk: { accepts: [], emits: [] } },
        'gizzzmo.creative.write': { id: 'gizzzmo.creative.write', name: 'Write Pad', version: '2.0.0', repository: 'https://github.com/GizzZmo/Omni-Grid-2.0', category: 'CREATIVE', isolation: 'native-esm', entryPoint: '/plugins/write/index.js', defaultLayout: { w: 4, h: 3 }, crossTalk: { accepts: [], emits: [] } },
        'gizzzmo.secops.cipher-vault': {
          id: 'gizzzmo.secops.cipher-vault',
          name: 'Cipher Vault',
          version: '2.0.0',
          repository: 'https://github.com/GizzZmo/Omni-Grid-2.0',
          category: 'SECOPS',
          isolation: 'native-esm',
          entryPoint: '/plugins/cipher-vault/index.js',
          defaultLayout: { w: 4, h: 4, minW: 3, minH: 3 },
          crossTalk: { accepts: ['sec/biometric-auth'], emits: ['sec/biometric-auth'] },
        },
        'gizzzmo.secops.autosec': {
          id: 'gizzzmo.secops.autosec',
          name: 'AutoSec Threat Command',
          version: '3.0.0',
          repository: 'https://github.com/GizzZmo/AutoSec',
          category: 'SECOPS',
          isolation: 'sandboxed-iframe',
          entryPoint: '/plugins/autosec/index.html',
          defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 },
          sidecar: {
            type: 'cpp-daemon',
            endpoint: 'ws://localhost:1234/ipc/pcap-stream',
            permissions: ['pcap-net'],
          },
          crossTalk: {
            accepts: ['sec/pcap-packet', 'sec/biometric-auth'],
            emits: ['ai/agent-task', 'text/plain'],
          },
        },
      },
      activeInstances: [],

      registerManifest: (manifest) =>
        set((state) => ({
          manifests: { ...state.manifests, [manifest.id]: manifest },
        })),

      spawnWidget: (pluginId, coords, size) => {
        const manifest = get().manifests[pluginId];
        if (!manifest) return null;

        const w = Math.min(12, Math.max(4, size?.w ?? manifest.defaultLayout.w));
        const h = Math.max(6, size?.h ?? manifest.defaultLayout.h);
        const taken = [
          ...useOmniStore.getState().layouts,
          ...get().activeInstances.map((inst) => inst.layout),
        ];
        const spot = coords ?? nextOpenCell(w, h, taken);
        const instanceId = `${pluginId}::${crypto.randomUUID().slice(0, 8)}`;
        const newInstance: ActiveWidgetInstance = {
          instanceId,
          pluginId,
          layout: { x: spot.x, y: spot.y, w, h },
        };

        set((state) => ({
          activeInstances: [...state.activeInstances, newInstance],
        }));
        return instanceId;
      },

      closeWidget: (instanceId) =>
        set((state) => ({
          activeInstances: state.activeInstances.filter((i) => i.instanceId !== instanceId),
        })),

      syncInstalledPlugins: async () => {
        try {
          const res = await fetch('/plugins/registry.json');
          if (!res.ok) return;
          const discovered: Record<string, OmniPluginManifest> = await res.json();
          set((state) => ({
            manifests: { ...state.manifests, ...discovered },
          }));
        } catch (err) {
          console.warn('[PluginRegistry] No external /plugins/registry.json found yet:', err);
        }
      },
    }),
    {
      name: 'omnigrid-plugin-registry-v2',
      merge: (persistedState, currentState) => {
        const persisted = (persistedState ?? {}) as Partial<PluginRegistryState>;
        const manifests = {
          ...currentState.manifests,
          ...(persisted.manifests ?? {}),
        };
        const core = useOmniStore.getState().layouts;
        const raw = persisted.activeInstances ?? [];
        const grown = raw.map((inst) => {
          const w = Math.min(12, Math.max(4, inst.layout.w));
          const h = Math.max(6, inst.layout.h);
          return { ...inst, layout: { ...inst.layout, w, h } };
        });
        const taken = core.map((item) => ({ x: item.x, y: item.y, w: item.w, h: item.h }));
        const activeInstances = grown.map((inst) => {
          const { w, h } = inst.layout;
          let { x, y } = inst.layout;
          const hits = (xx: number, yy: number) =>
            taken.some((item) => xx < item.x + item.w && xx + w > item.x && yy < item.y + item.h && yy + h > item.y);
          if (x < 0 || y < 0 || x + w > 12 || hits(x, y)) {
            const spot = nextOpenCell(w, h, taken);
            x = spot.x;
            y = spot.y;
          }
          const layout = { x, y, w, h };
          taken.push(layout);
          return { ...inst, layout };
        });
        return {
          ...currentState,
          ...persisted,
          manifests,
          activeInstances,
        };
      },
    }
  )
);
