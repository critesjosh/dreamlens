'use client';

import { useEffect } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { theme, autoNightMode, checkAutoNightMode } = useSettingsStore();

  // Apply theme on mount and when it changes
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark', 'aggressive-dark');
    root.classList.add(theme);
  }, [theme]);

  // Check auto night mode periodically
  useEffect(() => {
    if (!autoNightMode) return;

    // Check immediately
    checkAutoNightMode();

    // Check every minute
    const interval = setInterval(checkAutoNightMode, 60000);

    return () => clearInterval(interval);
  }, [autoNightMode, checkAutoNightMode]);

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration.scope);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }, []);

  return <>{children}</>;
}
