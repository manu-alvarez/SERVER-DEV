import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { HistoryEntry, Provider } from './api';

interface AppState {
  provider: Provider;
  history: HistoryEntry[];
  setProvider: (provider: Provider) => void;
  addToHistory: (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => void;
  clearHistory: () => void;
  deleteHistoryItem: (id: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      provider: 'groq',
      history: [],
      setProvider: (provider) => set({ provider }),
      addToHistory: (entry) => set((state) => ({
        history: [
          { ...entry, id: crypto.randomUUID(), timestamp: Date.now() },
          ...state.history
        ].slice(0, 100) // Keep last 100 entries
      })),
      clearHistory: () => set({ history: [] }),
      deleteHistoryItem: (id) => set((state) => ({
        history: state.history.filter((h) => h.id !== id)
      })),
    }),
    {
      name: 'traductor-pro-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
