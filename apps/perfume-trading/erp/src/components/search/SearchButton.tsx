'use client';

import React from 'react';
import { Search } from 'lucide-react';

export function SearchButton() {
  return (
    <button
      onClick={() => window.dispatchEvent(new CustomEvent('teringp:search'))}
      className="flex items-center text-[11px] opacity-80 hover:opacity-100 transition-opacity"
      title="Buscar (Cmd+K)"
    >
      <Search size={16} className="mr-1" />
      <kbd className="hidden sm:inline text-[10px] border border-white/30 px-1 rounded">⌘K</kbd>
    </button>
  );
}
