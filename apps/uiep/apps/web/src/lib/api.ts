/**
 * Cliente del Control Center. TODA la API sale por el BFF del backend:
 *   · /    (producción) → /_uiep  … mismo origen, cookie HttpOnly automática
 *   · dev  → VITE_API_BASE=http://localhost:4000 (proxy Vite reescribe /_uiep)
 *
 * La contraseña de consola se usa SOLO en el login; el resto viaja con la
 * cookie de sesión firmada. `UIEP_RUNTIME_TOKEN` nunca está disponible aquí.
 */

interface ViteEnv {
  readonly VITE_API_BASE?: string
}

const ENV: ViteEnv = (import.meta as unknown as { env: ViteEnv }).env ?? {}
export const API_BASE: string = ENV.VITE_API_BASE || '/_uiep'

const CSRF_HEADER = 'x-uiep-console'

export class ApiError extends Error {
  status: number
  payload: unknown
  constructor(status: number, payload: unknown) {
    super(`api_error_${status}`)
    this.status = status
    this.payload = payload
  }
}

async function request<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (method !== 'GET') {
    headers[CSRF_HEADER] = '1'
  }
  const res = await fetch(API_BASE + path, {
    method,
    headers,
    credentials: 'same-origin',
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!res.ok) {
    let payload: unknown = null
    try {
      payload = await res.json()
    } catch {
      payload = { error: `http_${res.status}` }
    }
    throw new ApiError(res.status, payload)
  }
  return (await res.json()) as T
}

const get = <T,>(path: string) => request<T>('GET', path)
const post = <T,>(path: string, body?: unknown) => request<T>('POST', path, body)

/* ── Tipos de la plataforma (contratos reales del backend) ─────────────────── */

export interface SpecSummary {
  id: string
  name: string
  version: string
  kind: string
  apiVersion: string
  description?: string
  createdAt?: string
}

export type SpecDoc = {
  apiVersion: string
  kind: string
  metadata: { id: string; name: string; version: string; description?: string; createdAt?: string; tags?: string[] }
  spec: unknown
}

export interface ToolSpecDoc {
  apiVersion: string
  kind: 'Tool'
  metadata: { id: string; name: string; version: string; description?: string }
  spec: {
    description: string
    inputSchema: { type: 'object'; properties: Record<string, { type: string; description?: string }>; required: string[] }
    permissions: string[]
    execution: { adapter: string; config?: Record<string, string> }
  }
}

export type RunStatus =
  | 'running'
  | 'completed'
  | 'completed_without_tools'
  | 'requires_approval'
  | 'failed'
  | 'timeout'
  | 'max_iterations_reached'

export interface ToolExecution {
  name: string
  ok: boolean
  error?: string
  result?: unknown
}

export interface RunRecord {
  executionId: string
  sessionId: string
  agentSpecId: string
  agentSpec: unknown
  profileUsed: { id: string; version: string; provider: string; model: string; endpoint: string }
  input: string
  status: RunStatus
  result: {
    text?: string
    toolExecutions: ToolExecution[]
    iterations: number
    durationMs?: number
  }
  errors: string[]
  startedAt: string
  finishedAt?: string
}

export interface RunSummary {
  executionId: string
  sessionId: string
  agentSpecId: string
  status: RunStatus
  startedAt: string
  finishedAt?: string
  durationMs?: number
  iterations: number
  toolCount: number
  toolFailures: number
  textPreview: string
}

export interface SessionMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  toolName?: string
  at: string
}

export interface SessionListItem {
  sessionId: string
  agentSpecId: string
  profileId: string
  createdAt: string
  messageCount: number
  runCount: number
}

export interface SessionDetail extends SessionListItem {
  sessionId: string
  agentSpecId: string
  profileId: string
  createdAt: string
  messages: SessionMessage[]
  runExecutionIds: string[]
  runs: RunSummary[]
}

export interface Overview {
  generatedAt: string
  services: {
    backend: {
      ok: boolean
      node: string
      uptimeSec: number
      runtimeTokenConfigured: boolean
      consoleConfigured: boolean
    }
    ollama: {
      ok: boolean
      model?: string
      modelId?: string
      capabilities?: string[] | null
    }
  }
  counts: { agents: number; profiles: number; tools: number; sessions: number; runs: number }
  agents: Array<{ id: string; name: string; version: string; description: string | null }>
  profiles: Array<{ id: string; name: string; version: string }>
  recentRuns: RunSummary[]
}

export interface ProviderCallDescriptor {
  provider: string
  model: string
  endpoint: string
}

export interface ProfileHealth extends ProviderCallDescriptor {
  ok: boolean
  detail: string
}

export interface ProfileTestResult extends ProviderCallDescriptor {
  ok: boolean
  text?: string
  latencyMs?: number
  error?: string
}

export interface InvocationDescriptor extends ProviderCallDescriptor {
  costTier: string | null
}

/* ── Endpoints ─────────────────────────────────────────────────────────────── */

export const api = {
  /* Consola (BFF autenticado) */
  auth: {
    login: (password: string) => post<{ authenticated: boolean; expiresAt: string }>('/api/console/auth/login', { password }),
    session: () => get<{ authenticated: true; expiresAt: string }>('/api/console/auth/session'),
    logout: () => post<{ authenticated: boolean }>('/api/console/auth/logout'),
  },
  overview: () => get<Overview>('/api/console/overview'),
  tools: () => get<ToolSpecDoc[]>('/api/console/tools'),
  sessions: () => get<SessionListItem[]>('/api/console/sessions'),
  session: (id: string) => get<SessionDetail>(`/api/console/sessions/${id}`),
  runs: () => get<RunSummary[]>('/api/console/runs'),
  run: (id: string) => get<RunRecord>(`/api/console/runs/${id}`),
  createSession: (agentSpecId: string) =>
    post<{ sessionId: string; agentSpecId: string; profileId: string; createdAt: string }>(
      '/api/console/runtime/sessions',
      { agentSpecId },
    ),
  startRun: (sessionId: string, input: string) =>
    post<{ executionId: string; status: RunStatus; sessionId?: string; profileId?: string; createdAt?: string }>(
      `/api/console/runtime/sessions/${sessionId}/run`,
      { input },
    ),

  /* Públicos (contratos de Fases 1-2, sin cambios) */
  specs: {
    list: () => get<SpecSummary[]>('/api/specs'),
    get: (id: string) => get<SpecDoc>(`/api/specs/${id}`),
    save: (doc: unknown) => post<{ stored: boolean; id: string; version: string }>('/api/specs', doc),
  },
  profiles: {
    list: () => get<SpecSummary[]>('/api/profiles'),
    get: (id: string) => get<SpecDoc>(`/api/profiles/${id}`),
    health: (id: string) => get<ProfileHealth>(`/api/profiles/${id}/health`),
    test: (id: string, prompt?: string) => post<ProfileTestResult>(`/api/profiles/${id}/test`, prompt ? { prompt } : {}),
    resolve: (profileId: string) =>
      post<{ resolved: boolean; profileId: string; version: string; invocation: InvocationDescriptor }>(
        '/api/profiles/resolve',
        { profileId },
      ),
  },
  health: () => get<{ ok?: boolean; status?: string }>('/api/health'),
}
