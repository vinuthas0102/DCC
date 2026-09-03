import { useState, useEffect } from 'react';

export type ViewMode = 'card' | 'table' | 'list' | 'client';

export const useViewPreference = (storageKey: string, defaultView: ViewMode = 'list') => {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return (stored as ViewMode) || defaultView;
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
