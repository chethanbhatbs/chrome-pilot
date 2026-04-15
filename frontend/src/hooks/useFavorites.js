import { useState, useCallback, useEffect } from 'react';
import { isExtensionContext, chromeStorageGet, chromeStorageSet } from '@/utils/chromeAdapter';

const STORAGE_KEY = 'chromepilot_favorites';

/**
 * Hook for managing tab favorites (starred tabs).
 * Favorites are stored by URL (not tab ID) so they persist across sessions.
 * Uses chrome.storage.local in extension context, localStorage in web preview.
 */
export function useFavorites() {
  const [favorites, setFavorites] = useState(new Set());

  // Load on mount
  useEffect(() => {
    if (isExtensionContext()) {
      chromeStorageGet([STORAGE_KEY]).then(data => {
        const stored = data?.[STORAGE_KEY];
        if (Array.isArray(stored)) setFavorites(new Set(stored));
      });
    } else {
      try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        if (Array.isArray(stored)) setFavorites(new Set(stored));
      } catch { /* ignore */ }
    }
  }, []);

  // Persist whenever favorites change
  const persist = useCallback((newSet) => {
    const arr = [...newSet];
    if (isExtensionContext()) {
      chromeStorageSet({ [STORAGE_KEY]: arr });
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    }
  }, []);

  const toggleFavorite = useCallback((url) => {
    if (!url) return;
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      persist(next);
      return next;
    });
  }, [persist]);

  const isFavorite = useCallback((url) => {
    return favorites.has(url);
  }, [favorites]);

  return { favorites, toggleFavorite, isFavorite };
}
