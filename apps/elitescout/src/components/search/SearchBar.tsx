"use client";

import { useRef, useCallback, type KeyboardEvent } from "react";
import { motion } from "framer-motion";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  isLoading?: boolean;
  placeholder?: string;
  size?: "default" | "hero";
}

/**
 * Predictive search input with premium styling and keyboard shortcuts.
 */
export function SearchBar({
  value,
  onChange,
  onSearch,
  isLoading = false,
  placeholder = "Buscar productos, comparar precios, encontrar ofertas...",
  size = "default",
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && value.trim()) {
        onSearch();
      }
    },
    [value, onSearch]
  );

  const isHero = size === "hero";

  return (
    <motion.div
      className={`relative w-full max-w-2xl mx-auto ${isHero ? "group" : ""}`}
      initial={isHero ? { opacity: 0, y: 20 } : undefined}
      animate={isHero ? { opacity: 1, y: 0 } : undefined}
      transition={{ delay: 0.3, duration: 0.6 }}
    >
      {/* Glow backdrop for hero */}
      {isHero && (
        <div className="absolute -inset-1 bg-gradient-to-r from-gold/10 via-cyan/5 to-gold/10 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
      )}

      <div
        className={`relative flex items-center glass rounded-2xl transition-all duration-300 focus-within:border-gold/20 ${
          isHero ? "px-6 py-4" : "px-4 py-2.5"
        }`}
      >
        {/* Search icon */}
        <svg
          className={`shrink-0 text-text-muted ${isHero ? "w-5 h-5" : "w-4 h-4"}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-text-muted ml-3 ${
            isHero ? "text-base" : "text-sm"
          }`}
          id="search-input"
          autoComplete="off"
        />

        {/* Loading spinner or search button */}
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
        ) : (
          <button
            onClick={onSearch}
            disabled={!value.trim()}
            className={`shrink-0 rounded-xl font-semibold transition-colors ${
              value.trim()
                ? "bg-gold/10 text-gold hover:bg-gold/20"
                : "bg-white/5 text-text-muted cursor-default"
            } ${isHero ? "px-5 py-2 text-sm" : "px-3 py-1.5 text-xs"}`}
          >
            Buscar
          </button>
        )}
      </div>
    </motion.div>
  );
}
