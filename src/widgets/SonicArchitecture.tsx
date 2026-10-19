import { useState } from 'react';
import { Music, Play, Pause } from 'lucide-react';

const RELATIVE_MAJORS = ['C', 'G', 'D', 'A', 'E', 'B', 'Gb', 'Db', 'Ab', 'Eb', 'Bb', 'F'];
const RELATIVE_MINORS = ['Am', 'Em', 'Bm', 'F#m', 'C#m', 'G#m', 'D#m', 'Bbm', 'Fm', 'Cm', 'Gm', 'Dm'];

export function SonicArchitecture() {
  const [root, setRoot] = useState('C');
  const [bpm, setBpm] = useState(120);
  const [playing, setPlaying] = useState(false);

  const idx = RELATIVE_MAJORS.indexOf(root);
  const neighbors = idx >= 0
    ? {
        major: [RELATIVE_MAJORS[(idx - 1 + 12) % 12], RELATIVE_MAJORS[idx], RELATIVE_MAJORS[(idx + 1) % 12]],
        minor: [RELATIVE_MINORS[(idx - 1 + 12) % 12], RELATIVE_MINORS[idx], RELATIVE_MINORS[(idx + 1) % 12]],
      }
    : { major: [], minor: [] };

  return (
    <div className="h-full flex flex-col gap-3 p-2 text-xs font-mono">
      <div className="flex items-center gap-2 text-fuchsia-400 font-bold">
        <Music size={14} /> Sonic Architecture · Circle of Fifths
      </div>

      <div className="grid grid-cols-6 gap-1">
        {RELATIVE_MAJORS.map(n => (
          <button
            key={n}
            onClick={() => setRoot(n)}
            className={`p-1 rounded border ${root === n ? 'bg-fuchsia-600 border-fuchsia-400 text-white' : 'bg-slate-900 border-slate-700 text-slate-400'}`}
          >
            {n}
          </button>
        ))}
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded p-3 text-center">
        <div className="text-[10px] uppercase text-slate-500 mb-2">Compatible Chords · Key of {root}</div>
        <div className="flex gap-2 justify-center mb-1">
          {neighbors.major.map((c, i) => (
            <div key={c} className={`w-10 h-10 flex items-center justify-center rounded font-bold ${i === 1 ? 'bg-fuchsia-400 text-slate-900 scale-110' : 'bg-fuchsia-200/70 text-slate-900'}`}>
              {c}
            </div>
          ))}
        </div>
        <div className="flex gap-2 justify-center">
          {neighbors.minor.map(c => (
            <div key={c} className="w-10 h-10 flex items-center justify-center rounded border border-slate-600 bg-slate-800 text-slate-300">
              {c}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded p-2">
        <button onClick={() => setPlaying(!playing)} className="p-1.5 bg-fuchsia-900/50 text-fuchsia-300 rounded">
          {playing ? <Pause size={12} /> : <Play size={12} />}
        </button>
        <input type="range" min={40} max={220} value={bpm} onChange={e => setBpm(+e.target.value)} className="flex-1 accent-fuchsia-500" />
        <span className="text-fuchsia-400 w-16 text-right">{bpm} BPM</span>
      </div>
    </div>
  );
}
