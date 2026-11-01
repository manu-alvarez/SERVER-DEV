import { promises as fs } from 'node:fs';
import path from 'node:path';
import { audit } from './observability.service';

/**
 * execution-registry (Misión 14) — registro de EJECUCIONES de artefactos.
 *
 * Cada run (agentic-app, api-request, dataset, harness, quality) queda
 * registrado con: artefacto+versión, sandbox usado, límites aplicados,
 * estado terminal, métricas, logs REDACTADOS (sin payload de entrada) y
 * error si lo hubo. Persistencia atómica en data/engineering/executions/.
 *
 * Los secretos NUNCA se registran: los logs del sandbox son metadatos del
 * orquestador (p. ej. 'agent X: start falló (concurrency_limit)'), no
 * contenido de entrada/salida completo.
 */

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const EXECUTIONS_DIR = path.join(DATA_DIR, 'engineering', 'executions');

export type ExecutionStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'timeout' | 'cancelled';

export interface ExecutionRecord {
  runId: string;
  kind: 'agentic-app' | 'api-request' | 'dataset' | 'harness' | 'quality';
  artifact: { kind: string; id: string; version: string };
  invocationSummary: Record<string, unknown>;
  status: ExecutionStatus;
  sandbox: { image: string; mode: 'container-internal-net' };
  limits: { timeoutMs: number };
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  result?: Record<string, unknown>;
  logs?: string[];
  error?: string;
  cancelled?: boolean;
  evaluation?: { verdict: 'pass' | 'fail' | 'not_evaluated'; details: Record<string, unknown> };
}

const RUN_ID_RE = /^run-[a-z0-9-]{4,60}$/;

let dirReady = false;

async function ensureDir(): Promise<void> {
  if (!dirReady) {
    await fs.mkdir(EXECUTIONS_DIR, { recursive: true });
    dirReady = true;
  }
}

export function newRunId(): string {
  return `run-${Date.now().toString(36)}-${randomId()}`;
}

function randomId(): string {
  return Math.random().toString(36).slice(2, 8);
}

/** Redacción: solo resúmenes SIN contenido de entrada del usuario. */
export function summarizeInvocation(invocation: unknown): Record<string, unknown> {
  if (invocation === null || typeof invocation !== 'object') {
    return {};
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(invocation as Record<string, unknown>)) {
    if (typeof v === 'string') {
      out[k] = { chars: v.length }; // jamás el valor
    } else if (v !== null && typeof v === 'object') {
      out[k] = { keys: Object.keys(v as Record<string, unknown>).slice(0, 16) };
    } else {
      out[k] = v;
    }
  }
  return out;
}

export async function saveExecution(record: ExecutionRecord): Promise<void> {
  await ensureDir();
  const file = path.join(EXECUTIONS_DIR, `${record.runId}.json`);
  const tmp = `${file}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(record, null, 2), 'utf8');
  await fs.rename(tmp, file);
}

export async function getExecution(runId: string): Promise<ExecutionRecord | null> {
  if (!RUN_ID_RE.test(runId)) {
    return null;
  }
  try {
    return JSON.parse(await fs.readFile(path.join(EXECUTIONS_DIR, `${runId}.json`), 'utf8')) as ExecutionRecord;
  } catch {
    return null;
  }
}

export async function listExecutions(limit = 50): Promise<ExecutionRecord[]> {
  let files: string[] = [];
  try {
    files = (await fs.readdir(EXECUTIONS_DIR)).filter((f) => f.endsWith('.json'));
  } catch {
    return [];
  }
  const records: ExecutionRecord[] = [];
  for (const f of files) {
    try {
      records.push(JSON.parse(await fs.readFile(path.join(EXECUTIONS_DIR, f), 'utf8')) as ExecutionRecord);
    } catch {
      /* corrupto: ignorar */
    }
  }
  records.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  return limit > 0 ? records.slice(0, limit) : records;
}

export async function updateExecution(runId: string, patch: Partial<ExecutionRecord>): Promise<ExecutionRecord | null> {
  const current = await getExecution(runId);
  if (!current) {
    return null;
  }
  const next = { ...current, ...patch };
  await saveExecution(next);
  return next;
}

/** Cancelación: marca el registro y pide al sandbox abortar el job. */
export async function markCancelled(runId: string): Promise<ExecutionRecord | null> {
  return updateExecution(runId, { status: 'cancelled', cancelled: true, finishedAt: new Date().toISOString() });
}

export function auditExecution(record: ExecutionRecord, passed: boolean): void {
  audit({
    actor: { kind: 'system' },
    action: 'engineering.execution',
    correlation: { targetId: record.artifact.id },
    detail: { runId: record.runId, kind: record.kind, artifact: `${record.artifact.kind}/${record.artifact.id}@${record.artifact.version}`, passed, durationMs: record.durationMs ?? null, error: record.error ?? null },
  });
}

/** Bloqueo de concurrencia por proceso (2 runs simultáneos máx.). */
let inFlight = 0;

export function tryAcquireExecutionSlot(max = 2): boolean {
  if (inFlight >= max) {
    return false;
  }
  inFlight += 1;
  return true;
}

export function releaseExecutionSlot(): void {
  inFlight = Math.max(0, inFlight - 1);
}

/**
 * Reconciliación de RUNS ZOMBIS (Misión 15): un run `running` cuyo job ya NO
 * existe en el sandbox (el contenedor se reinició, el cliente murió a mitad,
 * el proceso perdió la respuesta) se marca `failed` con error
 * `orphan_reconciled` — sin inventar resultados. Solo se consulta el sandbox
 * una vez por ciclo; si no responde, no se toca nada (fail-closed).
 */
export async function reconcileZombieExecutions(): Promise<{ reconciled: string[]; sandboxReachable: boolean }> {
  const running = (await listExecutions(200)).filter((r) => r.status === 'running');
  if (running.length === 0) {
    return { reconciled: [], sandboxReachable: true };
  }
  const { sandboxRunningJobs } = await import('./sandbox-client.service');
  const liveJobs = await sandboxRunningJobs();
  if (liveJobs === null) {
    return { reconciled: [], sandboxReachable: false }; // sandbox no disponible: NO se toca nada
  }
  const reconciled: string[] = [];
  for (const rec of running) {
    if (!liveJobs.includes(rec.runId)) {
      const done = await updateExecution(rec.runId, {
        status: 'failed',
        finishedAt: new Date().toISOString(),
        error: 'orphan_reconciled: el job ya no existe en el sandbox (reinicio del contenedor o respuesta perdida)',
      });
      audit({
        actor: { kind: 'system' },
        action: 'engineering.execution.reconcile',
        correlation: { targetId: rec.runId },
        detail: { kind: rec.kind, artifact: `${rec.artifact.kind}/${rec.artifact.id}` },
      });
      if (done) {
        reconciled.push(rec.runId);
      }
    }
  }
  return { reconciled, sandboxReachable: true };
}
