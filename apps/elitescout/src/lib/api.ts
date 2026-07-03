"use client"

export function getConfig(): Partial<import('@/types/config').MSBrossConfig> {
  if (typeof document !== 'undefined') {
    const el = document.getElementById('msbross-config')
    if (el && el.textContent) {
      try {
        const parsed = JSON.parse(el.textContent)
        if (parsed.apiBase === '__TUNNEL_URL__') {
          return {}
        }
        return parsed
      } catch {}
    }
  }
  return {}
}

export function apiUrl(path: string): string {
  const config = getConfig()
  const base = config.apiBase || ''
  return base ? `${base}${path}` : path
}
