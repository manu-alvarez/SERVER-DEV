import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { HistoryCombo } from '../types';

interface ComboState {
  apiKey: string;
  setApiKey: (key: string) => void;
  removeApiKey: () => void;
  
  selectedLeagues: string[];
  toggleLeague: (key: string) => void;
  
  risk: 'safe' | 'balanced' | 'turbo';
  setRisk: (risk: 'safe' | 'balanced' | 'turbo') => void;
  
  stake: number;
  setStake: (stake: number) => void;
  
  selectedMarket: string;
  setSelectedMarket: (market: string) => void;
  
  history: HistoryCombo[];
  addHistoryCombos: (combos: HistoryCombo[]) => void;
  updateHistoryStatus: (id: string, status: 'pending' | 'won' | 'lost') => void;
  clearHistory: () => void;
}

export const useComboStore = create<ComboState>()(
  persist(
    (set) => ({
      apiKey: '',
      setApiKey: (key) => set({ apiKey: key }),
      removeApiKey: () => set({ apiKey: '' }),

      selectedLeagues: [
        'soccer_fifa_world_cup',
        'soccer_uefa_champs_league',
        'soccer_uefa_europa_league',
        'soccer_epl',
        'soccer_spain_la_liga',
        'soccer_italy_serie_a',
        'soccer_germany_bundesliga',
        'soccer_france_ligue_one',
        'soccer_netherlands_eredivisie',
        'soccer_portugal_primeira_liga'
      ],
      toggleLeague: (key) => set((state) => ({
        selectedLeagues: state.selectedLeagues.includes(key)
          ? state.selectedLeagues.filter(l => l !== key)
          : [...state.selectedLeagues, key]
      })),

      risk: 'balanced',
      setRisk: (risk) => set({ risk }),

      stake: 10,
      setStake: (stake) => set({ stake }),

      selectedMarket: 'auto',
      setSelectedMarket: (market) => set({ selectedMarket: market }),

      history: [],
      addHistoryCombos: (combos) => set((state) => ({ 
        history: [...combos, ...state.history] 
      })),
      updateHistoryStatus: (id, status) => set((state) => ({
        history: state.history.map(c => c.id === id ? { ...c, status } : c)
      })),
      clearHistory: () => set({ history: [] })
    }),
    {
      name: 'combipro_store',
      partialize: (state) => ({ 
        apiKey: state.apiKey, 
        history: state.history, 
        risk: state.risk, 
        stake: state.stake, 
        selectedMarket: state.selectedMarket 
      })
    }
  )
);
