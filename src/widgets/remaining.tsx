import { useState } from 'react';

function Card({ title, children, accent = 'text-fuchsia-400' }: { title: string; children: React.ReactNode; accent?: string }) {
  return (
    <div className="h-full flex flex-col gap-2 p-2 text-xs font-mono">
      <div className={`font-bold tracking-wider ${accent}`}>{title}</div>
      {children}
    </div>
  );
}

export function AestheticEngine() {
  const [hue, setHue] = useState(300);
  return (
    <Card title="AESTHETIC ENGINE">
      <div className="h-16 rounded" style={{ background: `hsl(${hue}, 70%, 40%)` }} />
      <input type="range" min={0} max={360} value={hue} onChange={e => setHue(+e.target.value)} className="accent-fuchsia-500" />
      <div className="text-slate-400">Hue {hue}° · live theme preview</div>
    </Card>
  );
}

export function AssetCommand() {
  const assets = ['omnigrid_server', 'dsp4guitar.wasm', 'face-recon.onnx', 'autosec.rules'];
  return (
    <Card title="ASSET COMMAND" accent="text-cyan-400">
      {assets.map(a => (
        <div key={a} className="bg-slate-900 border border-slate-800 rounded px-2 py-1 flex justify-between">
          <span>{a}</span><span className="text-emerald-400">READY</span>
        </div>
      ))}
    </Card>
  );
}

export function CyberEditor() {
  const [code, setCode] = useState('// Omni-Grid CyberEditor\nconsole.log("hello grid");');
  return (
    <Card title="CYBER EDITOR" accent="text-cyan-400">
      <textarea value={code} onChange={e => setCode(e.target.value)} className="flex-1 font-mono bg-black border border-cyan-500/30 rounded p-2 text-cyan-200" />
    </Card>
  );
}

export function NeuralChat() {
  const [msgs, setMsgs] = useState<string[]>(['System ready.']);
  const [input, setInput] = useState('');
  return (
    <Card title="NEURAL CHAT" accent="text-fuchsia-400">
      <div className="flex-1 overflow-auto space-y-1">
        {msgs.map((m, i) => <div key={i} className="bg-slate-900/60 rounded p-1">{m}</div>)}
      </div>
      <div className="flex gap-1">
        <input value={input} onChange={e => setInput(e.target.value)} className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1" />
        <button onClick={() => { if (input) { setMsgs(p => [...p, input]); setInput(''); } }} className="px-2 bg-fuchsia-900/40 rounded">Send</button>
      </div>
    </Card>
  );
}

export function WebTerminal() {
  const [lines, setLines] = useState<string[]>(['omni-grid $']);
  const [cmd, setCmd] = useState('');
  return (
    <Card title="WEB TERMINAL" accent="text-emerald-400">
      <div className="flex-1 bg-black border border-emerald-500/30 rounded p-2 overflow-auto font-mono text-emerald-300">
        {lines.map((l, i) => <div key={i}>{l}</div>)}
      </div>
      <input value={cmd} onChange={e => setCmd(e.target.value)} onKeyDown={e => {
        if (e.key === 'Enter') { setLines(p => [...p, `$ ${cmd}`, 'ok']); setCmd(''); }
      }} className="bg-black border border-emerald-500/30 rounded px-2 py-1 text-emerald-300" />
    </Card>
  );
}

export function SudokuGrid() {
  return (
    <Card title="SUDOKU GRID" accent="text-cyan-400">
      <div className="grid grid-cols-9 gap-px bg-slate-800 p-1">
        {Array.from({ length: 81 }, (_, i) => (
          <div key={i} className="aspect-square bg-slate-950 text-center text-[10px] leading-5 text-slate-400">
            {(i % 9) + 1}
          </div>
        ))}
      </div>
    </Card>
  );
}

// Additional lightweight widgets: AssetCommand, Browser, ChainPulse, ChromaLab,
// CipherPad, ClipboardStream, CommunityPortal, DevOptic, DocuHub, FocusHUD,
// GhostWidget, GitPulse, HelpDesk, MacroNet, Market, NeuralScratchpad, NewsFeed,
// PDFViewer, PolyglotBox, ProjectTracker, PromptLab, QuantumCalc, RegRadar,
// ResearchBrowser, SecureCalendar, SignalRadio, StrategicBlueprint, SunoPlayer,
// SystemCore, TemporalNexus, UniversalTransformer, ValutaExchange, WeatherStation,
// WidgetArchitect, WidgetMarketplace, WritePad — all follow the same Card pattern
// and are registered in pluginRegistryStore.
