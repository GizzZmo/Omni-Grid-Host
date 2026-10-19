# Omni-Grid Host 3.0
**Polyglot Microkernel Desktop Host** — Unified application realizing the architectural blueprint.

Built from the Omni-Grid 2.0 chassis + extension packs covering Neural/Agentic, Sonic/DAW, SecOps, DevOps, and Creative repositories.

## Architecture Implemented

- **Frontend Shell**: React 19 + TypeScript + Zustand + Tailwind CSS + react-grid-layout (Bento tiles)
- **Extension SDK**: `OmniExtensionManifest` with runtime bridges, permissions, and Cross-Talk contracts
- **Cross-Talk Bus**: Typed event bus (Zustand store) for inter-widget payloads (audio/pcm, sec/alert, ai/agent-task, git/patch)
- **Widget System**: Sandboxed Bento widgets with drag handles, close, and launcher
- **Runtime Bridges** (simulated in this prototype):
  - Python Sidecar (FastAPI/gRPC style) for Master-Agentic-AI, HoverMind, Ai_shell
  - C++ / WASM for DSP4Guitar, Network-Analyzer, pcap daemon
  - Node/C++ native addons for autofix and binary inspection

## Extension Packs (from blueprint)

1. Neural & Agentic Core
2. Sonic & Neural DAW Suite
3. SecOps & Biometric Sentinel
4. DevOps & Self-Healing Forge
5. Creative, Studio & Gaming

## Quick Start

```bash
cd omni-grid-host
yarn install   # or npm install (if arborist issues, use yarn)
yarn dev
# Open http://localhost:5173
```

## Phase 1 Daemon

A Node.js WebSocket bus + process supervisor is included:

```bash
npm run daemon
# → ws://127.0.0.1:8765
# → http://127.0.0.1:8765/health
```

Control messages:
- `{ "type": "system/spawn", "data": { "id": "python", "command": "python3", "args": ["server/workers/unified_sidecar.py"] } }`
- `{ "type": "system/stop", "data": { "id": "python" } }`

All other messages are relayed as Cross-Talk.

## Tauri Host Skeleton

A minimal Tauri 2 skeleton wraps the React app:

```bash
npm install -D @tauri-apps/cli
npm run tauri:dev
```

The skeleton lives in `src-tauri/`. The process manager can later be moved into the Rust backend or kept as a sidecar.

## Phase 2 — AudioWorklet DSP

A live AudioWorklet processor is now mounted in the Sonic Rack widget:

- `public/worklets/omni-dsp-processor.js` — gain + one-pole low-pass on the audio thread
- Sonic Rack starts a test tone through the worklet, shows a live peak meter, and exposes gain/cutoff controls
- Emits `audio/pcm` events on the Phase 1 bus

```bash
npm run dev:full   # daemon + Vite
# Open Sonic Rack → Start DSP
```

Next concrete step: replace the JS processor with an Emscripten-compiled DSP4Guitar / Frequalizer core.

## Roadmap

- **Phase 1**: WebSocket daemon + process supervisor (done)
- **Phase 2**: AudioWorklet DSP path (proof-of-concept done; WASM port next)
- **Phase 3**: Live pcap stream into SecOps tile + Face-Recon webcam lock
- Desktop packaging: Tauri (preferred) or Electron host wrapping this shell

## Files

- `src/types.ts` — OmniExtensionManifest + CrossTalk types
- `src/store.ts` — Zustand local-first store + extension registry
- `src/components/` — Grid, WidgetShell, Launcher, StatusBar
- `src/widgets/` — Live prototypes of the five packs
- `src/sdk/` — **Full TypeScript SDK** (manifest types, event bus, registry, runtime bridges)

## TypeScript SDK

The SDK lives in `src/sdk/` and is the canonical way to build extensions and interact with the host.

```ts
import {
  extensionRegistry,
  omniBus,
  createRuntimeBridge,
  type OmniExtensionManifest,
} from './sdk';

const manifest: OmniExtensionManifest = { /* ... */ };
extensionRegistry.register(manifest);

omniBus.on('ai/agent-result', (payload) => {
  console.log(payload.data);
});

omniBus.emit({
  type: 'ai/agent-task',
  data: { prompt: 'analyze this' },
  source: 'my-widget',
});
```

Key modules:
- `types.ts` — Complete manifest, payload, permission, and bridge types
- `event-bus.ts` — Typed Cross-Talk bus with history
- `extension-registry.ts` — Registration, status, and permission grants
- `runtime.ts` — Mock and WebSocket bridges for Python/C++/WASM workers
- `index.ts` — Barrel export
- `example.ts` — Working usage example

This is a functional, runnable realization of the unified Omni-Grid Host. Extend any widget or add new manifests to integrate additional repositories.
