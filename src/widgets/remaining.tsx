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

export function BrowserWidget() {
  const [url, setUrl] = useState('https://github.com/GizzZmo');
  return (
    <Card title="BROWSER">
      <input value={url} onChange={e => setUrl(e.target.value)} className="bg-slate-900 border border-slate-700 rounded px-2 py-1" />
      <iframe src={url} title="browser" className="flex-1 min-h-[120px] border border-slate-800 rounded bg-black" />
    </Card>
  );
}

export function ChainPulse() {
  return (
    <Card title="CHAIN PULSE" accent="text-amber-400">
      <div className="text-emerald-400">ETH · 3,241.18</div>
      <div className="text-slate-400">Gas 18 gwei · blocks streaming</div>
    </Card>
  );
}

export function ChromaLab() {
  const [c, setC] = useState('#d946ef');
  return (
    <Card title="CHROMA LAB">
      <div className="h-12 rounded" style={{ background: c }} />
      <input type="color" value={c} onChange={e => setC(e.target.value)} />
    </Card>
  );
}

export function CipherPad() {
  const [text, setText] = useState('');
  return (
    <Card title="CIPHER PAD" accent="text-red-400">
      <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Encrypt locally…" className="flex-1 bg-slate-900 border border-slate-700 rounded p-2" />
      <div className="text-slate-500">SHA-style local pad · no network</div>
    </Card>
  );
}

export function ClipboardStream() {
  const [items, setItems] = useState<string[]>([]);
  return (
    <Card title="CLIPBOARD STREAM" accent="text-cyan-400">
      <button onClick={async () => {
        const t = await navigator.clipboard.readText().catch(() => '');
        if (t) setItems(p => [t.slice(0, 80), ...p].slice(0, 8));
      }} className="px-2 py-1 bg-cyan-900/40 border border-cyan-500/40 rounded">Capture</button>
      {items.map((i, n) => <div key={n} className="bg-slate-900 border border-slate-800 rounded p-1 truncate">{i}</div>)}
    </Card>
  );
}

