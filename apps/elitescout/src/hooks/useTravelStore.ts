'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { fetchLiveDestinations } from '@/lib/family-travel/aiOrchestrator'
import type { AIDestination } from '@/lib/family-travel/aiOrchestrator'
import type { TravelAnalysis, TransportMode, AccommodationType } from '@/components/family-travel/types'

function getDefaultDates() {
  const today = new Date()
  const from = new Date(today); from.setDate(from.getDate() + 14)
  const to = new Date(from); to.setDate(to.getDate() + 7)
  return { dateFrom: from.toISOString().split('T')[0], dateTo: to.toISOString().split('T')[0] }
}

function calcNights(from: string, to: string): number {
  const d1 = new Date(from)
  const d2 = new Date(to)
  const diff = Math.round((d2.getTime() - d1.getTime()) / 86400000)
  return Math.max(1, Math.abs(diff))
}

const defaults = getDefaultDates()

interface TravelState {
  destinations: AIDestination[]
  isLoading: boolean
  error: string | null
  favorites: string[]
  compareItem: { dest: AIDestination; geo: TravelAnalysis } | null
  fuelPrice: number
  fuelConsumption: number
  destination: string
  transportModes: TransportMode[]
  accommodationType: AccommodationType | 'all'
  dateFrom: string
  dateTo: string
  nights: number
  search: (dest?: string, modes?: TransportMode[], accom?: AccommodationType | 'all') => Promise<void>
  toggleFavorite: (id: string) => void
  setCompareItem: (item: { dest: AIDestination; geo: TravelAnalysis } | null) => void
  setFuelPrice: (price: number) => void
  setFuelConsumption: (consumption: number) => void
  setDestination: (dest: string) => void
  setTransportModes: (modes: TransportMode[]) => void
  setAccommodationType: (type: AccommodationType | 'all') => void
  setDateFrom: (date: string) => void
  setDateTo: (date: string) => void
  exportFavorites: () => string
  importFavorites: (json: string) => void
  reset: () => void
}

export const useTravelStore = create<TravelState>()(
  persist(
    (set, get) => ({
      destinations: [],
      isLoading: false,
      error: null,
      favorites: [],
      compareItem: null,
      fuelPrice: 1.72,
      fuelConsumption: 6.5,
      destination: '',
      transportModes: ['car', 'flight', 'train'],
      accommodationType: 'hotel',
      dateFrom: defaults.dateFrom,
      dateTo: defaults.dateTo,
      nights: calcNights(defaults.dateFrom, defaults.dateTo),

      search: async (dest, modes, accom) => {
        set({ isLoading: true, error: null })
        try {
          const state = get()
          const currentDest = dest ?? state.destination
          if (dest !== undefined) set({ destination: dest })
          if (modes) set({ transportModes: modes })
          if (accom) set({ accommodationType: accom })
          const data = await fetchLiveDestinations(currentDest, state.dateFrom, state.dateTo, state.accommodationType)
          set({ destinations: data, isLoading: false })
          // Notify if supported
          if ('Notification' in window && Notification.permission === 'granted' && data.length > 0) {
            new Notification('🎉 Family Travel Finder', {
              body: `${data.length} destinos encontrados para ${currentDest || 'tu búsqueda'}!`,
              icon: '/icon-192.png',
            })
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Error desconocido'
          set({ error: message, isLoading: false })
        }
      },

      toggleFavorite: (id) =>
        set((state) => ({
          favorites: state.favorites.includes(id)
            ? state.favorites.filter((f) => f !== id)
            : [...state.favorites, id],
        })),

      setCompareItem: (item) => set({ compareItem: item }),
      setFuelPrice: (fuelPrice) => set({ fuelPrice }),
      setFuelConsumption: (fuelConsumption) => set({ fuelConsumption }),
      setDestination: (destination) => set({ destination }),
      setTransportModes: (transportModes) => set({ transportModes }),
      setAccommodationType: (accommodationType) => set({ accommodationType }),

      setDateFrom: (dateFrom) => set({ dateFrom, nights: calcNights(dateFrom, get().dateTo) }),
      setDateTo: (dateTo) => set({ dateTo, nights: calcNights(get().dateFrom, dateTo) }),

      exportFavorites: () => JSON.stringify(get().favorites, null, 2),

      importFavorites: (json) => {
        try { set({ favorites: JSON.parse(json) }) } catch { /* ignore */ }
      },

      reset: () => set({
        destinations: [], isLoading: false, error: null, compareItem: null,
        dateFrom: defaults.dateFrom, dateTo: defaults.dateTo,
        nights: calcNights(defaults.dateFrom, defaults.dateTo),
      }),
    }),
    {
      name: 'elitescout-family-travel',
      partialize: (state) => ({ favorites: state.favorites }),
    },
  ),
)
