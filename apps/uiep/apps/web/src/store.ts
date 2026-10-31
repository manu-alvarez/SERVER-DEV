import { create } from 'zustand'
import { api, ApiError } from './lib/api'

/**
 * Estado del fondo de consola: la UI solo distingue desconocido/operador/anónimo.
 * La cookie de sesión HttpOnly la gestiona el navegador; aquí solo reflejamos
 * el resultado de /api/console/auth/session.
 */

export type AuthStatus = 'unknown' | 'authed' | 'anon'

interface ConsoleState {
  status: AuthStatus
  expiresAt: string | null
  consoleDisabled: boolean
  refresh: () => Promise<AuthStatus>
  login: (password: string) => Promise<void>
  logout: () => Promise<void>
}

export const useConsole = create<ConsoleState>((set) => ({
  status: 'unknown',
  expiresAt: null,
  consoleDisabled: false,
  refresh: async () => {
    try {
      const r = await api.auth.session()
      set({ status: 'authed', expiresAt: r.expiresAt, consoleDisabled: false })
      return 'authed' as const
    } catch (err) {
      if (err instanceof ApiError && err.status === 503) {
        set({ status: 'anon', consoleDisabled: true, expiresAt: null })
      } else {
        set({ status: 'anon', consoleDisabled: false, expiresAt: null })
      }
      return 'anon' as const
    }
  },
  login: async (password: string) => {
    const r = await api.auth.login(password)
    set({ status: 'authed', expiresAt: r.expiresAt, consoleDisabled: false })
  },
  logout: async () => {
    try {
      await api.auth.logout()
    } finally {
      set({ status: 'anon', expiresAt: null })
    }
  },
}))
