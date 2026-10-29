# Omni-Grid Host 3.0 — Comprehensive Documentation

**Polyglot Microkernel Desktop Host**  
Repository: https://github.com/GizzZmo/Omni-Grid-Host

> "Good. You found the desk. I left the north lights on and the sidecars humming."  
> — Jon-Arve Constantine

Omni-Grid Host unifies the Omni-Grid 2.0 chassis with C++, Python, Rust, and Node workloads into a single local-first command environment. It is designed as an extensible Bento-tile operating surface for Neural/Agentic, Sonic/DAW, SecOps, DevOps, and Creative tools.

The operator Face-Recon names is **Jon-Arve Constantine**. His lines for boot, trouble, and last call are collected in [GREETINGS.md](GREETINGS.md). They are numerous on purpose. Pick one that is still true if someone else is in the chair.

### Operator guides

| Document | What it answers |
|----------|-----------------|
| [OPERATOR-MANUAL.md](OPERATOR-MANUAL.md) | Regions of the screen, session order, persistence, footer badges |
| [TIPS-AND-TRICKS.md](TIPS-AND-TRICKS.md) | Short moves for layout, mix, bus, settings, and the mistakes that look like bugs |
| [AUDIO-DESK.md](AUDIO-DESK.md) | NAW transport, chord packets, Neural Compose, DSP signal path |
| [SIDECARS.md](SIDECARS.md) | How C++, Python, and the Phase 1 daemon link, and what they send |
| [GREETINGS.md](GREETINGS.md) | Constantine, sorted by moment |

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Phase Roadmap](#phase-roadmap)
4. [Getting Started](#getting-started)
5. [Widget Development](#widget-development)
6. [Cross-Talk Event Bus](#cross-talk-event-bus)
7. [Plugin System & CLI](#plugin-system--cli)
8. [Sidecar Daemons](#sidecar-daemons)
9. [DSP & AudioWorklet](#dsp--audioworklet)
10. [SecOps & Biometrics](#secops--biometrics)
11. [Phase 5 Enterprise Mesh](#phase-5-enterprise-mesh)
12. [Tauri Desktop Host](#tauri-desktop-host)
13. [API Reference](#api-reference)
14. [Project Structure](#project-structure)
15. [Troubleshooting](#troubleshooting)
16. [Further reading](#further-reading)

---

## Overview

Omni-Grid Host is a local-first, privacy-centric super-app shell. Every tool lives as a sandboxed Bento widget. Widgets communicate through a typed Cross-Talk bus instead of direct imports. Native workloads (C++ packet capture, Python agents, WASM DSP) run as sidecars and stream events into the same bus.

### Core Principles

- **Local-first**: State persists in the browser (Zustand + localStorage). No required cloud.
- **Plugin isolation**: Trusted widgets load as native ESM; untrusted ones load in sandboxed iframes with MessagePort.
- **Cross-Talk**: Typed MIME envelopes (`audio/midi`, `sec/pcap-packet`, `ai/agent-task`, …) with permission checks.
- **Polyglot sidecars**: C++17 WebSocket daemon, Python FastAPI worker, Emscripten WASM DSP, Tauri desktop host.
- **Zero-eval**: Dynamic loading uses Vite ESM imports only; no `eval()`.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React 19 Frontend Shell                  │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐ │
│  │ Bento Grid  │  │ Cross-Talk   │  │ Plugin Registry     │ │
│  │ (react-grid)│  │ Event Bus    │  │ (Zustand)           │ │
│  └──────┬──────┘  └──────┬───────┘  └──────────┬──────────┘ │
│         │                │                      │            │
│  ┌──────▼────────────────▼──────────────────────▼─────────┐ │
│  │              OmniPluginHost (native-esm / iframe)       │ │
│  └──────────────────────────┬──────────────────────────────┘ │
└─────────────────────────────┼────────────────────────────────┘
                              │ WebSocket / MessagePort
┌─────────────────────────────▼────────────────────────────────┐
│                    Sidecar Layer                             │
│  ┌──────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ C++17 WS Daemon  │  │ Python FastAPI  │  │ WASM DSP     │ │
│  │ (pcap + static)  │  │ (agents/CV)     │  │ AudioWorklet │ │
│  └──────────────────┘  └─────────────────┘  └──────────────┘ │
└──────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────▼────────────────────────────────┐
│                    Tauri 2 Desktop Host (optional)           │
└──────────────────────────────────────────────────────────────┘
```

### Key Modules

| Module | Path | Role |
|--------|------|------|
| Cross-Talk Bus | `src/services/crossTalkBus.ts` | Typed pub/sub + drag payload + iframe ports |
| Plugin Registry | `src/store/pluginRegistryStore.ts` | Manifests, spawn/close, dynamic ESM loader |
| Plugin Host | `src/components/OmniPluginHost.tsx` | Renders native or sandboxed widget |
| Sidecar Bridge | `src/services/sidecarBridge.ts` | Binds C++/Python WebSockets into the bus |
| Phase 5 | `src/services/phase5.ts` | Workspaces, agent mesh, HoverMind, audit |
| Types | `src/types/plugin-sdk.ts` | Manifest, MIME types, permissions |

---

## Phase Roadmap

| Phase | Status | Deliverable |
|-------|--------|-------------|
| **1** | Complete | WebSocket daemon + process supervisor (`server/omnigrid-daemon.mjs`) |
| **2** | Complete | DSP4Guitar AudioWorklet + live guitar input + volume knobs |
| **3** | Complete | SecOps Sentinel (pcap radar, Face-Recon lock, AutoSec playbooks) |
| **4** | Complete | Tauri host skeleton + dynamic plugin loader + local plugin map |
| **5** | Complete | Multi-workspace, HoverMind OS capture, agent mesh, enterprise audit |
| **6** | Complete | Agent autonomy + adaptive learning |
| **7** | Complete | Self-healing and fault tolerance |
| **8** | Complete | Hybrid post-quantum demonstration |
| **9** | Complete | Self-healing network topology |

### Phase 1 — Sidecar Bridge
Node.js WebSocket bus on `ws://127.0.0.1:8765`. Spawns and supervises Python/C++ workers. Relays all non-control messages as Cross-Talk.

### Phase 2 — Audio/DSP
Zero-allocation C++17 DSP core (`dsp/dsp4guitar_wasm.cpp`) compiled via Emscripten. AudioWorklet processor with JS fallback. Live USB guitar input (echo cancellation off), input gain (0–4×), headphone output (0–150%).

### Phase 3 — SecOps
SecOps Sentinel widget: 60 FPS polar threat radar, biometric lock overlay, one-click IP quarantine that emits `ai/prompt` + `text/plain` rules.

### Phase 4 — Desktop + Plugins
Tauri 2 skeleton with native commands. Production plugin loader (no eval). Local plugin map for 40+ widgets. Repo-to-Widget CLI bundler.

### Phase 5 — Enterprise Mesh
- Multi-workspace profiles with isolated switch events
- HoverMind OS capture (Alt+Shift+H arm, simulated region capture → `ai/prompt`)
- Agent mesh router with load tracking and async task completion
- Append-only enterprise audit log (capped at 500 entries, persisted)

### The audio chain
NAW is the clock. TABFRET is the neck. DSP4Guitar is the string and the amp. They share `audio/midi` and nothing else. Full signal path, default voicings, and the Neural Compose round-trip are in [AUDIO-DESK.md](AUDIO-DESK.md).

### Sidecar link
The footer badges **C++ LINKED** and **PY LINKED** are the network analyzer and the FastAPI sidecar, proxied through the dev server. **BUS LIVE** inside Neural is the Phase 1 daemon, a third process. Startup, packet shape, and the composer reply are in [SIDECARS.md](SIDECARS.md).

Phases 7–9 (breakers, hybrid PQC demo, topology) are summarized in [PHASES.md](PHASES.md).

---

## Getting Started

### Prerequisites
- Node.js 20+
- npm or yarn
- Optional: Emscripten (for `make wasm-dsp`), Tauri CLI, Python 3.10+, g++

### Install & Run

```bash
git clone https://github.com/GizzZmo/Omni-Grid-Host
cd Omni-Grid-Host
npm install
npm run dev          # Vite frontend → http://localhost:5173
npm run daemon       # WebSocket bus → ws://127.0.0.1:8765
npm run dev:full     # both
```

### Desktop (Tauri)

```bash
npm install -D @tauri-apps/cli @tauri-apps/api
npm run desktop
```

### DSP WASM (optional)

```bash
make wasm-dsp        # emits public/wasm/dsp4guitar_core.js
```

---

## Widget Development

### Manifest (`omni-extension.json`)

```json
{
  "id": "gizzzmo.category.slug",
  "name": "My Widget",
  "version": "1.0.0",
  "repository": "https://github.com/GizzZmo/MyRepo",
  "category": "NEURAL",
  "isolation": "native-esm",
  "entryPoint": "/plugins/my-widget/index.js",
  "defaultLayout": { "w": 6, "h": 4, "minW": 3, "minH": 3 },
  "crossTalk": {
    "accepts": ["ai/prompt"],
    "emits": ["text/plain"]
  }
}
```

### Widget Component

```tsx
import { OmniWidgetHostProps } from '../../../src/types/plugin-sdk';

export default function MyWidget({ instanceId, bus, manifest }: OmniWidgetHostProps) {
  // Subscribe
  useEffect(() => {
    return bus.subscribe('ai/prompt', (env) => { /* ... */ });
  }, [bus]);

  // Emit
  const send = () => bus.emit('text/plain', { message: 'hello' });

  return <div>...</div>;
}
```

### Register Locally

Add to `src/plugins/index.ts`:

```ts
import MyWidget from '../../public/plugins/my-widget/index';
export const localPluginMap = {
  'gizzzmo.category.slug': MyWidget,
  // ...
};
```

And add the manifest to `src/store/pluginRegistryStore.ts`.

### CLI Bundler

```bash
npm run plugin:bundle -- --repo https://github.com/GizzZmo/TABFRET --category AUDIO
npm run plugin:sync-all
```

The CLI clones, detects stack, scaffolds a manifest, bundles with Vite (or writes a sandboxed iframe), and updates `/public/plugins/registry.json`.

---

## Cross-Talk Event Bus

### MIME Types

| MIME | Direction | Typical Use |
|------|-----------|-------------|
| `ai/prompt` | both | Master-Prompt-Editor ↔ MultiAgentHub |
| `ai/agent-task` | both | Master-Agentic-AI ↔ Ai_shell |
| `audio/midi` | both | TABFRET ↔ DSP4Guitar / NAW |
| `audio/pcm-stream` | both | DSP ↔ Frequalizer |
| `sec/pcap-packet` | both | Network-Analyzer ↔ AutoSec |
| `sec/biometric-auth` | both | Face-Recon ↔ lock |
| `code/patch` | both | autofix ↔ CyberEditor |
| `text/plain` | both | generic |
| `application/json` | both | generic |
| `system/workspace` | emit | Phase 5 workspace switch |

### Usage

```ts
import { crossTalkBus } from './services/crossTalkBus';

// Emit
crossTalkBus.emit('audio/midi', { midiNotes: [60, 64, 67], chordName: 'Cmaj' });

// Subscribe
const unsub = crossTalkBus.subscribe('sec/pcap-packet', (env) => {
  console.log(env.payload);
});

// Drag payload (for Cross-Talk drag-and-drop)
crossTalkBus.createDragPayload(event, instanceId, 'text/plain', payload);
```

Envelopes include `id`, `timestamp`, `sourceWidgetId`, `mimeType`, and `payload`.

---

## Plugin System & CLI

- **Isolation modes**: `native-esm` (trusted, shared React) or `sandboxed-iframe` (MessagePort bridge).
- **Local map**: `src/plugins/index.ts` resolves widgets without network.
- **Dynamic load**: `loadNativePluginComponent` checks the local map first, then dynamic `import()`.
- **Registry sync**: `usePluginRegistry.getState().syncInstalledPlugins()` fetches `/plugins/registry.json`.

---

## Sidecar Daemons

### Node Daemon (`npm run daemon`)
- WebSocket on port 8765
- Process supervisor for `system/spawn` / `system/stop`
- Relays all other messages

### C++ Server (`server/omnigrid_server.cpp`)
- RFC 6455 WebSocket handshake (SHA-1 + Base64)
- Optional libpcap live sniff (`-DHAVE_PCAP`)
- Spawns Python sidecar
- Serves static `dist/`

### Python Sidecar (`server/sidecar/main.py`)
- FastAPI WebSocket endpoints
- Streams Face-Recon, multi-agent, HoverMind telemetry as CrossTalkEnvelope

---

## DSP & AudioWorklet

Signal path:

```
USB Guitar → INPUT Gain (0–4×) → Worklet (Overdrive → Cabinet → Delay) → Analyser → PHONES Gain (0–150%) → Destination
                ↑
TABFRET MIDI ───┘ (Karplus-Strong voices)
```

Files:
- `dsp/dsp4guitar_wasm.cpp` — zero-allocation C++17 core
- `public/worklets/dsp4guitar-worklet.js` — AudioWorklet + JS fallback
- `public/plugins/dsp4guitar/index.tsx` — React widget with presets, device picker, knobs, spectrum

Controls: ARM WASM DSP, Enable Guitar Input, INPUT, PHONES, Tube Drive, Cabinet Tone, Delay Time, Delay Mix.

---

## SecOps & Biometrics

`public/plugins/secops-sentinel/index.tsx`:
- Subscribes to `sec/pcap-packet` → polar radar blips + packet table + KB/s
- Subscribes to `sec/biometric-auth` → lock overlay when operator absent
- Subscribes to `ai/agent-task` → playbook bar
- BLOCK button emits quarantine prompt + iptables rule
- Packets and playbooks are draggable into other widgets

---

## Phase 5 Enterprise Mesh

`public/plugins/phase5-command/index.tsx` + `src/services/phase5.ts`:

- **Workspaces**: Create / switch profiles. Switch emits `system/workspace`.
- **Agent Mesh**: Four default nodes (AUTOSEC_RESPONDER, RESEARCH_ANALYST, CODE_FORGE, HOVERMIND). Route a task; node goes busy then idle; completion emits `ai/agent-task`.
- **HoverMind**: Arm with button or Alt+Shift+H. Simulate capture beams text into `ai/prompt`.
- **Audit Log**: Append-only, persisted, severity-tagged, capped at 500 entries.

---

## Tauri Desktop Host

Skeleton in `src-tauri/`:
- `tauri.conf.json` — app config
- `src/main.rs` — `host_info`, `daemon_set` commands
- Frontend detects desktop via `src/lib/desktop.ts` (`isTauri()`)

Status bar shows “Tauri Desktop” when running inside the webview.

---

## API Reference

### `crossTalkBus`

| Method | Signature | Notes |
|--------|-----------|-------|
| `emit` | `(mime: CrossTalkMimeType, payload: unknown) => void` | Broadcasts envelope |
| `subscribe` | `(mime, cb) => () => void` | Returns unsubscribe |
| `createDragPayload` | `(e, instanceId, mime, payload) => void` | Sets dataTransfer for Cross-Talk drag |
| `bindIframe` | `(instanceId, port: MessagePort) => void` | Sandbox bridge |

### `usePluginRegistry`

| Method | Notes |
|--------|-------|
| `registerManifest(manifest)` | Adds or updates a manifest |
| `spawnWidget(pluginId, coords?)` | Creates an instance, returns instanceId |
| `closeWidget(instanceId)` | Removes instance |
| `syncInstalledPlugins()` | Fetches `/plugins/registry.json` |

### `usePhase5`

| Method | Notes |
|--------|-------|
| `createWorkspace(name, desc?)` | Returns new workspace id |
| `switchWorkspace(id)` | Sets active, emits event, audits |
| `appendAudit(entry)` | Adds audit entry |
| `armHoverMind(bool)` | Arms/disarms OS capture |
| `simulateHoverCapture(region, text)` | Beams capture if armed |
| `routeAgentTask(role, task)` | Routes to mesh, returns taskId |

### `OmniPluginManifest`

```ts
interface OmniPluginManifest {
  id: string;
  name: string;
  version: string;
  repository: string;
  category: WidgetCategory;
  isolation: 'native-esm' | 'sandboxed-iframe';
  entryPoint: string;
  defaultLayout: { w: number; h: number; minW?: number; minH?: number };
  sidecar?: { type: RuntimeSidecarType; endpoint: string; permissions: WidgetPermission[] };
  crossTalk: { accepts: CrossTalkMimeType[]; emits: CrossTalkMimeType[] };
}
```

---

## Project Structure

```
omni-grid-host/
├── src/
│   ├── App.tsx
│   ├── components/          # Grid, Launcher, PluginHost, MatrixRain, StatusBar
│   ├── plugins/index.ts     # Local plugin map
│   ├── services/            # crossTalkBus, sidecarBridge, phase5
│   ├── store/               # pluginRegistryStore
│   ├── types/plugin-sdk.ts
│   └── widgets/             # Built-in widgets
├── public/
│   ├── plugins/             # Widget bundles (dsp4guitar, secops-sentinel, phase5-command, …)
│   └── worklets/            # AudioWorklet processors
├── dsp/                     # C++ DSP sources
├── server/                  # Node daemon, C++ server, Python sidecar
├── scripts/omni-plugin-cli.ts
├── src-tauri/               # Tauri 2 skeleton
├── docs/                    # This documentation set
└── Makefile
```

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Plugin not appearing | Confirm manifest in registry and local map entry |
| AudioWorklet fails | Check console; JS fallback should still run. Compile WASM with `make wasm-dsp` |
| Webcam denied | Grant permission; Face-Recon lock requires it |
| Daemon not connecting | Ensure `npm run daemon` is running and port 8765 is free. Neural stays on `local` until then |
| Footer says C++ OFF or PY OFF | Start `omnigrid_server` so it can spawn Uvicorn. See [SIDECARS.md](SIDECARS.md) |
| NAW plays but TABFRET does not move | Guitar stem muted, those steps are off, or a second NAW is emitting over the first |
| Tauri build fails | Install Rust + Tauri CLI; run `npm run desktop` |
| CLI clone fails | Ensure `git` is available and the repo is public or authenticated |

---

## Further reading

- [OPERATOR-MANUAL.md](OPERATOR-MANUAL.md) — session order and what each badge means
- [TIPS-AND-TRICKS.md](TIPS-AND-TRICKS.md) — the short version, including what not to do
- [AUDIO-DESK.md](AUDIO-DESK.md) — sixteenth-note clock, chord packet, compose round-trip
- [SIDECARS.md](SIDECARS.md) — ports, proxies, packet shape, Python replies
- [GREETINGS.md](GREETINGS.md) — Jon-Arve Constantine, for when the procedure is already known
- [PHASES.md](PHASES.md) — phases 1 through 9
- [ARCHITECTURE.md](ARCHITECTURE.md) — kernel, isolation, the anomaly path
- [WIDGET-DEVELOPMENT.md](WIDGET-DEVELOPMENT.md) — manifest, bus, local map

---

## License & Credits

Built on the Omni-Grid 2.0 chassis by GizzZmo.  
Operator identity used by Face-Recon: Jon-Arve Constantine.  
See original repository: https://github.com/GizzZmo/Omni-Grid-2.0

---

*Last updated: audio desk, sidecar link, and the operator's greetings.*

