// src/store/pluginRegistryStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { localPluginMap } from '../plugins';
import { OmniPluginManifest, OmniWidgetHostProps } from '../types/plugin-sdk';

export interface ActiveWidgetInstance {
  instanceId: string;
  pluginId: string;
  layout: { x: number; y: number; w: number; h: number };
}

interface PluginRegistryState {
  manifests: Record<string, OmniPluginManifest>;
  activeInstances: ActiveWidgetInstance[];
  registerManifest: (manifest: OmniPluginManifest) => void;
  spawnWidget: (pluginId: string, coords?: { x: number; y: number }) => string | null;
  closeWidget: (instanceId: string) => void;
  syncInstalledPlugins: () => Promise<void>;
}

const componentCache = new Map<string, React.ComponentType<OmniWidgetHostProps>>();

export async function loadNativePluginComponent(
  manifest: OmniPluginManifest
): Promise<React.ComponentType<OmniWidgetHostProps>> {
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
        'gizzzmo.audio.dsp4guitar': {
          id: 'gizzzmo.audio.dsp4guitar',
          name: 'DSP4Guitar Studio Rack',
          version: '2.1.0',
          repository: 'https://github.com/GizzZmo/DSP4Guitar',
          category: 'AUDIO',
          isolation: 'native-esm',
          entryPoint: '/plugins/dsp4guitar/index.js',
          defaultLayout: { w: 6, h: 4, minW: 4, minH: 3 },
          sidecar: { type: 'cpp-wasm', endpoint: '/wasm/dsp4guitar_processor.wasm', permissions: ['usb-audio', 'web-midi'] },
          crossTalk: { accepts: ['audio/midi', 'audio/pcm-stream', 'ai/prompt'], emits: ['audio/pcm-stream'] },
        },
      },
      activeInstances: [],
      registerManifest: (manifest) => set(s => ({ manifests: { ...s.manifests, [manifest.id]: manifest } })),
      spawnWidget: (pluginId, coords) => {
        const manifest = get().manifests[pluginId];
        if (!manifest) return null;
        const instanceId = `${pluginId}-${Date.now()}`;
        const newInstance = {
          instanceId,
          pluginId,
          layout: { x: coords?.x ?? 0, y: coords?.y ?? 0, w: manifest.defaultLayout.w, h: manifest.defaultLayout.h },
        };
        set(s => ({ activeInstances: [...s.activeInstances, newInstance] }));
        return instanceId;
      },
      closeWidget: (instanceId) => set(s => ({ activeInstances: s.activeInstances.filter(i => i.instanceId !== instanceId) })),
      syncInstalledPlugins: async () => {
        try {
          const res = await fetch('/plugins/registry.json');
          if (!res.ok) return;
          const discovered: Record<string, OmniPluginManifest> = await res.json();
          set(s => ({ manifests: { ...s.manifests, ...discovered } }));
        } catch (err) {
          console.warn('[PluginRegistry] No external /plugins/registry.json found yet:', err);
        }
      },
    }),
    { name: 'omnigrid-plugin-registry-v2' }
  )
);
