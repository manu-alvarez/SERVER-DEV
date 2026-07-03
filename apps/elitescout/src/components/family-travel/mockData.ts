import type { Destination } from './types'

export const MOCK_DESTINATIONS: Destination[] = [
  {
    id: '1', name: 'Salou', country: 'España', lat: 41.074, lon: 1.136,
    hotelName: 'Hotel Estival Park', accommodationType: 'hotel', stars: 4,
    familyScore: 0.92, pricePerNight: 145, amenities: ['cuna', 'parque_infantil', 'piscina', 'restaurante_ninos'],
    image: '🏖️', familyNotes: 'Excelente para familias, parque infantil y cuna disponibles',
    url: 'https://www.booking.com/searchresults.html?ss=Salou',
    transportOptions: [],
  },
  {
    id: '2', name: 'Ordesa', country: 'España', lat: 42.637, lon: -0.045,
    hotelName: 'Parador de Bielsa', accommodationType: 'hotel', stars: 4,
    familyScore: 0.78, pricePerNight: 120, amenities: ['cuna', 'piscina', 'restaurante_ninos'],
    image: '⛰️', familyNotes: 'Entorno natural, ideal para familias tranquilas',
    transportOptions: [],
  },
  {
    id: '3', name: 'Valencia', country: 'España', lat: 39.47, lon: -0.376,
    hotelName: 'Sercotel Sorolla Palace', accommodationType: 'hotel', stars: 4,
    familyScore: 0.71, pricePerNight: 110, amenities: ['piscina', 'restaurante_ninos'],
    image: '🌊', familyNotes: 'Buena opción urbana con servicios familiares básicos',
    transportOptions: [],
  },
  {
    id: '4', name: 'Palma de Mallorca', country: 'España', lat: 39.569, lon: 2.646,
    hotelName: 'Meliá Palma Marina', accommodationType: 'hotel', stars: 5,
    familyScore: 0.88, pricePerNight: 195, amenities: ['cuna', 'parque_infantil', 'piscina', 'restaurante_ninos'],
    image: '🏝️', familyNotes: 'Hotel premium con todas las comodidades para familias',
    transportOptions: [],
  },
  {
    id: '5', name: 'Biarritz', country: 'Francia', lat: 43.483, lon: -1.559,
    hotelName: 'Hôtel du Palais', accommodationType: 'hotel', stars: 5,
    familyScore: 0.65, pricePerNight: 260, amenities: ['piscina', 'restaurante_ninos'],
    image: '🇫🇷', familyNotes: 'Opción internacional, verificar disponibilidad de cuna',
    transportOptions: [],
  },
  {
    id: '6', name: 'Tenerife', country: 'España', lat: 28.291, lon: -16.629,
    hotelName: 'Hotel Bahía del Duque', accommodationType: 'hotel', stars: 5,
    familyScore: 0.95, pricePerNight: 285, amenities: ['cuna', 'parque_infantil', 'piscina', 'restaurante_ninos', 'club_ninos'],
    image: '🌋', familyNotes: 'Mejor puntuación familiar, club infantil incluido',
    transportOptions: [],
  },
]
