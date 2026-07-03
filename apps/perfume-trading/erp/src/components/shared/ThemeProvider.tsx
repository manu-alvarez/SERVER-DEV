'use client';

import React, { useEffect, useState } from 'react';

/**
 * ThemeProvider reads the Zustand-persisted theme preference
 * and applies the 'dark' class to <html>.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem('perfume-ui-storage');
      if (stored) {
        const parsed = JSON.parse(stored);
        const theme = parsed?.state?.theme;
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else if (theme === 'light') {
          document.documentElement.classList.remove('dark');
        } else {
          // system
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          document.documentElement.classList.toggle('dark', prefersDark);
        }
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return <>{children}</>;
}
