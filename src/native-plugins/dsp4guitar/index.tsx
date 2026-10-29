// public/plugins/dsp4guitar/index.tsx
import React, { useEffect, useRef, useState } from 'react';
import { OmniWidgetHostProps } from '../../../src/types/plugin-sdk';

interface GuitarPreset {
  name: string;
  drive: number;
  tone: number;
  delayTime: number;
  delayMix: number;
  master: number;
}

const PRESETS: GuitarPreset[] = [
  { name: 'Cyberpunk Lead (High Gain)', drive: 12.5, tone: 0.42, delayTime: 0.375, delayMix: 0.35, master: 0.85 },
  { name: 'Nordic Noir Clean Chorus', drive: 1.8, tone: 0.72, delayTime: 0.45, delayMix: 0.48, master: 0.95 },
  { name: 'Djent 7-String Tight Gate', drive: 18.0, tone: 0.31, delayTime: 0.12, delayMix: 0.08, master: 0.8 },
];

export default function DSP4GuitarWidget({ bus }: OmniWidgetHostProps) {
  const [engineReady, setEngineReady] = useState(false);
  const [liveInputActive, setLiveInputActive] = useState(false);
  const [inputDevices, setInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [inputError, setInputError] = useState<string>('');
  const [inputGain, setInputGain] = useState(1.0);
  const [outputGain, setOutputGain] = useState(0.8);
  const [rmsLevel, setRmsLevel] = useState(0);
  const [lastMidiEvent, setLastMidiEvent] = useState<string>('Waiting for TABFRET / WebMIDI...');
  const [params, setParams] = useState<GuitarPreset>(PRESETS[0]);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const inputGainRef = useRef<GainNode | null>(null);
  const outputGainRef = useRef<GainNode | null>(null);

  const initAudioEngine = async () => {
    if (audioCtxRef.current) return;

    const ctx = new AudioContext({ sampleRate: 48000, latencyHint: 'interactive' });
    await ctx.audioWorklet.addModule('/worklets/dsp4guitar-worklet.js');

    const worklet = new AudioWorkletNode(ctx, 'dsp4guitar-worklet', {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [2],
    });

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;

    const outputGainNode = ctx.createGain();
    outputGainNode.gain.value = outputGain;

    worklet.connect(analyser);
    analyser.connect(outputGainNode);
    outputGainNode.connect(ctx.destination);

    worklet.port.onmessage = (e) => {
      if (e.data?.type === 'TELEMETRY') {
        setRmsLevel(e.data.rms);
      }
    };

    audioCtxRef.current = ctx;
    workletNodeRef.current = worklet;
    analyserRef.current = analyser;
    outputGainRef.current = outputGainNode;
    setEngineReady(true);

    worklet.port.postMessage({ type: 'SET_PARAMS', payload: params });
    startVisualizerLoop();
  };

  // Enumerate audio input devices
  useEffect(() => {
    const loadDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const inputs = devices.filter(d => d.kind === 'audioinput');
        setInputDevices(inputs);
        if (inputs.length && !selectedDeviceId) {
          setSelectedDeviceId(inputs[0].deviceId);
        }
      } catch {
        // Permission not yet granted — devices will appear after first getUserMedia
      }
    };
    loadDevices();
    navigator.mediaDevices.addEventListener('devicechange', loadDevices);
    return () => navigator.mediaDevices.removeEventListener('devicechange', loadDevices);
  }, [selectedDeviceId]);

  const stopLiveInput = () => {
    sourceRef.current?.disconnect();
    sourceRef.current = null;
    inputGainRef.current?.disconnect();
    inputGainRef.current = null;
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setLiveInputActive(false);
    setInputError('');
  };

  const toggleLiveGuitarInput = async () => {
    if (liveInputActive) {
      stopLiveInput();
      return;
    }

    if (!audioCtxRef.current || !workletNodeRef.current) {
      await initAudioEngine();
    }
    const ctx = audioCtxRef.current!;
    const worklet = workletNodeRef.current!;

    if (ctx.state === 'suspended') await ctx.resume();

    try {
      const constraints: MediaStreamConstraints = {
        audio: {
          deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 1,
          sampleRate: 48000,
        },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const micSource = ctx.createMediaStreamSource(stream);
      const gain = ctx.createGain();
      gain.gain.value = inputGain;
      micSource.connect(gain);
      gain.connect(worklet);

      streamRef.current = stream;
      sourceRef.current = micSource;
      inputGainRef.current = gain;
      setLiveInputActive(true);
      setInputError('');

      // Refresh device list now that permission is granted
      const devices = await navigator.mediaDevices.enumerateDevices();
      setInputDevices(devices.filter(d => d.kind === 'audioinput'));
    } catch (err: any) {
      setInputError(err?.message || 'Microphone access denied');
      setLiveInputActive(false);
    }
  };

  useEffect(() => {
    const unsubscribe = bus.subscribe<{
      chordName?: string;
      midiNotes: number[];
      bpm?: number;
    }>('audio/midi', async (envelope) => {
      if (!audioCtxRef.current) {
        await initAudioEngine();
      }
      if (audioCtxRef.current?.state === 'suspended') {
        await audioCtxRef.current.resume();
      }

      setLastMidiEvent(
        `${envelope.payload.chordName || 'MIDI Trigger'} [${envelope.payload.midiNotes.join(', ')}]`
      );

      workletNodeRef.current?.port.postMessage({
        type: 'MIDI_CHORD',
        payload: envelope.payload,
      });
    });

    return () => {
      unsubscribe();
      stopLiveInput();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      audioCtxRef.current?.close();
    };
  }, [bus]);

  const updateParam = <K extends keyof GuitarPreset>(key: K, value: GuitarPreset[K]) => {
    const next = { ...params, [key]: value };
    setParams(next);
    workletNodeRef.current?.port.postMessage({
      type: 'SET_PARAMS',
      payload: next,
    });
  };

  const startVisualizerLoop = () => {
    const freqBins = new Uint8Array(128);
    const render = () => {
      const canvas = canvasRef.current;
      const analyser = analyserRef.current;
      if (canvas && analyser) {
        const ctx2d = canvas.getContext('2d');
        analyser.getByteFrequencyData(freqBins);

        if (ctx2d) {
          ctx2d.fillStyle = '#020617';
          ctx2d.fillRect(0, 0, canvas.width, canvas.height);

          const barWidth = canvas.width / 64;
          for (let i = 0; i < 64; i++) {
            const barHeight = (freqBins[i] / 255) * canvas.height;
            ctx2d.fillStyle = i < 20 ? '#22d3ee' : '#a855f7';
            ctx2d.fillRect(i * barWidth, canvas.height - barHeight, barWidth - 1, barHeight);
          }
        }
      }
      rafRef.current = requestAnimationFrame(render);
    };
    rafRef.current = requestAnimationFrame(render);
  };

  return (
    <div className="flex flex-col h-full p-3 bg-slate-950 text-slate-100 font-mono text-xs gap-3 select-none">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <button
            onClick={initAudioEngine}
            className={`px-2.5 py-1 rounded font-bold transition ${
              engineReady
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                : 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 hover:bg-cyan-500/30'
            }`}
          >
            {engineReady ? 'DSP ONLINE (48kHz)' : 'ARM WASM DSP'}
          </button>

          <button
            onClick={toggleLiveGuitarInput}
            className={`px-2.5 py-1 rounded transition border ${
              liveInputActive
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse'
                : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            {liveInputActive ? 'HI-Z INPUT ACTIVE' : 'Enable Guitar Input'}
          </button>
          {inputDevices.length > 1 && (
            <select
              value={selectedDeviceId}
              onChange={(e) => {
                setSelectedDeviceId(e.target.value);
                if (liveInputActive) {
                  stopLiveInput();
                }
              }}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[10px] text-slate-300 max-w-[140px]"
              title="Audio input device"
            >
              {inputDevices.map(d => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Input ${d.deviceId.slice(0, 6)}`}
                </option>
              ))}
            </select>
          )}
          {inputError && (
            <span className="text-rose-400 text-[10px]">{inputError}</span>
          )}
          {liveInputActive && (
            <label className="flex items-center gap-1.5 bg-slate-900/70 px-2 py-1 rounded border border-slate-800">
              <span className="text-[10px] text-cyan-400">INPUT</span>
              <input
                type="range"
                min="0"
                max="4"
                step="0.05"
                value={inputGain}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setInputGain(v);
                  if (inputGainRef.current) inputGainRef.current.gain.value = v;
                }}
                className="accent-cyan-400 w-20"
                title={`Input gain ${inputGain.toFixed(2)}x`}
              />
              <span className="text-[10px] text-slate-400 w-8">{inputGain.toFixed(1)}x</span>
            </label>
          )}
          <label className="flex items-center gap-1.5 bg-slate-900/70 px-2 py-1 rounded border border-slate-800">
            <span className="text-[10px] text-emerald-400">PHONES</span>
            <input
              type="range"
              min="0"
              max="1.5"
              step="0.01"
              value={outputGain}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                setOutputGain(v);
                if (outputGainRef.current) outputGainRef.current.gain.value = v;
              }}
              className="accent-emerald-400 w-20"
              title={`Output volume ${(outputGain * 100).toFixed(0)}%`}
            />
            <span className="text-[10px] text-slate-400 w-8">{Math.round(outputGain * 100)}%</span>
          </label>
        </div>

        <select
          value={params.name}
          onChange={(e) => {
            const found = PRESETS.find((p) => p.name === e.target.value);
            if (found) {
              setParams(found);
              workletNodeRef.current?.port.postMessage({ type: 'SET_PARAMS', payload: found });
            }
          }}
          className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-cyan-300 text-[11px] max-w-full w-full min-w-0"
        >
          {PRESETS.map((p) => (
            <option key={p.name} value={p.name}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="relative h-20 w-full bg-slate-900/90 rounded border border-slate-800 overflow-hidden">
        <canvas ref={canvasRef} className="block h-full w-full max-w-full" />
        <div className="absolute top-1.5 left-2 text-[10px] text-cyan-400/80">
          CROSS-TALK MIDI: <span className="text-slate-200">{lastMidiEvent}</span>
        </div>
        <div className="absolute bottom-1.5 right-2 text-[10px] text-emerald-400">
          RMS: {(rmsLevel * 100).toFixed(1)}%
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
        <label className="flex flex-col bg-slate-900/70 p-2 rounded border border-slate-800">
          <span className="text-[10px] text-slate-400">TUBE DRIVE ({params.drive.toFixed(1)})</span>
          <input
            type="range"
            min="1"
            max="25"
            step="0.5"
            value={params.drive}
            onChange={(e) => updateParam('drive', parseFloat(e.target.value))}
            className="accent-cyan-400 mt-1"
          />
        </label>

        <label className="flex flex-col bg-slate-900/70 p-2 rounded border border-slate-800">
          <span className="text-[10px] text-slate-400">CABINET TONE ({Math.round(params.tone * 100)}%)</span>
          <input
            type="range"
            min="0.05"
            max="0.95"
            step="0.05"
            value={params.tone}
            onChange={(e) => updateParam('tone', parseFloat(e.target.value))}
            className="accent-cyan-400 mt-1"
          />
        </label>

        <label className="flex flex-col bg-slate-900/70 p-2 rounded border border-slate-800">
          <span className="text-[10px] text-slate-400">DELAY TIME ({Math.round(params.delayTime * 1000)}ms)</span>
          <input
            type="range"
            min="0.05"
            max="1.2"
            step="0.025"
            value={params.delayTime}
            onChange={(e) => updateParam('delayTime', parseFloat(e.target.value))}
            className="accent-purple-400 mt-1"
          />
        </label>

        <label className="flex flex-col bg-slate-900/70 p-2 rounded border border-slate-800">
          <span className="text-[10px] text-slate-400">DELAY MIX ({Math.round(params.delayMix * 100)}%)</span>
          <input
            type="range"
            min="0"
            max="0.85"
            step="0.05"
            value={params.delayMix}
            onChange={(e) => updateParam('delayMix', parseFloat(e.target.value))}
            className="accent-purple-400 mt-1"
          />
        </label>
      </div>
    </div>
  );
}
