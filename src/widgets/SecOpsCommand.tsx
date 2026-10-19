import { useEffect, useRef, useState } from 'react';
import { Shield, Camera, AlertTriangle } from 'lucide-react';
import { useOmniBus } from '../hooks/useOmniBus';
import { useOmniStore } from '../store';

interface Alert {
  id: string;
  type: string;
  msg: string;
  ts: number;
}

export function SecOpsCommand() {
  const { connected, send, lastMessage } = useOmniBus('secops');
  const setLocked = useOmniStore(s => s.setLocked);
  const locked = useOmniStore(s => s.locked);

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [cameraOn, setCameraOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Collect sec/* events from the bus
  useEffect(() => {
    if (!lastMessage) return;
    if (lastMessage.type?.startsWith('sec/')) {
      setAlerts(prev => [
        {
          id: lastMessage.id || String(Date.now()),
          type: lastMessage.type,
          msg: lastMessage.data?.anomaly || lastMessage.data?.msg || JSON.stringify(lastMessage.data || {}),
          ts: lastMessage.timestamp || Date.now(),
        },
        ...prev.slice(0, 8),
      ]);
    }
  }, [lastMessage]);

  const toggleLock = async () => {
    if (!locked) {
      // try to open camera for "presence"
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setCameraOn(true);
      } catch {
        setCameraOn(false);
      }
      setLocked(true);
      send('sec/alert', { anomaly: 'biometric lock engaged', severity: 'info' });
    } else {
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      setCameraOn(false);
      setLocked(false);
      send('sec/alert', { anomaly: 'biometric lock released', severity: 'info' });
    }
  };

  const simulatePcap = () => {
    const samples = [
      { anomaly: 'outbound spike to 185.220.101.1', severity: 'high' },
      { anomaly: 'new DNS query for suspicious domain', severity: 'medium' },
      { anomaly: 'port scan detected on :22', severity: 'high' },
      { anomaly: 'large upload (42 MB) to unknown host', severity: 'medium' },
    ];
    const sample = samples[Math.floor(Math.random() * samples.length)];
    send('sec/pcap-stream', sample);
    send('sec/alert', sample);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-red-400">
          <Shield size={16} /> SecOps · Phase 3
        </div>
        <span className={`text-[10px] ${connected ? 'text-green-400' : 'text-red-400'}`}>
          {connected ? 'BUS LIVE' : 'BUS OFFLINE'}
        </span>
      </div>

      {/* biometric */}
      <div className={`p-2 rounded border ${locked ? 'border-red-500 bg-red-900/20' : 'border-green-500/40 bg-green-900/10'}`}>
        <div className="flex items-center justify-between text-xs">
          <span>Face-Recon Lock</span>
          <button onClick={toggleLock} className="px-2 py-0.5 bg-white/10 rounded flex items-center gap-1">
            <Camera size={12} /> {locked ? 'LOCKED' : 'UNLOCK'}
          </button>
        </div>
        {cameraOn && (
          <video ref={videoRef} autoPlay muted playsInline className="mt-2 w-full h-16 object-cover rounded opacity-70" />
        )}
      </div>

      {/* alert feed */}
      <div className="text-[10px] text-red-300/80 flex items-center gap-1">
        <AlertTriangle size={10} /> Live telemetry
      </div>
      <div className="max-h-24 overflow-auto space-y-1 text-[10px] font-mono bg-black/40 p-2 rounded border border-red-500/20">
        {alerts.length === 0 && <div className="text-white/40">no alerts yet</div>}
        {alerts.map(a => (
          <div key={a.id} className="text-red-200/90">
            <span className="text-white/40">{new Date(a.ts).toLocaleTimeString()}</span> {a.type}: {a.msg}
          </div>
        ))}
      </div>

      <button
        onClick={simulatePcap}
        className="px-3 py-1 bg-red-500/30 hover:bg-red-500/50 rounded text-xs"
      >
        Inject pcap Event
      </button>

      <div className="text-[10px] text-white/50">
        Lock blurs the grid. Events arrive over the Phase 1 bus. Next: real libpcap sidecar.
      </div>
    </div>
  );
}
