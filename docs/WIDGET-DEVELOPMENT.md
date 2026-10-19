# Widget Development Guide

## Quick Start
1. Create public/plugins/my-widget/index.tsx
2. Create omni-extension.json
3. Add to src/plugins/index.ts
4. Add manifest to pluginRegistryStore
5. Spawn from PluginLauncher

## Component Contract
Default export receives OmniWidgetHostProps (instanceId, manifest, bus, sidecarSocket?).

## Cross-Talk
- Subscribe: bus.subscribe(mime, cb)
- Emit: bus.emit(mime, payload)
- Drag: crossTalkBus.createDragPayload(e, instanceId, mime, payload)

## Isolation
- native-esm for trusted high-FPS widgets
- sandboxed-iframe for untrusted code (MessagePort)

## CLI
```bash
npm run plugin:bundle -- --repo ../MyRepo --category DEV
```
