// src/types/plugin-sdk.ts

export type WidgetCategory =
  | 'NEURAL'
  | 'AUDIO'
  | 'SECOPS'
  | 'DEV'
  | 'FINANCE'
  | 'CREATIVE'
  | 'SYSTEM';

export type CrossTalkMimeType =
  | 'ai/prompt'
  | 'ai/agent-task'
  | 'audio/midi'
  | 'audio/pcm-stream'
  | 'sec/pcap-packet'
  | 'sec/biometric-auth'
  | 'code/patch'
  | 'text/plain'
  | 'application/json';

export interface CrossTalkEnvelope<T = unknown> {
  id: string;
  timestamp: number;
  sourceWidgetId: string;
  targetWidgetId?: string | '*';
  mimeType: CrossTalkMimeType;
  payload: T;
  transferables?: Transferable[];
}

export type RuntimeSidecarType =
  | 'none'
  | 'cpp-wasm'
  | 'cpp-daemon'
  | 'python-sidecar'
  | 'node-worker';

export type WidgetPermission =
  | 'usb-audio'
  | 'web-midi'
  | 'webcam'
  | 'pcap-net'
  | 'shell-exec'
  | 'fs-local'
  | 'gemini-api';

export interface OmniPluginManifest {
  id: string;
  name: string;
  version: string;
  repository: string;
  category: WidgetCategory;
  isolation: 'native-esm' | 'sandboxed-iframe';
  entryPoint: string;
  defaultLayout: {
    w: number;
    h: number;
    minW?: number;
    minH?: number;
  };
  sidecar?: {
    type: RuntimeSidecarType;
    endpoint: string;
    permissions: WidgetPermission[];
  };
  crossTalk: {
    accepts: CrossTalkMimeType[];
    emits: CrossTalkMimeType[];
  };
}

export interface OmniWidgetHostProps {
  instanceId: string;
  manifest: OmniPluginManifest;
  bus: CrossTalkClient;
  sidecarSocket?: WebSocket;
}

export interface CrossTalkClient {
  emit: <T>(
    mimeType: CrossTalkMimeType,
    payload: T,
    targetWidgetId?: string | '*',
    transferables?: Transferable[]
  ) => void;
  subscribe: <T>(
    mimeType: CrossTalkMimeType,
    handler: (envelope: CrossTalkEnvelope<T>) => void
  ) => () => void;
}
