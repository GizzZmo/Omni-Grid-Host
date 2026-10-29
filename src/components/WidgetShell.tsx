import { useOmniStore } from '../store';
import { categoryAccent } from '../lib/categoryAccent';

interface Props {
  title: string;
  id: string;
  children: React.ReactNode;
}

const CORE: Record<string, string> = {
  neural: 'NEURAL',
  sonic: 'AUDIO',
  secops: 'SECOPS',
  dev: 'DEV',
};

export function WidgetShell({ title, id, children }: Props) {
  const toggleWidget = useOmniStore(s => s.toggleWidget);
  const accent = categoryAccent(CORE[id] || 'SYSTEM');

  return (
    <div className="h-full flex flex-col bg-slate-950/90" style={{ boxShadow: `inset 3px 0 0 ${accent}` }}>
      <div className="widget-drag h-7 flex items-center justify-between px-2.5 bg-gradient-to-r from-slate-900 to-slate-950 border-b border-slate-800 shrink-0 [.grid-locked_&]:cursor-default cursor-move">
        <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: accent }}>{title}</span>
        <button onClick={() => toggleWidget(id)} className="text-slate-500 hover:text-rose-400 text-xs leading-none px-1">×</button>
      </div>
      <div className="flex-1 p-2 overflow-auto text-xs min-h-0 [&>*]:min-h-full">
        {children}
      </div>
    </div>
  );
}
