import { useState, useEffect, useCallback } from 'react';

export function useStats() {
  const [stats, setStats] = useState(() => {
    try {
      const saved = localStorage.getItem('visionplay-stats');
      return saved ? JSON.parse(saved) : {
        alto: 0,
        seguimiento: 0,
        enfoque: 0,
        descanso: 0,
        formas: 0,
        total: 0,
        lastSession: null,
      };
    } catch (e) {
      return {
        alto: 0,
        seguimiento: 0,
        enfoque: 0,
        descanso: 0,
        formas: 0,
        total: 0,
        lastSession: null,
      };
    }
  });

  const increment = useCallback((modeKey) => {
    setStats(prev => {
      const updated = { ...prev };
      if (updated[modeKey] !== undefined) {
        updated[modeKey] += 1;
        updated.total += 1;
        updated.lastSession = new Date().toISOString();
      }
      try {
        localStorage.setItem('visionplay-stats', JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save stats', e);
      }
      return updated;
    });
  }, []);

  const reset = useCallback(() => {
    setStats({
      alto: 0,
      seguimiento: 0,
      enfoque: 0,
      descanso: 0,
      formas: 0,
      total: 0,
      lastSession: null,
    });
    try {
      localStorage.removeItem('visionplay-stats');
    } catch (e) {
      console.warn('Failed to clear stats', e);
    }
  }, []);

  return [stats, increment, reset];
}