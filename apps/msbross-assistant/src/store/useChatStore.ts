import { create } from 'zustand';
import { Message, ModelConfig } from '../lib/schemas';

interface ChatState {
  messages: Message[];
  models: ModelConfig[];
  selectedModel: string;
  isGenerating: boolean;
  systemPrompt: string;
  stitch: { isOpen: boolean; content: string; language: string };
  isToolsOpen: boolean;
  attachments: File[];
  
  addMessage: (msg: Message) => void;
  appendChunkToLastMessage: (chunk: string) => void;
  setMessages: (msgs: Message[]) => void;
  setModels: (models: ModelConfig[]) => void;
  setSelectedModel: (modelId: string) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setSystemPrompt: (prompt: string) => void;
  setStitch: (stitch: Partial<{ isOpen: boolean; content: string; language: string }>) => void;
  setIsToolsOpen: (isOpen: boolean) => void;
  setAttachments: (files: File[] | ((prev: File[]) => File[])) => void;
  clearAttachments: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  models: [],
  selectedModel: 'gm/gemini-3.5-flash',
  isGenerating: false,
  systemPrompt: 'Eres MSBrOSs Assistant, una IA avanzada y eficiente...',
  stitch: { isOpen: false, content: '', language: 'html' },
  isToolsOpen: false,
  attachments: [],
  
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  
  appendChunkToLastMessage: (chunk) => set((state) => {
    const newMessages = [...state.messages];
    if (newMessages.length === 0) return state;
    const lastIdx = newMessages.length - 1;
    newMessages[lastIdx] = { 
      ...newMessages[lastIdx], 
      content: newMessages[lastIdx].content + chunk 
    };

    // Very basic auto-stitch detection
    const fullContent = newMessages[lastIdx].content;
    const codeBlockMatch = fullContent.match(/```(html|tsx|jsx|javascript|js|css|python)\n([\s\S]*?)```/);
    let newStitch = state.stitch;
    
    if (codeBlockMatch && !state.stitch.isOpen) {
      newStitch = {
        isOpen: true,
        language: codeBlockMatch[1],
        content: codeBlockMatch[2]
      };
    } else if (codeBlockMatch && state.stitch.isOpen) {
      newStitch = {
        isOpen: true,
        language: codeBlockMatch[1],
        content: codeBlockMatch[2]
      };
    }

    return { messages: newMessages, stitch: newStitch };
  }),
  
  setMessages: (msgs) => set({ messages: msgs, stitch: { isOpen: false, content: '', language: 'html' } }),
  setModels: (models) => set({ models }),
  setSelectedModel: (modelId) => set({ selectedModel: modelId }),
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  setSystemPrompt: (prompt) => set({ systemPrompt: prompt }),
  setStitch: (stitchData) => set((state) => ({ stitch: { ...state.stitch, ...stitchData } })),
  setIsToolsOpen: (isOpen) => set({ isToolsOpen: isOpen }),
  setAttachments: (files) => set((state) => ({ 
    attachments: typeof files === 'function' ? files(state.attachments) : files 
  })),
  clearAttachments: () => set({ attachments: [] })
}));
