import { useState, useEffect } from 'react';

export type ViewMode = 'card' | 'table' | 'list';

const VIEW_VERSION = 'v2';

export const useViewPreference = (storageKey: string, defaultView: ViewMode = 'list') => {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    try {
      const version = localStorage.getItem(`${storageKey}_version`);
      if (version !== VIEW_VERSION) {
        localStorage.setItem(`${storageKey}_version`, VIEW_VERSION);
        return defaultView;
      }
      const stored = localStorage.getItem(storageKey);
      if (!stored) return defaultView;
      if (stored === 'client') return 'list';
      if (stored === 'card' || stored === 'table' || stored === 'list') return stored;
      return defaultView;
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
