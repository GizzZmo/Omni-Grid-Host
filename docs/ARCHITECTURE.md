# Architecture Deep Dive

## Polyglot Microkernel Model

Omni-Grid Host is a microkernel: the React shell is the kernel, widgets are user-space processes, and sidecars are device drivers. Communication is message-passing via the Cross-Talk bus.

### Kernel Responsibilities
- Render the Bento grid and plugin hosts
- Enforce permission checks on Cross-Talk emit/subscribe
- Persist layouts and manifests
- Bridge native sidecars into the bus

### User-Space (Widgets)
- Self-contained React components
- Declare accepted/emitted MIME types in the manifest
- Native ESM or sandboxed iframe

### Device Drivers (Sidecars)
- C++17 WebSocket server
- Python FastAPI
- WASM AudioWorklet
- Tauri OS integration

## Isolation & Security

| Mode | Trust | Mechanism |
|------|-------|-----------|
| native-esm | High | Dynamic import, shared React |
| sandboxed-iframe | Low | iframe + MessagePort |

## Data Flow: High-Anomaly Packet

1. C++ pcap emits sec/pcap-packet
2. sidecarBridge dispatches to crossTalkBus
3. SecOps Sentinel updates radar
4. High anomaly forwarded to Python agent
5. Agent emits ai/agent-task with iptables rule
6. Operator quarantines or drags playbook
7. Phase 5 audit records the action

## Persistence

- useOmniStore → omni-grid-storage
- usePluginRegistry → omnigrid-plugin-registry-v2
- usePhase5 → omnigrid-phase5-v1
