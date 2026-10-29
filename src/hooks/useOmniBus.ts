/**
 * Live bus client for the Phase 1 daemon.
 * Widgets use this to send/receive Cross-Talk over WebSocket.
 */

import { useEffect, useRef, useState, useCallback } from 'react';

import { linkSidecarEndpoint } from '../lib/sidecars';

export interface BusMessage {
  type: string;
  source?: string;
  data?: any;
  timestamp?: number;
  id?: string;
}

export function useOmniBus(source: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<BusMessage | null>(null);

  useEffect(() => {
    let ws: WebSocket | undefined;
    let retry: number | undefined;
    let alive = true;
    const endpoint = linkSidecarEndpoint('ws://127.0.0.1:8765');

    const connect = () => {
      if (!alive) return;
      try {
        ws = new WebSocket(endpoint);
        wsRef.current = ws;

        ws.onopen = () => {
          if (alive) setConnected(true);
        };
        ws.onclose = () => {
          if (!alive) return;
          setConnected(false);
          retry = window.setTimeout(connect, 2000);
        };
        ws.onerror = () => ws?.close();
        ws.onmessage = (ev) => {
          try {
            const msg = JSON.parse(ev.data) as BusMessage;
            if (alive) setLastMessage(msg);
          } catch {
            /* ignore */
          }
        };
      } catch {
        if (alive) retry = window.setTimeout(connect, 2000);
      }
    };

    connect();
    return () => {
      alive = false;
      clearTimeout(retry);
      ws?.close();
    };
  }, []);

  const send = useCallback((type: string, data?: any) => {
    const ws = wsRef.current;
    if (ws?.readyState !== WebSocket.OPEN) return false;
    ws.send(JSON.stringify({ type, source, data, timestamp: Date.now() }));
    return true;
  }, [source]);

  const spawn = useCallback((id: string, command: string, args: string[] = []) => {
    return send('system/spawn', { id, command, args });
  }, [send]);

  return { connected, lastMessage, send, spawn };
}
