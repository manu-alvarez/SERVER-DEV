import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GasStationState {
  user: any | null;
  view: string;
  setUser: (user: any | null) => void;
  setView: (view: string) => void;
  logout: () => void;
}

export const useStore = create<GasStationState>()(
  persist(
    (set) => ({
      user: null,
      view: 'dashboard',
      setUser: (user) => set({ user }),
      setView: (view) => set({ view }),
      logout: () => set({ user: null, view: 'dashboard' }),
    }),
    {
      name: 'gas-station-store',
      partialize: (state) => ({ user: state.user }), // Only persist user
    }
  )
);
