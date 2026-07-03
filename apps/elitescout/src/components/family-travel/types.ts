export type TransportMode = 'car' | 'flight' | 'train'
export type AccommodationType = 'hotel' | 'apartamento' | 'casa'

export interface TravelAnalysis {
  mode: TransportMode
  distanceKm: number
  durationHours: number
  costEur: number
  details: Record<string, any>
}

export interface Destination {
  id: string
  name: string
  country: string
  lat: number
  lon: number
  hotelName: string
  accommodationType: AccommodationType
  stars: number
  familyScore: number
  pricePerNight: number
  amenities: string[]
  image: string
  imageUrl?: string
  url?: string
  familyNotes: string
  transportOptions: TravelAnalysis[]
}
