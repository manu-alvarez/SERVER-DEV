// Database types
export interface SearchQuery {
  id?: number
  origin: string
  destination: string
  transport_mode: 'mar' | 'aire' | 'tierra'
  results?: Record<string, unknown>
  created_at?: string
}

export interface RFQ {
  id?: number
  search_query_id: number
  origin: string
  destination: string
  transport_mode: string
  cargo_details: string
  status: 'pending' | 'sent' | 'replied'
  created_at?: string
}

// Save search to localStorage
export async function saveSearch(query: SearchQuery): Promise<SearchQuery | null> {
  try {
    const historyStr = localStorage.getItem('logisearch_searches')
    const history: SearchQuery[] = historyStr ? JSON.parse(historyStr) : []
    
    const newSearch: SearchQuery = {
      ...query,
      id: Date.now(),
      created_at: new Date().toISOString(),
    }
    
    history.unshift(newSearch)
    
    // Keep only last 50 searches
    if (history.length > 50) history.pop()
    
    localStorage.setItem('logisearch_searches', JSON.stringify(history))
    return newSearch
  } catch (err) {
    console.error('Error saving search:', err)
    return null
  }
}

// Get search history from localStorage
export async function getSearchHistory(): Promise<SearchQuery[]> {
  try {
    const historyStr = localStorage.getItem('logisearch_searches')
    return historyStr ? JSON.parse(historyStr) : []
  } catch (err) {
    console.error('Error fetching search history:', err)
    return []
  }
}

// Save RFQ to localStorage
export async function saveRFQ(rfq: Omit<RFQ, 'id' | 'created_at'>): Promise<RFQ | null> {
  try {
    const rfqsStr = localStorage.getItem('logisearch_rfqs')
    const rfqs: RFQ[] = rfqsStr ? JSON.parse(rfqsStr) : []
    
    const newRFQ: RFQ = {
      ...rfq,
      id: Date.now(),
      created_at: new Date().toISOString(),
    }
    
    rfqs.unshift(newRFQ)
    localStorage.setItem('logisearch_rfqs', JSON.stringify(rfqs))
    
    return newRFQ
  } catch (err) {
    console.error('Error in saveRFQ:', err)
    return null
  }
}

// API keys from environment variables
// Note: Gemini keys are managed by aiProvider.ts (rotation + fallback)
export const TAVILY_API_KEY = import.meta.env.VITE_TAVILY_API_KEY || ''
