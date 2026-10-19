// src/store/settingsStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AiProvider = 'openai' | 'anthropic' | 'gemini' | 'groq' | 'ollama' | 'custom';

export interface AiSettings {
  provider: AiProvider;
  apiKey: string;
  baseUrl: string;
  model: string;
}

interface SettingsState extends AiSettings {
  setProvider: (provider: AiProvider) => void;
  setApiKey: (apiKey: string) => void;
  setBaseUrl: (baseUrl: string) => void;
  setModel: (model: string) => void;
  clearApiKey: () => void;
  reset: () => void;
}

const DEFAULTS: AiSettings = { provider: 'openai', apiKey: '', baseUrl: '', model: '' };

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      setProvider: (provider) => set({ provider }),
      setApiKey: (apiKey) => set({ apiKey }),
      setBaseUrl: (baseUrl) => set({ baseUrl }),
      setModel: (model) => set({ model }),
      clearApiKey: () => set({ apiKey: '' }),
      reset: () => set(DEFAULTS),
    }),
    { name: 'omnigrid-settings-v1' }
  )
);

export function getAiConfig(): AiSettings { return useSettingsStore.getState(); }
export function hasApiKey(): boolean { return !!useSettingsStore.getState().apiKey; }
