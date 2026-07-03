'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import { SearchPanel, CompareModal, OffersGrid, TravelChat } from '@/components/family-travel'
import { useTravelStore } from '@/hooks/useTravelStore'
import type { Destination, TravelAnalysis } from '@/components/family-travel/types'

const DestinationMap = dynamic(
  () => import('@/components/family-travel/DestinationMap').then((m) => m.DestinationMap),
  { ssr: false, loading: () => <div className="skeleton rounded-2xl h-80" /> },
)

export default function FamilyTravelPage() {
  const [sortBy, setSortBy] = useState<'family_score' | 'price' | 'distance'>('family_score')
  const [compareDest, setCompareDest] = useState<{ dest: Destination; geo: TravelAnalysis } | null>(null)
  const [notifEnabled, setNotifEnabled] = useState(false)
  const [showFavExport, setShowFavExport] = useState(false)

  const exportFavorites = useTravelStore((s) => s.exportFavorites)
  const importFavorites = useTravelStore((s) => s.importFavorites)
  const favorites = useTravelStore((s) => s.favorites)

  useEffect(() => {
    setNotifEnabled('Notification' in window && Notification.permission === 'granted')
  }, [])

  const requestNotification = useCallback(async () => {
    if (!('Notification' in window)) return
    const perm = await Notification.requestPermission()
    setNotifEnabled(perm === 'granted')
  }, [])

  const handleExport = useCallback(() => {
    const data = exportFavorites()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'elitescout-favoritos.json'; a.click()
    URL.revokeObjectURL(url)
  }, [exportFavorites])

  const handleImport = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'; input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => importFavorites(reader.result as string)
      reader.readAsText(file)
    }
    input.click()
  }, [importFavorites])

  const destinations = useTravelStore((s) => s.destinations)
  const error = useTravelStore((s) => s.error)
  const nights = useTravelStore((s) => s.nights)
  const dateFrom = useTravelStore((s) => s.dateFrom)
  const dateTo = useTravelStore((s) => s.dateTo)

  const handleCompare = useCallback((dest: Destination, geo: TravelAnalysis) => {
    setCompareDest({ dest, geo })
  }, [])

  const hasResults = destinations.length > 0 || error

  return (
    <div className="min-h-screen pt-6 pb-24 px-4 md:px-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border-gold/10 text-[9px] text-gold font-bold mb-4 tracking-[0.2em] uppercase">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-gold" />
          </span>
          AI Travel Intelligence
        </div>
        <h1 className="text-3xl md:text-5xl font-bold font-serif text-foreground mb-2">
          Viajes en <span className="gold-gradient-text">Familia</span>
        </h1>
        <p className="text-sm text-text-secondary max-w-xl mx-auto">
          Para           <strong className="text-blue-400">Manu</strong>,
          <strong className="text-yellow-400"> Arantxa</strong> y
          <strong className="text-pink-400"> Edelweiss</strong> 🦋 —
          buscamos el viaje familiar perfecto desde Mequinenza
        </p>
      </motion.div>

      <div className="mb-8">
        <SearchPanel />
      </div>

      <AnimatePresence mode="wait">
        {hasResults ? (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-xs text-text-muted font-mono">
                  {destinations.length} destinos encontrados
                </span>
                <span className="text-[10px] text-text-muted font-mono">
                  · {nights} noches ({dateFrom} → {dateTo})
                </span>
              </div>
              <div className="flex items-center gap-2">
                {(['family_score', 'price', 'distance'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSortBy(s)}
                    className={`text-[10px] px-2 py-1 rounded-lg transition-all cursor-pointer ${
                      sortBy === s
                        ? 'bg-gold/10 text-gold font-semibold'
                        : 'text-text-muted hover:text-text-secondary bg-transparent border-none'
                    }`}
                  >
                    {{ family_score: 'Family Score', price: 'Precio', distance: 'Distancia' }[s]}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {!notifEnabled ? (
                <button onClick={requestNotification}
                  className="text-[10px] px-2.5 py-1 rounded-lg font-mono cursor-pointer border-none transition-all"
                  style={{ background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.2)', color: '#FF6B6B' }}>
                  🔔 Activar notificaciones
                </button>
              ) : (
                <span className="text-[10px] px-2.5 py-1 rounded-lg font-mono"
                  style={{ background: 'rgba(78,205,196,0.1)', border: '1px solid rgba(78,205,196,0.2)', color: '#4ECDC4' }}>
                  ✅ Notificaciones activas
                </span>
              )}
              {favorites.length > 0 && (
                <>
                  <button onClick={() => setShowFavExport(!showFavExport)}
                    className="text-[10px] px-2.5 py-1 rounded-lg font-mono cursor-pointer border-none transition-all"
                    style={{ background: 'rgba(255,230,109,0.1)', border: '1px solid rgba(255,230,109,0.2)', color: '#FFE66D' }}>
                    ⭐ {favorites.length} favoritos
                  </button>
                  {showFavExport && (
                    <div className="flex gap-1">
                      <button onClick={handleExport}
                        className="text-[10px] px-2 py-1 rounded-lg font-mono cursor-pointer border-none"
                        style={{ background: 'rgba(78,205,196,0.1)', border: '1px solid rgba(78,205,196,0.2)', color: '#4ECDC4' }}>
                        📤 Exportar
                      </button>
                      <button onClick={handleImport}
                        className="text-[10px] px-2 py-1 rounded-lg font-mono cursor-pointer border-none"
                        style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', color: '#A78BFA' }}>
                        📥 Importar
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="mb-6">
              <DestinationMap
                destinations={destinations as any}
                selectedId={null}
              />
            </div>

            <OffersGrid
              nights={nights}
              sortBy={sortBy}
              onCompare={handleCompare}
            />

            <TravelChat />
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-20"
          >
            <span className="text-5xl mb-6 block">🌍</span>
            <h3 className="text-lg font-serif font-bold text-foreground mb-2">
              ¿A dónde vamos?
            </h3>
            <p className="text-sm text-text-muted font-mono max-w-md mx-auto">
              ¿Dónde vamos esta vez, Edelweiss? 🦋 Escribe un destino, elige fechas y pulsa BUSCAR.
            </p>
            <div className="flex justify-center gap-8 mt-8 text-xs text-text-muted font-mono">
              <span>🔍 Tavily busca</span>
              <span>⚡ Groq extrae</span>
              <span>🧠 Gemini puntúa</span>
              <span>🚗✈️🚆 Compara modos</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {compareDest && (
          <CompareModal
            dest={compareDest.dest}
            geo={compareDest.geo}
            nights={nights}
            onClose={() => setCompareDest(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
