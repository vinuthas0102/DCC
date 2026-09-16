import { useState, useEffect } from 'react';

export type ViewMode = 'card' | 'table' | 'list';

const migrateView = (stored: string | null, defaultView: ViewMode): ViewMode => {
  if (!stored) return defaultView;
  if (stored === 'client') return 'list';
  if (stored === 'card' || stored === 'table' || stored === 'list') return stored;
  return defaultView;
};

export const useViewPreference = (storageKey: string, defaultView: ViewMode = 'list') => {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return migrateView(stored, defaultView);
    } catch {
      return defaultView;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, viewMode);
    } catch (error) {
      console.error('Failed to save view preference:', error);
    }
  }, [storageKey, viewMode]);

  return [viewMode, setViewMode] as const;
};
