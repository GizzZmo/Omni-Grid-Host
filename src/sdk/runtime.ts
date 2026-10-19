/**
 * Runtime Bridge Interfaces & Factories
 * Abstract adapters for Python, C++, WASM, Node, and Rust workers.
 */

import type { RuntimeBridge, CrossTalkPayload, RuntimeType, OmniExtensionManifest } from './types';
import { omniBus } from './event-bus';

export abstract class BaseRuntimeBridge implements RuntimeBridge {
  protected handlers: ((payload: CrossTalkPayload) => void)[] = [];

  abstract start(): Promise<void>;
  abstract stop(): Promise<void>;
  abstract send(payload: CrossTalkPayload): Promise<void>;

  onMessage(handler: (payload: CrossTalkPayload) => void): void {
    this.handlers.push(handler);
  }

  protected notify(payload: CrossTalkPayload): void {
    this.handlers.forEach(h => h(payload));
    omniBus.emit(payload);
  }

  async health(): Promise<'healthy' | 'unhealthy' | 'unknown'> {
    return 'unknown';
  }
}

/** Mock / development bridge that echoes messages */
export class MockRuntimeBridge extends BaseRuntimeBridge {
  private running = false;

  async start(): Promise<void> {
    this.running = true;
    console.log('[MockRuntime] started');
  }

  async stop(): Promise<void> {
    this.running = false;
  }

  async send(payload: CrossTalkPayload): Promise<void> {
    if (!this.running) throw new Error('Bridge not started');
    // Echo with result
    setTimeout(() => {
      this.notify({
        ...payload,
        type: payload.type.replace(/task$/, 'result') as any,
        source: 'runtime',
        data: { echo: payload.data, status: 'ok' },
        timestamp: Date.now(),
        id: crypto.randomUUID?.() ?? 'mock-' + Date.now(),
      });
    }, 120);
  }
}

/** WebSocket bridge for external daemons (Python FastAPI, C++ server, etc.) */
export class WebSocketRuntimeBridge extends BaseRuntimeBridge {
  private ws: WebSocket | null = null;

  constructor(private endpoint: string) {
    super();
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.endpoint);
      this.ws.onopen = () => resolve();
      this.ws.onerror = () => reject(new Error('WebSocket failed'));
      this.ws.onmessage = (ev) => {
        try {
          const payload = JSON.parse(ev.data) as CrossTalkPayload;
          this.notify(payload);
        } catch {
          /* ignore non-json */
        }
      };
    });
  }

  async stop(): Promise<void> {
    this.ws?.close();
    this.ws = null;
  }

  async send(payload: CrossTalkPayload): Promise<void> {
    if (this.ws?.readyState !== WebSocket.OPEN) throw new Error('WebSocket not open');
    this.ws.send(JSON.stringify(payload));
  }
}

export function createRuntimeBridge(
  manifest: OmniExtensionManifest,
  options?: { endpoint?: string }
): RuntimeBridge {
  const type: RuntimeType = manifest.runtime?.type ?? 'node-worker';

  switch (type) {
    case 'python-worker':
    case 'cpp-daemon':
    case 'rust-native':
      return new WebSocketRuntimeBridge(options?.endpoint ?? 'ws://localhost:8765');
    case 'cpp-wasm':
    case 'node-worker':
    default:
      return new MockRuntimeBridge();
  }
}
