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

async function request<T>(method: 'GET' | 'POST' | 'DELETE', path: string, body?: unknown): Promise<T> {
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
    /** Fase 5: fragmentos de conocimiento inyectados (trazabilidad → fuente). */
    retrievals?: KnowledgeRetrievalRef[]
    /** Fase 5.1: citas emitidas por el modelo, validadas contra los fragmentos
     *  existentes (verified=false → el modelo citó una referencia inexistente). */
    citations?: Array<{ ref: number; verified: boolean; sourceId: string | null; chunkIdx: number | null; score: number | null }>
  }
  errors: string[]
  startedAt: string
  finishedAt?: string
}

/** Fase 5 — trazabilidad conocimiento: fragmento inyectado → fuente. */
export interface KnowledgeRetrievalRef {
  sourceId: string
  title: string
  ref: string
  chunkIdx: number
  score: number
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
  retrievalCount?: number
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

/* ── Knowledge (Fase 5) ──────────────────────────────────────────────────── */

export type KnowledgeSourceStatus = 'pending' | 'ingesting' | 'ingested' | 'failed'

export interface KnowledgeSource {
  sourceId: string
  type: 'text' | 'url'
  ref: string
  title: string
  status: KnowledgeSourceStatus
  error?: string
  hash?: string
  chunkCount: number
  dims?: number
  createdAt: string
  ingestedAt?: string
}

export interface KnowledgeHit {
  sourceId: string
  title: string
  ref: string
  chunkIdx: number
  score: number
  text: string
}

export interface KnowledgeQueryResult {
  ok: boolean
  hits: KnowledgeHit[]
  dims: number
}

/* ── Memory (Fase 5.1) ───────────────────────────────────────────────────── */

export interface MemoryRecord {
  memoryId: string
  agentSpecId: string
  sessionId: string | null
  kind: 'agent' | 'session'
  content: string
  origin: { executionId: string; input: string; reason: string }
  createdAt: string
  expiresAt: string
  status: 'active' | 'deleted'
  expired: boolean
}

/* ── Workflows (Fase 6) ──────────────────────────────────────────────────── */

export type WorkflowNodeStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'cancelled'

export interface WorkflowNodeStep {
  nodeId: string
  type: 'agent' | 'condition' | 'parallel'
  status: WorkflowNodeStatus
  output?: string
  renderedInput?: string
  error?: string
  attempts: number
  startedAt?: string
  finishedAt?: string
  durationMs?: number
  agentSessionId?: string
  agentExecutionId?: string
  branchTaken?: string
  branchOutputs?: Array<{ nodeId: string; ok: boolean; output?: string; error?: string }>
}

export type WorkflowRunStatus = 'running' | 'cancelling' | 'completed' | 'failed' | 'cancelled'

export interface WorkflowRunRecord {
  workflowRunId: string
  workflowId: string
  workflowVersion: string
  input: string
  status: WorkflowRunStatus
  steps: Record<string, WorkflowNodeStep>
  order: string[]
  output?: string
  errors: string[]
  startedAt: string
  finishedAt?: string
}

export interface WorkflowRunSummary {
  workflowRunId: string
  workflowId: string
  workflowVersion: string
  status: WorkflowRunStatus
  input: string
  output?: string
  nodesDone: number
  nodesTotal: number
  errors: string[]
  startedAt: string
  finishedAt?: string
}

/* ── Integraciones (Fase 7) ──────────────────────────────────────────────── */

/** Forma de ENTRADA del WorkflowSpec (pre-defaults) — espejo del contrato. */
export type WorkflowSpecInput = {
  start: string
  nodes: Array<
    | { id: string; type: 'agent'; agentSpecId: string; input: string; retries?: number; timeoutMs?: number }
    | { id: string; type: 'condition'; input: string; check: { op: 'contains' | 'equals' | 'not_empty' | 'starts_with'; value: string; caseSensitive: boolean }; then: string; else: string }
    | { id: string; type: 'parallel'; branches: string[] }
  >
}

export interface IntegrationSummary {
  id: string
  name: string
  version: string
  type: 'http-api' | 'mcp-server'
  baseUrl: string
  auth: { type: string; secretEnv: string | null }
  healthPath: string
  timeoutMs: number
}

/* ── Endpoints ─────────────────────────────────────────────────────────────── */

/* ── Engineering Control Center (M12–M15) ────────────────────────────────── */

export interface CapabilityMatrix {
  schema: boolean
  generator: boolean
  execution: boolean
  validation: boolean
}

export interface CatalogEntry {
  type: string
  capabilities: CapabilityMatrix
  via?: { generator?: string; execution?: string; validation?: string }
  notes?: string
}

export interface GeneratorInfo {
  type: string
  label: string
  docKind: string
  outStore: 'specs' | 'engineering'
  inputShape: string
  capabilities: CapabilityMatrix | null
}

export type EngineeringOutcome = {
  store: 'specs' | 'engineering'
  specKind?: string
  artifactKind?: string
  id: string
  version: string
}

export interface GenerationRecord {
  id: string
  type: string
  status: 'succeeded' | 'failed'
  startedAt: string
  durationMs: number
  inputHash: string
  outputHash?: string
  outcome?: EngineeringOutcome | null
  extraOutcomes?: EngineeringOutcome[]
  warnings?: string[]
  children?: string[]
  error?: { status?: number; code?: string; keys?: string[]; message?: string }
  provenance?: { generator: { id: string; version: string }; generatedAt: string }
}

export interface GenerateOkResponse {
  ok: true
  generationId: string
  type: string
  outcome: EngineeringOutcome
  extraOutcomes?: EngineeringOutcome[]
  reused: boolean
  warnings: string[]
  provenance: { generator: { id: string; version: string }; generatedAt: string; inputHash: string; outputHash: string }
  durationMs: number
  children?: string[]
}

export interface ArtifactSummary {
  kind: string
  id: string
  name: string
  version: string
  lifecycle: string
  createdAt?: string
}

export interface ArtifactDetail {
  kind: string
  id: string
  version: string
  lifecycle: string
  history: Array<{ from: string; to: string; at: string; actor: string; note?: string }>
  versions: Array<{ version: string; createdAt: string | null }>
  document: Record<string, unknown>
}

export interface ProjectSummary {
  id: string
  name?: string
  version?: string
  lifecycle?: string
  artifacts?: number
}

export interface ProjectGraphRef {
  artifact: { ref: string; type: string }
  ref: string
  expectedKind: string
  found: boolean
  kindMatch?: boolean
  versionMatch?: boolean | null
  registeredVersion?: string
}

export interface ProjectGraph {
  artifacts: Array<{ ref: string; type: string; dependencies: Array<{ ref: string }> }>
  specRefs: ProjectGraphRef[]
}

export interface CompositionArtifactResult {
  ref: string
  type: string
  action: 'reused-existing' | 'reused-generated' | 'created'
  specRef: { id: string; kind: string; version: string }
  generationId?: string
}

export interface ExecutionRecord {
  runId: string
  kind: 'agentic-app' | 'api-request' | 'dataset' | 'harness' | 'quality'
  artifact: { kind: string; id: string; version: string }
  invocationSummary: Record<string, unknown>
  status: 'queued' | 'running' | 'succeeded' | 'failed' | 'timeout' | 'cancelled'
  sandbox: { image: string; mode: string }
  limits: { timeoutMs: number }
  startedAt: string
  finishedAt?: string
  durationMs?: number
  result?: Record<string, unknown>
  logs?: string[]
  error?: string
  cancelled?: boolean
}

export interface ExecutionListItem {
  runId: string
  kind: string
  artifact: { kind: string; id: string; version: string }
  status: ExecutionRecord['status']
  durationMs: number | null
  startedAt: string
  error?: string | null
}

export interface QualityCheck {
  dimension: 'schema' | 'references' | 'security' | 'behavior'
  passed: boolean
  detail: Record<string, unknown>
}

export interface QualityReport {
  artifact: { kind: string; id: string; version: string }
  verdict: 'pass' | 'fail'
  checks: QualityCheck[]
  behaviorRunId?: string
  evaluatedAt: string
}

export interface ExportResult {
  exported: boolean
  format: string
  filename: string
  documents: string[]
  sizeBytes: number
  sha256: string
}

export interface SandboxStatus {
  configured: boolean
  healthy: boolean
  mode: string
  image: string
  note: string
}

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

