import { X } from 'lucide-react';
import { useOmniStore } from '../store';

interface Props {
  title: string;
  id: string;
  children: React.ReactNode;
}

export function WidgetShell({ title, id, children }: Props) {
  const toggleWidget = useOmniStore(s => s.toggleWidget);

  return (
    <div className="h-full flex flex-col">
      <div className="widget-drag h-8 flex items-center justify-between px-3 bg-black/50 border-b border-cyan-500/20 cursor-move">
        <span className="text-xs font-bold tracking-wider text-cyan-300">{title}</span>
        <button onClick={() => toggleWidget(id)} className="text-red-400 hover:text-red-300">
          <X size={14} />
        </button>
      </div>
      <div className="flex-1 p-3 overflow-auto text-sm">
        {children}
      </div>
    </div>
  );
}
