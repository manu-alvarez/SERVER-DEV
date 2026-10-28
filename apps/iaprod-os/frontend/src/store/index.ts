import { create } from 'zustand'

export interface IAPUser {
  email: string
  role: 'user' | 'admin'
}

interface AuthState {
  token: string | null
  user: IAPUser | null
  isAuthenticated: boolean
  login: (token: string, user: IAPUser) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('iap_token') || null,
  user: null,
  isAuthenticated: !!localStorage.getItem('iap_token'),
  login: (token, user) => {
    localStorage.setItem('iap_token', token)
    set({ user, token, isAuthenticated: true })
  },
  logout: () => {
    localStorage.removeItem('iap_token')
    set({ user: null, token: null, isAuthenticated: false })
  },
}))

interface UIState {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  theme: 'dark' | 'neon'
  setTheme: (t: 'dark' | 'neon') => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  setSidebarOpen: (o) => set({ sidebarOpen: o }),
  theme: 'dark',
  setTheme: (t) => set({ theme: t }),
}))
