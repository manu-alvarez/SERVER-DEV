// Web Search Service — Tavily API
// Provides real-time web data for logistics queries
import { TAVILY_API_KEY } from '../lib/storage'

interface TavilyResult {
  title: string
  url: string
  content: string
  score: number
}

interface TavilyResponse {
  results: TavilyResult[]
  answer?: string
  related_queries: string[]
}

// Core search function
export async function searchWeb(query: string, maxResults: number = 5): Promise<TavilyResponse> {
  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query,
        max_results: maxResults,
        include_answer: true,
        include_raw_content: false,
        include_images: false,
      }),
    })

    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Web search error:', error)
    return { results: [], related_queries: [] }
  }
}

// ─── Logistics-specific searches ───

// Freight rates — current market prices
export async function searchFreightRates(origin: string, destination: string, mode: string) {
  const modeStr = mode === 'mar' ? 'shipping container freight' : mode === 'aire' ? 'air cargo freight' : 'trucking road transport'
  const query = `${modeStr} rates ${origin} to ${destination} 2025 2026 current prices cost per unit`
  return searchWeb(query, 5)
}

// Customs and regulatory requirements
export async function searchCustomsRequirements(origin: string, destination: string) {
  const query = `customs requirements regulations import export ${origin} to ${destination} documents needed 2025 current rules`
  return searchWeb(query, 5)
}

// Incoterms information
export async function searchIncoterms(productType: string) {
  const query = `Incoterms 2020 ${productType} responsibilities risks ICC rules import export`
  return searchWeb(query, 3)
}

// Specific carrier rates
export async function searchCarrierRates(carrier: string, route: string) {
  const query = `${carrier} shipping rates ${route} container freight prices 2025 2026`
  return searchWeb(query, 3)
}

// Shanghai Containerized Freight Index
export async function searchSCFIIndex() {
  const query = `SCFI Shanghai Containerized Freight Index latest current week 2025 2026`
  return searchWeb(query, 3)
}

// HS Code classification
export async function searchHSCode(product: string) {
  const query = `HS code harmonized system ${product} tariff classification customs code`
  return searchWeb(query, 3)
}

// National transport regulations
export async function searchNationalRegulations(country: string, cargoType: string = '') {
  const query = `${country} national transport regulations ${cargoType} road freight law requirements 2025`
  return searchWeb(query, 3)
}

// Dangerous goods regulations
export async function searchDangerousGoods(product: string) {
  const query = `ADR IMDG IATA dangerous goods classification ${product} transport requirements`
  return searchWeb(query, 3)
}
