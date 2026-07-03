'use client'

import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import { MEQUINENZA } from './constants'
import type { AIDestination } from '@/lib/family-travel/aiOrchestrator'
import 'leaflet/dist/leaflet.css'

const homeIcon = L.divIcon({
  html: '🏠',
  className: 'text-2xl bg-none border-none',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
})

const destIcon = L.divIcon({
  html: '📍',
  className: 'text-2xl bg-none border-none',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
})

const selectedIcon = L.divIcon({
  html: '🔴',
  className: 'text-2xl bg-none border-none animate-bounce',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
})

function FitBounds({ destinations }: { destinations: AIDestination[] }) {
  const map = useMap()
  useEffect(() => {
    if (destinations.length === 0) return
    const bounds = L.latLngBounds([[MEQUINENZA.lat, MEQUINENZA.lon]])
    destinations.forEach((d) => bounds.extend([d.lat, d.lon]))
    map.fitBounds(bounds, { padding: [60, 60] })
  }, [destinations, map])
  return null
}

interface Props {
  destinations: AIDestination[]
  selectedId?: string | null
  onSelect?: (dest: AIDestination) => void
}

export default function DestinationMapInner({ destinations, selectedId, onSelect }: Props) {
  const center: [number, number] = useMemo(() => [MEQUINENZA.lat, MEQUINENZA.lon], [])

  const polylinePositions = useMemo(() => {
    if (!selectedId) return []
    const sel = destinations.find((d) => d.name === selectedId)
    if (!sel) return []
    return [
      [MEQUINENZA.lat, MEQUINENZA.lon] as [number, number],
      [sel.lat, sel.lon] as [number, number],
    ]
  }, [selectedId, destinations])

  return (
    <div className="glass rounded-2xl overflow-hidden" style={{ height: 320 }}>
      <MapContainer
        center={center}
        zoom={7}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitBounds destinations={destinations} />

        <Marker position={center} icon={homeIcon}>
          <Popup><strong>Mequinenza</strong><br /><span className="text-xs">Origen 🏠</span></Popup>
        </Marker>

        {destinations.map((d) => (
          <Marker
            key={d.name}
            position={[d.lat, d.lon]}
            icon={selectedId === d.name ? selectedIcon : destIcon}
            eventHandlers={onSelect ? { click: () => onSelect(d) } : undefined}
          >
            <Popup>
              <strong>{d.name}</strong><br />
              <span className="text-xs">{d.country}</span><br />
              <span className="text-xs">🏨 {d.hotelName}</span><br />
              <span className="text-xs font-bold">💰 {d.pricePerNight}€/noche</span>
            </Popup>
          </Marker>
        ))}

        {polylinePositions.length === 2 && (
          <Polyline positions={polylinePositions} color="#FF6B6B" weight={2} dashArray="8, 8" />
        )}
      </MapContainer>
    </div>
  )
}
