# Architecture Deep Dive

> "LINKED is not a mood. It means the wire is actually live."  
> — Jon-Arve Constantine

How the wires behave in practice: [SIDECARS.md](SIDECARS.md). How a person uses them: [OPERATOR-MANUAL.md](OPERATOR-MANUAL.md).

## Polyglot Microkernel Model

Omni-Grid Host is a microkernel: the React shell is the kernel, widgets are user-space processes, and sidecars are device drivers. Communication is message-passing via the Cross-Talk bus.

### Kernel Responsibilities
- Render the Bento grid and plugin hosts
- Enforce permission checks on Cross-Talk emit/subscribe
- Persist layouts and manifests (Zustand + localStorage)
- Bridge native sidecars into the bus

### User-Space (Widgets)
- Self-contained React components
- Declare accepted/emitted MIME types in the manifest
- May be native ESM (shared React) or sandboxed iframe (MessagePort)

### Device Drivers (Sidecars)
- C++17 WebSocket server: static assets, pcap, process spawn
- Python FastAPI: CV, multi-agent, HoverMind
- WASM AudioWorklet: real-time DSP
- Tauri: OS integration (future: global hotkeys, file dialogs)

## Isolation & Security

| Mode | Trust | Mechanism |
|------|-------|-----------|
| `native-esm` | High (local map or `/plugins/`) | Dynamic import, shared React |
| `sandboxed-iframe` | Low (community) | iframe + MessagePort, CSP |

Permission checks happen in `crossTalkBus` before delivery. Untrusted entry points are rejected for native-esm.

## Data Flow Example: High-Anomaly Packet

1. C++ pcap daemon emits `sec/pcap-packet` over WebSocket.
2. `sidecarBridge` receives and calls `crossTalkBus.dispatch`.
3. SecOps Sentinel subscribed to that MIME updates radar and table.
4. If `anomalyScore > 0.85`, bridge forwards the frame to the Python sidecar.
5. Python Master-Agentic-AI drafts an iptables rule and emits `ai/agent-task`.
6. Sentinel displays the playbook; operator clicks BLOCK or drags it to Ai_shell.
7. Phase 5 audit log records the quarantine action.

## Persistence

- Layouts and visible widgets: `useOmniStore` (persist key `omni-grid-storage`)
- Plugin instances: `usePluginRegistry` (persist key `omnigrid-plugin-registry-v2`)
- Phase 5 workspaces/audit: `usePhase5` (persist key `omnigrid-phase5-v1`)

Secrets (API keys) should never be written to the main persist blob; use a vault pattern if needed.

## Performance Notes

- AudioWorklet runs on the real-time audio thread; the C++ core is zero-allocation per block.
- Radar canvas uses requestAnimationFrame; blips fade and are culled.
- Audit log is capped at 500 entries to bound memory.
- Plugin components are cached after first load.
