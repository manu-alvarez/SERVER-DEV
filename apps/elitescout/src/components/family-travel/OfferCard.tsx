'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { resolveCarMode, resolveFlightMode, resolveTrainMode } from './geoUtils'
import { TransportOptions } from './TransportOptions'
import { FamilyScoreBar } from './FamilyScoreBar'
import { FuelCalculator } from './FuelCalculator'
import type { Destination, TravelAnalysis, TransportMode } from './types'

interface Props {
  dest: Destination
  nights: number
  fuelPrice: number
  consumption: number
  onCompare: (dest: Destination, geo: TravelAnalysis) => void
  isFavorite: boolean
  onFavorite: (id: string) => void
}

const ACCOMMODATION_ICONS: Record<string, string> = {
  hotel: '🏨', apartamento: '🏠', casa: '🏡',
}

function ScoreEmoji({ score }: { score: number }) {
  if (score >= 0.8) return <span className="text-lg animate-bounce">🌟</span>
  if (score >= 0.6) return <span className="text-lg">👍</span>
  return <span className="text-lg">💪</span>
}

export function OfferCard({ dest, nights, fuelPrice, consumption, onCompare, isFavorite, onFavorite }: Props) {
  const [selectedMode, setSelectedMode] = useState<TransportMode | null>(null)
  const [showFuelCalc, setShowFuelCalc] = useState(false)

  const carGeo = useMemo(() => resolveCarMode(dest.lat, dest.lon, fuelPrice, consumption), [dest.lat, dest.lon, fuelPrice, consumption])
  const flightGeo = useMemo(() => ({
    ...resolveFlightMode(dest.lat, dest.lon),
    costEur: (dest as any).flightPrice || 180,
    details: { ...resolveFlightMode(dest.lat, dest.lon).details, realPrice: !!(dest as any).flightPrice },
  }), [dest.lat, dest.lon, (dest as any).flightPrice])
  const trainGeo = useMemo(() => ({
    ...resolveTrainMode(dest.lat, dest.lon),
    costEur: (dest as any).trainPrice || resolveTrainMode(dest.lat, dest.lon).costEur,
    details: { ...resolveTrainMode(dest.lat, dest.lon).details, realPrice: !!(dest as any).trainPrice },
  }), [dest.lat, dest.lon, (dest as any).trainPrice])
  const totalModes = useMemo(() => [carGeo, flightGeo, trainGeo], [carGeo, flightGeo, trainGeo])
  const activeGeo = useMemo(() => totalModes.find(m => m.mode === (selectedMode || 'car')) || totalModes[0], [totalModes, selectedMode])

  const totalHotel = dest.pricePerNight * nights
  const totalTrip = totalHotel + activeGeo.costEur
  const accomIcon = ACCOMMODATION_ICONS[dest.accommodationType] || '🏨'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      className="rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        background: 'linear-gradient(135deg, rgba(255,107,107,0.08), rgba(78,205,196,0.08), rgba(255,230,109,0.05))',
        border: '1px solid rgba(255,107,107,0.15)',
        boxShadow: '0 8px 32px rgba(255,107,107,0.08)',
      }}
    >
      {/* Photo section */}
      <div className="relative h-44 overflow-hidden" style={{
        background: `linear-gradient(135deg, rgba(255,107,107,0.15), rgba(78,205,196,0.15))`,
      }}>
        <img
          src={`https://picsum.photos/seed/${encodeURIComponent(dest.name.replace(/\s+/g, ''))}/600/400`}
          alt={dest.name}
          className="w-full h-full object-cover"
          loading="lazy"
          width={600}
          height={400}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end">
          <div>
            <div className="text-lg font-bold text-white drop-shadow-lg">{dest.name}</div>
            <div className="text-[10px] text-white/70 font-mono">{dest.country}</div>
          </div>
          <button
            onClick={() => onFavorite(dest.id)}
            className="text-xl transition-all drop-shadow-lg"
            style={{ opacity: isFavorite ? 1 : 0.5 }}
          >
            {isFavorite ? '❤️' : '🤍'}
          </button>
        </div>
          <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-sm rounded-full px-2.5 py-0.5 text-[11px]">
            {'⭐'.repeat(Math.max(1, Math.min(5, dest.stars || 4)))}
          </div>
        <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-sm rounded-full px-2.5 py-0.5 text-[11px] flex items-center gap-1">
          {accomIcon} {dest.accommodationType}
        </div>
      </div>

      {/* Hotel name */}
      <div className="px-4 pt-3">
        <div className="flex items-center gap-1.5 text-sm text-foreground font-medium">
          {accomIcon} {dest.hotelName}
        </div>
        <div className="text-[10px] text-text-muted font-mono mt-0.5">
          {dest.familyNotes || `${dest.name} · ${dest.country}`}
        </div>
      </div>

      {/* Transport options */}
      <div className="px-4 pt-3">
        <TransportOptions
          options={totalModes}
          selected={selectedMode || undefined}
          onSelect={(mode: string) => setSelectedMode(mode as TransportMode)}
          destName={dest.name}
          familyScore={dest.familyScore}
        />
      </div>

      {/* Family Score */}
      <div className="px-4 pt-3">
        <div className="flex items-center gap-2 mb-1">
          <ScoreEmoji score={dest.familyScore} />
          <FamilyScoreBar score={dest.familyScore} />
        </div>
      </div>

      {/* Pricing */}
      <div className="px-4 pb-3 pt-3">
        <div
          className="rounded-xl p-3 grid grid-cols-2 gap-2"
          style={{ background: 'rgba(255,255,255,0.04)' }}
        >
          <div>
            <div className="text-[9px] text-text-muted font-mono uppercase tracking-wider">🏨 Hotel {nights}N (familia)</div>
            <div className="text-base font-bold text-foreground">{totalHotel.toFixed(0)}€</div>
          </div>
          <div>
            <div className="text-[9px] text-text-muted font-mono uppercase tracking-wider">
              🚗✈️🚆 Transporte (3 pax)
            </div>
            <div className="text-base font-bold" style={{
              color: activeGeo.mode === 'car' ? '#60a5fa' : activeGeo.mode === 'flight' ? '#c084fc' : '#4ade80',
            }}>
              {activeGeo.costEur}€
            </div>
          </div>
          <div className="col-span-2 border-t border-white/[0.06] pt-2 mt-1">
            <div className="text-[9px] text-text-muted font-mono uppercase">💰 Total Familia (Manu + Arantxa + Edelweiss)</div>
            <div className="text-xl font-extrabold" style={{
              background: 'linear-gradient(135deg, #FF6B6B, #4ECDC4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              {totalTrip.toFixed(0)}€
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 flex gap-2">
        <button
          onClick={() => onCompare(dest, activeGeo)}
          className="flex-1 py-2.5 rounded-xl text-xs font-bold font-mono tracking-wider transition-all cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, rgba(255,107,107,0.15), rgba(78,205,196,0.15))',
            border: '1px solid rgba(255,107,107,0.2)',
            color: '#4ECDC4',
          }}
        >
          🎯 COMPARATIVA →
        </button>
        <a
          href={dest.url || `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(dest.name)}&group_adults=2&group_children=1&age=3`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center px-4 rounded-xl text-xs font-bold font-mono tracking-wider transition-all"
          style={{
            background: 'linear-gradient(135deg, rgba(0,108,228,0.2), rgba(0,168,255,0.15))',
            border: '1px solid rgba(0,108,228,0.3)',
            color: '#006CE4',
            textDecoration: 'none',
          }}
          title="Reservar en Booking.com"
        >
          🏨 RESERVAR
        </a>
        <button
          onClick={() => setShowFuelCalc(!showFuelCalc)}
          className="px-3 rounded-xl text-sm transition-all cursor-pointer"
          style={{
            background: 'rgba(255,230,109,0.1)',
            border: '1px solid rgba(255,230,109,0.2)',
          }}
        >
          ⛽
        </button>
      </div>

      {showFuelCalc && (
        <div className="px-4 pb-4">
          <FuelCalculator lat={dest.lat} lon={dest.lon} />
        </div>
      )}
    </motion.div>
  )
}
