import { promises as fs } from 'node:fs';
import path from 'node:path';
import { contentHash, embed } from './embedding.service';

/**
 * memory-store (Fase 5.1) — memoria de sesión y de agente.
 *
 * PRINCIPIO (decisión de producto): el modelo NUNCA escribe libremente en
 * memoria persistente. La escritura ocurre SOLO a través de la herramienta
 * CERRADA `memory-write` (ToolSpec sembrada, permiso 'memory:write',
 * declaración explícita en spec.tools[]) y pasa por políticas
 * DETERMINISTAS de este módulo: validación de tamaño, deduplicación por
 * hash, TTL, cuota por agente. Sin vector (fallo de embeddings) no se
 * persiste memoria de agente — nunca se simula.
 *
 * Separación con Knowledge: aquí vive lo DERIVADO de interacciones
 * (origen: executionId + entrada del turno); lo documental está en
 * knowledge-store. Cada recuerdo es trazable (agente, sesión, ejecución).
 *
 * Persistencia: DATA_DIR/memory/memories.json (escritura atómica), cubierto
 * por el backup de Fase 4.2. Límites (env con defaults):
 * MEMORY_MAX_CONTENT_CHARS (1000) · MEMORY_AGENT_TTL_DAYS (30) ·
 * MEMORY_SESSION_TTL_DAYS (7) · MEMORY_MAX_ACTIVE_PER_AGENT (50) ·
 * MEMORY_RETRIEVAL_TOPK (3).
 */

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const MEMORY_FILE = path.join(DATA_DIR, 'memory', 'memories.json');

export type MemoryKind = 'agent' | 'session';
export type MemoryStatus = 'active' | 'deleted';

export interface MemoryRecord {
  memoryId: string; // mem-…
  agentSpecId: string;
  sessionId: string | null; // memoria de sesión: ligada a la conversación
  kind: MemoryKind;
  content: string;
  hash: string;
  vector: number[] | null;
  origin: { executionId: string; input: string; reason: 'tool_memory_write' };
  createdAt: string;
  expiresAt: string;
  status: MemoryStatus;
}

let ready = false;
async function ensure(): Promise<void> {
  if (!ready) {
    await fs.mkdir(path.dirname(MEMORY_FILE), { recursive: true });
    ready = true;
  }
}

async function writeAll(list: MemoryRecord[]): Promise<void> {
  const tmp = `${MEMORY_FILE}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(list, null, 2), 'utf8');
  await fs.rename(tmp, MEMORY_FILE);
}

export async function listAll(): Promise<MemoryRecord[]> {
  await ensure();
  try {
    const list = JSON.parse(await fs.readFile(MEMORY_FILE, 'utf8')) as MemoryRecord[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function ttlMs(kind: MemoryKind): number {
  const days = kind === 'agent' ? envLimit('MEMORY_AGENT_TTL_DAYS', 30) : envLimit('MEMORY_SESSION_TTL_DAYS', 7);
  return days * 24 * 60 * 60 * 1000;
}

function envLimit(name: string, fallback: number): number {
  const v = Number(process.env[name]);
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

export function isExpired(m: MemoryRecord, now = Date.now()): boolean {
  return Date.parse(m.expiresAt) < now;
}

/** Recuerdos ACTIVOS (no borrados, no caducados) de un agente. */
export async function listActive(agentSpecId: string, kind?: MemoryKind): Promise<MemoryRecord[]> {
  const all = await listAll();
  const now = Date.now();
  return all.filter(
    (m) => m.agentSpecId === agentSpecId && m.status === 'active' && !isExpired(m, now) && (kind === undefined || m.kind === kind),
  );
}

export type MemoryWriteResult =
  | { ok: true; memory: MemoryRecord; deduplicated: boolean }
  | { ok: false; reason: 'memory_disabled' | 'invalid_content' | 'quota_exceeded' | 'embedding_failed' | 'embedding_provider_error'; message?: string };

/**
 * Políticas de escritura (deterministas, llamadas desde el adaptador cerrado
 * de la tool `memory-write`):
 *   1. El agente debe tener spec.memory.enabled (carga el llamador y pasa
 *      memoryEnabled=true; denegación por defecto en el runtime).
 *   2. Contenido 3..MEMORY_MAX_CONTENT_CHARS.
 *   3. Deduplicación por hash (mismo contenido activo → no-op idempotente).
 *   4. Cuota MEMORY_MAX_ACTIVE_PER_AGENT (los recuerdos no caducan solos; el
 *      operador limpia desde la consola o caducan por TTL).
 *   5. Embedding en el momento de la escritura (recuperación semántica
 *      posterior). Sin vector no se persiste memoria de agente.
 */
export async function writeMemory(input: {
  agentSpecId: string
  sessionId: string | null
  kind: MemoryKind
  content: string
  origin: { executionId: string; input: string }
  memoryEnabled: boolean
}): Promise<MemoryWriteResult> {
  if (!input.memoryEnabled) {
    return { ok: false, reason: 'memory_disabled' };
  }
  const content = input.content.trim().replace(/\s+/g, ' ');
  const maxChars = envLimit('MEMORY_MAX_CONTENT_CHARS', 1000);
  if (content.length < 3 || content.length > maxChars) {
    return { ok: false, reason: 'invalid_content', message: `el contenido debe tener 3-${maxChars} caracteres` };
  }
  const kind = input.kind === 'session' && input.sessionId ? 'session' : 'agent';
  const hash = contentHash(content);

  const all = await listAll();
  const active = all.filter((m) => m.status === 'active' && !isExpired(m));

  // Deduplicación: mismo contenido (mismo agente y, si es de sesión, la
  // misma sesión) ya activo → no-op idempotente.
  const dup = active.find(
    (m) => m.hash === hash && m.agentSpecId === input.agentSpecId && (m.kind === 'agent' || m.sessionId === input.sessionId),
  );
  if (dup) {
    return { ok: true, memory: dup, deduplicated: true };
  }

  // Cuota por agente (recuerdos activos de CUALQUIER sesión del agente).
  const quota = envLimit('MEMORY_MAX_ACTIVE_PER_AGENT', 50);
  if (active.filter((m) => m.agentSpecId === input.agentSpecId).length >= quota) {
    return { ok: false, reason: 'quota_exceeded', message: `límite ${quota} recuerdos activos` };
  }

  // Embedding real (agente) — sin vector no se persiste memoria de agente.
  let vector: number[] | null = null;
  if (kind === 'agent') {
    const v = await embed([content]);
    if (!v.ok || !v.vectors?.[0]) {
      return { ok: false, reason: 'embedding_failed', message: v.error };
    }
    vector = v.vectors[0];
  }

  const now = new Date();
  const record: MemoryRecord = {
    memoryId: `mem-${now.getTime().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    agentSpecId: input.agentSpecId,
    sessionId: kind === 'session' ? input.sessionId : null,
    kind,
    content,
    hash,
    vector,
    origin: { executionId: input.origin.executionId, input: input.origin.input.slice(0, 200), reason: 'tool_memory_write' },
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + ttlMs(kind)).toISOString(),
    status: 'active',
  };
  all.push(record);
  await writeAll(all);
  return { ok: true, memory: record, deduplicated: false };
}

