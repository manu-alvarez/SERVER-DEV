"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/store/theme-store";

export function ThemeInit() {
  const setTheme = useThemeStore((s) => s.setTheme);

  useEffect(() => {
    const stored = localStorage.getItem("txa-theme");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed?.state?.theme === "dark") {
          document.documentElement.classList.add("dark");
        }
      } catch {
        // ignore
      }
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(prefersDark ? "dark" : "light");
    }
  }, [setTheme]);

  return null;
}
