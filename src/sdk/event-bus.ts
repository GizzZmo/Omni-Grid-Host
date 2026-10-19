/**
 * Omni-Grid Cross-Talk Event Bus
 * Typed pub/sub for inter-widget and inter-runtime communication.
 */

import type { CrossTalkPayload, CrossTalkType } from './types';

type Handler<T = unknown> = (payload: CrossTalkPayload<T>) => void;

export class OmniEventBus {
  private handlers = new Map<CrossTalkType | '*', Set<Handler>>();
  private history: CrossTalkPayload[] = [];
  private maxHistory = 100;

  emit<T = unknown>(payload: Omit<CrossTalkPayload<T>, 'timestamp' | 'id'>): CrossTalkPayload<T> {
    const full: CrossTalkPayload<T> = {
      ...payload,
      timestamp: Date.now(),
      id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    };

    this.history.push(full as CrossTalkPayload);
    if (this.history.length > this.maxHistory) this.history.shift();

    // specific type handlers
    this.handlers.get(full.type)?.forEach(h => h(full as CrossTalkPayload));
    // wildcard
    this.handlers.get('*')?.forEach(h => h(full as CrossTalkPayload));

    return full;
  }

  on<T = unknown>(type: CrossTalkType | '*', handler: Handler<T>): () => void {
    if (!this.handlers.has(type)) this.handlers.set(type, new Set());
    this.handlers.get(type)!.add(handler as Handler);

    return () => this.off(type, handler);
  }

  off<T = unknown>(type: CrossTalkType | '*', handler: Handler<T>): void {
    this.handlers.get(type)?.delete(handler as Handler);
  }

  once<T = unknown>(type: CrossTalkType, handler: Handler<T>): () => void {
    const unsub = this.on(type, (payload) => {
      unsub();
      handler(payload as CrossTalkPayload<T>);
    });
    return unsub;
  }

  getHistory(filter?: { type?: CrossTalkType; source?: string; limit?: number }): CrossTalkPayload[] {
    let result = [...this.history];
    if (filter?.type) result = result.filter(p => p.type === filter.type);
    if (filter?.source) result = result.filter(p => p.source === filter.source);
    if (filter?.limit) result = result.slice(-filter.limit);
    return result;
  }

  clearHistory(): void {
    this.history = [];
  }
}

export const omniBus = new OmniEventBus();