  /* Knowledge (Fase 5 — consola) */
  knowledge: {
    sources: () => get<KnowledgeSource[]>('/api/console/knowledge/sources'),
    create: (input: { type: 'text' | 'url'; title?: string; ref?: string; text?: string }) =>
      post<KnowledgeSource>('/api/console/knowledge/sources', input),
    ingest: (sourceId: string) =>
      post<{ source: KnowledgeSource; skipped: boolean }>(`/api/console/knowledge/sources/${sourceId}/ingest`),
    remove: (sourceId: string) => request<{ deleted: boolean }>('DELETE', `/api/console/knowledge/sources/${sourceId}`),
    bindings: () => get<Record<string, string[]>>('/api/console/knowledge/bindings'),
    setBindings: (agentSpecId: string, sourceIds: string[]) =>
      post<{ bound: boolean }>(`/api/console/knowledge/bindings/${agentSpecId}`, { sourceIds }),
    query: (query: string, topK?: number) => post<KnowledgeQueryResult>('/api/console/knowledge/query', { query, topK }),
  },

  /* Memory (Fase 5.1 — consola) */
  memory: {
    list: () => get<MemoryRecord[]>('/api/console/memory'),
    remove: (memoryId: string) => request<{ deleted: boolean }>('DELETE', `/api/console/memory/${memoryId}`),
  },

