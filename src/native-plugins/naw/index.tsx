// public/plugins/naw/index.tsx
import React, { useEffect, useRef, useState } from 'react';
import { OmniWidgetHostProps } from '../../../src/types/plugin-sdk';
import { crossTalkBus } from '../../../src/services/crossTalkBus';

export interface MidiStepChord {
  chordName: string;
  frets: (number | null)[];
  midiNotes: number[];
  bpm: number;
}

export interface StemTrack {
  id: string;
  name: string;
  type: 'DRUMS' | 'BASS' | 'GUITAR_MIDI' | 'SYNTH_PAD';
  color: string;
  muted: boolean;
  solo: boolean;
  volume: number;
  steps: boolean[];
  chordMap?: Record<number, MidiStepChord>;
}

const DEFAULT_CHORD_PROGRESSION: Record<number, MidiStepChord> = {
  0: {
    chordName: 'Em9 (Nordic Noir)',
    frets: [0, 2, 4, 0, 3, 2],
    midiNotes: [40, 47, 54, 55, 62, 66],
    bpm: 124,
  },
  4: {
    chordName: 'Cmaj7#11 (Cyber)',
    frets: [null, 3, 2, 4, 0, 2],
    midiNotes: [48, 52, 59, 64, 66],
    bpm: 124,
  },
  8: {
    chordName: 'Amadd9',
    frets: [null, 0, 2, 4, 1, 0],
    midiNotes: [45, 52, 59, 60, 64],
    bpm: 124,
  },
  12: {
    chordName: 'B7alt (Tension)',
    frets: [null, 2, 1, 2, 0, 3],
    midiNotes: [47, 51, 57, 59, 67],
    bpm: 124,
  },
};

const INITIAL_STEMS: StemTrack[] = [
  {
    id: 'stem-guitar',
    name: 'LEAD GUITAR → TABFRET & DSP4Guitar',
    type: 'GUITAR_MIDI',
    color: 'bg-cyan-400',
    muted: false,
    solo: false,
    volume: 0.9,
    steps: [
      true, false, false, false,
      true, false, false, true,
      true, false, false, false,
      true, false, true, false,
    ],
    chordMap: DEFAULT_CHORD_PROGRESSION,
  },
  {
    id: 'stem-bass',
    name: 'PROPHET SUB BASS',
    type: 'BASS',
    color: 'bg-purple-400',
    muted: false,
    solo: false,
    volume: 0.85,
    steps: [
      true, false, true, false,
      true, false, true, true,
      true, false, true, false,
      true, true, false, true,
    ],
  },
  {
    id: 'stem-drums',
    name: 'RYTM ANALOG PERC',
    type: 'DRUMS',
    color: 'bg-emerald-400',
    muted: false,
    solo: false,
    volume: 0.8,
    steps: [
      true, false, false, false,
      true, false, false, false,
      true, false, false, false,
      true, false, true, true,
    ],
  },
  {
    id: 'stem-pad',
    name: 'VIRUS TI DARK PAD',
    type: 'SYNTH_PAD',
    color: 'bg-amber-400',
    muted: false,
    solo: false,
    volume: 0.7,
    steps: [
      true, false, false, false,
      false, false, false, false,
      true, false, false, false,
      false, false, false, false,
    ],
  },
];

