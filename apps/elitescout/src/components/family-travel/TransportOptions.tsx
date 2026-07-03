'use client'

import { motion } from 'framer-motion'
import type { TravelAnalysis } from './types'

const LOGOS: Record<string, string> = { car: '🚗', flight: '✈️', train: '🚆' }

const STYLES: Record<string, { bg: string; border: string; text: string; activeBg: string; activeBorder: string }> = {
  car: {
    bg: 'rgba(255,107,107,0.06)', border: 'rgba(255,107,107,0.15)', text: '#FF6B6B',
    activeBg: 'rgba(255,107,107,0.15)', activeBorder: 'rgba(255,107,107,0.4)',
  },
  flight: {
    bg: 'rgba(167,139,250,0.06)', border: 'rgba(167,139,250,0.15)', text: '#A78BFA',
    activeBg: 'rgba(167,139,250,0.15)', activeBorder: 'rgba(167,139,250,0.4)',
  },
  train: {
    bg: 'rgba(78,205,196,0.06)', border: 'rgba(78,205,196,0.15)', text: '#4ECDC4',
    activeBg: 'rgba(78,205,196,0.15)', activeBorder: 'rgba(78,205,196,0.4)',
  },
}

interface Props {
  options: TravelAnalysis[]
  selected?: string
  onSelect: (mode: string) => void
  destName: string
  familyScore: number
}

export function TransportOptions({ options, selected, onSelect, destName, familyScore }: Props) {
  return (
    <div className="space-y-2">
      <div className="text-[9px] text-text-muted font-mono uppercase tracking-wider flex items-center gap-2">
        <span>🚗✈️🚆 Opciones de transporte</span>
        <span className="text-[8px] opacity-50">(selecciona)</span>
      </div>
      {options.map((opt, i) => {
        const s = STYLES[opt.mode] || STYLES.car
        const active = !selected || selected === opt.mode
        return (
          <motion.button
            key={opt.mode}
            whileTap={{ scale: 0.97 }}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            onClick={() => onSelect(opt.mode)}
            className="w-full rounded-xl p-2.5 text-left transition-all cursor-pointer"
            style={{
              background: active ? s.activeBg : s.bg,
              border: `1px solid ${active ? s.activeBorder : s.border}`,
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{LOGOS[opt.mode]}</span>
                <span className="text-xs font-bold font-mono tracking-wide" style={{ color: s.text }}>
                  {opt.mode === 'car' ? 'COCHE' : opt.mode === 'flight' ? 'AVIÓN' : 'TREN'}
                </span>
                {active && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-[10px]"
                  >
                    ✅
                  </motion.span>
                )}
              </div>
              <span className="text-sm font-extrabold" style={{ color: s.text }}>
                {opt.costEur}€
              </span>
            </div>
            <div className="flex gap-3 mt-1 text-[9px] text-text-muted font-mono">
              <span>{opt.distanceKm} km</span>
              {opt.durationHours > 0 && <span>⏱ {opt.durationHours}h</span>}
              {opt.mode === 'car' && opt.details?.fuelCostEur && <span>⛽ {opt.details.fuelCostEur}€</span>}
              {opt.mode === 'flight' && opt.details?.nearestAirportName && <span>🛫 {opt.details.nearestAirportName}</span>}
              {opt.mode === 'train' && opt.details?.nearestStationName && <span>🚉 {opt.details.nearestStationName}</span>}
            </div>
          </motion.button>
        )
      })}
    </div>
  )
}
