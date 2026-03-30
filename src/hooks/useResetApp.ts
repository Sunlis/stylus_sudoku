import React from 'react';

export const useResetApp = () => {
  return React.useCallback(async () => {
    if (typeof window === 'undefined') {
      return;
    }

    const confirmed = window.confirm(
      'Clear all saved puzzles, notes, and offline data and refresh the app?'
    );
    if (!confirmed) {
      return;
    }

    try {
      // Clear app-specific preferences from localStorage.
      localStorage.removeItem('userPreferences');
    } catch (e) {
      console.error('Error clearing userPreferences from localStorage', e);
    }

    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
    } catch (e) {
      console.error('Error clearing CacheStorage', e);
    }

    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((reg) => reg.unregister()));
      }
    } catch (e) {
      console.error('Error unregistering service workers', e);
    }

    window.location.reload();
  }, []);
};
