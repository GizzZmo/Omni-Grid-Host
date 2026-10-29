import { usePluginRegistry } from '../store/pluginRegistryStore';

export function PluginLauncher() {
  const manifests = usePluginRegistry(s => s.manifests);
  const spawnWidget = usePluginRegistry(s => s.spawnWidget);
  const list = Object.values(manifests);

  return (
    <div className="flex gap-1.5 text-[10px] overflow-x-auto max-w-[46vw] min-w-0 scrollbar-thin">
      {list.map(m => (
        <button
          key={m.id}
          onClick={() => spawnWidget(m.id)}
          className="px-2 py-1 rounded bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/25 text-cyan-200 whitespace-nowrap shrink-0"
          title={m.name}
        >
          + {m.name.split(' ')[0]}
        </button>
      ))}
    </div>
  );
}
