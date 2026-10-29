import { useMemo, useState } from 'react';
import { usePluginRegistry } from '../store/pluginRegistryStore';
import { categoryAccent } from '../lib/categoryAccent';

export function PluginLauncher() {
  const manifests = usePluginRegistry(s => s.manifests);
  const activeInstances = usePluginRegistry(s => s.activeInstances);
  const spawnWidget = usePluginRegistry(s => s.spawnWidget);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return Object.values(manifests)
      .filter((m) => !q || m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q) || m.id.toLowerCase().includes(q))
      .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
  }, [manifests, query]);

  const reveal = (instanceId: string) => {
    requestAnimationFrame(() => {
      document.querySelector(`[data-instance="${CSS.escape(instanceId)}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  };

  const openOne = (pluginId: string, fresh: boolean) => {
    const existing = activeInstances.find((item) => item.pluginId === pluginId);
    const instanceId = !fresh && existing ? existing.instanceId : spawnWidget(pluginId);
    setOpen(false);
    if (instanceId) reveal(instanceId);
  };

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
            placeholder="Find weather, editor, sudoku..."
            className="m-2 px-2 py-1.5 rounded bg-black border border-slate-700 text-xs text-slate-100 outline-none focus:border-cyan-500/50"
          />
          <div className="overflow-auto px-2 pb-2 grid grid-cols-1 sm:grid-cols-2 gap-1">
            {list.map((m) => {
              const live = activeInstances.some((item) => item.pluginId === m.id);
              const accent = categoryAccent(m.category);
              return (
                <div key={m.id} className="flex rounded border border-slate-800 hover:border-cyan-500/40 hover:bg-cyan-500/10" style={{ borderLeft: `3px solid ${accent}` }}>
                  <button onClick={() => openOne(m.id, false)} className="flex-1 min-w-0 text-left px-2 py-1.5">
                    <div className="text-[11px] text-cyan-100 truncate">{m.name}</div>
                    <div className="text-[9px] tracking-widest text-slate-500">{live ? 'ON THE DESK' : m.category}</div>
                  </button>
                  <button
                    onClick={() => openOne(m.id, true)}
                    className="px-2 text-slate-500 hover:text-cyan-200 text-sm"
                    title="Open another copy"
                  >
                    +
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
