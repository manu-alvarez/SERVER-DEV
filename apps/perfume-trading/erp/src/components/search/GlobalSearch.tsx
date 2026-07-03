'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowRight, Package, Users, ArrowLeftRight, FileText, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Searchable data ───
const SEARCH_ENTRIES = [
  // Products
  { id: 'p1', label: 'Chanel Bleu de Chanel EDP 100ml', category: 'Productos', href: '/catalog', keywords: 'chanel bleu edp 100ml perfume fragancia' },
  { id: 'p2', label: 'Dior Sauvage EDT 100ml Tester', category: 'Productos', href: '/catalog', keywords: 'dior sauvage edt tester perfume' },
  { id: 'p3', label: 'Creed Aventus EDP 100ml', category: 'Productos', href: '/catalog', keywords: 'creed aventus edp 100ml niche lujo' },
  { id: 'p4', label: 'Tom Ford Ombre Leather EDP 100ml', category: 'Productos', href: '/catalog', keywords: 'tom ford ombre leather edp' },
  { id: 'p5', label: 'Lancôme La Vie Est Belle EDP 75ml', category: 'Productos', href: '/catalog', keywords: 'lancome vie est belle edp femenino' },
  { id: 'p6', label: 'Jo Malone Wood Sage & Sea Salt 100ml', category: 'Productos', href: '/catalog', keywords: 'jo malone wood sage sea salt unisex' },
  { id: 'p7', label: 'Prada Luna Rossa Carbon EDT 150ml', category: 'Productos', href: '/catalog', keywords: 'prada luna rossa carbon edt tester' },
  { id: 'p8', label: 'YSL Libre EDP 90ml', category: 'Productos', href: '/catalog', keywords: 'ysl libre edp femenino' },
  // Partners
  { id: 'sp1', label: 'GlobalFragance GmbH', category: 'Socios', href: '/partners', keywords: 'globalfragance alemania proveedor' },
  { id: 'sp2', label: 'Parfums World SA', category: 'Socios', href: '/partners', keywords: 'parfums world francia ambos' },
  { id: 'sp3', label: 'Luxury Scents Ltd', category: 'Socios', href: '/partners', keywords: 'luxury scents reino unido proveedor' },
  { id: 'sp4', label: 'Aroma Select SL', category: 'Socios', href: '/partners', keywords: 'aroma select españa cliente' },
  { id: 'sp5', label: 'Beauty Distribution Inc', category: 'Socios', href: '/partners', keywords: 'beauty distribution usa cliente' },
  { id: 'sp6', label: 'Scents Global Brokers AG', category: 'Socios', href: '/partners', keywords: 'scents global brokers suiza broker' },
  // Trading
  { id: 't1', label: 'Offer — Chanel Bleu de Chanel a GlobalFragance', category: 'Trading', href: '/trading', keywords: 'offer chanel globalfragance activa' },
  { id: 't2', label: 'Offer — Dior Sauvage a Parfums World', category: 'Trading', href: '/trading', keywords: 'offer dior parfums world activa' },
  { id: 't3', label: 'Bid — Tom Ford Ombre Leather de Aroma Select', category: 'Trading', href: '/trading', keywords: 'bid tom ford aroma select activa' },
  { id: 't4', label: 'Bid — Lancôme La Vie Est Belle de Beauty Dist.', category: 'Trading', href: '/trading', keywords: 'bid lancome beauty distribution accepted' },
  // Invoices
  { id: 'i1', label: 'INV-2026-0001 — GlobalFragance GmbH', category: 'Facturas', href: '/invoices', keywords: 'inv 2026 0001 globalfragance pagada' },
  { id: 'i2', label: 'INV-2026-0002 — Parfums World SA', category: 'Facturas', href: '/invoices', keywords: 'inv 2026 0002 parfums world pendiente' },
  { id: 'i3', label: 'INV-2026-0003 — Aroma Select SL', category: 'Facturas', href: '/invoices', keywords: 'inv 2026 0003 aroma select approved' },
  // Pages
  { id: 'nav1', label: 'Dashboard — Panel de Control', category: 'Navegación', href: '/', keywords: 'dashboard panel control inicio' },
  { id: 'nav2', label: 'Catálogo Maestro', category: 'Navegación', href: '/catalog', keywords: 'catalogo maestro sku productos' },
  { id: 'nav3', label: 'Trading B2B', category: 'Navegación', href: '/trading', keywords: 'trading offers bids operaciones' },
  { id: 'nav4', label: 'Socios B2B', category: 'Navegación', href: '/partners', keywords: 'socios partners proveedores clientes brokers' },
  { id: 'nav5', label: 'Facturación', category: 'Navegación', href: '/invoices', keywords: 'facturas invoices proforma' },
  { id: 'nav6', label: 'Correo Comercial', category: 'Navegación', href: '/email', keywords: 'correo email plantillas templates' },
  { id: 'nav8', label: 'Configuración', category: 'Navegación', href: '/settings', keywords: 'configuracion settings preferencias' },
];

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Productos: Package,
  Socios: Users,
  Trading: ArrowLeftRight,
  Facturas: FileText,
  Navegación: Search,
};

