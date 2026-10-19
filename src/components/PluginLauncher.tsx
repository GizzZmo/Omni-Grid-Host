import { usePluginRegistry } from '../store/pluginRegistryStore';

export function PluginLauncher() {
  const manifests = usePluginRegistry(s => s.manifests);
  const spawnWidget = usePluginRegistry(s => s.spawnWidget);

  return (
    <div className="flex gap-2 text-xs">
      {Object.values(manifests).map(m => (
        <button
          key={m.id}
          onClick={() => spawnWidget(m.id)}
          className="px-2 py-1 rounded bg-cyan-500/20 border border-cyan-500/40 hover:bg-cyan-500/40"
        >
          + {m.name.split(' ')[0]}
        </button>
      ))}
    </div>
  );
}
