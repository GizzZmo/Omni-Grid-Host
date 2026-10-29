import type { GridItemData, GhostData } from '../types';

export async function optimizeLayout(currentLayout: GridItemData[], _visibleWidgets: string[]) {
  return { layout: currentLayout } as { layout: GridItemData[]; ghost?: GhostData };
}

export async function processCrossTalk(droppedText: string, _targetWidgetType: string): Promise<string> {
  return droppedText;
}
