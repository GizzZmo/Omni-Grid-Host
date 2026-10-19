export interface OmniExtensionManifest {
  id: string;
  name: string;
  category: 'NEURAL' | 'AUDIO' | 'SECOPS' | 'DEV' | 'FINANCE' | 'CREATIVE' | 'SYSTEM';
  uiEntry: string;
  runtime?: {
    type: 'cpp-wasm' | 'cpp-daemon' | 'python-worker' | 'node-worker';
    binaryOrScript: string;
    permissions: ('usb-audio' | 'midi' | 'webcam' | 'pcap-net' | 'shell' | 'filesystem')[];
  };
  crossTalk: {
    accepts: string[];
    emits: string[];
  };
  description: string;
}

export interface WidgetLayout {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

export interface CrossTalkPayload {
  type: string;
  data: any;
  source: string;
  timestamp: number;
}

export type WidgetId = string;
