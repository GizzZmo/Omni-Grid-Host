import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WidgetLayout, CrossTalkPayload, OmniExtensionManifest } from './types';

interface OmniState {
  layouts: WidgetLayout[];
  visibleWidgets: string[];
  theme: 'cyber' | 'matrix' | 'void';
  locked: boolean;
  crossTalkBus: CrossTalkPayload[];
  extensions: OmniExtensionManifest[];
  setLayouts: (layouts: WidgetLayout[]) => void;
  toggleWidget: (id: string) => void;
  setLocked: (locked: boolean) => void;
  emitCrossTalk: (payload: Omit<CrossTalkPayload, 'timestamp'>) => void;
  setTheme: (theme: OmniState['theme']) => void;
}

const defaultExtensions: OmniExtensionManifest[] = [
  {
    id: 'gizzzmo.neural.core',
    name: 'Neural & Agentic Core',
    category: 'NEURAL',
    uiEntry: 'NeuralHub',
    description: 'MultiAgentHub, HoverMind overlay, Ai_shell',
    runtime: { type: 'python-worker', binaryOrScript: './workers/agentic.py', permissions: ['shell'] },
    crossTalk: { accepts: ['ai/prompt', 'code/ast'], emits: ['ai/agent-task'] }
  },
  {
    id: 'gizzzmo.audio.daw',
    name: 'Sonic & Neural DAW Suite',
    category: 'AUDIO',
    uiEntry: 'SonicRack',
    description: 'NAW timeline, DSP4Guitar WASM, TABFRET',
    runtime: { type: 'cpp-wasm', binaryOrScript: './bin/dsp4guitar.wasm', permissions: ['usb-audio', 'midi'] },
    crossTalk: { accepts: ['audio/midi', 'audio/pcm'], emits: ['audio/pcm'] }
  },
  {
    id: 'gizzzmo.secops.sentinel',
    name: 'SecOps & Biometric Sentinel',
    category: 'SECOPS',
    uiEntry: 'SecOpsCommand',
    description: 'AutoSec tile, Face-Recon lock, Network-Analyzer stream',
    runtime: { type: 'cpp-daemon', binaryOrScript: './bin/pcap-daemon', permissions: ['pcap-net', 'webcam'] },
    crossTalk: { accepts: ['sec/pcap-stream'], emits: ['sec/alert'] }
  },
  {
    id: 'gizzzmo.dev.forge',
    name: 'DevOps & Self-Healing Forge',
    category: 'DEV',
    uiEntry: 'CyberForge',
    description: 'autofix-engine + CyberEditor + ps4 inspector',
    crossTalk: { accepts: ['code/ast', 'git/patch'], emits: ['git/patch'] }
  },
  {
    id: 'gizzzmo.creative.studio',
    name: 'Creative, Studio & Gaming',
    category: 'CREATIVE',
    uiEntry: 'CreativeStudio',
    description: 'Tattoo-Workshop, Matrix-Sudoku, martial_arts graph',
    crossTalk: { accepts: ['ai/prompt'], emits: [] }
  }
];

export const useOmniStore = create<OmniState>()(
  persist(
    (set) => ({
      layouts: [
        { i: 'neural', x: 0, y: 0, w: 3, h: 4 },
        { i: 'sonic', x: 3, y: 0, w: 3, h: 4 },
        { i: 'secops', x: 6, y: 0, w: 3, h: 4 },
        { i: 'dev', x: 9, y: 0, w: 3, h: 4 },
      ],
      visibleWidgets: ['neural', 'sonic', 'secops', 'dev'],
      theme: 'cyber',
      locked: false,
      crossTalkBus: [],
      extensions: defaultExtensions,
      setLayouts: (layouts) => set({ layouts }),
      toggleWidget: (id) => set((s) => ({
        visibleWidgets: s.visibleWidgets.includes(id)
          ? s.visibleWidgets.filter(w => w !== id)
          : [...s.visibleWidgets, id]
      })),
      setLocked: (locked) => set({ locked }),
      emitCrossTalk: (payload) => set((s) => ({
        crossTalkBus: [...s.crossTalkBus.slice(-20), { ...payload, timestamp: Date.now() }]
      })),
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'omni-grid-host-v2' }
  )
);