  /* Workflows (Fase 6 — consola) */
  workflows: {
    list: () => get<SpecSummary[]>('/api/console/workflows'),
    get: (id: string) => get<SpecDoc>(`/api/console/workflows/${id}`),
    save: (doc: unknown) => post<{ stored: boolean; id: string; version: string }>('/api/console/workflows', doc),
    run: (id: string, input: string) => post<{ workflowRunId: string }>(`/api/console/workflows/${id}/run`, { input }),
    runs: () => get<WorkflowRunSummary[]>('/api/console/workflow-runs'),
    runDetail: (runId: string) => get<WorkflowRunRecord>(`/api/console/workflow-runs/${runId}`),
    cancel: (runId: string) => post<{ cancelling: boolean }>(`/api/console/workflow-runs/${runId}/cancel`),
    resume: (runId: string) => post<{ resumed: boolean }>(`/api/console/workflow-runs/${runId}/resume`),
  },

  templates: {
    list: () => get<Array<{ id: string; title: string; description: string; kind: string }>>('/api/console/templates'),
    install: (id: string) => post<{ ok: boolean; details?: string[] }>(`/api/console/templates/${id}/install`),
  },

  /* Integraciones (Fase 7 — consola) */
  integrations: {
    list: () => get<IntegrationSummary[]>('/api/console/integrations'),
    health: (id: string) => get<{ id: string; ok: boolean; status?: number; detail: string; durationMs: number }>(`/api/console/integrations/${id}/health`),
    mcpTools: (id: string) => get<{ id: string; tools: Array<{ name: string; description?: string }> }>(`/api/console/integrations/${id}/mcp-tools`),
    save: (doc: unknown) => post<{ stored: boolean; id: string; version: string }>('/api/console/integrations', doc),
  },

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

