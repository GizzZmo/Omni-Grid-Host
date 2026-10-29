import { useOmniStore } from '../store';

interface Props {
  title: string;
  id: string;
  children: React.ReactNode;
}

export function WidgetShell({ title, id, children }: Props) {
  const toggleWidget = useOmniStore(s => s.toggleWidget);

  return (
    <div className="h-full flex flex-col bg-slate-950/80">
      <div className="widget-drag h-7 flex items-center justify-between px-2.5 bg-slate-900/90 border-b border-cyan-500/30 shrink-0 [.grid-locked_&]:cursor-default cursor-move">
        <span className="text-[10px] font-bold tracking-widest text-cyan-300 uppercase">{title}</span>
        <button onClick={() => toggleWidget(id)} className="text-slate-500 hover:text-rose-400 text-xs leading-none px-1">×</button>
      </div>
      <div className="flex-1 p-2 overflow-auto text-xs min-h-0 [&>*]:min-h-full">
        {children}
      </div>
    </div>
  );
}
