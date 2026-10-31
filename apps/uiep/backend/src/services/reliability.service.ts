import { promises as fs } from 'node:fs';
import path from 'node:path';
import { contentHash } from './embedding.service';

/**
 * reliability (Fase 8) — motor transversal de fiabilidad.
 *
 * 1. LIBRO DE IDEMPOTENCIA para llamadas externas: cada operación externa
 *    (conector HTTP) lleva una clave determinista (integración + método +
 *    path + hash del body). El libro (DATA_DIR/reliability/idempotency.json)
 *    guarda el resultado PERSISTIDO: si un workflow se reanuda y re-intenta
 *    una llamada ya COMPLETADA, se REPRODUCE el resultado guardado en vez de
 *    repetir el efecto externo. Resultados INCERTOS (fallo de red tras
 *    enviar) se registran como inciertos y NO se reproducen (se re-ejecutan
 *    con aviso) — nunca se simula un éxito.
 * 2. SEMÁFOROS GLOBALES: tope de ejecuciones de agente y de workflows en
 *    vuelo EN TODO EL PROCESO (backpressure en el borde → 429) — los límites
 *    por workflow/integración no bastan para proteger al VPS del conjunto.
 */

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const LEDGER_FILE = path.join(DATA_DIR, 'reliability', 'idempotency.json');

const ENTRY_TTL_MS = 24 * 60 * 60 * 1000; // las entradas viven 24 h

export type LedgerOutcome = 'completed' | 'uncertain';

export interface IdempotencyEntry {
  key: string
  outcome: LedgerOutcome
  /** Resultado persistido (solo para 'completed' — reproducción exacta). */
  result?: { status?: number; body?: string }
  createdAt: string
}

type Ledger = Record<string, IdempotencyEntry>;

let ledgerCache: Ledger | null = null;

async function loadLedger(): Promise<Ledger> {
  if (ledgerCache) {
    return ledgerCache;
  }
  await fs.mkdir(path.dirname(LEDGER_FILE), { recursive: true });
  try {
    const raw = JSON.parse(await fs.readFile(LEDGER_FILE, 'utf8')) as Ledger;
    ledgerCache = raw && typeof raw === 'object' ? raw : {};
  } catch {
    ledgerCache = {};
  }
  return ledgerCache;
}

async function persistLedger(ledger: Ledger): Promise<void> {
  const tmp = `${LEDGER_FILE}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(ledger, null, 2), 'utf8');
  await fs.rename(tmp, LEDGER_FILE);
}

export function idempotencyKey(input: { integrationId: string; method: string; path?: string; body?: unknown }): string {
  return contentHash(`${input.integrationId}|${input.method}|${input.path ?? ''}|${JSON.stringify(input.body ?? null)}`).slice(0, 32);
}

/** ¿Hay un resultado COMPLETADO previo para esta clave? → reproducir. */
export async function lookupIdempotent(key: string): Promise<IdempotencyEntry | null> {
  const ledger = await loadLedger();
  const entry = ledger[key];
  if (!entry) {
    return null;
  }
  if (Date.now() - Date.parse(entry.createdAt) > ENTRY_TTL_MS) {
    delete ledger[key];
    await persistLedger(ledger);
    return null;
  }
  return entry;
}

export async function recordIdempotent(key: string, outcome: LedgerOutcome, result?: { status?: number; body?: string }): Promise<void> {
  const ledger = await loadLedger();
  // Purga perezosa de entradas caducadas.
  const now = Date.now();
  for (const [k, e] of Object.entries(ledger)) {
    if (now - Date.parse(e.createdAt) > ENTRY_TTL_MS) {
      delete ledger[k];
    }
  }
  ledger[key] = { key, outcome, result, createdAt: new Date().toISOString() };
  await persistLedger(ledger);
}

/* ── Semáforos globales (backpressure en el borde) ────────────────────────── */

let agentRunsInFlight = 0;
let workflowRunsInFlight = 0;

export function globalSlots(): { agentRunsInFlight: number; workflowRunsInFlight: number; agentLimit: number; workflowLimit: number } {
  return {
    agentRunsInFlight,
    workflowRunsInFlight,
    agentLimit: envLimit('RUNTIME_MAX_CONCURRENT_RUNS', 8),
    workflowLimit: envLimit('WORKFLOW_MAX_CONCURRENT_RUNS', 4),
  };
}

function envLimit(name: string, fallback: number): number {
  const v = Number(process.env[name]);
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

/** Adquisición del slot global de ejecución de agente (false → saturado). */
export function tryAcquireAgentSlot(): boolean {
  const limit = envLimit('RUNTIME_MAX_CONCURRENT_RUNS', 8);
  if (agentRunsInFlight >= limit) {
    return false;
  }
  agentRunsInFlight += 1;
  return true;
}

export function releaseAgentSlot(): void {
  agentRunsInFlight = Math.max(0, agentRunsInFlight - 1);
}

export function tryAcquireWorkflowSlot(): boolean {
  const limit = envLimit('WORKFLOW_MAX_CONCURRENT_RUNS', 4);
  if (workflowRunsInFlight >= limit) {
    return false;
  }
  workflowRunsInFlight += 1;
  return true;
}

export function releaseWorkflowSlot(): void {
  workflowRunsInFlight = Math.max(0, workflowRunsInFlight - 1);
}
