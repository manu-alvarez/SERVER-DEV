'use client'

interface Props {
  mode: 'car' | 'flight'
  roadKm: number
  driveHours: number
  nearestAirportName?: string
}

export function TravelModeBadge({ mode, roadKm, driveHours, nearestAirportName }: Props) {
  const isCar = mode === 'car'

  return (
    <div
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold font-mono tracking-wider"
      style={{
        background: isCar ? 'rgba(59,130,246,0.15)' : 'rgba(168,85,247,0.15)',
        border: `1px solid ${isCar ? 'rgba(59,130,246,0.4)' : 'rgba(168,85,247,0.4)'}`,
        color: isCar ? '#60a5fa' : '#c084fc',
      }}
    >
      <span className="text-sm">{isCar ? '🚗' : '✈️'}</span>
      {isCar
        ? `${roadKm} km · ${driveHours}h`
        : `Vuelo desde ${nearestAirportName}`}
    </div>
  )
}
