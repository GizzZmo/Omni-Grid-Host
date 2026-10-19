/**
 * Omni-Grid Host SDK — Core Types
 * Full type system for the Polyglot Microkernel Desktop Host.
 */

export type ExtensionCategory =
  | 'NEURAL'
  | 'AUDIO'
  | 'SECOPS'
  | 'DEV'
  | 'FINANCE'
  | 'CREATIVE'
  | 'SYSTEM';

export type RuntimeType =
  | 'cpp-wasm'
  | 'cpp-daemon'
  | 'python-worker'
  | 'node-worker'
  | 'rust-native';

export type Permission =
  | 'usb-audio'
  | 'midi'
  | 'webcam'
  | 'pcap-net'
  | 'shell'
  | 'filesystem'
  | 'clipboard'
  | 'notifications'
  | 'screen-capture';

export type CrossTalkType =
  | 'audio/pcm'
  | 'audio/midi'
  | 'audio/stems'
  | 'sec/pcap-stream'
  | 'sec/alert'
  | 'sec/blocklist'
  | 'ai/prompt'
  | 'ai/agent-task'
  | 'ai/agent-result'
  | 'code/ast'
  | 'code/diff'
  | 'git/patch'
  | 'git/status'
  | 'text/plain'
  | 'application/json'
  | string; // allow custom

export interface OmniExtensionManifest {
  id: string; // e.g. "gizzzmo.audio.dsp4guitar"
  name: string;
  version: string;
  category: ExtensionCategory;
  description: string;
  author?: string;
  uiEntry: string; // React component name or path
  icon?: string;

  runtime?: {
    type: RuntimeType;
    binaryOrScript: string;
    entrypoint?: string;
    permissions: Permission[];
    env?: Record<string, string>;
    restartPolicy?: 'never' | 'on-failure' | 'always';
  };

  crossTalk: {
    accepts: CrossTalkType[];
    emits: CrossTalkType[];
  };

  /** Optional schema for validation of payloads */
  schemas?: Record<string, object>;

  /** Minimum host version required */
  minHostVersion?: string;
}

export interface WidgetLayout {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  static?: boolean;
}

export interface CrossTalkPayload<T = unknown> {
  type: CrossTalkType;
  data: T;
  source: string; // extension or widget id
  target?: string; // optional directed message
  timestamp: number;
  id: string;
}

export interface ExtensionRegistration {
  manifest: OmniExtensionManifest;
  status: 'registered' | 'loaded' | 'running' | 'error' | 'stopped';
  error?: string;
  pid?: number;
}

export interface RuntimeBridge {
  start(): Promise<void>;
  stop(): Promise<void>;
  send(payload: CrossTalkPayload): Promise<void>;
  onMessage(handler: (payload: CrossTalkPayload) => void): void;
  health(): Promise<'healthy' | 'unhealthy' | 'unknown'>;
}

export interface PermissionGrant {
  extensionId: string;
  permission: Permission;
  granted: boolean;
  grantedAt?: number;
  scope?: 'session' | 'persistent';
}

export interface OmniHostConfig {
  version: string;
  busEndpoint?: string; // ws://localhost:8765
  pythonSidecarPort?: number;
  allowedOrigins?: string[];
  debug?: boolean;
}