export async function deleteMemory(memoryId: string): Promise<boolean> {
  const all = await listAll();
  const target = all.find((m) => m.memoryId === memoryId);
  if (!target || target.status === 'deleted') {
    return false;
  }
  target.status = 'deleted';
  await writeAll(all);
  return true;
}

/* ── Recuperación semántica (inyección de contexto) ───────────────────────── */

function dot(a: number[], b: number[]): number {
  let s = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i += 1) {
    s += a[i] * b[i];
  }
  return s;
}

export interface MemoryHit {
  memoryId: string
  kind: MemoryKind
  content: string
  score: number | null // null → ordenación por recencia (sin vector)
  createdAt: string
}

/**
 * Recuerdos relevantes para un turno:
 *  - kind 'agent': similitud semántica con la entrada (topK, umbral).
 *  - kind 'session': recencia (son notas de ESTA conversación).
 * Fallos de embeddings → degradación por recencia (nunca bloquea el turno).
 */
export async function retrieveMemories(
  agentSpecId: string,
  sessionId: string,
  rawInput: string,
): Promise<{ agent: MemoryHit[]; session: MemoryHit[] }> {
  const [agentActive, sessionAll] = await Promise.all([listActive(agentSpecId, 'agent'), listActive(agentSpecId, 'session')]);
  const sessionActive = sessionAll.filter((m) => m.sessionId === sessionId);

  const byRecency = (a: MemoryRecord, b: MemoryRecord) => b.createdAt.localeCompare(a.createdAt);
  const sessionHits: MemoryHit[] = sessionActive
    .sort(byRecency)
    .slice(0, envLimit('MEMORY_SESSION_INJECTION_MAX', 5))
    .map((m) => ({ memoryId: m.memoryId, kind: m.kind, content: m.content, score: null, createdAt: m.createdAt }));

  const k = envLimit('MEMORY_RETRIEVAL_TOPK', 3);
  const minScore = Number(process.env.MEMORY_RETRIEVAL_MIN_SCORE) || 0.3;
  let agentHits: MemoryHit[] = [];
  const vectorized = agentActive.filter((m) => m.vector && m.vector.length > 0);
  if (vectorized.length > 0) {
    const q = await embed([rawInput.slice(0, 2000)]);
    if (q.ok && q.vectors?.[0]) {
      agentHits = vectorized
        .map((m) => ({ memoryId: m.memoryId, kind: m.kind, content: m.content, score: Number(dot(q.vectors![0], m.vector!).toFixed(4)), createdAt: m.createdAt }))
        .filter((m) => (m.score ?? 0) >= minScore)
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
        .slice(0, k);
    } else {
      // Degradación: sin embeddings, los últimos por recencia (explícito).
      agentHits = vectorized.sort(byRecency).slice(0, k).map((m) => ({ memoryId: m.memoryId, kind: m.kind, content: m.content, score: null, createdAt: m.createdAt }));
    }
  }
  return { agent: agentHits, session: sessionHits };
}
