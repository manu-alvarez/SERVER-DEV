'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { resolveCarMode, resolveFlightMode, resolveTrainMode } from './geoUtils'
import type { Destination, TravelAnalysis } from './types'

interface Props {
  dest: Destination | null
  geo: TravelAnalysis | null
  nights: number
  onClose: () => void
}

const MODE_CONFIG: Record<string, { icon: string; title: string; color: string; bg: string; border: string }> = {
  car: { icon: '🚗', title: 'EN COCHE', color: '#60a5fa', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.25)' },
  flight: { icon: '✈️', title: 'EN AVIÓN', color: '#c084fc', bg: 'rgba(168,85,247,0.08)', border: 'rgba(168,85,247,0.25)' },
  train: { icon: '🚆', title: 'EN TREN', color: '#4ade80', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.25)' },
}

export function CompareModal({ dest, geo, nights, onClose }: Props) {
  if (!dest || !geo) return null

  const hotelTotal = dest.pricePerNight * nights

  const allModes = useMemo(() => {
    try {
      return {
        car: resolveCarMode(dest.lat, dest.lon),
        flight: resolveFlightMode(dest.lat, dest.lon),
        train: resolveTrainMode(dest.lat, dest.lon),
      }
    } catch {
      return null
    }
  }, [dest.lat, dest.lon])

  const rows: { label: string; values: Record<string, string> }[] = allModes ? [
    { label: 'Distancia', values: {
      car: `${allModes.car.distanceKm} km`,
      flight: `${allModes.flight.distanceKm} km`,
      train: `${allModes.train.distanceKm} km`,
    }},
    { label: 'Duración', values: {
      car: `${allModes.car.durationHours}h`,
      flight: allModes.flight.durationHours ? `${allModes.flight.durationHours}h` : '—',
      train: `${allModes.train.durationHours}h`,
    }},
    { label: allModes.car.details?.fuelCostEur ? 'Combustible' : 'Coste', values: {
      car: allModes.car.details?.fuelCostEur ? `${allModes.car.details.fuelCostEur}€` : `${allModes.car.costEur}€`,
      flight: `${allModes.flight.costEur}€`,
      train: `${allModes.train.costEur}€`,
    }},
    { label: 'Peajes', values: {
      car: allModes.car.details?.tollCostEur ? `${allModes.car.details.tollCostEur}€` : '—',
      flight: '—',
      train: '—',
    }},
    ...(allModes.flight.details?.nearestAirportName ? [{ label: 'Salida', values: {
      car: 'Mequinenza',
      flight: allModes.flight.details.nearestAirportName,
      train: allModes.train.details?.nearestStationName || '—',
    }}] : []),
    { label: `Hotel ${nights}N`, values: {
      car: `${hotelTotal.toFixed(0)}€`,
      flight: `${hotelTotal.toFixed(0)}€`,
      train: `${hotelTotal.toFixed(0)}€`,
    }},
  ] : []

  const isRecommended = (mode: string) => {
    if (!allModes) return false
    const costs = [allModes.car.costEur, allModes.flight.costEur, allModes.train.costEur] as const
    return costs[mode === 'car' ? 0 : mode === 'flight' ? 1 : 2] === Math.min(...costs)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass rounded-2xl p-8 max-w-2xl w-full relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 bg-none border-none text-text-muted text-lg cursor-pointer">✕</button>

        <h2 className="text-xl font-bold font-serif text-foreground mb-1">{dest.image} {dest.name}</h2>
        <p className="text-xs text-text-muted font-mono mb-6">
          {nights} noches · 2 adultos + 1 niña (3.5 años) · Origen: Mequinenza
        </p>

        {/* Three-column comparison */}
        {allModes && rows.length > 0 && (
          <div className="space-y-3">
            {/* Header */}
            <div className="grid grid-cols-4 gap-2 text-[10px] font-mono text-text-muted uppercase tracking-wider pb-1 border-b border-white/5">
              <div></div>
            {(['car', 'flight', 'train'] as const).map((mode) => {
              const c = MODE_CONFIG[mode]
              const total = hotelTotal + allModes[mode].costEur
              return (
                <div key={mode} className="text-center" style={{ color: c.color }}>
                  <div>{total.toFixed(0)}€</div>
                  <div className="text-[8px] opacity-70">familia completa</div>
                </div>
              )
            })}
            </div>

            {/* Rows */}
            {rows.map((row) => (
              <div key={row.label} className="grid grid-cols-4 gap-2 text-xs py-1.5 border-b border-white/[0.03]">
                <div className="font-mono text-text-muted">{row.label}</div>
                {['car', 'flight', 'train'].map((mode) => (
                  <div key={mode} className="text-center font-mono font-semibold text-foreground">
                    {row.values[mode] || '—'}
                  </div>
                ))}
              </div>
            ))}

            {/* Totals */}
            <div className="grid grid-cols-4 gap-2 text-sm pt-2 border-t border-white/10 font-bold">
              <div className="font-mono text-text-muted">TOTAL</div>
              {(['car', 'flight', 'train'] as const).map((mode) => {
                const c = MODE_CONFIG[mode]
                const total = hotelTotal + allModes[mode].costEur
                return (
                  <div key={mode} className="text-center" style={{ color: c.color }}>
                    {total.toFixed(0)}€
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Recommended badge */}
        {allModes && (
          <div className="mt-6 flex justify-center">
            {(() => {
              const best = (['car', 'flight', 'train'] as const).reduce((a, b) =>
                allModes[a].costEur <= allModes[b].costEur ? a : b
              )
              const c = MODE_CONFIG[best]
              return (
                <span
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold font-mono"
                  style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.color }}
                >
                  {c.icon} RECOMENDADO: {c.title} ({allModes[best].costEur}€)
                </span>
              )
            })()}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
