import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';

/**
 * agent-runtime-store — persistencia de sesiones y ejecuciones (Fase 3).
 *
 * Reutiliza el volumen persistente del backend (DATA_DIR, montado por
 * docker-compose en /app/data). Escrituras atómicas (tmp+rename). Sin
 * secretos: los registros no contienen ni contienen nunca credenciales ni
 * URLs resueltas (solo referencias 'env:VAR').
 */

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const SESSIONS_DIR = path.join(DATA_DIR, 'runtime', 'sessions');
const RUNS_DIR = path.join(DATA_DIR, 'runtime', 'runs');

let ready = false;

async function ensure(): Promise<void> {
  if (!ready) {
    await fs.mkdir(SESSIONS_DIR, { recursive: true });
    await fs.mkdir(RUNS_DIR, { recursive: true });
    ready = true;
  }
}

export type RunStatus =
  | 'running'
  | 'completed'
  | 'completed_without_tools'
  | 'requires_approval'
  | 'failed'
  | 'timeout'
  | 'max_iterations_reached';

export interface SessionMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolName?: string;
  at: string;
}

export interface AgentRunRecord {
  executionId: string;
  sessionId: string;
  agentSpecId: string;
  /** Documento AgentSpec v1 ejecutado (sin secretos por diseño del contrato). */
  agentSpec: unknown;
  profileUsed: {
    id: string;
    version: string;
    provider: string;
    model: string;
    /** Referencia al endpoint (env:VAR), nunca el valor resuelto. */
    endpoint: string;
  };
  input: string;
  status: RunStatus;
  result: {
    text?: string;
    toolExecutions: Array<{ name: string; ok: boolean; error?: string; result?: unknown }>;
    iterations: number;
    durationMs?: number;
    /** Fase 5: fragmentos de conocimiento inyectados en el turno (trazabilidad
     *  respuesta→fuente). Solo con spec.memory { enabled, strategy: 'semantic' }. */
    retrievals?: Array<{ sourceId: string; title: string; ref: string; chunkIdx: number; score: number }>;
  };
  errors: string[];
  startedAt: string;
  finishedAt?: string;
}

export interface AgentSessionRecord {
  sessionId: string;
  agentSpecId: string;
  profileId: string;
  createdAt: string;
  messages: SessionMessage[];
  runExecutionIds: string[];
}

export function newExecutionId(): string {
  return 'run-' + randomBytes(6).toString('hex');
}

export function newSessionId(): string {
  return 'ses-' + randomBytes(6).toString('hex');
}

