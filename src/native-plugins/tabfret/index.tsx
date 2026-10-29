// public/plugins/tabfret/index.tsx
import React, { useEffect, useState } from 'react';
import { OmniWidgetHostProps } from '../../../src/types/plugin-sdk';
import { crossTalkBus } from '../../../src/services/crossTalkBus';

interface MidiChordPayload {
  chordName: string;
  frets: (number | null)[];
  midiNotes: number[];
  bpm: number;
}

export default function TabFretWidget({ instanceId, bus }: OmniWidgetHostProps) {
  const [activeChord, setActiveChord] = useState<MidiChordPayload>({
    chordName: 'E Minor 9 (Cyberpunk Voicing)',
    frets: [0, 2, 4, 0, 3, 2],
    midiNotes: [40, 47, 54, 55, 62, 66],
    bpm: 124,
  });

  useEffect(() => {
    return bus.subscribe<MidiChordPayload>('audio/midi', (envelope) => {
      setActiveChord(envelope.payload);
    });
  }, [bus]);

  const triggerAudition = () => {
    bus.emit<MidiChordPayload>('audio/midi', activeChord);
  };

  return (
    <div
      draggable
      onDragStart={(e) =>
        crossTalkBus.createDragPayload(e, instanceId, 'audio/midi', activeChord)
      }
      className="p-4 font-mono text-xs text-slate-200 flex flex-col gap-3"
    >
      <div className="flex justify-between items-center">
        <span className="text-cyan-400 font-bold">{activeChord.chordName}</span>
        <span className="text-slate-400">{activeChord.bpm} BPM</span>
      </div>

      <div className="grid grid-cols-6 gap-1 bg-slate-900 p-2 rounded border border-slate-800 text-center">
        {activeChord.frets.map((fret, stringIdx) => (
          <div key={stringIdx} className="flex flex-col items-center">
            <span className="text-[10px] text-slate-500">S{6 - stringIdx}</span>
            <span className="text-emerald-400 font-bold">{fret ?? 'X'}</span>
          </div>
        ))}
      </div>

      <button
        onClick={triggerAudition}
        className="px-3 py-1.5 rounded bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 hover:bg-cyan-500/30 transition"
      >
        Broadcast MIDI to DSP4Guitar / NAW (or Drag Tile)
      </button>
    </div>
  );
}