  /* Engineering Control Center (M12–M15 — consola) */
  eng: {
    catalog: () => get<CatalogEntry[]>('/api/console/engineering/catalog'),
    generators: () => get<{ engineVersion: string; generators: GeneratorInfo[] }>('/api/console/engineering/generators'),
    validate: (type: string, input: unknown) =>
      post<{ ok: boolean; type: string; checks?: Array<{ name: string; passed: boolean }>; status?: number; errors?: Record<string, string[]> }>(
        `/api/console/engineering/generators/${type}/validate`,
        input,
      ),
    generate: (type: string, input: unknown) => post<GenerateOkResponse>('/api/console/engineering/generate', { type, input }),
    generations: (limit = 30) => get<{ count: number; records: GenerationRecord[] }>(`/api/console/engineering/generations?limit=${limit}`),
    generation: (id: string) => get<GenerationRecord>(`/api/console/engineering/generations/${id}`),
    artifacts: () => get<{ count: number; artifacts: ArtifactSummary[] }>('/api/console/engineering/artifacts'),
    artifact: (kind: string, id: string) => get<ArtifactDetail>(`/api/console/engineering/artifacts/${kind}/${id}`),
    artifactLifecycle: (kind: string, id: string, to: string, note?: string) =>
      post<{ ok: boolean; state: string }>(`/api/console/engineering/artifacts/${kind}/${id}/lifecycle`, { to, note }),
    projects: () => get<ProjectSummary[] | { projects: ProjectSummary[] }>('/api/console/engineering/projects'),
    project: (id: string) => get<Record<string, unknown>>(`/api/console/engineering/projects/${id}`),
    projectGraph: (id: string) => get<ProjectGraph>(`/api/console/engineering/projects/${id}/graph`),
    projectProvenance: (id: string) => get<Record<string, unknown>>(`/api/console/engineering/projects/${id}/provenance`),
    projectLifecycle: (id: string, to: string, note?: string) =>
      post<{ ok: boolean; state: string }>(`/api/console/engineering/projects/${id}/lifecycle`, { to, note }),
    compose: (project: unknown) =>
      post<{ ok: true; projectId: string; version: string; artifacts: CompositionArtifactResult[]; warnings: string[]; generationId: string; durationMs: number }>(
        '/api/console/engineering/compositions',
        project,
      ),
    sandbox: () => get<SandboxStatus>('/api/console/engineering/sandbox'),
    run: (kind: string, id: string, invocation: Record<string, unknown>) =>
      post<ExecutionRecord>(`/api/console/engineering/${kind}/${id}/runs`, { invocation }),
    executions: (limit = 30) =>
      get<{ count: number; executions: ExecutionListItem[] }>(`/api/console/engineering/executions?limit=${limit}`),
    execution: (runId: string) => get<ExecutionRecord>(`/api/console/engineering/executions/${runId}`),
    cancelExecution: (runId: string) => post<{ ok: boolean; runId: string }>(`/api/console/engineering/executions/${runId}/cancel`),
    reconcile: () => post<{ ok: boolean; reconciled: string[]; sandboxReachable: boolean }>('/api/console/engineering/executions/reconcile'),
    quality: (kind: string, id: string, behavior?: { agentSpecId: string; timeoutMs?: number }) =>
      post<QualityReport>(`/api/console/engineering/quality/${kind}/${id}`, behavior ? { behavior } : {}),
    projectQuality: (id: string, behavior: boolean) =>
      post<{ ok: true; project: string; reports: Array<QualityReport | { artifact: string; error: string }> }>(
        `/api/console/engineering/projects/${id}/quality`,
        { behavior },
      ),
    exportProject: (id: string) => post<ExportResult>(`/api/console/engineering/projects/${id}/export`),
    exportArtifact: (kind: string, id: string) => post<ExportResult>(`/api/console/engineering/artifacts/${kind}/${id}/export`),
    exportGeneration: (id: string) => post<ExportResult>(`/api/console/engineering/generations/${id}/export`),
    exports: () => get<{ count: number; files: Array<{ filename: string; sizeBytes: number; createdAt: string }> }>('/api/console/engineering/exports'),
    exportFile: (filename: string) => get<unknown>(`/api/console/engineering/exports/${encodeURIComponent(filename)}`),
  },
}
