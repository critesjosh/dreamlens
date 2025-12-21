'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Settings, DEFAULT_SETTINGS, ThemeMode, FrameworkId, ProviderId } from '@/types';

interface SettingsStore extends Settings {
  setTheme: (theme: ThemeMode) => void;
  setOpenAIApiKey: (key: string) => void;
  setDefaultFramework: (framework: FrameworkId) => void;
  setDefaultModel: (model: string) => void;
  setAutoNightMode: (enabled: boolean) => void;
  setNightModeTime: (start: string, end: string) => void;
  updateSettings: (settings: Partial<Settings>) => void;
  checkAutoNightMode: () => void;
}

function applyTheme(theme: ThemeMode) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.remove('light', 'dark', 'aggressive-dark');
  root.classList.add(theme);
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_SETTINGS,

      setTheme: (theme) => {
        set({ theme });
        applyTheme(theme);
      },

      setOpenAIApiKey: (openaiApiKey) => {
        set({ openaiApiKey });
      },

      setDefaultFramework: (defaultFramework) => {
        set({ defaultFramework });
      },

      setDefaultModel: (defaultModel) => {
        set({ defaultModel });
      },

      setAutoNightMode: (autoNightMode) => {
        set({ autoNightMode });
        if (autoNightMode) {
          get().checkAutoNightMode();
        }
      },

      setNightModeTime: (nightModeStart, nightModeEnd) => {
        set({ nightModeStart, nightModeEnd });
        if (get().autoNightMode) {
          get().checkAutoNightMode();
        }
      },

      updateSettings: (settings) => {
        set(settings);
        if (settings.theme) {
          applyTheme(settings.theme);
        }
      },

      checkAutoNightMode: () => {
        const { autoNightMode, nightModeStart, nightModeEnd, theme } = get();
        if (!autoNightMode) return;

        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        const [startHour, startMin] = nightModeStart.split(':').map(Number);
        const [endHour, endMin] = nightModeEnd.split(':').map(Number);
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;

        let shouldBeAggressiveDark: boolean;

        if (startMinutes < endMinutes) {
          // Same day range (e.g., 09:00 - 17:00)
          shouldBeAggressiveDark = currentMinutes >= startMinutes && currentMinutes < endMinutes;
        } else {
          // Overnight range (e.g., 22:00 - 07:00)
          shouldBeAggressiveDark = currentMinutes >= startMinutes || currentMinutes < endMinutes;
        }

        const targetTheme = shouldBeAggressiveDark ? 'aggressive-dark' : 'dark';

        if (theme !== targetTheme) {
          set({ theme: targetTheme });
          applyTheme(targetTheme);
        }
      },
    }),
    {
      name: 'dreamlens-settings',
      onRehydrateStorage: () => (state) => {
        // Apply theme on hydration
        if (state?.theme) {
          applyTheme(state.theme);
        }
        // Check auto night mode on app load
        if (state?.autoNightMode) {
          state.checkAutoNightMode();
        }
      },
    }
  )
);
