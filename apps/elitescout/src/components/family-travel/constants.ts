export const MEQUINENZA = { lat: 41.3667, lon: 0.3333 }

export const FAMILY = {
  child: { name: 'Edelweiss', age: 3.5 },
  mother: 'Arantxa',
  father: 'Manu',
}

export const AIRPORTS: Record<string, { name: string; coords: { lat: number; lon: number }; drive_km: number }> = {
  ZAZ: { name: "Zaragoza", coords: { lat: 41.6663, lon: -1.0415 }, drive_km: 95 },
  REU: { name: "Reus", coords: { lat: 41.1474, lon: 1.1672 }, drive_km: 130 },
  BCN: { name: "Barcelona El Prat", coords: { lat: 41.2971, lon: 2.0785 }, drive_km: 175 },
}

export const TRAIN_STATIONS: Record<string, { name: string; coords: { lat: number; lon: number }; drive_km: number }> = {
  CAS: { name: "Caspe", coords: { lat: 41.2333, lon: -0.0333 }, drive_km: 30 },
  LLE: { name: "Lleida Pirineus", coords: { lat: 41.6167, lon: 0.6333 }, drive_km: 80 },
  ZAZ: { name: "Zaragoza Delicias", coords: { lat: 41.6568, lon: -0.9139 }, drive_km: 95 },
}

export const CAR_THRESHOLD_KM = 400
export const ROAD_FACTOR = 1.25
export const AVG_SPEED_KMH = 90
export const TOLL_COST_PER_KM = 0.07
export const DEFAULT_FUEL_CONSUMPTION = 6.5
export const DEFAULT_FUEL_PRICE = 1.72

export const ACCOMMODATION_TYPES = ['hotel', 'apartamento', 'casa'] as const
export const TRANSPORT_MODES = ['car', 'flight', 'train'] as const

export const FAMILY_TRAVEL_COLORS = {
  primary: '#FF6B6B',
  secondary: '#4ECDC4',
  accent: '#FFE66D',
  warm: '#FF8A5C',
  purple: '#A78BFA',
  pink: '#F472B6',
  gradient: 'linear-gradient(135deg, #FF6B6B, #4ECDC4, #FFE66D)',
}
