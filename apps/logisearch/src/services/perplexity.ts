export interface GlobalAlert {
  title: string
  description: string
  location?: string
  severity: 'high' | 'medium' | 'low'
}

const CACHE_KEY = 'logisearch_global_alerts'
const CACHE_DURATION_MS = 6 * 60 * 60 * 1000 // 6 horas

export async function fetchGlobalAlerts(): Promise<GlobalAlert[]> {
  try {
    // 1. Revisar caché local para ahorrar cuota de Perplexity
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      const parsed = JSON.parse(cached)
      if (Date.now() - parsed.timestamp < CACHE_DURATION_MS) {
        console.log('✅ Alertas obtenidas del caché')
        return parsed.data
      }
    }

    const apiKey = import.meta.env.VITE_PERPLEXITY_API_KEY
    if (!apiKey) {
      console.warn('Falta VITE_PERPLEXITY_API_KEY')
      return []
    }

    const prompt = `Actúa como un analista de riesgos logísticos globales. Busca las noticias más recientes (últimos 3 días) sobre huelgas portuarias, piratería, conflictos marítimos, cierres de canales, o tormentas extremas que afecten la logística marítima y aérea mundial.
    Devuelve estrictamente un arreglo JSON válido sin texto adicional (solo el json).
    Formato:
    [
      { "title": "...", "description": "...", "location": "...", "severity": "high" | "medium" | "low" }
    ]`

    console.log('🚨 Consultando Perplexity (API externa) para alertas...')
    
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2
      })
    })

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`)
    }

    const data = await response.json()
    let text = data.choices?.[0]?.message?.content || ''
    
    // Limpiar posible formato markdown de json
    text = text.replace(/```json/g, '').replace(/```/g, '').trim()
    
    const alerts: GlobalAlert[] = JSON.parse(text)
    
    // Guardar en caché
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      timestamp: Date.now(),
      data: alerts
    }))
    
    return alerts
  } catch (error) {
    console.error('Error fetching global alerts:', error)
    return []
  }
}
