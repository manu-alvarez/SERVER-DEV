'use client';

import { create } from 'zustand';
import type { TradingItem, TradeType, TradeStatus } from '@/types';

interface TradingState {
  items: TradingItem[];
  filter: { type: TradeType | 'all'; status: TradeStatus | 'all' };
  search: string;
  loading: boolean;
  setFilter: (filter: Partial<TradingState['filter']>) => void;
  setSearch: (search: string) => void;
  setLoading: (loading: boolean) => void;
  setItems: (items: TradingItem[]) => void;
  getFiltered: () => TradingItem[];
}

export const useTradingStore = create<TradingState>()((set, get) => ({
  items: [],
  filter: { type: 'all', status: 'all' },
  search: '',
  loading: false,

  setFilter: (filter) =>
    set((s) => ({ filter: { ...s.filter, ...filter } })),

  setSearch: (search) => set({ search }),
  setLoading: (loading) => set({ loading }),
  setItems: (items) => set({ items }),

  getFiltered: () => {
    const { items, filter, search } = get();
    const q = search.toLowerCase();
    return items.filter((item) => {
      if (filter.type !== 'all' && item.type !== filter.type) return false;
      if (filter.status !== 'all' && item.status !== filter.status) return false;
      if (q && !item.brand_name?.toLowerCase().includes(q) &&
          !item.product_name?.toLowerCase().includes(q) &&
          !item.partner_name?.toLowerCase().includes(q)) return false;
      return true;
    });
  },
}));
