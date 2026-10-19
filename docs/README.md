# Omni-Grid Host 3.0 — Comprehensive Documentation

**Polyglot Microkernel Desktop Host**  
Repository: https://github.com/GizzZmo/Omni-Grid-Host

Omni-Grid Host unifies the Omni-Grid 2.0 chassis with C++, Python, Rust, and Node workloads into a single local-first command environment.

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

## Overview

Omni-Grid Host is a local-first, privacy-centric super-app shell. Every tool lives as a sandboxed Bento widget. Widgets communicate through a typed Cross-Talk bus. Native workloads run as sidecars and stream events into the same bus.

### Core Principles

- **Local-first**: State persists in the browser. No required cloud.
- **Plugin isolation**: Trusted widgets load as native ESM; untrusted ones load in sandboxed iframes.
- **Cross-Talk**: Typed MIME envelopes with permission checks.
- **Polyglot sidecars**: C++17 daemon, Python FastAPI, Emscripten WASM DSP, Tauri host.
- **Zero-eval**: Dynamic loading uses Vite ESM imports only.

## Architecture

See docs/ARCHITECTURE.md for the full deep dive.

## Phase Roadmap

| Phase | Status | Deliverable |
|-------|--------|-------------|
| 1 | Complete | WebSocket daemon + process supervisor |
| 2 | Complete | DSP4Guitar AudioWorklet + live guitar input |
| 3 | Complete | SecOps Sentinel |
| 4 | Complete | Tauri host + dynamic plugin loader + CLI |
| 5 | Complete | Multi-workspace, HoverMind, agent mesh, audit |

## Getting Started

```bash
git clone https://github.com/GizzZmo/Omni-Grid-Host
cd Omni-Grid-Host
npm install
npm run dev
```

See the full docs for widget development, Cross-Talk MIME types, sidecar details, DSP signal path, SecOps, Phase 5 APIs, and troubleshooting.
