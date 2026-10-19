// src/services/sidecarBridge.ts
import { crossTalkBus } from './crossTalkBus';
import { CrossTalkEnvelope } from '../types/plugin-sdk';

class OmniSidecarBridge {
  private cppSocket: WebSocket | null = null;
  private pySocket: WebSocket | null = null;

  public init(
    cppEndpoint = 'ws://localhost:1234/ipc/pcap-stream',
    pyEndpoint = 'ws://localhost:8001/ws/sidecar'
  ): void {
    this.connectSocket(cppEndpoint, 'CPP');
    this.connectSocket(pyEndpoint, 'PYTHON');

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
    const ws = new WebSocket(url);

    ws.onopen = () => {
      console.info(`[SidecarBridge] Connected to ${label} daemon at ${url}`);
      if (label === 'CPP') this.cppSocket = ws;
      if (label === 'PYTHON') this.pySocket = ws;
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
      const delay = Math.min(1000 * Math.pow(2, retryAttempt), 15000);
      setTimeout(() => this.connectSocket(url, label, retryAttempt + 1), delay);
    };
  }
}

export const sidecarBridge = new OmniSidecarBridge();
