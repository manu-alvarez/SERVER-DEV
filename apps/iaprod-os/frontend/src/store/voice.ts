import { create } from 'zustand'

interface VoiceState {
  isListening: boolean
  isSpeaking: boolean
  volume: number
  transcript: string
  setListening: (v: boolean) => void
  setSpeaking: (v: boolean) => void
  setVolume: (v: number) => void
  setTranscript: (v: string) => void
}

export const useVoiceStore = create<VoiceState>((set) => ({
  isListening: false,
  isSpeaking: false,
  volume: 0,
  transcript: '',
  setListening: (v) => set({ isListening: v }),
  setSpeaking: (v) => set({ isSpeaking: v }),
  setVolume: (v) => set({ volume: v }),
  setTranscript: (v) => set({ transcript: v }),
}))
