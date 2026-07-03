'use client'

import { useMemo } from 'react'
import { useTravelStore } from '@/hooks/useTravelStore'
import { resolveCarMode } from './geoUtils'

interface Props {
  lat: number
  lon: number
}

export function FuelCalculator({ lat, lon }: Props) {
  const fuelPrice = useTravelStore((s) => s.fuelPrice)
  const fuelConsumption = useTravelStore((s) => s.fuelConsumption)
  const setFuelPrice = useTravelStore((s) => s.setFuelPrice)
  const setFuelConsumption = useTravelStore((s) => s.setFuelConsumption)

  const car = useMemo(
    () => resolveCarMode(lat, lon, fuelPrice, fuelConsumption),
    [lat, lon, fuelPrice, fuelConsumption],
  )

  return (
    <div className="glass rounded-xl p-4 space-y-3">
      <h3 className="text-xs font-bold font-mono tracking-wider" style={{ color: '#FFE66D' }}>
        ⛽ CALCULADORA DE COMBUSTIBLE
      </h3>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[9px] text-text-muted font-mono uppercase tracking-wider">Consumo (L/100km)</label>
          <input
            type="number"
            value={fuelConsumption}
            onChange={(e) => setFuelConsumption(Math.max(3, Math.min(20, Number(e.target.value) || 6.5)))}
            step="0.1"
            min="3"
            max="20"
            aria-label="Consumo de combustible en litros por 100km"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm font-mono focus:border-gold/30 outline-none transition-all mt-1"
          />
        </div>
        <div>
          <label className="text-[9px] text-text-muted font-mono uppercase tracking-wider">Precio (€/L)</label>
          <input
            type="number"
            value={fuelPrice}
            onChange={(e) => setFuelPrice(Math.max(1, Math.min(3, Number(e.target.value) || 1.72)))}
            step="0.01"
            min="1"
            max="3"
            aria-label="Precio del combustible en euros por litro"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm font-mono focus:border-gold/30 outline-none transition-all mt-1"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
        <div><div className="text-[9px] text-text-muted font-mono">Distancia</div><div className="text-sm font-bold font-mono" style={{ color: '#4ECDC4' }}>{car.distanceKm} km</div></div>
        <div><div className="text-[9px] text-text-muted font-mono">Tiempo</div><div className="text-sm font-bold font-mono" style={{ color: '#4ECDC4' }}>{car.durationHours}h</div></div>
        <div><div className="text-[9px] text-text-muted font-mono">Combustible</div><div className="text-sm font-bold font-mono" style={{ color: '#FFE66D' }}>{car.details?.fuelCostEur || 0}€</div></div>
        <div><div className="text-[9px] text-text-muted font-mono">Peajes est.</div><div className="text-sm font-bold font-mono" style={{ color: '#FFE66D' }}>{car.details?.tollCostEur || 0}€</div></div>
      </div>

      <div className="flex justify-between items-center pt-2 border-t border-white/10">
        <span className="text-[10px] text-text-muted font-mono">TOTAL TRANSPORTE</span>
        <span className="text-lg font-extrabold font-mono" style={{ color: '#FF6B6B' }}>{car.costEur}€</span>
      </div>
    </div>
  )
}
