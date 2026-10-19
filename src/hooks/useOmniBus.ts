/**
 * Live bus client for the Phase 1 daemon.
 * Widgets use this to send/receive Cross-Talk over WebSocket.
 */

import { useEffect, useRef, useState, useCallback } from 'react';

const ENDPOINT = 'ws://127.0.0.1:8765';

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
    let ws: WebSocket;
    let retry: number;

    const connect = () => {
      try {
        ws = new WebSocket(ENDPOINT);
        wsRef.current = ws;

        ws.onopen = () => setConnected(true);
        ws.onclose = () => {
          setConnected(false);
          retry = window.setTimeout(connect, 2000);
        };
        ws.onerror = () => ws.close();
        ws.onmessage = (ev) => {
          try {
            const msg = JSON.parse(ev.data) as BusMessage;
            setLastMessage(msg);
          } catch {
            /* ignore */
          }
        };
      } catch {
        retry = window.setTimeout(connect, 2000);
      }
    };

    connect();
    return () => {
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
