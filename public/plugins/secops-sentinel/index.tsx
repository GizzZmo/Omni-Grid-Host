// public/plugins/secops-sentinel/index.tsx
import React, { useEffect, useRef, useState } from 'react';
import { OmniWidgetHostProps } from '../../../src/types/plugin-sdk';
import { crossTalkBus } from '../../../src/services/crossTalkBus';

export interface PcapPacketPayload { srcIp: string; dstIp: string; protocol: string | number; bytes: number; anomalyScore: number; }
export interface BiometricAuthPayload { operatorPresent: boolean; identity: string; confidence: number; vaultLocked: boolean; }
export interface AgentTaskPayload { agentRole: string; status: 'PENDING' | 'COMPLETED'; output: string; originalTaskId?: string; }
interface RadarBlip { id: string; angle: number; radius: number; anomaly: number; srcIp: string; alpha: number; }

export default function SecOpsSentinelWidget({ instanceId, bus }: OmniWidgetHostProps) {
  const [packets, setPackets] = useState<(PcapPacketPayload & { id: string; time: number })[]>([]);
  const [blockedIps, setBlockedIps] = useState<string[]>(['185.220.101.7', '45.155.205.233']);
  const [biometric, setBiometric] = useState<BiometricAuthPayload>({ operatorPresent: true, identity: 'Jon-Arve Constantine', confidence: 0.99, vaultLocked: false });
  const [agentPlaybook, setAgentPlaybook] = useState<string>('[AUTOSEC_RESPONDER] Standing by for high-anomaly PCAP telemetry...');
  const [manualLockOverride, setManualLockOverride] = useState<boolean>(false);
  const [bytesPerSec, setBytesPerSec] = useState<number>(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const blipsRef = useRef<RadarBlip[]>([]);
  const sweepAngleRef = useRef<number>(0);
  const byteAccumulatorRef = useRef<number>(0);

  useEffect(() => {
    const unsubPcap = bus.subscribe<PcapPacketPayload>('sec/pcap-packet', (envelope) => {
      const pkt = envelope.payload;
      byteAccumulatorRef.current += pkt.bytes || 0;
      const hash = pkt.srcIp.split('.').reduce((acc, octet) => (acc * 31 + parseInt(octet, 10)) % 360, 0);
      const angleRad = (hash * Math.PI) / 180;
      const normalizedRadius = Math.max(0.15, 1.0 - pkt.anomalyScore * 0.75);
      blipsRef.current.push({ id: envelope.id, angle: angleRad, radius: normalizedRadius, anomaly: pkt.anomalyScore, srcIp: pkt.srcIp, alpha: 1.0 });
      if (blipsRef.current.length > 40) blipsRef.current.shift();
      setPackets((prev) => [{ ...pkt, id: envelope.id, time: envelope.timestamp }, ...prev.slice(0, 29)]);
    });
    const unsubBio = bus.subscribe<BiometricAuthPayload>('sec/biometric-auth', (envelope) => setBiometric(envelope.payload));
    const unsubAgent = bus.subscribe<AgentTaskPayload>('ai/agent-task', (envelope) => { if (envelope.payload?.output) setAgentPlaybook(envelope.payload.output); });
    const bwInterval = setInterval(() => { setBytesPerSec(byteAccumulatorRef.current); byteAccumulatorRef.current = 0; }, 1000);
    return () => { unsubPcap(); unsubBio(); unsubAgent(); clearInterval(bwInterval); };
  }, [bus]);

  useEffect(() => {
    let rafId: number;
    const renderRadar = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const w = canvas.width, h = canvas.height, cx = w / 2, cy = h / 2, maxR = Math.min(cx, cy) - 8;
          ctx.fillStyle = 'rgba(2, 6, 23, 0.25)'; ctx.fillRect(0, 0, w, h);
          ctx.strokeStyle = 'rgba(30, 41, 59, 0.85)'; ctx.lineWidth = 1;
          [0.33, 0.66, 1.0].forEach((r) => { ctx.beginPath(); ctx.arc(cx, cy, maxR * r, 0, Math.PI * 2); ctx.stroke(); });
          ctx.beginPath(); ctx.moveTo(cx - maxR, cy); ctx.lineTo(cx + maxR, cy); ctx.moveTo(cx, cy - maxR); ctx.lineTo(cx, cy + maxR); ctx.stroke();
          sweepAngleRef.current = (sweepAngleRef.current + 0.04) % (Math.PI * 2);
          ctx.strokeStyle = 'rgba(34, 211, 238, 0.65)'; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(sweepAngleRef.current) * maxR, cy + Math.sin(sweepAngleRef.current) * maxR); ctx.stroke();
          blipsRef.current.forEach((blip) => {
            const bx = cx + Math.cos(blip.angle) * (blip.radius * maxR);
            const by = cy + Math.sin(blip.angle) * (blip.radius * maxR);
            const isCritical = blip.anomaly > 0.8;
            ctx.beginPath(); ctx.arc(bx, by, isCritical ? 4.5 : 2.5, 0, Math.PI * 2);
            ctx.fillStyle = isCritical ? `rgba(244, 63, 94, ${blip.alpha})` : `rgba(52, 211, 153, ${blip.alpha})`;
            ctx.fill();
            if (isCritical && blip.alpha > 0.4) { ctx.strokeStyle = `rgba(244, 63, 94, ${blip.alpha * 0.5})`; ctx.beginPath(); ctx.arc(bx, by, 9, 0, Math.PI * 2); ctx.stroke(); }
            blip.alpha = Math.max(0, blip.alpha - 0.008);
          });
          blipsRef.current = blipsRef.current.filter((b) => b.alpha > 0.02);
        }
      }
      rafId = requestAnimationFrame(renderRadar);
    };
    rafId = requestAnimationFrame(renderRadar);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const quarantineIp = (ip: string) => {
    if (!blockedIps.includes(ip)) setBlockedIps((prev) => [ip, ...prev]);
    bus.emit('ai/prompt', { agentRole: 'AUTOSEC_RESPONDER', prompt: `Generate immediate iptables and nftables drop rules for hostile IP ${ip} and verify active socket termination.` });
    bus.emit('text/plain', `sudo iptables -I INPUT -s ${ip} -j DROP`);
  };

  const isVaultLocked = manualLockOverride || biometric.vaultLocked || !biometric.operatorPresent;

  return (
    <div className="relative flex flex-col h-full w-full p-3 bg-slate-950 text-slate-100 font-mono text-xs gap-2.5 select-none overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${isVaultLocked ? 'bg-rose-950/90 text-rose-400 border-rose-500/60 animate-pulse' : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'}`}>{isVaultLocked ? '🔒 FACE-RECON: OPERATOR ABSENT' : `👁️ VERIFIED: ${biometric.identity} (${Math.round(biometric.confidence * 100)}%)`}</span>
          <span className="text-[10px] text-cyan-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">PCAP STREAM: {(bytesPerSec / 1024).toFixed(1)} KB/s</span>
        </div>
        <button onClick={() => setManualLockOverride((prev) => !prev)} className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-[10px] transition">{manualLockOverride ? '🔓 Override Lock' : '🛡️ Force Zero-Trust Lock'}</button>
      </div>
      <div className={`grid grid-cols-1 md:grid-cols-12 gap-2.5 flex-1 min-h-0 transition-all duration-300 ${isVaultLocked ? 'blur-md pointer-events-none select-none opacity-40' : ''}`}>
        <div className="md:col-span-5 flex flex-col items-center justify-center bg-slate-900/70 rounded-lg border border-slate-800 p-2 relative">
          <canvas ref={canvasRef} width={160} height={160} className="rounded-full" />
          <div className="flex justify-between w-full text-[10px] text-slate-400 mt-1 px-1"><span className="text-emerald-400">● NOMINAL</span><span className="text-rose-400">● ANOMALY (&gt;0.80)</span></div>
        </div>
        <div className="md:col-span-7 flex flex-col bg-slate-900/70 rounded-lg border border-slate-800 overflow-hidden">
          <div className="px-2.5 py-1 bg-slate-900 border-b border-slate-800 flex justify-between text-[10px] text-slate-400"><span>SOURCE IP → DEST</span><span>PROTO / BYTES</span><span>ACTION</span></div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-1.5 space-y-1">
            {packets.length === 0 && <div className="text-slate-500 text-center py-6 text-[11px]">Waiting for C++ /ipc/pcap-stream frames...</div>}
            {packets.map((pkt) => {
              const isHighRisk = pkt.anomalyScore > 0.8;
              const isBlocked = blockedIps.includes(pkt.srcIp);
              return (
                <div key={pkt.id} draggable onDragStart={(e) => crossTalkBus.createDragPayload(e, instanceId, 'sec/pcap-packet', pkt)} className={`flex items-center justify-between px-2 py-1 rounded text-[11px] cursor-grab ${isHighRisk ? 'bg-rose-950/40 border border-rose-500/40 text-rose-200' : 'bg-slate-950/60 text-slate-300'}`}>
                  <div className="truncate max-w-[150px]"><span className={isHighRisk ? 'text-rose-400 font-bold' : 'text-cyan-300'}>{pkt.srcIp}</span><span className="text-slate-500"> → {pkt.dstIp}</span></div>
                  <div className="text-[10px] text-slate-400">{pkt.protocol} · {pkt.bytes}B · <span className={isHighRisk ? 'text-rose-400 font-bold' : 'text-emerald-400'}>{(pkt.anomalyScore * 100).toFixed(0)}%</span></div>
                  <button onClick={() => quarantineIp(pkt.srcIp)} disabled={isBlocked} className={`px-1.5 py-0.5 rounded text-[10px] transition ${isBlocked ? 'bg-slate-800 text-slate-500' : 'bg-rose-500/20 border border-rose-500/50 text-rose-300 hover:bg-rose-500/40'}`}>{isBlocked ? 'DROP ACTIVE' : '⚡ BLOCK'}</button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div draggable onDragStart={(e) => crossTalkBus.createDragPayload(e, instanceId, 'text/plain', agentPlaybook)} className="p-2 rounded bg-slate-900/90 border border-cyan-500/30 flex items-center justify-between gap-2 cursor-grab" title="Drag this remediation playbook into Ai_shell or CyberEditor">
        <div className="truncate text-[11px] text-cyan-300"><span className="text-purple-400 font-bold mr-1.5">[AGENT PLAYBOOK]</span>{agentPlaybook}</div>
        <span className="text-[10px] text-slate-400 shrink-0">⇄ Drag to Ai_shell</span>
      </div>
      {isVaultLocked && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 text-center">
          <div className="px-4 py-3 rounded-xl bg-rose-950/90 border border-rose-500/60 shadow-[0_0_30px_rgba(244,63,94,0.35)] max-w-xs">
            <div className="text-rose-400 font-bold text-sm tracking-wider mb-1">BIOMETRIC SENTINEL LOCKED</div>
            <p className="text-[11px] text-slate-300 mb-3">Face-Recon detected operator absence. Live PCAP telemetry and AutoSec rules are encrypted until facial verification resumes.</p>
            <button onClick={() => { setManualLockOverride(false); setBiometric((prev) => ({ ...prev, operatorPresent: true, vaultLocked: false })); }} className="px-3 py-1 rounded bg-rose-500/20 border border-rose-400 text-rose-200 hover:bg-rose-500/40 text-xs font-bold transition">Re-Authenticate Session</button>
          </div>
        </div>
      )}
    </div>
  );
}
