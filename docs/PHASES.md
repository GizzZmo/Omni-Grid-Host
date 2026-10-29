# Phase Roadmap — Omni-Grid Host

## Phase 1 — Sidecar Bridge ✅
**Goal**: Persistent local daemon that can spawn workers and relay events.

- `server/omnigrid-daemon.mjs`: WebSocket server + process supervisor
- Control messages: `system/spawn`, `system/stop`
- All other messages relayed as Cross-Talk
- Health endpoint: `http://127.0.0.1:8765/health`

## Phase 2 — Audio/DSP WebAssembly ✅
**Goal**: Real-time guitar DSP inside the grid with zero native installer for the DSP core.

- C++17 zero-allocation core (overdrive, cabinet, delay, Karplus-Strong)
- Emscripten target (`make wasm-dsp`)
- AudioWorklet processor with JS fallback
- Live USB input, device picker, INPUT and PHONES volume knobs
- Spectrum visualizer and Cross-Talk MIDI subscription

## Phase 3 — SecOps Telemetry ✅
**Goal**: Unify Network-Analyzer, Face-Recon, AutoSec, and Master-Agentic-AI in one tile.

- 60 FPS polar threat radar
- Biometric lock overlay
- One-click IP quarantine + draggable playbook
- Manifest and local registration

## Phase 4 — Desktop Host & Plugin System ✅
**Goal**: Production plugin loading and desktop packaging.

- Tauri 2 skeleton with native commands
- Dynamic plugin loader (no eval)
- Local plugin map for 40+ widgets
- Repo-to-Widget CLI bundler (`scripts/omni-plugin-cli.ts`)
- Registry sync from `/plugins/registry.json`

## Phase 5 — Enterprise Mesh ✅
**Goal**: Multi-workspace isolation, OS context capture, agent orchestration, and auditability.

- Multi-workspace profiles with switch events
- HoverMind OS capture (arm + simulate → `ai/prompt`)
- Agent mesh router with load and async completion
- Enterprise audit log (persisted, capped, severity-tagged)
- Phase 5 Command widget

## Phase 6 — Agent Autonomy & Adaptive Learning ✅
**Goal**: Agents initiate work and improve from outcomes.

- Autonomy mode: idle mesh nodes periodically select and route tasks
- Adaptive weights: per-role/action scores updated by reward signals
- Learning signals: success/fail/neutral with EMA weight updates
- Operator completions also reinforce learning
- Phase 6 Autonomy widget shows weights, signals, and controls

## Phase 7 — Self-Healing and Fault Tolerance ✅
**Goal**: Detect, isolate, and recover from service failures automatically.

- Health probes every 5s
- Circuit breakers (closed / open / half-open)
- Automatic recovery when services are down
- Fault injection and heal controls
- Phase 7 widget

## Phase 8 — Quantum-Resistant Encryption ✅
**Goal**: Hybrid classical + post-quantum cryptography for long-term confidentiality.

- Educational hybrid model: simulated Kyber-style KEM + Dilithium/SPHINCS signatures
- AES-GCM classical layer for payload confidentiality
- Key generation, rotation, encrypt/decrypt, sign/verify
- Audit integration with Phase 5
- Phase 8 widget with algo selector and envelope inspector
- Production path: replace simulation with real Kyber/Dilithium WASM

## Phase 9 — Self-Healing Network ✅
**Goal**: Topology-aware mesh with redundant paths and automatic rerouting.

- Network nodes (core, edge, sidecar) with health and latency
- Redundant links with primary/backup paths
- BFS path finding that skips failed links
- Automatic link healing when endpoints recover
- Manual fail/heal and reroute controls
- Phase 9 widget with topology view and route computation
- Integrates with Phase 5 audit and Phase 7 fault cascade

## Future Directions (Phase 10+)
- Real HoverMind global hotkey + OCR via Tauri
- Signed plugin manifests and trust scoring
- Multi-node mesh (remote sidecars over authenticated WebSocket)
- Encrypted workspace export/import
- Mobile companion (read-only telemetry)

## Where to practice

- Play the chain: [AUDIO-DESK.md](AUDIO-DESK.md)
- Light the sidecars: [SIDECARS.md](SIDECARS.md)
- Daily operation and the mistakes that look like bugs: [TIPS-AND-TRICKS.md](TIPS-AND-TRICKS.md)
- The operator's voice, when you need a line instead of a procedure: [GREETINGS.md](GREETINGS.md)

> "Linked, live, and not on fire. I will take that over a manifesto."  
> — Jon-Arve Constantine

