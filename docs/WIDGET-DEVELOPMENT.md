# Widget Development Guide

> "A widget with no Cross-Talk contract is a poster. Pretty, and mute."  
> — Jon-Arve Constantine

Before you add a tile, skim [TIPS-AND-TRICKS.md](TIPS-AND-TRICKS.md) for how operators actually spawn, resize, and misunderstand widgets. The contract below is how you stop that from being your fault.

## Quick Start

1. Create `public/plugins/my-widget/index.tsx`
2. Create `public/plugins/my-widget/omni-extension.json`
3. Add to `src/plugins/index.ts` local map
4. Add manifest to `src/store/pluginRegistryStore.ts`
5. Spawn from the PluginLauncher

## Component Contract

Your default export receives `OmniWidgetHostProps`:

```ts
interface OmniWidgetHostProps {
  instanceId: string;
  manifest: OmniPluginManifest;
  bus: typeof crossTalkBus;
  sidecarSocket?: WebSocket;
}
```

## Cross-Talk Patterns

### Subscribe on mount

```tsx
useEffect(() => {
  const unsub = bus.subscribe('audio/midi', (env) => {
    // env.payload is typed if you supply a generic
  });
  return unsub;
}, [bus]);
```

### Emit

```tsx
bus.emit('text/plain', { message: 'from my widget' });
```

### Drag-and-drop payload

```tsx
<div
  draggable
  onDragStart={(e) => crossTalkBus.createDragPayload(e, instanceId, 'sec/pcap-packet', pkt)}
>
  ...
</div>
```

## Isolation

- Use `native-esm` for widgets you control and that need high FPS or direct React context.
- Use `sandboxed-iframe` for community or untrusted code. The host injects a MessagePort; your iframe script should listen for `OMNIGRID_INIT_PORT`.

## Sidecar Access

If your manifest declares a sidecar, the host may pass `sidecarSocket`. Prefer Cross-Talk for all inter-widget communication; use the socket only for raw hardware streams.

## Styling

Use Tailwind. The shell provides a dark cyberpunk base (`bg-slate-950`, cyan/emerald/rose accents). Keep widgets self-contained; avoid global CSS that leaks.

## Testing

- Run `npm run dev` and spawn the widget.
- Emit synthetic events from another widget or the browser console:
  ```js
  crossTalkBus.emit('sec/pcap-packet', { srcIp: '1.2.3.4', dstIp: '10.0.0.1', protocol: 'TCP', bytes: 128, anomalyScore: 0.9 });
  ```

## CLI Alternative

```bash
npm run plugin:bundle -- --repo ../MyLocalRepo --category DEV
```

This generates the manifest, bundles, and updates the registry for you.
