import { useMemo, useState } from 'react';
import { usePluginRegistry } from '../store/pluginRegistryStore';

export function PluginLauncher() {
  const manifests = usePluginRegistry(s => s.manifests);
  const spawnWidget = usePluginRegistry(s => s.spawnWidget);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return Object.values(manifests)
      .filter((m) => !q || m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q))
      .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
  }, [manifests, query]);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="px-2 py-1 rounded bg-slate-900/80 border border-cyan-500/30 text-cyan-200 text-xs hover:bg-cyan-500/10"
      >
        Widgets {list.length}
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-[80] w-[min(92vw,560px)] max-h-[min(70vh,640px)] overflow-hidden flex flex-col rounded-lg border border-cyan-500/30 bg-slate-950 shadow-2xl">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a widget"
            className="m-2 px-2 py-1 rounded bg-black border border-slate-700 text-xs text-slate-100 outline-none"
          />
          <div className="overflow-auto px-2 pb-2 grid grid-cols-1 sm:grid-cols-2 gap-1">
            {list.map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  spawnWidget(m.id);
                  setOpen(false);
                  requestAnimationFrame(() => {
                    const items = document.querySelectorAll('.react-grid-item');
                    items[items.length - 1]?.scrollIntoView({ block: 'nearest' });
                  });
                }}
                className="text-left px-2 py-1.5 rounded border border-slate-800 hover:border-cyan-500/40 hover:bg-cyan-500/10"
              >
                <div className="text-[11px] text-cyan-100 truncate">{m.name}</div>
                <div className="text-[9px] tracking-widest text-slate-500">{m.category}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
