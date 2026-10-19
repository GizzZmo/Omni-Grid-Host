import { useOmniStore } from '../store';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { NeuralHub } from '../widgets/NeuralHub';
import { SonicRack } from '../widgets/SonicRack';
import { SecOpsCommand } from '../widgets/SecOpsCommand';
import { CyberForge } from '../widgets/CyberForge';
import { WidgetShell } from './WidgetShell';

const ResponsiveGrid = WidthProvider(Responsive);

const widgetMap: Record<string, React.FC> = {
  neural: NeuralHub,
  sonic: SonicRack,
  secops: SecOpsCommand,
  dev: CyberForge,
};

export function GridContainer() {
  const { layouts, setLayouts, visibleWidgets } = useOmniStore();

  const onLayoutChange = (layout: any) => setLayouts(layout);

  return (
    <ResponsiveGrid
      className="layout h-full"
      layouts={{ lg: layouts }}
      breakpoints={{ lg: 1200, md: 996, sm: 768 }}
      cols={{ lg: 12, md: 10, sm: 6 }}
      rowHeight={30}
      onLayoutChange={onLayoutChange}
      draggableHandle=".widget-drag"
      margin={[8, 8]}
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
    </ResponsiveGrid>
  );
}
