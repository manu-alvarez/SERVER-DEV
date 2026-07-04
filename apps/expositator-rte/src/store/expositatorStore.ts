import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARNING' | 'CRITICAL';
  type: string;
  message: string;
  details?: any;
}

export interface ExpositatorState {
  apiKey: string;
  knowledgeBase: string;
  score: number;
  wpm: number;
  fillers: number;
  deviations: number;
  logs: LogEntry[];
  isRunning: boolean;
  
  setApiKey: (key: string) => void;
  setKnowledgeBase: (kb: string) => void;
  startSession: () => void;
  stopSession: () => void;
  updateMetrics: (metrics: { score: number; wpm: number; fillers: number; deviations: number }) => void;
  addLog: (log: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;
}

export const useExpositatorStore = create<ExpositatorState>()(
  persist(
    (set) => ({
      apiKey: '',
      knowledgeBase: '',
      score: 10.0,
      wpm: 0,
      fillers: 0,
      deviations: 0,
      logs: [],
      isRunning: false,

      setApiKey: (key) => set({ apiKey: key }),
      setKnowledgeBase: (kb) => set({ knowledgeBase: kb }),
      startSession: () => set({ isRunning: true, score: 10.0, wpm: 0, fillers: 0, deviations: 0, logs: [] }),
      stopSession: () => set({ isRunning: false }),
      updateMetrics: (metrics) => set((state) => ({ ...state, ...metrics })),
      addLog: (log) => set((state) => ({
        logs: [
          {
            ...log,
            id: Math.random().toString(36).substring(7),
            timestamp: new Date().toISOString(),
          },
          ...state.logs,
        ],
      })),
      clearLogs: () => set({ logs: [] }),
    }),
    {
      name: 'expositator-storage',
      partialize: (state) => ({ apiKey: state.apiKey }), // Only persist apiKey
    }
  )
);
