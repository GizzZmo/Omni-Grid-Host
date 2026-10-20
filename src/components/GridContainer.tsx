import { useOmniStore } from '../store';
import { usePluginRegistry } from '../store/pluginRegistryStore';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { NeuralHub } from '../widgets/NeuralHub';
import { SonicRack } from '../widgets/SonicRack';
import { SecOpsCommand } from '../widgets/SecOpsCommand';
import { CyberForge } from '../widgets/CyberForge';
import { WidgetShell } from './WidgetShell';
import { OmniPluginHost } from './OmniPluginHost';

const ResponsiveGrid = WidthProvider(Responsive);

const widgetMap: Record<string, React.FC> = {
  neural: NeuralHub,
  sonic: SonicRack,
  secops: SecOpsCommand,
  dev: CyberForge,
};

export function GridContainer() {
  const { layouts, setLayouts, visibleWidgets } = useOmniStore();
  const activeInstances = usePluginRegistry(s => s.activeInstances);
  const manifests = usePluginRegistry(s => s.manifests);
  const closeWidget = usePluginRegistry(s => s.closeWidget);

  const onLayoutChange = (layout: any) => setLayouts(layout);

  const pluginLayouts = activeInstances.map(inst => ({
    i: inst.instanceId,
    x: inst.layout.x,
    y: inst.layout.y,
    w: inst.layout.w,
    h: inst.layout.h,
  }));

  const allLayouts = [...layouts, ...pluginLayouts];

  return (
    <ResponsiveGrid
      className="layout h-full"
      layouts={{ lg: allLayouts }}
      breakpoints={{ lg: 1200, md: 996, sm: 768 }}
      cols={{ lg: 12, md: 10, sm: 6 }}
      rowHeight={28}
      onLayoutChange={onLayoutChange}
      draggableHandle=".widget-drag"
      margin={[6, 6]}
      containerPadding={[8, 8]}
    >
      {visibleWidgets.map(id => {
        const Widget = widgetMap[id];
        if (!Widget) return null;
        return (
          <div key={id} className="cyber-border rounded-lg overflow-hidden bg-cyber-panel/80 backdrop-blur">
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
          <div key={inst.instanceId} className="h-full cyber-border rounded-lg overflow-hidden">
            <OmniPluginHost
              instanceId={inst.instanceId}
              manifest={manifest}
              onClose={closeWidget}
            />
          </div>
        );
      })}
    </ResponsiveGrid>
  );
}
