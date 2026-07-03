/** Zustand stores for global state management. */

import { create } from "zustand";
import type { ChatMessage, Conversation, ModelInfo, User } from "@/types/chat";

// ── Auth Store ────────────────────────────────────────────

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));

// ── API Key Store ─────────────────────────────────────────
import { persist, createJSONStorage } from "zustand/middleware";

interface ApiKeyState {
  keys: Record<string, string>;
  setKey: (provider: string, key: string) => void;
  removeKey: (provider: string) => void;
  getKey: (provider: string) => string | undefined;
}

export const useApiStore = create<ApiKeyState>()(
  persist(
    (set, get) => ({
      keys: {},
      setKey: (provider, key) =>
        set((state) => ({ keys: { ...state.keys, [provider]: key } })),
      removeKey: (provider) =>
        set((state) => {
          const newKeys = { ...state.keys };
          delete newKeys[provider];
          return { keys: newKeys };
        }),
      getKey: (provider) => get().keys[provider],
    }),
    {
      name: "jartosdto-api-keys",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// ── Chat Store ────────────────────────────────────────────

interface ChatState {
  messages: ChatMessage[];
  conversationId: string | null;
  isStreaming: boolean;
  selectedModel: string;
  webSearchEnabled: boolean;
  temperature: number;
  maxTokens: number;
  autoSpeak: boolean;

  setMessages: (msgs: ChatMessage[]) => void;
  addMessage: (msg: ChatMessage) => void;
  updateLastAssistant: (content: string, thinking?: string) => void;
  setConversationId: (id: string | null) => void;
  setIsStreaming: (v: boolean) => void;
  setSelectedModel: (m: string) => void;
  setWebSearchEnabled: (v: boolean) => void;
  setTemperature: (t: number) => void;
  setMaxTokens: (t: number) => void;
  setAutoSpeak: (v: boolean) => void;
  clearChat: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  conversationId: null,
  isStreaming: false,
  selectedModel: "gpt-4o",
  webSearchEnabled: false,
  temperature: 0.7,
  maxTokens: 4096,
  autoSpeak: false,

  setMessages: (messages) => set({ messages }),
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  updateLastAssistant: (content, thinking) =>
    set((s) => {
      const msgs = [...s.messages];
      const last = msgs[msgs.length - 1];
      if (last?.role === "assistant") {
        last.content = content;
        if (thinking) last.thinking = thinking;
      }
      return { messages: msgs };
    }),
  setConversationId: (conversationId) => set({ conversationId }),
  setIsStreaming: (isStreaming) => set({ isStreaming }),
  setSelectedModel: (selectedModel) => set({ selectedModel }),
  setWebSearchEnabled: (webSearchEnabled) => set({ webSearchEnabled }),
  setTemperature: (temperature) => set({ temperature }),
  setMaxTokens: (maxTokens) => set({ maxTokens }),
  setAutoSpeak: (autoSpeak) => set({ autoSpeak }),
  clearChat: () => set({ messages: [], conversationId: null }),
}));

// ── UI Store ──────────────────────────────────────────────

interface UIState {
  sidebarOpen: boolean;
  theme: "dark" | "light";
  toggleSidebar: () => void;
  setTheme: (t: "dark" | "light") => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  theme: "dark",
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setTheme: (theme) => set({ theme }),
}));
