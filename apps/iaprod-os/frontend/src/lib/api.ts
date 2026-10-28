const API_BASE = (() => {
  const host = window.location.hostname
  const isProd = host === 'msbross.me' || host === 'iaprod.manuelalvarez.dev' || host.endsWith('.manuelalvarez.dev')
  if (isProd) return '/_iaprod/api'
  return import.meta.env.VITE_API_BASE_URL || `http://${host}:8006/api`
})()

export const api = {
  base: API_BASE,

  async request(path: string, options: RequestInit = {}) {
    const token = localStorage.getItem('iap_token')
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }
    if (token) headers.Authorization = `Bearer ${token}`
    const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
    if (res.status === 401) {
      localStorage.removeItem('iap_token')
      window.location.href = '/login'
    }
    return res
  },

  async get(path: string) {
    const res = await this.request(path)
    return res.json()
  },

  async post(path: string, body: any) {
    const res = await this.request(path, {
      method: 'POST',
      body: JSON.stringify(body),
    })
    return res.json()
  },

  async postForm(path: string, formData: FormData) {
    const token = localStorage.getItem('iap_token')
    const headers: Record<string, string> = {}
    if (token) headers.Authorization = `Bearer ${token}`
    const res = await fetch(`${API_BASE}${path}`, { method: 'POST', body: formData, headers })
    return res.json()
  },
}

export const WS_URL = API_BASE.replace(/^http/, 'ws') + '/ws'
