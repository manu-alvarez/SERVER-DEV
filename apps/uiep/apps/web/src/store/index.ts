import { create } from 'zustand'

export interface UIEPUser {
  id: string
  email: string
  name: string
  role: 'admin' | 'user'
  plan: 'free' | 'pro' | 'enterprise'
}

interface AuthState {
  user: UIEPUser | null
  token: string | null
  isAuthenticated: boolean
  login: (token: string, user: UIEPUser) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('uiep_token') || null,
  isAuthenticated: !!localStorage.getItem('uiep_token'),
  login: (token, user) => {
    localStorage.setItem('uiep_token', token)
    set({ user, token, isAuthenticated: true })
  },
  logout: () => {
    localStorage.removeItem('uiep_token')
    set({ user: null, token: null, isAuthenticated: false })
  },
}))

interface ProjectState {
  currentProject: string | null
  projects: Array<{ id: string; name: string; type: string; updatedAt: string }>
  setCurrentProject: (id: string | null) => void
  addProject: (project: { id: string; name: string; type: string }) => void
}

export const useProjectStore = create<ProjectState>((set) => ({
  currentProject: null,
  projects: [],
  setCurrentProject: (id) => set({ currentProject: id }),
  addProject: (p) => set((s) => ({ projects: [...s.projects, { ...p, updatedAt: new Date().toISOString() }] })),
}))