async function writeAtomic(file: string, data: unknown): Promise<void> {
  const tmp = `${file}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf8');
  await fs.rename(tmp, file);
}

/** Guard de formato (defensa en profundidad: la ruta también sanea). */
function safeId(id: string): boolean {
  return /^[a-z0-9-]{3,80}$/.test(id);
}

export async function saveSession(session: AgentSessionRecord): Promise<void> {
  await ensure();
  await writeAtomic(path.join(SESSIONS_DIR, `${session.sessionId}.json`), session);
}

export async function loadSession(sessionId: string): Promise<AgentSessionRecord | null> {
  await ensure();
  if (!safeId(sessionId)) {
    return null;
  }
  try {
    return JSON.parse(await fs.readFile(path.join(SESSIONS_DIR, `${sessionId}.json`), 'utf8')) as AgentSessionRecord;
  } catch {
    return null;
  }
}

export async function saveRun(record: AgentRunRecord): Promise<void> {
  await ensure();
  await writeAtomic(path.join(RUNS_DIR, `${record.executionId}.json`), record);
}

export async function loadRun(executionId: string): Promise<AgentRunRecord | null> {
  await ensure();
  if (!safeId(executionId)) {
    return null;
  }
  try {
    return JSON.parse(await fs.readFile(path.join(RUNS_DIR, `${executionId}.json`), 'utf8')) as AgentRunRecord;
  } catch {
    return null;
  }
}

/* ── Listados (Fase 4 — Control Center) ───────────────────────────────────── */
/**
 * MVP sobre ficheros JSON: readdir + parse (el volumen es pequeño). El
 * orden por antigüedad usa startedAt/createdAt del documento. La migración a
 * repositorios estructurados (Fase 4.1, si la carga lo justifica) reemplazará
 * estos escaneos sin cambiar la interfaz.
 */

export async function listSessions(limit = 25): Promise<AgentSessionRecord[]> {
  await ensure();
  const files = (await fs.readdir(SESSIONS_DIR)).filter((f) => f.endsWith('.json'));
  const sessions: AgentSessionRecord[] = [];
  for (const file of files) {
    try {
      sessions.push(JSON.parse(await fs.readFile(path.join(SESSIONS_DIR, file), 'utf8')) as AgentSessionRecord);
    } catch {
      // fichero corrupto: se ignora, no bloquea el listado
    }
  }
  sessions.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  return sessions.slice(0, Math.max(1, limit));
}

export async function countSessions(): Promise<number> {
  await ensure();
  return (await fs.readdir(SESSIONS_DIR)).filter((f) => f.endsWith('.json')).length;
}

export async function listRuns(limit = 25): Promise<AgentRunRecord[]> {
  await ensure();
  const files = (await fs.readdir(RUNS_DIR)).filter((f) => f.endsWith('.json'));
  const runs: AgentRunRecord[] = [];
  for (const file of files) {
    try {
      runs.push(JSON.parse(await fs.readFile(path.join(RUNS_DIR, file), 'utf8')) as AgentRunRecord);
    } catch {
      // fichero corrupto: se ignora, no bloquea el listado
    }
  }
  runs.sort((a, b) => (b.startedAt || '').localeCompare(a.startedAt || ''));
  return runs.slice(0, Math.max(1, limit));
}

export async function countRuns(): Promise<number> {
  await ensure();
  return (await fs.readdir(RUNS_DIR)).filter((f) => f.endsWith('.json')).length;
}

/**
 * Al arrancar el runtime, las ejecuciones que quedaron en 'running' tras un
 * reinicio (crash, deploy) nunca alcanzarán estado terminal por sí solas: se
 * marcan explícitamente como fallidas con la causa. Nunca simula un resultado.
 */
export async function sweepInterruptedRuns(): Promise<number> {
  await ensure();
  const files = (await fs.readdir(RUNS_DIR)).filter((f) => f.endsWith('.json'));
  let swept = 0;
  for (const file of files) {
    const full = path.join(RUNS_DIR, file);
    try {
      const run = JSON.parse(await fs.readFile(full, 'utf8')) as AgentRunRecord;
      if (run.status !== 'running') {
        continue;
      }
      run.status = 'failed';
      run.errors.push('runtime_restarted: la ejecución quedó en running tras reiniciar el contenedor');
      if (!run.finishedAt) {
        run.finishedAt = new Date().toISOString();
        run.result.durationMs = Date.now() - Date.parse(run.startedAt);
      }
      await writeAtomic(full, run);
      swept += 1;
    } catch {
      // fichero corrupto: no se toca
    }
  }
  return swept;
}

/** Ejecuciones de una sesión (resumen por marcas temporales). */
export async function listSessionRuns(sessionId: string): Promise<
  Array<{ executionId: string; status: RunStatus; startedAt: string; finishedAt?: string }>
> {
  await ensure();
  if (!safeId(sessionId)) {
    return [];
  }
  const session = await loadSession(sessionId);
  if (!session) {
    return [];
  }
  const entries: Array<{ executionId: string; status: RunStatus; startedAt: string; finishedAt?: string }> = [];
  for (const executionId of session.runExecutionIds) {
    const run = await loadRun(executionId);
    if (run) {
      entries.push({ executionId: run.executionId, status: run.status, startedAt: run.startedAt, finishedAt: run.finishedAt });
    }
  }
  return entries;
}
