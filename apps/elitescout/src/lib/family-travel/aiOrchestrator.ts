import { apiUrl } from '@/lib/api'

export interface AIDestination {
  name: string
  country: string
  lat: number
  lon: number
  hotelName: string
  accommodationType: string
  pricePerNight: number
  amenities: string[]
  familyScore: number
  familyNotes: string
  stars: number
  image: string
  imageUrl?: string
  url?: string
  flightPrice?: number
  trainPrice?: number
}

/**
 * Client-side fetcher. Queries the unified Next.js API server proxied via the edge.
 */
export async function fetchLiveDestinations(
  destination?: string,
  dateFrom?: string,
  dateTo?: string,
  accommodationType?: string
): Promise<AIDestination[]> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (typeof window !== 'undefined') {
      const gmToken = localStorage.getItem('godmode_token');
      const customKeys = localStorage.getItem('user_custom_keys');
      if (gmToken) headers['x-godmode-token'] = gmToken;
      if (customKeys) headers['x-user-custom-keys'] = customKeys;
    }

    const res = await fetch(apiUrl('/app/elitescout/api/family-travel/'), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        destination,
        dateFrom,
        dateTo,
        accommodationType,
      }),
    })

    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`Error en el servidor backend: ${res.status} - ${errorText}`)
    }

    const json = await res.json()
    if (!json.success) {
      throw new Error(json.error || 'Fallo en la búsqueda de destinos familiares')
    }

    return json.data || []
  } catch (error) {
    console.error('[aiOrchestrator Client] Error fetching live destinations:', error)
    throw error
  }
}
