import type { TravelAnalysis } from './types'
import {
  MEQUINENZA, AIRPORTS, TRAIN_STATIONS, CAR_THRESHOLD_KM,
  ROAD_FACTOR, AVG_SPEED_KMH, TOLL_COST_PER_KM,
  DEFAULT_FUEL_PRICE, DEFAULT_FUEL_CONSUMPTION,
} from './constants'

const EARTH_RADIUS_KM = 6371
const TRAIN_COST_PER_KM_PERSON = 0.12
const FAMILY_SIZE = 3
const ROUND_TRIP = 2

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (x: number) => (x * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function roadKmFromStraight(straightKm: number): number {
  return straightKm * ROAD_FACTOR
}

function closestEntry<T>(entries: Record<string, T>, origin: typeof MEQUINENZA, getDist: (v: T) => number): [string, T] | null {
  const sorted = Object.entries(entries).sort((a, b) => getDist(a[1]) - getDist(b[1]))
  return sorted[0] || null
}

export function resolveCarMode(
  destLat: number,
  destLon: number,
  fuelPriceEur = DEFAULT_FUEL_PRICE,
  consumptionL100 = DEFAULT_FUEL_CONSUMPTION,
): TravelAnalysis {
  const straight = haversineKm(MEQUINENZA.lat, MEQUINENZA.lon, destLat, destLon)
  const roadKm = roadKmFromStraight(straight)
  const driveH = roadKm / AVG_SPEED_KMH
  const litersRt = (roadKm / 100) * consumptionL100 * 2
  const fuelCost = litersRt * fuelPriceEur
  const tollCost = roadKm * 2 * TOLL_COST_PER_KM

  return {
    mode: 'car',
    distanceKm: Math.round(roadKm),
    durationHours: Math.round(driveH * 10) / 10,
    costEur: Math.round((fuelCost + tollCost) * 100) / 100,
    details: {
      fuelCostEur: Math.round(fuelCost * 100) / 100,
      tollCostEur: Math.round(tollCost * 100) / 100,
    },
  }
}

export function resolveFlightMode(
  destLat: number,
  destLon: number,
): TravelAnalysis {
  const straight = haversineKm(MEQUINENZA.lat, MEQUINENZA.lon, destLat, destLon)
  const nearest = closestEntry(AIRPORTS, MEQUINENZA, (ap) =>
    haversineKm(MEQUINENZA.lat, MEQUINENZA.lon, ap.coords.lat, ap.coords.lon),
  )

  return {
    mode: 'flight',
    distanceKm: Math.round(straight),
    durationHours: 0,
    costEur: 180,
    details: {
      nearestAirport: nearest?.[0] || 'N/A',
      nearestAirportName: nearest?.[1]?.name || 'Desconocido',
      airportDriveKm: nearest?.[1]?.drive_km || 0,
    },
  }
}

export function resolveTrainMode(
  destLat: number,
  destLon: number,
): TravelAnalysis {
  const nearest = Object.entries(TRAIN_STATIONS).sort((a, b) => a[1].drive_km - b[1].drive_km)[0] || null

  if (!nearest) {
    return { mode: 'train', distanceKm: 0, durationHours: 0, costEur: 60, details: {} }
  }

  const railKm = Math.round(haversineKm(nearest[1].coords.lat, nearest[1].coords.lon, destLat, destLon) * 1.1)
  const trainTotal = Math.round(railKm * TRAIN_COST_PER_KM_PERSON * FAMILY_SIZE * ROUND_TRIP)

  return {
    mode: 'train',
    distanceKm: railKm,
    durationHours: Math.round((railKm / 80 + nearest[1].drive_km / 90) * 10) / 10,
    costEur: Math.max(trainTotal, 60),
    details: {
      nearestStation: nearest[0],
      nearestStationName: nearest[1].name,
      stationDriveKm: nearest[1].drive_km,
    },
  }
}

export function resolveAllModes(
  destLat: number,
  destLon: number,
  fuelPriceEur = 1.72,
  consumptionL100 = 6.5,
): TravelAnalysis[] {
  return [
    resolveCarMode(destLat, destLon, fuelPriceEur, consumptionL100),
    resolveFlightMode(destLat, destLon),
    resolveTrainMode(destLat, destLon),
  ]
}
