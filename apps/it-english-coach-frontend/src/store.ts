import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Provider = "custom" | "openai" | "anthropic" | "gemini" | "groq" | "openrouter";

export interface Settings {
  provider: Provider;
  customBase: string;
  keys: Record<string, string>;
  models: Record<string, string>;
  proxyUrl: string;
}

export interface Progress {
  status: Record<string, boolean>; // moduleId -> isCompleted
}

export type TabType = 'dashboard' | 'temario' | 'practica' | 'pruebas' | 'writing' | 'speaking' | 'tutor' | 'settings';

interface AppState {
  // Navigation
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  
  // Settings
  settings: Settings;
  updateSettings: (partial: Partial<Settings>) => void;
  updateKey: (provider: string, key: string) => void;
  updateModel: (provider: string, model: string) => void;
  
  // Progress
  progress: Progress;
  toggleModuleProgress: (moduleId: string) => void;
}

const defaultSettings: Settings = {
  provider: "anthropic",
  customBase: "http://localhost:1234/v1",
  keys: { openai:"", anthropic:"", gemini:"", groq:"", openrouter:"", custom:"" },
  models: { openai:"gpt-4o", anthropic:"claude-3-5-sonnet-20240620", gemini:"gemini-1.5-pro", groq:"llama3-8b-8192", openrouter:"openai/gpt-4o", custom:"lmstudio-community/Meta-Llama-3-8B-Instruct-GGUF" },
  proxyUrl: "https://msbross.me/_itenglish/proxy"
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeTab: 'dashboard',
      setActiveTab: (tab) => set({ activeTab: tab }),
      
      settings: defaultSettings,
      updateSettings: (partial) => set((state) => ({ settings: { ...state.settings, ...partial } })),
      updateKey: (provider, key) => set((state) => ({ 
        settings: { ...state.settings, keys: { ...state.settings.keys, [provider]: key } } 
      })),
      updateModel: (provider, model) => set((state) => ({ 
        settings: { ...state.settings, models: { ...state.settings.models, [provider]: model } } 
      })),
      
      progress: { status: {} },
      toggleModuleProgress: (moduleId) => set((state) => {
        const newStatus = { ...state.progress.status };
        newStatus[moduleId] = !newStatus[moduleId];
        return { progress: { status: newStatus } };
      })
    }),
    {
      name: 'itenglish-storage',
    }
  )
)
