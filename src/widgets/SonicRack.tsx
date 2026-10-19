import { useEffect, useRef, useState } from 'react';
import { Music, Activity, Play, Square } from 'lucide-react';
import { useOmniBus } from '../hooks/useOmniBus';

export function SonicRack() {
  const { connected, send } = useOmniBus('sonic');
  const [running, setRunning] = useState(false);
  const [gain, setGain] = useState(0.8);
  const [cutoff, setCutoff] = useState(0.5);
  const [meter, setMeter] = useState(0);
  const ctxRef = useRef<AudioContext | null>(null);
  const nodeRef = useRef<AudioWorkletNode | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);

  const start = async () => {
    if (running) return;
    const ctx = new AudioContext();
    ctxRef.current = ctx;

    await ctx.audioWorklet.addModule('/worklets/omni-dsp-processor.js');
    const dsp = new AudioWorkletNode(ctx, 'omni-dsp');
    nodeRef.current = dsp;

    dsp.port.onmessage = (e) => {
      if (e.data?.type === 'meter') setMeter(e.data.peak);
    };

    // test tone → DSP → destination
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = 220;
    oscRef.current = osc;

    osc.connect(dsp);
    dsp.connect(ctx.destination);
    osc.start();

    setRunning(true);
    send('audio/pcm', { event: 'dsp-started', worklet: 'omni-dsp' });
  };

  const stop = () => {
    oscRef.current?.stop();
    oscRef.current = null;
    nodeRef.current?.disconnect();
    ctxRef.current?.close();
    ctxRef.current = null;
    nodeRef.current = null;
    setRunning(false);
    setMeter(0);
    send('audio/pcm', { event: 'dsp-stopped' });
  };

  useEffect(() => {
    nodeRef.current?.port.postMessage({ type: 'gain', value: gain });
  }, [gain]);

  useEffect(() => {
    nodeRef.current?.port.postMessage({ type: 'cutoff', value: cutoff });
  }, [cutoff]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-green-400">
          <Music size={16} /> Sonic Rack · Phase 2 WASM DSP
        </div>
        <span className={`text-[10px] ${connected ? 'text-green-400' : 'text-red-400'}`}>
          {connected ? 'BUS LIVE' : 'BUS OFFLINE'}
        </span>
      </div>

      {/* meter */}
      <div className="h-6 bg-black/50 rounded border border-green-500/30 overflow-hidden">
        <div
          className="h-full bg-green-400/70 transition-all duration-75"
          style={{ width: `${Math.min(100, meter * 100)}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <label className="flex flex-col gap-1">
          Gain
          <input
            type="range" min="0" max="2" step="0.01"
            value={gain}
            onChange={e => setGain(Number(e.target.value))}
            className="accent-green-400"
          />
        </label>
        <label className="flex flex-col gap-1">
          Cutoff
          <input
            type="range" min="0.01" max="1" step="0.01"
            value={cutoff}
            onChange={e => setCutoff(Number(e.target.value))}
            className="accent-green-400"
          />
        </label>
      </div>

      <div className="flex gap-2">
        {!running ? (
          <button onClick={start} className="px-3 py-1 bg-green-500/40 hover:bg-green-500/60 rounded text-xs flex items-center gap-1">
            <Play size={12} /> Start DSP
          </button>
        ) : (
          <button onClick={stop} className="px-3 py-1 bg-red-500/40 hover:bg-red-500/60 rounded text-xs flex items-center gap-1">
            <Square size={12} /> Stop
          </button>
        )}
        <button
          onClick={() => send('audio/pcm', { stems: 4, gain, cutoff })}
          className="px-3 py-1 bg-green-500/20 hover:bg-green-500/40 rounded text-xs flex items-center gap-1"
        >
          <Activity size={12} /> Emit Buffer
        </button>
      </div>

      <div className="text-[10px] text-white/50">
        AudioWorklet processor (gain + one-pole LPF). Next: Emscripten port of DSP4Guitar core.
      </div>
    </div>
  );
}