export function CommunityPortal() {
  return (
    <Card title="COMMUNITY PORTAL" accent="text-emerald-400">
      <div>Omni-Grid · 334 repositories</div>
      <div className="text-slate-400">Flagships: DSP4Guitar · AutoSec · Master-Agentic-AI</div>
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

export function DevOptic() {
  return (
    <Card title="DEV OPTIC" accent="text-amber-400">
      <div>Build: green · Tests: 42/42 · Coverage: 91%</div>
      <div className="text-slate-400">CI/CD pulse from Omni-Grid-2.0</div>
    </Card>
  );
}

export function DocuHub() {
  const docs = ['architecture.md', 'plugin-sdk.md', 'crosstalk.md', 'sidecar.md'];
  return (
    <Card title="DOCU HUB">
      {docs.map(d => <div key={d} className="bg-slate-900 border border-slate-800 rounded px-2 py-1">{d}</div>)}
    </Card>
  );
}

export function FocusHUD() {
  const [mins, setMins] = useState(25);
  return (
    <Card title="FOCUS HUD" accent="text-emerald-400">
      <div className="text-2xl font-bold text-center">{mins}:00</div>
      <input type="range" min={5} max={90} value={mins} onChange={e => setMins(+e.target.value)} className="accent-emerald-500" />
    </Card>
  );
}

export function GhostWidget() {
  return (
    <Card title="GHOST WIDGET" accent="text-slate-500">
      <div className="opacity-40">Stealth mode · no telemetry</div>
    </Card>
  );
}

export function GitPulse() {
  return (
    <Card title="GIT PULSE" accent="text-orange-400">
      <div>main · +3 commits · CI green</div>
      <div className="text-slate-400">Omni-Grid-Host · GizzZmo</div>
    </Card>
  );
}

export function HelpDesk() {
  return (
    <Card title="HELP DESK" accent="text-cyan-400">
      <div>Cmd+K palette · Alt+Shift hover capture · Face-Recon lock</div>
    </Card>
  );
}

export function MacroNet() {
  return (
    <Card title="MACRO NET" accent="text-purple-400">
      <div>Alt+Shift → HoverMind → Neural Scratchpad</div>
      <div className="text-slate-400">OS-wide context capture</div>
    </Card>
  );
}

export function MarketWidget() {
  return (
    <Card title="MARKET" accent="text-emerald-400">
      <div>BTC 67,420 · ETH 3,241 · SOL 148</div>
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

export function NeuralScratchpad() {
  const [text, setText] = useState('');
  return (
    <Card title="NEURAL SCRATCHPAD" accent="text-cyan-400">
      <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Capture thoughts…" className="flex-1 bg-slate-900 border border-slate-700 rounded p-2" />
    </Card>
  );
}

export function NewsFeed() {
  return (
    <Card title="NEWS FEED" accent="text-amber-400">
      <div>Omni-Grid 3.0 Host ships dual-daemon sidecar</div>
      <div className="text-slate-400">Phase 1–4 complete · plugin bus live</div>
    </Card>
  );
}

export function PDFViewer() {
  return (
    <Card title="PDF VIEWER">
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded flex items-center justify-center text-slate-500">Drop PDF</div>
    </Card>
  );
}

export function PolyglotBox() {
  return (
    <Card title="POLYGLOT BOX" accent="text-cyan-400">
      <div>C++ · Python · TypeScript · Rust · C#</div>
      <div className="text-slate-400">Unified runtime via Cross-Talk</div>
    </Card>
  );
}

export function ProjectTracker() {
  const items = ['Phase 1 daemon', 'Phase 2 DSP', 'Phase 3 SecOps', 'Phase 4 Tauri'];
  return (
    <Card title="PROJECT TRACKER" accent="text-emerald-400">
      {items.map(i => <div key={i} className="flex justify-between"><span>{i}</span><span className="text-emerald-400">DONE</span></div>)}
    </Card>
  );
}

export function PromptLab() {
  const [p, setP] = useState('');
  return (
    <Card title="PROMPT LAB" accent="text-fuchsia-400">
      <textarea value={p} onChange={e => setP(e.target.value)} placeholder="Craft system prompt…" className="flex-1 bg-slate-900 border border-slate-700 rounded p-2" />
    </Card>
  );
}

export function QuantumCalc() {
  const [expr, setExpr] = useState('');
  const [out, setOut] = useState('');
  return (
    <Card title="QUANTUM CALC" accent="text-cyan-400">
      <input value={expr} onChange={e => setExpr(e.target.value)} className="bg-slate-900 border border-slate-700 rounded px-2 py-1" />
      <button onClick={() => { try { setOut(String(Function(`"use strict"; return (${expr})`)())); } catch { setOut('err'); } }} className="px-2 py-1 bg-cyan-900/40 rounded">=</button>
      <div className="text-emerald-400">{out}</div>
    </Card>
  );
}

export function RegRadar() {
  return (
    <Card title="REG RADAR" accent="text-amber-400">
      <div>Watching: omnigrid_server.cpp · sidecar · plugin-sdk</div>
    </Card>
  );
}

export function ResearchBrowser() {
  return (
    <Card title="RESEARCH BROWSER" accent="text-cyan-400">
      <div>HoverMind ready · OCR capture on Alt+Shift</div>
    </Card>
  );
}

export function SecureCalendar() {
  return (
    <Card title="SECURE CALENDAR" accent="text-emerald-400">
      <div>Today · local-only · no sync</div>
    </Card>
  );
}

export function SignalRadio() {
  return (
    <Card title="SIGNAL RADIO" accent="text-fuchsia-400">
      <div>Cross-Talk bus · live</div>
      <div className="text-slate-400">sec/pcap-packet · ai/agent-task · audio/midi</div>
    </Card>
  );
}

export function StrategicBlueprint() {
  return (
    <Card title="STRATEGIC BLUEPRINT" accent="text-purple-400">
      <div>Polyglot Microkernel · Extension Packs · Dual Daemon</div>
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

export function SunoPlayer() {
  return (
    <Card title="SUNO PLAYER" accent="text-fuchsia-400">
      <div>Official Theme · ready</div>
      <audio controls className="w-full" />
    </Card>
  );
}

export function SystemCore() {
  return (
    <Card title="SYSTEM CORE" accent="text-emerald-400">
      <div>C++ daemon · Python sidecar · Tauri host</div>
      <div className="text-slate-400">All systems nominal</div>
    </Card>
  );
}

export function TemporalNexus() {
  const now = new Date().toLocaleTimeString();
  return (
    <Card title="TEMPORAL NEXUS" accent="text-cyan-400">
      <div className="text-2xl font-bold text-center">{now}</div>
    </Card>
  );
}

export function UniversalTransformer() {
  const [in_, setIn] = useState('');
  return (
    <Card title="UNIVERSAL TRANSFORMER" accent="text-amber-400">
      <textarea value={in_} onChange={e => setIn(e.target.value)} className="flex-1 bg-slate-900 border border-slate-700 rounded p-2" />
      <div className="text-slate-400">JSON · Base64 · Hex</div>
    </Card>
  );
}

export function ValutaExchange() {
  return (
    <Card title="VALUTA" accent="text-emerald-400">
      <div>1 USD = 0.92 EUR · 1.27 GBP</div>
    </Card>
  );
}

export function WeatherStation() {
  return (
    <Card title="WEATHER STATION" accent="text-cyan-400">
      <div>18°C · overcast · local</div>
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

export function WidgetArchitect() {
  return (
    <Card title="WIDGET ARCHITECT" accent="text-fuchsia-400">
      <div>Manifest · isolation · Cross-Talk MIME</div>
      <div className="text-slate-400">native-esm | sandboxed-iframe</div>
    </Card>
  );
}

export function WidgetMarketplace() {
  return (
    <Card title="WIDGET MARKETPLACE" accent="text-cyan-400">
      <div>40+ widgets · Omni-Grid-2.0 catalog</div>
    </Card>
  );
}

export function WritePad() {
  const [text, setText] = useState('');
  return (
    <Card title="WRITE PAD" accent="text-slate-300">
      <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Draft…" className="flex-1 bg-slate-900 border border-slate-700 rounded p-2" />
    </Card>
  );
}
