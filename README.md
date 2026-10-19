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

## Next Evolution Steps (matching blueprint phases)

- **Phase 1**: Replace mock status with real WebSocket router in `omnigrid_server.cpp` + Python FastAPI worker supervisor
- **Phase 2**: Emscripten/CMake WASM AudioWorklet for DSP4Guitar + Frequalizer
- **Phase 3**: Live pcap stream into SecOps tile + Face-Recon webcam lock
- Desktop packaging: Tauri (preferred) or Electron host wrapping this shell

## Files

- `src/types.ts` — OmniExtensionManifest + CrossTalk types
- `src/store.ts` — Zustand local-first store + extension registry
- `src/components/` — Grid, WidgetShell, Launcher, StatusBar
- `src/widgets/` — Live prototypes of the five packs

This is a functional, runnable realization of the unified Omni-Grid Host. Extend any widget or add new manifests to integrate additional repositories.
