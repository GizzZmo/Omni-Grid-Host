import { useOmniStore } from '../store';
import { Code2, GitBranch } from '../icons';

export function CyberForge() {
  const emit = useOmniStore(s => s.emitCrossTalk);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-yellow-300">
        <Code2 size={16} /> CyberEditor · autofix-engine · ps4 Inspector
      </div>
      <pre className="bg-black/60 p-2 rounded text-[10px] text-green-300 overflow-auto">
{`// autofix staging
git status
# dead links, dep drift, CI failures
# staged patches ready`}
      </pre>
      <button
        onClick={() => emit({ type: 'git/patch', data: { files: 3 }, source: 'dev' })}
        className="px-3 py-1 bg-yellow-500/30 hover:bg-yellow-500/50 rounded text-xs flex items-center gap-1"
      >
        <GitBranch size={12} /> Stage Fix
      </button>
      <div className="text-[10px] text-white/50">
        Node.js / C++ Native Addons · Git API · Hex/ELF/Mach-O Widget
      </div>
    </div>
  );
}
