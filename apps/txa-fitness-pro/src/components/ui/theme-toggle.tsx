"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/store/theme-store";
import { cn } from "@/utils/cn";
import { Moon, Sun } from "lucide-react";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme, setTheme } = useThemeStore();

  useEffect(() => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (!localStorage.getItem("txa-theme")) {
      setTheme(prefersDark ? "dark" : "light");
    }
  }, [setTheme]);

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
        "text-surface-500 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800",
        className
      )}
      aria-label={theme === "dark" ? "Modo claro" : "Modo oscuro"}
    >
      {theme === "dark" ? (
        <Sun className="w-4 h-4" />
      ) : (
        <Moon className="w-4 h-4" />
      )}
    </button>
  );
}
