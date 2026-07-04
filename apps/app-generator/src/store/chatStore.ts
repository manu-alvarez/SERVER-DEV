import { create } from 'zustand';

export type Role = 'user' | 'assistant';

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
}

interface ChatState {
  messages: Message[];
  addMessage: (role: Role, content: string) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  addMessage: (role, content) =>
    set((state) => ({
      messages: [
        ...state.messages,
        { id: crypto.randomUUID(), role, content, timestamp: Date.now() },
      ],
    })),
  clearMessages: () => set({ messages: [] }),
}));
