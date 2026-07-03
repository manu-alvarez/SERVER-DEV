import { useState, useEffect, useCallback } from 'react';

export function useConfig() {
  const [config, setConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('visionplay-config');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure all expected keys exist with defaults
        const defaults = {
          volume: 0.5,
          vibration: true,
          reducedMotion: false,
          highContrast: false,
          language: 'es',
          speed: 6,
          kiosk: false,
        };
        return { ...defaults, ...parsed };
      }
      return {
        volume: 0.5,
        vibration: true,
        reducedMotion: false,
        highContrast: false,
        language: 'es',
        speed: 6,
        kiosk: false,
      };
    } catch (e) {
      console.warn('Failed to load config', e);
      return {
        volume: 0.5,
        vibration: true,
        reducedMotion: false,
        highContrast: false,
        language: 'es',
        speed: 6,
        kiosk: false,
      };
    }
  });

  // Sync config to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('visionplay-config', JSON.stringify(config));
    } catch (e) {
      console.warn('Failed to save config', e);
    }
  }, [config]);

  const updateConfig = useCallback((newConfig) => {
    setConfig(prev => {
      const merged = { ...prev, ...newConfig };
      return merged;
    });
  }, []);

  return [config, updateConfig];
}