// Custom event to toggle search from anywhere
export function openGlobalSearch() {
  window.dispatchEvent(new CustomEvent('teringp:search'));
}

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Keyboard shortcut: Cmd+K or Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') setIsOpen(false);
    };
    const customHandler = () => setIsOpen(true);
    document.addEventListener('keydown', handler);
    window.addEventListener('teringp:search', customHandler);
    return () => {
      document.removeEventListener('keydown', handler);
      window.removeEventListener('tingerp:search', customHandler);
    };
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 50);
  }, [isOpen]);

  const results = query.trim()
    ? SEARCH_ENTRIES.filter(
        (e) =>
          e.label.toLowerCase().includes(query.toLowerCase()) ||
          e.keywords.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 10)
    : SEARCH_ENTRIES.slice(0, 6);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIdx((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && results[selectedIdx]) {
        router.push(results[selectedIdx].href);
        setIsOpen(false);
        setQuery('');
      }
    },
    [results, selectedIdx, router]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

      {/* Dialog */}
      <div className="relative w-full max-w-lg bg-white dark:bg-[#1e1e1e] border border-[#EDEBE9] dark:border-[#333] shadow-2xl">
        {/* Search input */}
        <div className="flex items-center px-4 border-b border-[#EDEBE9] dark:border-[#333]">
          <Search size={16} className="text-[#605E5C] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIdx(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Buscar productos, socios, operaciones..."
            className="flex-1 px-3 py-3 text-sm bg-transparent border-none outline-none text-[#323130] dark:text-[#e0e0e0] placeholder:text-[#aaa]"
          />
          <kbd className="text-[10px] text-[#605E5C] border border-[#EDEBE9] dark:border-[#444] px-1.5 py-0.5 rounded">
            ESC
          </kbd>
        </div>

        {/* Results */}
        {results.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#605E5C]">
            No se encontraron resultados para <strong>"{query}"</strong>
          </div>
        ) : (
          <ul className="max-h-80 overflow-y-auto p-2">
            {results.map((entry, idx) => {
              const Icon = CATEGORY_ICONS[entry.category] ?? Search;
              return (
                <li
                  key={entry.id}
                  onClick={() => {
                    router.push(entry.href);
                    setIsOpen(false);
                    setQuery('');
                  }}
                  onMouseEnter={() => setSelectedIdx(idx)}
                  className={cn(
                    'flex items-center px-3 py-2.5 rounded cursor-pointer text-sm transition-colors',
                    idx === selectedIdx
                      ? 'bg-[#f43f5e]/10 dark:bg-[#fb7185]/20 text-[#f43f5e] dark:text-[#fb7185]'
                      : 'text-[#323130] dark:text-[#e0e0e0] hover:bg-[#F3F2F1] dark:hover:bg-[#2a2a2a]'
                  )}
                >
                  <Icon size={16} className="shrink-0 mr-3 text-[#605E5C]" />
                  <span className="flex-1 truncate">{entry.label}</span>
                  <span className="text-[10px] text-[#605E5C] mr-2 shrink-0">{entry.category}</span>
                  <ArrowRight size={14} className="shrink-0 opacity-0 group-hover:opacity-100" />
                </li>
              );
            })}
          </ul>
        )}

        {/* Footer */}
        <div className="px-4 py-2 border-t border-[#EDEBE9] dark:border-[#333] flex items-center text-[10px] text-[#605E5C] space-x-4">
          <span>↑↓ Navegar</span>
          <span>↵ Abrir</span>
          <span>ESC Cerrar</span>
          <span className="ml-auto">{results.length} resultados</span>
        </div>
      </div>
    </div>
  );
}
