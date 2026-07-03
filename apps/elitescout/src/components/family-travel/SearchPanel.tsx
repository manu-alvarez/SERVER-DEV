'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTravelStore } from '@/hooks/useTravelStore'
import type { TransportMode, AccommodationType } from './types'
import { TRANSPORT_MODES, ACCOMMODATION_TYPES } from './constants'

const TRANSPORT_LABELS: Record<string, { icon: string; label: string }> = {
  car: { icon: '🚗', label: 'Coche' },
  flight: { icon: '✈️', label: 'Avión' },
  train: { icon: '🚆', label: 'Tren' },
}

export function SearchPanel() {
  const {
    search,
    isLoading,
    setFuelPrice,
    setFuelConsumption,
    dateFrom,
    dateTo,
    nights,
    setDateFrom,
    setDateTo,
    fuelPrice,
    fuelConsumption,
  } = useTravelStore()

  const [destination, setDestination] = useState('')
  const [selectedModes, setSelectedModes] = useState<TransportMode[]>(['car', 'flight', 'train'])
  const [accommodation, setAccommodation] = useState<AccommodationType | 'all'>('hotel')
  const [expanded, setExpanded] = useState(false)

  const toggleMode = (mode: TransportMode) => {
    setSelectedModes((prev) =>
      prev.includes(mode) ? prev.filter((m) => m !== mode) : [...prev, mode],
    )
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    search(destination, selectedModes, accommodation)
  }

  const statusMessages = [
    'Buscando en Tavily…',
    'Extrayendo datos con Groq…',
    'Puntuando con Gemini…',
    'Calculando rutas…',
  ]
  const statusIndex = Math.floor(Date.now() / 3000) % statusMessages.length

  return (
    <motion.div
      layout
      className={`glass rounded-2xl p-5 space-y-4 transition-all duration-500 ${isLoading ? 'opacity-70' : ''}`}
      style={{
        borderColor: isLoading ? 'rgba(255,107,107,0.3)' : 'rgba(212, 175, 55, 0.15)',
        background: isLoading
          ? 'linear-gradient(135deg, rgba(255,107,107,0.08), rgba(78,205,196,0.05))'
          : 'linear-gradient(135deg, rgba(212, 175, 55, 0.05), rgba(0, 229, 255, 0.03))',
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold font-serif text-foreground">
            🌍 Buscador de Viajes Familiar
          </h2>
          <p className="text-[10px] text-text-muted font-mono mt-0.5">
            Manu · Arantxa · Edelweiss 🦋 (3.5 años) · Origen: Mequinenza
          </p>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-text-muted font-mono bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 cursor-pointer hover:text-foreground transition-colors"
        >
          {expanded ? 'SIMPLE' : 'AVANZADO'}
        </button>
      </div>

      <form onSubmit={handleSearch} className="space-y-4">
        {/* Destination */}
        <div>
          <label className="text-[9px] text-gold font-mono uppercase tracking-wider">
            📍 Destino
          </label>
          <div className="flex gap-2 mt-1">
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Ej: Salou, París, Pirineos… (déjalo vacío para búsqueda general)"
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-mono focus:border-gold/30 outline-none transition-all"
            />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-[9px] text-gold font-mono uppercase tracking-wider">📅 Desde</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm font-mono focus:border-gold/30 outline-none transition-all mt-1" />
          </div>
          <div>
            <label className="text-[9px] text-gold font-mono uppercase tracking-wider">📅 Hasta</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm font-mono focus:border-gold/30 outline-none transition-all mt-1" />
          </div>
          <div>
            <label className="text-[9px] text-gold font-mono uppercase tracking-wider">🌙 Noches</label>
            <div className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm font-mono mt-1 text-cyan font-bold flex items-center h-[42px]">
              {nights} noches
            </div>
          </div>
        </div>

        {/* Transport mode selector */}
        <div>
          <label className="text-[9px] text-gold font-mono uppercase tracking-wider">
            🚗 Modo de transporte
          </label>
          <div className="flex gap-2 mt-1">
            {TRANSPORT_MODES.map((mode) => {
              const info = TRANSPORT_LABELS[mode]
              const active = selectedModes.includes(mode)
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => toggleMode(mode)}
                  aria-label={`${info.label}${active ? ' (seleccionado)' : ''}`}
                  aria-pressed={active}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono transition-all cursor-pointer"
                  style={{
                    background: active ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${active ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.06)'}`,
                    color: active ? '#D4AF37' : '#666',
                  }}
                >
                  {info.icon} {info.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Accommodation type */}
        <div>
          <label className="text-[9px] text-gold font-mono uppercase tracking-wider">
            🏠 Tipo de alojamiento
          </label>
          <div className="flex gap-2 mt-1">
            {(['hotel', 'apartamento', 'casa', 'all'] as const).map((type) => {
              const icons: Record<string, string> = { hotel: '🏨', apartamento: '🏠', casa: '🏡', all: '🔀' }
              const labels: Record<string, string> = { hotel: 'Hotel', apartamento: 'Apartamento', casa: 'Casa', all: 'Todos' }
              const active = accommodation === type
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setAccommodation(type)}
                  aria-label={`${labels[type]}${active ? ' (seleccionado)' : ''}`}
                  aria-pressed={active}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono transition-all cursor-pointer"
                  style={{
                    background: active ? 'rgba(0,229,255,0.15)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${active ? 'rgba(0,229,255,0.3)' : 'rgba(255,255,255,0.06)'}`,
                    color: active ? '#00E5FF' : '#666',
                  }}
                >
                  {icons[type]} {labels[type]}
                </button>
              )
            })}
          </div>
        </div>

        {/* Expanded: fuel settings */}
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-3 pt-2 border-t border-white/[0.06]"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] text-text-muted font-mono uppercase tracking-wider">Precio combustible (€/L)</label>
                <input
                  type="number"
                  value={fuelPrice}
                  onChange={(e) => setFuelPrice(Number(e.target.value))}
                  step="0.01"
                  min="1"
                  max="3"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm font-mono focus:border-gold/30 outline-none transition-all mt-1"
                />
              </div>
              <div>
                <label className="text-[9px] text-text-muted font-mono uppercase tracking-wider">Consumo (L/100km)</label>
                <input
                  type="number"
                  value={fuelConsumption}
                  onChange={(e) => setFuelConsumption(Number(e.target.value))}
                  step="0.1"
                  min="3"
                  max="15"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm font-mono focus:border-gold/30 outline-none transition-all mt-1"
                />
              </div>
            </div>
          </motion.div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gold text-luxury-black font-bold py-3 rounded-xl hover:bg-vivid-gold transition-all shadow-lg shadow-gold/20 disabled:opacity-50 disabled:cursor-not-allowed text-sm tracking-wider cursor-pointer"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-luxury-black/30 border-t-luxury-black rounded-full animate-spin" />
              {statusMessages[statusIndex]}
            </span>
          ) : (
            '🔍 BUSCAR VIAJES'
          )}
        </button>
      </form>
    </motion.div>
  )
}
