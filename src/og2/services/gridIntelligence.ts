import type { GridItemData, GhostData } from '../types';
import { getGenAIClient } from './geminiService';

export async function optimizeLayout(currentLayout: GridItemData[], _visibleWidgets: string[]) {
  return { layout: currentLayout } as { layout: GridItemData[]; ghost?: GhostData };
}

export async function processCrossTalk(droppedText: string, targetWidgetType: string): Promise<string> {
  const ai = getGenAIClient();
  if (!ai || !droppedText.trim()) return droppedText;
  try {
    const response = await ai.models.generateContent({
      contents: `Adapt this note so it is useful inside the ${targetWidgetType} widget. Return only the adapted text.\n\n${droppedText}`,
    });
    return response.text?.trim() || droppedText;
  } catch {
    return droppedText;
  }
}
