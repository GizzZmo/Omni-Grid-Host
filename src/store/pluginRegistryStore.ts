// src/store/pluginRegistryStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import React from 'react';
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
}

const componentCache = new Map<string, React.ComponentType<OmniWidgetHostProps>>();

export async function loadNativePluginComponent(
  manifest: OmniPluginManifest
): Promise<React.ComponentType<OmniWidgetHostProps>> {
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

      spawnWidget: (pluginId, coords = { x: 0, y: 0 }) => {
        const manifest = get().manifests[pluginId];
        if (!manifest) return null;

        const instanceId = `${pluginId}::${crypto.randomUUID().slice(0, 8)}`;
        const newInstance: ActiveWidgetInstance = {
          instanceId,
          pluginId,
          layout: {
            x: coords.x,
            y: coords.y,
            w: manifest.defaultLayout.w,
            h: manifest.defaultLayout.h,
          },
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
    }),
    {
      name: 'omnigrid-plugin-registry-v2',
    }
  )
);
