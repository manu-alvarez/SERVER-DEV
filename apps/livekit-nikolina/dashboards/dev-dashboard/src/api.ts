import axios from 'axios'
import type { InternalAxiosRequestConfig } from 'axios'

const api = axios.create({
  baseURL: '/api/dev',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('access_token');
            window.location.href = '/dev/login';
        }
        return Promise.reject(error);
    }
);

export const login = (data: URLSearchParams) => axios.post('/api/login', data, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
});

export interface LLMConfig {
  id: number
  model_name: string
  voice: string
  temperature: number
  system_prompt: string
  enable_internet_search: number
  vad_sensitivity: number
  turn_detection_mode: string
  max_call_duration_minutes: number
  updated_at: string
}

export interface ModelsResponse {
  models: string[]
}

export interface VoicesResponse {
  voices: string[]
}

export interface PipelineConfig {
  id: number
  name: string
  architecture: 'realtime' | 'modular'
  llm_provider: string
  llm_model: string | null
  llm_base_url: string | null
  llm_temperature: number
  stt_provider: string
  stt_model: string
  stt_language: string
  tts_provider: string
  tts_voice: string
  tts_speed: number
  tts_server_url: string | null
  realtime_provider: string
  realtime_model: string | null
  realtime_voice: string | null
  is_active: number
  created_at: string
  updated_at: string
}

export interface ProviderStatus {
  name: string
  status: 'online' | 'offline' | 'error'
  latency?: number
}

export interface PipelineCatalogResponse {
  llm: { providers: string[], models: string[] }
  stt: { providers: string[], urls: Record<string, string> }
  tts: { providers: string[], urls: Record<string, string> }
  realtime: { providers: string[], models: string[] }
}

// API response format from /providers/status
export interface ProvidersResponse {
  ollama?: {
    available: boolean
    url?: string
    models?: string[]
  }
  kokoro?: {
    available: boolean
    url?: string
  }
  gemini?: {
    available: boolean
    note?: string
  }
  faster_whisper?: {
    available: boolean
    url?: string
  }
  [key: string]: any // allow other dynamic providers
}

export interface LogEntry {
  timestamp: string
  level: 'INFO' | 'WARNING' | 'ERROR'
  message: string
}

export const devApi = {
  getConfig: () => api.get<LLMConfig>('/llm-config'),
  updateConfig: (config: Partial<LLMConfig>) => api.put('/llm-config', config),
  getModels: () => api.get<ModelsResponse>('/models'),
  getVoices: () => api.get<VoicesResponse>('/voices'),
  getPrompt: () => api.get<LLMConfig>('/llm-config'),
  updatePrompt: (prompt: string) => api.put('/llm-config', { system_prompt: prompt }),
  resetAgent: () => api.post('/reset-agent'),
  getStatus: () => api.get('/status'),
  getLogs: () => api.get<LogEntry[]>('/logs'),
  getPipelineConfig: () => api.get<PipelineConfig>('/pipeline-config'),
  getAllPipelineConfigs: () => api.get<{ configs: PipelineConfig[] }>('/pipeline-configs'),
  updatePipelineConfig: (id: number, config: Partial<PipelineConfig>) =>
    api.put(`/pipeline-config/${id}`, config),
  activatePipeline: (id: number) =>
    api.post(`/pipeline-config/${id}/activate`),
  getProvidersStatus: () => api.get<ProvidersResponse>('/providers/status'),
  getPipelineCatalog: () => api.get<PipelineCatalogResponse>('/pipeline-catalog'),
}

export default api
