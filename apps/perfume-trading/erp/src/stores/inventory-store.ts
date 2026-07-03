'use client';

import { create } from 'zustand';
import type { Inventory } from '@/types';

interface InventoryState {
  items: Inventory[];
  lowStockThreshold: number;
  loading: boolean;
  setItems: (items: Inventory[]) => void;
  setLoading: (loading: boolean) => void;
  getLowStock: () => Inventory[];
  getExpiringSoon: (days?: number) => Inventory[];
}

export const useInventoryStore = create<InventoryState>()((set, get) => ({
  items: [],
  lowStockThreshold: 20,
  loading: false,

  setItems: (items) => set({ items }),
  setLoading: (loading) => set({ loading }),

  getLowStock: () => {
    const threshold = get().lowStockThreshold;
    return get().items.filter((i) => i.quantity < threshold);
  },

  getExpiringSoon: (days = 90) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + days);
    return get().items.filter((i) => i.expiry_date && new Date(i.expiry_date) <= cutoff);
  },
}));
