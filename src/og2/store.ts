import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppTheme, GhostData, PromptTemplate } from './types';

const nid = () => Math.random().toString(36).slice(2, 10);

const theme: AppTheme = {
  name: 'Cyber',
  colors: {
    background: '#0f0518',
    surface: '#1a0b2e',
    primary: '#d946ef',
    secondary: '#8b5cf6',
    text: '#e2e8f0',
    accent: '#06b6d4',
  },
  font: 'Share Tech Mono',
  radius: '0.25rem',
};

const starter: PromptTemplate = {
  id: 'nordic',
  name: 'Nordic brief',
  content: 'Write a short brief about {{topic}}.',
  tags: ['audio'],
  versions: [],
  variables: { topic: 'the grid' },
};

type Settings = {
  geminiApiKey: string;
  e2bApiKey: string;
  scanlines: boolean;
  sound: boolean;
  startupBehavior: 'restore' | 'default' | 'empty';
};

export const useAppStore = create<any>()(
  persist(
    (set) => ({
      theme,
      setTheme: (next: AppTheme) => set({ theme: next }),
      settings: {
        geminiApiKey: '',
        e2bApiKey: '',
        scanlines: true,
        sound: false,
        startupBehavior: 'restore',
      } as Settings,
      toggleSetting: (key: keyof Settings) =>
        set((s: any) => ({ settings: { ...s.settings, [key]: !s.settings[key] } })),
      setGeminiApiKey: (key: string) =>
        set((s: any) => ({ settings: { ...s.settings, geminiApiKey: key } })),
      setE2bApiKey: (key: string) =>
        set((s: any) => ({ settings: { ...s.settings, e2bApiKey: key } })),
      weatherLocation: 'Oslo',
      setWeatherLocation: (weatherLocation: string) => set({ weatherLocation }),
      gitToken: '',
      setGitToken: (gitToken: string) => set({ gitToken }),
      logs: ['[boot] Omni-Grid widgets online'],
      tasks: [{ id: 't1', text: 'Open a widget from the menu', status: 'todo' as const }],
      addTask: (text: string) =>
        set((s: any) => ({ tasks: [...s.tasks, { id: nid(), text, status: 'todo' }] })),
      toggleTask: (id: string) =>
        set((s: any) => ({
          tasks: s.tasks.map((t: any) => t.id === id ? { ...t, status: t.status === 'done' ? 'todo' : 'done' } : t),
        })),
      deleteTask: (id: string) => set((s: any) => ({ tasks: s.tasks.filter((t: any) => t.id !== id) })),
      tickers: ['ETH', 'BTC'],
      addTicker: (ticker: string) => set((s: any) => ({ tickers: [...s.tickers, ticker.toUpperCase()] })),
      removeTicker: (ticker: string) => set((s: any) => ({ tickers: s.tickers.filter((t: string) => t !== ticker) })),
      rssFeeds: ['https://hnrss.org/frontpage'],
      calendarEvents: [] as { date: string; title: string; encrypted?: boolean }[],
      addCalendarEvent: (event: { date: string; title: string; encrypted?: boolean }) =>
        set((s: any) => ({ calendarEvents: [...s.calendarEvents, event] })),
      clipboardHistory: [] as string[],
      addToClipboardHistory: (text: string) =>
        set((s: any) => ({ clipboardHistory: [text, ...s.clipboardHistory].slice(0, 30) })),
      clearClipboardHistory: () => set({ clipboardHistory: [] }),
      scratchpadContent: '',
      setScratchpadContent: (scratchpadContent: string) => set({ scratchpadContent }),
      writePadContent: '',
      setWritePadContent: (writePadContent: string) => set({ writePadContent }),
      cyberEditorTabs: null as null | { id: string; name: string; language: string; content: string }[],
      setCyberEditorTabs: (cyberEditorTabs: unknown) => set({ cyberEditorTabs }),
      cyberEditorActiveTab: '',
      setCyberEditorActiveTab: (cyberEditorActiveTab: string) => set({ cyberEditorActiveTab }),
      promptLibrary: [starter],
      activePromptId: starter.id,
      setActivePrompt: (activePromptId: string) => set({ activePromptId }),
      updatePromptContent: (id: string, content: string) =>
        set((s: any) => ({
          promptLibrary: s.promptLibrary.map((p: PromptTemplate) => p.id === id ? { ...p, content } : p),
        })),
      updatePromptVariables: (id: string, variables: Record<string, string>) =>
        set((s: any) => ({
          promptLibrary: s.promptLibrary.map((p: PromptTemplate) => p.id === id ? { ...p, variables } : p),
        })),
      tagPrompt: (id: string, tag: string) =>
        set((s: any) => ({
          promptLibrary: s.promptLibrary.map((p: PromptTemplate) =>
            p.id === id ? { ...p, tags: p.tags.includes(tag) ? p.tags : [...p.tags, tag] } : p),
        })),
      savePromptVersion: (id: string, note?: string) =>
        set((s: any) => ({
          promptLibrary: s.promptLibrary.map((p: PromptTemplate) =>
            p.id === id
              ? { ...p, versions: [...p.versions, { id: nid(), content: p.content, createdAt: new Date().toISOString(), note, tokens: Math.ceil(p.content.length / 4) }] }
              : p),
        })),
      restorePromptVersion: (id: string, versionId: string) =>
        set((s: any) => ({
          promptLibrary: s.promptLibrary.map((p: PromptTemplate) => {
            if (p.id !== id) return p;
            const version = p.versions.find((v) => v.id === versionId);
            return version ? { ...p, content: version.content } : p;
          }),
        })),
      ghostWidget: null as GhostData | null,
      setGhostWidget: (ghostWidget: GhostData | null) => set({ ghostWidget }),
      solidifyGhostWidget: () => set({ ghostWidget: null }),
      visibleWidgets: [] as string[],
      toggleWidget: (id: string) =>
        set((s: any) => ({
          visibleWidgets: s.visibleWidgets.includes(id)
            ? s.visibleWidgets.filter((w: string) => w !== id)
            : [...s.visibleWidgets, id],
        })),
      vaultStatus: 'unprotected' as 'unprotected' | 'locked' | 'unlocked',
      setVaultPassphrase: async (_pass: string) => {
        set({ vaultStatus: 'unlocked' });
        return { ok: true as const, error: '' };
      },
      unlockVault: async (_pass?: string) => {
        set({ vaultStatus: 'unlocked' });
        return true;
      },
      lockVault: () => set({ vaultStatus: 'locked' }),
      removeVaultPassphrase: () => set({ vaultStatus: 'unprotected' }),
      installedWidgets: {} as Record<string, string>,
      availableUpdates: [] as string[],
      marketplaceLastChecked: Date.now(),
      installWidget: (id: string) =>
        set((s: any) => ({ installedWidgets: { ...s.installedWidgets, [id]: '2.0.0' } })),
      uninstallWidget: (id: string) =>
        set((s: any) => {
          const installedWidgets = { ...s.installedWidgets };
          delete installedWidgets[id];
          return { installedWidgets };
        }),
      checkForUpdates: () => set({ marketplaceLastChecked: Date.now(), availableUpdates: [] }),
      resetAll: () => set({ logs: ['[reset] desk cleared'], tasks: [], tickers: [], clipboardHistory: [] }),
    }),
    { name: 'omnigrid-og2-widgets' },
  ),
);