function chordsForPrompt(prompt: string, tempo: number): Record<number, MidiStepChord> {
  const text = prompt.toLowerCase();
  const withTempo = (chord: MidiStepChord): MidiStepChord => ({ ...chord, bpm: tempo });

  if (text.includes('phrygian') || text.includes('dark')) {
    return {
      0: withTempo({
        chordName: 'Em Phrygian',
        frets: [0, 2, 2, 0, 3, 0],
        midiNotes: [40, 47, 52, 55, 62, 64],
        bpm: tempo,
      }),
      4: withTempo({
        chordName: 'Fmaj (bII)',
        frets: [1, 3, 3, 2, 1, 1],
        midiNotes: [41, 48, 53, 57, 60, 65],
        bpm: tempo,
      }),
      8: withTempo({
        chordName: 'Am(b6)',
        frets: [5, 7, 7, 5, 8, 8],
        midiNotes: [45, 52, 57, 60, 64, 68],
        bpm: tempo,
      }),
      12: withTempo({
        chordName: 'B7alt (Tension)',
        frets: [null, 2, 1, 2, 0, 3],
        midiNotes: [47, 51, 57, 59, 67],
        bpm: tempo,
      }),
    };
  }

  if (text.includes('major') || text.includes('bright') || text.includes('lydian')) {
    return {
      0: withTempo({
        chordName: 'Cmaj7#11 (Cyber)',
        frets: [null, 3, 2, 4, 0, 2],
        midiNotes: [48, 52, 59, 64, 66],
        bpm: tempo,
      }),
      4: withTempo({
        chordName: 'Gmaj9',
        frets: [3, 2, 0, 2, 0, 2],
        midiNotes: [43, 47, 50, 59, 62, 66],
        bpm: tempo,
      }),
      8: withTempo({
        chordName: 'Amadd9',
        frets: [null, 0, 2, 4, 1, 0],
        midiNotes: [45, 52, 59, 60, 64],
        bpm: tempo,
      }),
      12: withTempo({
        chordName: 'Fmaj7',
        frets: [1, 3, 3, 2, 1, 1],
        midiNotes: [41, 48, 53, 57, 60, 65],
        bpm: tempo,
      }),
    };
  }

  return {
    0: withTempo(DEFAULT_CHORD_PROGRESSION[0]),
    4: withTempo(DEFAULT_CHORD_PROGRESSION[4]),
    8: withTempo(DEFAULT_CHORD_PROGRESSION[8]),
    12: withTempo(DEFAULT_CHORD_PROGRESSION[12]),
  };
}

