import axios from 'axios'
import type { InternalAxiosRequestConfig } from 'axios'

const baseURL = import.meta.env.VITE_API_URL || 'https://nikolina.manuelalvarez.dev/api'

const api = axios.create({
  baseURL,
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
            window.location.href = '/app/dev-dashboard/login';
        }
        return Promise.reject(error);
    }
);

export const login = (data: URLSearchParams) => axios.post(`${baseURL}/login`, data, {
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

export interface PipelineCatalogResponse {
  llm: { providers: string[], models: string[] }
  stt: { providers: string[], urls: Record<string, string> }
  tts: { providers: string[], urls: Record<string, string> }
  realtime: { providers: string[], models: string[] }
}

export interface ProvidersResponse {
  ollama?: { available: boolean, url?: string, models?: string[] }
  kokoro?: { available: boolean, url?: string }
  gemini?: { available: boolean, note?: string }
  faster_whisper?: { available: boolean, url?: string }
  [key: string]: any
}

export interface LogEntry {
  timestamp: string
  level: 'INFO' | 'WARNING' | 'ERROR'
  message: string
}

export interface AgentStatusResponse {
  status: string
  uptime_seconds: number
  sessions_today: number
  last_call: string
  model: string
  voice: string
  active_pipeline: string
  metrics: {
    cpu: number
    memory: { used: number, total: number }
    active_sessions: number
    latency: number
  }
}

const p = '/dev'

export const devApi = {
  getConfig: () => api.get<LLMConfig>(`${p}/llm-config`),
  updateConfig: (config: Partial<LLMConfig>) => api.put(`${p}/llm-config`, config),
  getModels: () => api.get<ModelsResponse>(`${p}/models`),
  getVoices: () => api.get<VoicesResponse>(`${p}/voices`),
  resetAgent: () => api.post(`${p}/reset-agent`),
  getStatus: () => api.get<AgentStatusResponse>(`${p}/status`),
  getLogs: () => api.get<LogEntry[]>(`${p}/logs`),
  getPipelineConfig: () => api.get<PipelineConfig>(`${p}/pipeline-config`),
  getAllPipelineConfigs: () => api.get<{ configs: PipelineConfig[] }>(`${p}/pipeline-configs`),
  updatePipelineConfig: (id: number, config: Partial<PipelineConfig>) =>
    api.put(`${p}/pipeline-config/${id}`, config),
  activatePipeline: (id: number) =>
    api.post(`${p}/pipeline-config/${id}/activate`),
  getProvidersStatus: () => api.get<ProvidersResponse>(`${p}/providers/status`),
  getPipelineCatalog: () => api.get<PipelineCatalogResponse>(`${p}/pipeline-catalog`),
}

export default api
