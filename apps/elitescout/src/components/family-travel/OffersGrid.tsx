'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { OfferCard } from './OfferCard'
import { useTravelStore } from '@/hooks/useTravelStore'
import { resolveCarMode } from './geoUtils'
import type { AIDestination } from '@/lib/family-travel/aiOrchestrator'
import type { Destination, TravelAnalysis } from './types'

interface Props {
  nights: number
  sortBy: 'family_score' | 'price' | 'distance'
  onCompare: (dest: Destination, geo: TravelAnalysis) => void
}

export function OffersGrid({ nights, sortBy, onCompare }: Props) {
  const destinations = useTravelStore((s) => s.destinations)
  const isLoading = useTravelStore((s) => s.isLoading)
  const error = useTravelStore((s) => s.error)
  const favoritesList = useTravelStore((s) => s.favorites)
  const toggleFavorite = useTravelStore((s) => s.toggleFavorite)
  const favorites = useMemo(() => new Set(favoritesList), [favoritesList])
  const fuelPrice = useTravelStore((s) => s.fuelPrice)
  const fuelConsumption = useTravelStore((s) => s.fuelConsumption)

  const sorted: Destination[] = useMemo(() => {
    const list = [...destinations]
    list.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return (a.pricePerNight || 999) - (b.pricePerNight || 999)
        case 'distance': {
          const ga = resolveCarMode(a.lat, a.lon, fuelPrice, fuelConsumption)
          const gb = resolveCarMode(b.lat, b.lon, fuelPrice, fuelConsumption)
          return ga.distanceKm - gb.distanceKm
        }
        case 'family_score':
        default:
          return (b.familyScore ?? 0) - (a.familyScore ?? 0)
      }
    })
    return list.map((d) => ({
      id: d.name,
      name: d.name,
      country: d.country,
      lat: d.lat,
      lon: d.lon,
      hotelName: d.hotelName,
      accommodationType: (d.accommodationType === 'apartamento' || d.accommodationType === 'casa' ? d.accommodationType : 'hotel') as 'hotel' | 'apartamento' | 'casa',
      stars: d.stars ?? 4,
      familyScore: d.familyScore ?? 0.5,
      pricePerNight: d.pricePerNight ?? 120,
      amenities: d.amenities || [],
      image: d.image || '🌍',
      familyNotes: d.familyNotes || '',
      url: d.url,
      flightPrice: d.flightPrice,
      trainPrice: d.trainPrice,
      imageUrl: d.imageUrl,
      transportOptions: [],
    }))
  }, [destinations, sortBy, fuelPrice, fuelConsumption])

  if (error) {
    return (
      <div className="text-center py-16">
        <span className="text-3xl mb-4 block">⚠️</span>
        <p className="text-red-400 font-mono text-sm mb-2">Error de búsqueda</p>
        <p className="text-text-muted font-mono text-xs">{error}</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-[560px] w-full rounded-2xl" />
        ))}
      </div>
    )
  }

  if (destinations.length === 0) {
    return (
      <div className="text-center py-16">
        <span className="text-4xl mb-4 block">🔍</span>
        <p className="text-text-muted font-mono text-sm">
          Introduce un destino o pulsa "BUSCAR VIAJES" para descubrir ofertas familiares
        </p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {sorted.map((dest, i) => (
        <motion.div
          key={dest.id + i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <OfferCard
            dest={dest}
            nights={nights}
            fuelPrice={fuelPrice}
            consumption={fuelConsumption}
            onCompare={onCompare}
            isFavorite={favorites.has(dest.id)}
            onFavorite={() => toggleFavorite(dest.id)}
          />
        </motion.div>
      ))}
    </motion.div>
  )
}
