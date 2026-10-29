import { useEffect, useRef, useState } from 'react';
import { useOmniStore } from '../store';
import { usePluginRegistry } from '../store/pluginRegistryStore';
import ReactGridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { NeuralHub } from '../widgets/NeuralHub';
import { SonicRack } from '../widgets/SonicRack';
import { SecOpsCommand } from '../widgets/SecOpsCommand';
import { CyberForge } from '../widgets/CyberForge';
import { WidgetShell } from './WidgetShell';
import { OmniPluginHost } from './OmniPluginHost';

const ResponsiveGrid = ReactGridLayout.WidthProvider(ReactGridLayout.Responsive);

const widgetMap: Record<string, React.FC> = {
  neural: NeuralHub,
  sonic: SonicRack,
  secops: SecOpsCommand,
  dev: CyberForge,
};

export function GridContainer() {
  const { layouts, setLayouts, visibleWidgets } = useOmniStore();
  const gridLocked = useOmniStore(s => s.gridLocked);
  const activeInstances = usePluginRegistry(s => s.activeInstances);
  const manifests = usePluginRegistry(s => s.manifests);
  const closeWidget = usePluginRegistry(s => s.closeWidget);
  const fitRef = useRef<HTMLDivElement>(null);
  const [rowHeight, setRowHeight] = useState(28);

  const onLayoutChange = (next: Array<{ i: string; x: number; y: number; w: number; h: number }>) => {
    const coreIds = new Set(visibleWidgets);
    const coreNext = next
      .filter((item) => coreIds.has(item.i))
      .map(({ i, x, y, w, h }) => ({ i, x, y, w, h }));
    const prev = useOmniStore.getState().layouts;
    const same =
      prev.length === coreNext.length &&
      coreNext.every((item) => {
        const old = prev.find((entry) => entry.i === item.i);
        return old && old.x === item.x && old.y === item.y && old.w === item.w && old.h === item.h;
      });
    if (!same) setLayouts(coreNext);
  };

  const pluginLayouts = activeInstances.map(inst => ({
    i: inst.instanceId,
    x: inst.layout.x,
    y: inst.layout.y,
    w: inst.layout.w,
    h: inst.layout.h,
  }));

  const allLayouts = [...layouts, ...pluginLayouts];
  const rows = allLayouts.reduce((max, item) => Math.max(max, item.y + item.h), 1);

  const layoutSignature = allLayouts.map((item) => `${item.i}:${item.y}:${item.h}`).join('|');

  useEffect(() => {
    const el = fitRef.current;
    if (!el) return;
    const fit = () => {
      const available = el.clientHeight - 16;
      const margin = 6;
      const next = Math.max(20, Math.floor((available - margin * Math.max(0, rows - 1)) / rows));
      setRowHeight((prev) => (prev === next ? prev : next));
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    return () => observer.disconnect();
  }, [rows, layoutSignature]);

  return (
    <div ref={fitRef} className={`h-full min-h-0 overflow-auto ${gridLocked ? 'grid-locked' : ''}`}>
    <ResponsiveGrid
      className="layout"
      layouts={{ lg: allLayouts }}
      breakpoints={{ lg: 1200, md: 996, sm: 480 }}
      cols={{ lg: 12, md: 12, sm: 12 }}
      rowHeight={rowHeight}
      isDraggable={!gridLocked}
      isResizable={!gridLocked}
      onLayoutChange={onLayoutChange}
      draggableHandle=".widget-drag"
      margin={[6, 6]}
      containerPadding={[8, 8]}
    >
      {visibleWidgets.map(id => {
        const Widget = widgetMap[id];
        if (!Widget) return null;
        return (
          <div key={id} className="h-full min-h-0 cyber-border rounded-lg overflow-hidden bg-cyber-panel/80 backdrop-blur">
            <WidgetShell title={id.toUpperCase()} id={id}>
              <Widget />
            </WidgetShell>
          </div>
        );
      })}

      {activeInstances.map(inst => {
        const manifest = manifests[inst.pluginId];
        if (!manifest) return null;
        return (
          <div key={inst.instanceId} className="h-full min-h-0">
            <OmniPluginHost
              instanceId={inst.instanceId}
              manifest={manifest}
              onClose={closeWidget}
            />
          </div>
        );
      })}
    </ResponsiveGrid>
    </div>
  );
}
