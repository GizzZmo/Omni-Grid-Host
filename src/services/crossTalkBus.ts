// src/services/crossTalkBus.ts
import {
  CrossTalkClient,
  CrossTalkEnvelope,
  CrossTalkMimeType,
  OmniPluginManifest,
} from '../types/plugin-sdk';

type EnvelopeHandler = (envelope: CrossTalkEnvelope<any>) => void;

class CrossTalkEventBus {
  private listeners = new Map<CrossTalkMimeType, Set<EnvelopeHandler>>();
  private manifests = new Map<string, OmniPluginManifest>();
  private iframePorts = new Map<string, MessagePort>();
  private history: CrossTalkEnvelope[] = [];
  private readonly MAX_HISTORY = 100;

  public registerInstance(instanceId: string, manifest: OmniPluginManifest): CrossTalkClient {
    this.manifests.set(instanceId, manifest);

    return {
      emit: <T>(
        mimeType: CrossTalkMimeType,
        payload: T,
        targetWidgetId: string | '*' = '*',
        transferables?: Transferable[]
      ) => {
        if (!manifest.crossTalk.emits.includes(mimeType)) {
          console.warn(
            `[CrossTalk Security] Widget "${manifest.id}" (${instanceId}) attempted to emit undeclared MIME type: ${mimeType}`
          );
          return;
        }

        const envelope: CrossTalkEnvelope<T> = {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          sourceWidgetId: instanceId,
          targetWidgetId,
          mimeType,
          payload,
          transferables,
        };

        this.dispatch(envelope);
      },

      subscribe: <T>(
        mimeType: CrossTalkMimeType,
        handler: (envelope: CrossTalkEnvelope<T>) => void
      ) => {
        if (!manifest.crossTalk.accepts.includes(mimeType)) {
          console.warn(
            `[CrossTalk Security] Widget "${manifest.id}" (${instanceId}) subscribed to undeclared MIME type: ${mimeType}`
          );
        }

        if (!this.listeners.has(mimeType)) {
          this.listeners.set(mimeType, new Set());
        }
        const wrappedHandler: EnvelopeHandler = (env) => {
          if (env.targetWidgetId === '*' || env.targetWidgetId === instanceId) {
            handler(env);
          }
        };

        this.listeners.get(mimeType)!.add(wrappedHandler);
        return () => {
          this.listeners.get(mimeType)?.delete(wrappedHandler);
        };
      },
    };
  }

  public attachIframePort(instanceId: string, port: MessagePort): void {
    this.iframePorts.set(instanceId, port);
    port.onmessage = (event: MessageEvent<CrossTalkEnvelope>) => {
      const envelope = event.data;
      if (envelope && envelope.mimeType) {
        this.dispatch({ ...envelope, sourceWidgetId: instanceId });
      }
    };
    port.start();
  }

  public unregisterInstance(instanceId: string): void {
    this.manifests.delete(instanceId);
    const port = this.iframePorts.get(instanceId);
    if (port) {
      port.close();
      this.iframePorts.delete(instanceId);
    }
  }

  public dispatch(envelope: CrossTalkEnvelope): void {
    this.history.unshift(envelope);
    if (this.history.length > this.MAX_HISTORY) {
      this.history.pop();
    }

    const handlers = this.listeners.get(envelope.mimeType);
    if (handlers) {
      handlers.forEach((fn) => fn(envelope));
    }

    this.iframePorts.forEach((port, instanceId) => {
      if (instanceId === envelope.sourceWidgetId) return;
      const manifest = this.manifests.get(instanceId);
      if (!manifest?.crossTalk.accepts.includes(envelope.mimeType)) return;

      if (envelope.targetWidgetId === '*' || envelope.targetWidgetId === instanceId) {
        port.postMessage(envelope, envelope.transferables ?? []);
      }
    });
  }

  public createDragPayload<T>(
    e: React.DragEvent,
    sourceWidgetId: string,
    mimeType: CrossTalkMimeType,
    payload: T
  ): void {
    const envelope: CrossTalkEnvelope<T> = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      sourceWidgetId,
      mimeType,
      payload,
    };
    e.dataTransfer.setData('application/x-omnigrid-crosstalk', JSON.stringify(envelope));
    e.dataTransfer.effectAllowed = 'copyMove';
  }

  public parseDropPayload(e: React.DragEvent, targetWidgetId: string): CrossTalkEnvelope | null {
    const raw = e.dataTransfer.getData('application/x-omnigrid-crosstalk');
    if (!raw) return null;
    try {
      const envelope: CrossTalkEnvelope = JSON.parse(raw);
      const routedEnvelope = { ...envelope, targetWidgetId };
      this.dispatch(routedEnvelope);
      return routedEnvelope;
    } catch {
      return null;
    }
  }

  public getHistory(limit = 20): CrossTalkEnvelope[] {
    return this.history.slice(0, limit);
  }
}

export const crossTalkBus = new CrossTalkEventBus();
