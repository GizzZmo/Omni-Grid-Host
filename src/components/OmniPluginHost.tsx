// src/components/OmniPluginHost.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  CrossTalkClient,
  OmniPluginManifest,
  OmniWidgetHostProps,
} from '../types/plugin-sdk';
import { crossTalkBus } from '../services/crossTalkBus';
import { linkSidecarEndpoint } from '../lib/sidecars';
import { loadNativePluginComponent } from '../store/pluginRegistryStore';

interface Props {
  instanceId: string;
  manifest: OmniPluginManifest;
  onClose: (instanceId: string) => void;
}

export const OmniPluginHost: React.FC<Props> = ({ instanceId, manifest, onClose }) => {
  const [NativeComponent, setNativeComponent] =
    useState<React.ComponentType<OmniWidgetHostProps> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [sidecarLive, setSidecarLive] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const busClientRef = useRef<CrossTalkClient | null>(null);
  const sidecarWsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const client = crossTalkBus.registerInstance(instanceId, manifest);
    busClientRef.current = client;

    if (manifest.sidecar && manifest.sidecar.endpoint.startsWith('ws://')) {
      let alive = true;
      let retry = 0;
      let ws: WebSocket | null = null;

      const connect = () => {
        if (!alive) return;
        ws = new WebSocket(linkSidecarEndpoint(manifest.sidecar!.endpoint));
        sidecarWsRef.current = ws;
        ws.onopen = () => {
          if (alive) setSidecarLive(true);
        };
        ws.onclose = () => {
          if (!alive) return;
          setSidecarLive(false);
          window.setTimeout(connect, Math.min(1000 * 2 ** retry, 8000));
          retry += 1;
        };
      };
      connect();

      return () => {
        alive = false;
        crossTalkBus.unregisterInstance(instanceId);
        ws?.close();
      };
    }

    return () => {
      crossTalkBus.unregisterInstance(instanceId);
    };
  }, [instanceId, manifest]);

  useEffect(() => {
    if (manifest.isolation !== 'native-esm') return;

    let cancelled = false;
    loadNativePluginComponent(manifest)
      .then((Comp) => {
        if (!cancelled) setNativeComponent(() => Comp);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [manifest]);

  const handleIframeLoad = () => {
    if (manifest.isolation !== 'sandboxed-iframe' || !iframeRef.current?.contentWindow) return;

    const channel = new MessageChannel();
    crossTalkBus.attachIframePort(instanceId, channel.port1);

    iframeRef.current.contentWindow.postMessage(
      {
        type: 'OMNIGRID_INIT_PORT',
        instanceId,
        manifest,
      },
      '*',
      [channel.port2]
    );
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('application/x-omnigrid-crosstalk')) {
      e.preventDefault();
      setIsDragOver(true);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    crossTalkBus.parseDropPayload(e, instanceId);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      className={`relative flex flex-col w-full h-full rounded-xl bg-slate-950/90 border transition-all overflow-hidden ${
        isDragOver
          ? 'border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.45)]'
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      <div className="widget-drag flex items-center justify-between px-3 py-1.5 bg-slate-900/80 border-b border-slate-800 text-xs font-mono select-none cursor-move [.grid-locked_&]:cursor-default">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-200 font-semibold tracking-wider">{manifest.name}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400">
            {manifest.category}
          </span>
          {manifest.sidecar && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
              sidecarLive
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/40'
                : 'bg-purple-950/80 text-purple-300 border-purple-700/40'
            }`}>
              {sidecarLive ? 'SIDECAR LINKED' : manifest.sidecar.type}
            </span>
          )}
        </div>
        <button
          onClick={() => onClose(instanceId)}
          className="text-slate-500 hover:text-rose-400 transition-colors px-1"
          title="Terminate Widget"
        >
          ✕
        </button>
      </div>

      <div className="relative flex-1 w-full h-full overflow-auto">
        {error && (
          <div className="p-4 text-xs font-mono text-rose-400 bg-rose-950/30">
            [PLUGIN FAULT] {error}
          </div>
        )}

        {manifest.isolation === 'native-esm' && NativeComponent && busClientRef.current && (
          <NativeComponent
            instanceId={instanceId}
            manifest={manifest}
            bus={busClientRef.current}
            sidecarSocket={sidecarWsRef.current ?? undefined}
          />
        )}

        {manifest.isolation === 'sandboxed-iframe' && (
          <iframe
            ref={iframeRef}
            src={manifest.entryPoint}
            onLoad={handleIframeLoad}
            title={manifest.name}
            sandbox="allow-scripts allow-forms"
            className="w-full h-full border-0 bg-transparent"
          />
        )}
      </div>
    </div>
  );
};
