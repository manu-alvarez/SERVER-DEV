import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('uiep_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export interface GenerateRequest {
  goal: string
  type: 'agent' | 'subagent' | 'system' | 'mcp' | 'harness' | 'adversarial' | 'template'
  framework?: 'langgraph' | 'crewai' | 'n8n' | 'openai' | 'custom'
  templateId?: string
}

export interface GenerateResponse {
  id: string
  goal: string
  type: string
  framework: string | null
  code: string
  structure: Record<string, any>
  mcpConfig: Record<string, any> | null
  adversarialTests: string[]
  createdAt: string
}

export const generateEntity = (payload: GenerateRequest) =>
  api.post<GenerateResponse>('/api/generate', payload)

export interface Template {
  id: string
  name: string
  category: string
  description: string
  code: string
  variables: Record<string, string>
}

export const getTemplates = () => api.get<Template[]>('/api/templates')
export const createTemplate = (t: Omit<Template, 'id'>) => api.post<Template>('/api/templates', t)

export interface MCPServer {
  id: string
  name: string
  command: string
  args: string[]
  env: Record<string, string>
}

export const getMCP = () => api.get<MCPServer[]>('/api/mcp')
export const saveMCP = (m: MCPServer) => api.post<MCPServer>('/api/mcp', m)

export const getHealth = () => api.get('/api/health')