export default function NAWWidget({ instanceId, bus }: OmniWidgetHostProps) {
  const [stems, setStems] = useState<StemTrack[]>(INITIAL_STEMS);
  const [bpm, setBpm] = useState<number>(124);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [aiPrompt, setAiPrompt] = useState<string>(
    'Minimal techno 126 BPM in E Phrygian with syncopated guitar stabs'
  );
  const [aiStatus, setAiStatus] = useState<string>('Ready for Neural Stem Generation');

  const audioCtxRef = useRef<AudioContext | null>(null);
  const stemsRef = useRef<StemTrack[]>(stems);
  const bpmRef = useRef(bpm);
  const stepRef = useRef(0);
  stemsRef.current = stems;
  bpmRef.current = bpm;

  const triggerLocalBackingSynth = (stem: StemTrack, stepIdx: number) => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext({ latencyHint: 'interactive' });
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') void ctx.resume();

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (stem.type === 'DRUMS') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(135, now);
      osc.frequency.exponentialRampToValueAtTime(38, now + 0.11);
      gain.gain.setValueAtTime(stem.volume * 0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.19);
    } else if (stem.type === 'BASS') {
      osc.type = 'sawtooth';
      const bassFreqs = [55.0, 65.41, 73.42, 61.74];
      osc.frequency.setValueAtTime(bassFreqs[Math.floor(stepIdx / 4) % 4], now);
      gain.gain.setValueAtTime(stem.volume * 0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.17);
    } else if (stem.type === 'SYNTH_PAD') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      gain.gain.setValueAtTime(stem.volume * 0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.46);
    }
  };

  // Sample clock: requestAnimationFrame accumulator locked to 16th notes.
  useEffect(() => {
    if (!isPlaying) return;

    const triggerStep = (step: number) => {
      const activeStems = stemsRef.current;
      const anySolo = activeStems.some((s) => s.solo);
      const tempo = bpmRef.current;

      activeStems.forEach((stem) => {
        const isAudible = anySolo ? stem.solo : !stem.muted;
        if (!isAudible || !stem.steps[step]) return;

        if (stem.type === 'GUITAR_MIDI') {
          const anchorStep = Math.floor(step / 4) * 4;
          const chord =
            stem.chordMap?.[step] ||
            stem.chordMap?.[anchorStep] ||
            DEFAULT_CHORD_PROGRESSION[0];

          bus.emit<MidiStepChord>('audio/midi', { ...chord, bpm: tempo });
        } else {
          triggerLocalBackingSynth(stem, step);
        }
      });
    };

    let raf = 0;
    let last = performance.now();
    let acc = 0;
    triggerStep(stepRef.current);

    const frame = (now: number) => {
      const stepMs = (60 / Math.max(40, bpmRef.current) / 4) * 1000;
      acc += now - last;
      last = now;
      let hops = 0;
      while (acc >= stepMs && hops < 8) {
        acc -= stepMs;
        hops += 1;
        const nextStep = (stepRef.current + 1) % 16;
        stepRef.current = nextStep;
        setCurrentStep(nextStep);
        triggerStep(nextStep);
      }
      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, bus]);

  useEffect(() => {
    return bus.subscribe<{
      agentRole?: string;
      output?: string;
      bpm?: number;
      chords?: Record<number, MidiStepChord>;
    }>('ai/agent-task', (envelope) => {
      if (envelope.payload.bpm) {
        setBpm(envelope.payload.bpm);
      }
      if (envelope.payload.chords) {
        const chords = envelope.payload.chords;
        setStems((prev) =>
          prev.map((stem) =>
            stem.type === 'GUITAR_MIDI'
              ? { ...stem, chordMap: { ...stem.chordMap, ...chords } }
              : stem
          )
        );
      }
      setAiStatus(
        `Neural Stems Updated (${new Date(envelope.timestamp).toLocaleTimeString()})`
      );
    });
  }, [bus]);

  const generateNeuralArrangement = () => {
    setAiStatus('Synthesizing multi-stem MIDI & tab voicings...');

    const hash = aiPrompt.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const bpmMatch = aiPrompt.match(/(\d{2,3})\s*bpm/i);
    const inferredBpm = bpmMatch ? parseInt(bpmMatch[1], 10) : 126;

    setBpm(inferredBpm);
    const nextChords = chordsForPrompt(aiPrompt, inferredBpm);
    setStems((prev) =>
      prev.map((stem, idx) => ({
        ...stem,
        chordMap: stem.type === 'GUITAR_MIDI' ? nextChords : stem.chordMap,
        steps: stem.steps.map((_, stepIdx) => ((stepIdx + idx + hash) % 3 === 0) || stepIdx % 4 === 0),
      }))
    );

    bus.emit('ai/prompt', {
      agentRole: 'NEURAL_AUDIO_COMPOSER',
      prompt: `Generate a 16-step multi-stem arrangement and 6-string guitar tab voicings for: ${aiPrompt}`,
    });
  };

  const toggleStep = (stemId: string, stepIdx: number) => {
    setStems((prev) =>
      prev.map((stem) =>
        stem.id === stemId
          ? {
              ...stem,
              steps: stem.steps.map((val, idx) => (idx === stepIdx ? !val : val)),
            }
          : stem
      )
    );
  };

  const toggleMute = (stemId: string) => {
    setStems((prev) =>
      prev.map((s) => (s.id === stemId ? { ...s, muted: !s.muted } : s))
    );
  };

  const toggleSolo = (stemId: string) => {
    setStems((prev) =>
      prev.map((s) => (s.id === stemId ? { ...s, solo: !s.solo } : s))
    );
  };

  const guitarStem = stems.find((s) => s.type === 'GUITAR_MIDI');

  return (
    <div className="flex flex-col h-full w-full p-3 bg-slate-950 text-slate-100 font-mono text-xs gap-2.5 select-none">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (!isPlaying) {
                stepRef.current = 0;
                setCurrentStep(0);
              }
              setIsPlaying((p) => !p);
            }}
            className={`px-3 py-1 rounded font-bold border transition cursor-pointer ${
              isPlaying
                ? 'bg-rose-500/20 border-rose-400 text-rose-300 animate-pulse'
                : 'bg-emerald-500/20 border-emerald-400/60 text-emerald-300 hover:bg-emerald-500/30'
            }`}
          >
            {isPlaying ? 'STOP TRANSPORT' : 'PLAY STEMS'}
          </button>

          <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded border border-slate-800">
            <span className="text-[10px] text-slate-400">BPM</span>
            <input
              type="number"
              min={60}
              max={200}
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value) || 120)}
              className="w-12 bg-transparent text-cyan-300 font-bold text-center focus:outline-none"
            />
          </div>

          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-purple-300 border border-purple-800/40">
            STEP: {(currentStep + 1).toString().padStart(2, '0')} / 16
          </span>
        </div>

        <span className="text-[10px] text-cyan-400/90 truncate">{aiStatus}</span>
      </div>

      <div className="flex gap-1.5">
        <input
          type="text"
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          placeholder="Describe genre, tempo, scale, and guitar motif..."
          className="flex-1 min-w-0 bg-slate-900/90 border border-slate-800 rounded px-2.5 py-1 text-slate-200 focus:border-cyan-400 focus:outline-none"
        />
        <button
          onClick={generateNeuralArrangement}
          className="px-3 py-1 rounded bg-purple-600/25 border border-purple-400/60 text-purple-200 hover:bg-purple-600/40 font-semibold transition shrink-0 cursor-pointer"
        >
          Neural Compose
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
        {[0, 4, 8, 12].map((stepAnchor) => {
          const chord =
            guitarStem?.chordMap?.[stepAnchor] || DEFAULT_CHORD_PROGRESSION[stepAnchor];
          const isCurrentBar = Math.floor(currentStep / 4) * 4 === stepAnchor && isPlaying;
          return (
            <div
              key={stepAnchor}
              draggable
              onDragStart={(e) =>
                crossTalkBus.createDragPayload(e, instanceId, 'audio/midi', {
                  ...chord,
                  bpm,
                })
              }
              onClick={() =>
                bus.emit<MidiStepChord>('audio/midi', {
                  ...chord,
                  bpm,
                })
              }
              className={`px-2 py-1 rounded border cursor-pointer transition flex items-center justify-between ${
                isCurrentBar
                  ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.3)]'
                  : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
              title="Click to audition or drag into TABFRET / DSP4Guitar"
            >
              <span className="truncate font-semibold text-[11px]">{chord.chordName}</span>
              <span className="text-[9px] text-cyan-400 ml-1">MIDI</span>
            </div>
          );
        })}
      </div>

      <div className="flex-1 flex flex-col justify-between gap-1.5 overflow-y-auto pr-0.5 min-h-0">
        {stems.map((stem) => (
          <div
            key={stem.id}
            className="flex items-center gap-2 bg-slate-900/60 px-2 py-1.5 rounded border border-slate-800/90"
          >
            <div className="w-28 sm:w-44 shrink-0 flex items-center justify-between gap-1">
              <span className="truncate text-[10px] font-semibold text-slate-200" title={stem.name}>
                {stem.name}
              </span>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => toggleMute(stem.id)}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold cursor-pointer ${
                    stem.muted
                      ? 'bg-rose-500 text-slate-950'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  M
                </button>
                <button
                  onClick={() => toggleSolo(stem.id)}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold cursor-pointer ${
                    stem.solo
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  S
                </button>
              </div>
            </div>

            <div className="grid flex-1 gap-1 min-w-0 [grid-template-columns:repeat(16,minmax(0,1fr))]">
              {stem.steps.map((active, stepIdx) => {
                const isPlayhead = isPlaying && currentStep === stepIdx;
                const isBeatMarker = stepIdx % 4 === 0;
                return (
                  <button
                    key={stepIdx}
                    onClick={() => toggleStep(stem.id, stepIdx)}
                    className={`h-6 rounded-sm transition-all border cursor-pointer ${
                      active
                        ? `${stem.color} border-white/40 shadow-[0_0_8px_rgba(34,211,238,0.35)]`
                        : isBeatMarker
                        ? 'bg-slate-800/90 border-slate-700'
                        : 'bg-slate-950 border-slate-800/80'
                    } ${isPlayhead ? 'ring-2 ring-white scale-105' : ''}`}
                    title={`Step ${stepIdx + 1}`}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export { NAWWidget };
