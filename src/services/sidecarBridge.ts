// src/services/sidecarBridge.ts
import { crossTalkBus } from './crossTalkBus';
import { CrossTalkEnvelope } from '../types/plugin-sdk';
import { linkSidecarEndpoint } from '../lib/sidecars';

export interface SidecarLinkState {
  cpp: boolean;
  python: boolean;
}

type LinkListener = (state: SidecarLinkState) => void;

class OmniSidecarBridge {
  private cppSocket: WebSocket | null = null;
  private pySocket: WebSocket | null = null;
  private link: SidecarLinkState = { cpp: false, python: false };
  private linkListeners = new Set<LinkListener>();
  private started = false;

  public getLinkState(): SidecarLinkState {
    return this.link;
  }

  public onLink(listener: LinkListener): () => void {
    this.linkListeners.add(listener);
    listener(this.link);
    return () => this.linkListeners.delete(listener);
  }

  private setLink(patch: Partial<SidecarLinkState>): void {
    this.link = { ...this.link, ...patch };
    this.linkListeners.forEach((fn) => fn(this.link));
  }

  public init(
    cppEndpoint = 'ws://localhost:1234/ipc/pcap-stream',
    pyEndpoint = 'ws://localhost:8001/ws/sidecar'
  ): void {
    if (this.started || typeof window === 'undefined') return;
    this.started = true;

    this.connectSocket(linkSidecarEndpoint(cppEndpoint), 'CPP');
    this.connectSocket(linkSidecarEndpoint(pyEndpoint), 'PYTHON');

    crossTalkBus
      .registerInstance('system.sidecar.bridge', {
        id: 'system.sidecar.bridge',
        name: 'Sidecar Bridge',
        version: '2.0.0',
        repository: 'local',
        category: 'SYSTEM',
        isolation: 'native-esm',
        entryPoint: '',
        defaultLayout: { w: 1, h: 1 },
        crossTalk: {
          accepts: ['ai/prompt', 'ai/agent-task', 'sec/pcap-packet'],
          emits: ['sec/pcap-packet', 'sec/biometric-auth', 'ai/agent-task'],
        },
      })
      .subscribe('ai/prompt', (envelope) => {
        if (this.pySocket?.readyState === WebSocket.OPEN) {
          this.pySocket.send(JSON.stringify(envelope));
        }
      });
  }

  private connectSocket(url: string, label: 'CPP' | 'PYTHON', retryAttempt = 0): void {
    let ws: WebSocket;
    try {
      ws = new WebSocket(url);
    } catch {
      const delay = Math.min(1000 * Math.pow(2, retryAttempt), 15000);
      setTimeout(() => this.connectSocket(url, label, retryAttempt + 1), delay);
      return;
    }

    ws.onopen = () => {
      console.info(`[SidecarBridge] Linked ${label} at ${url}`);
      if (label === 'CPP') {
        this.cppSocket = ws;
        this.setLink({ cpp: true });
      } else {
        this.pySocket = ws;
        this.setLink({ python: true });
      }
    };

    ws.onmessage = (event: MessageEvent<string>) => {
      try {
        const envelope: CrossTalkEnvelope = JSON.parse(event.data);
        if (envelope && envelope.mimeType) {
          crossTalkBus.dispatch(envelope);

          if (
            label === 'CPP' &&
            envelope.mimeType === 'sec/pcap-packet' &&
            (envelope.payload as { anomalyScore?: number })?.anomalyScore! > 0.85 &&
            this.pySocket?.readyState === WebSocket.OPEN
          ) {
            this.pySocket.send(event.data);
          }
        }
      } catch (err) {
        console.warn(`[SidecarBridge] Malformed frame from ${label}:`, err);
      }
    };

    ws.onclose = () => {
      if (label === 'CPP') this.setLink({ cpp: false });
      else this.setLink({ python: false });
      const delay = Math.min(1000 * Math.pow(2, retryAttempt), 15000);
      setTimeout(() => this.connectSocket(url, label, retryAttempt + 1), delay);
    };
  }
}

export const sidecarBridge = new OmniSidecarBridge();
