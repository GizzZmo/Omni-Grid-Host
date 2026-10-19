/**
 * Example: Registering and using an extension with the SDK
 */

import {
  extensionRegistry,
  omniBus,
  createRuntimeBridge,
  type OmniExtensionManifest,
} from './index';

const dsp4guitar: OmniExtensionManifest = {
  id: 'gizzzmo.audio.dsp4guitar',
  name: 'DSP4Guitar Studio Rack',
  version: '1.0.0',
  category: 'AUDIO',
  description: 'JUCE multi-effect chain as WASM AudioWorklet',
  uiEntry: 'SonicRack',
  runtime: {
    type: 'cpp-wasm',
    binaryOrScript: './bin/dsp4guitar.wasm',
    permissions: ['usb-audio', 'midi'],
  },
  crossTalk: {
    accepts: ['audio/pcm', 'audio/midi'],
    emits: ['audio/pcm'],
  },
};

// Register
extensionRegistry.register(dsp4guitar);

// Grant permissions (normally via UI)
extensionRegistry.grantPermission(dsp4guitar.id, 'usb-audio');
extensionRegistry.grantPermission(dsp4guitar.id, 'midi');

// Create and start runtime
const bridge = createRuntimeBridge(dsp4guitar);
await bridge.start();

// Subscribe to results
omniBus.on('audio/pcm', (payload) => {
  console.log('Received audio buffer from', payload.source, payload.data);
});

// Emit a task
omniBus.emit({
  type: 'audio/midi',
  data: { notes: [60, 64, 67], velocity: 100 },
  source: 'tabfret-widget',
});

// Send directly to runtime
await bridge.send({
  type: 'audio/pcm',
  data: { buffer: new Float32Array(512) },
  source: 'host',
  timestamp: Date.now(),
  id: 'example-1',
});
