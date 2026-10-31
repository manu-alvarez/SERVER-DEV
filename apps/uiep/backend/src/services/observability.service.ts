import { promises as fs } from 'node:fs';
import path from 'node:path';

/**
 * observability (Fase 8) — servicio transversal: métricas en proceso,
 * auditoría JSONL append-only y logging estructurado con correlación.
 *
 * · Sin dependencias: contadores/histogramas sencillos y suficientes para el
 *   volumen del VPS (SQLite/metrics store solo si las métricas lo justifican).
 * · Auditoría: DATA_DIR/audit/audit.jsonl — eventos {ts, actor, action,
 *   correlation, detail} SIN secretos; rotación por tamaño (5 MB → .old).
 * · Correlación: workflowRunId → agentRunId (sesión/ejecución del agente) →
 *   tool → integration — los IDs ya persistidos en los run records; el
 *   logger los propaga a cada línea.
 */

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const AUDIT_DIR = path.join(DATA_DIR, 'audit');
const AUDIT_FILE = path.join(AUDIT_DIR, 'audit.jsonl');
const AUDIT_MAX_BYTES = 5 * 1024 * 1024;

/* ── Auditoría (append-only, sin secretos) ────────────────────────────────── */

export type AuditActor =
  | { kind: 'console' }
  | { kind: 'agent'; id: string }
  | { kind: 'mcp' }
  | { kind: 'hook'; id: string }
  | { kind: 'system' };

export interface AuditEvent {
  /** El ts lo añade el writer (los llamadores no lo pasan). */
  ts?: string
  actor: AuditActor
  action: string
  correlation?: {
    workflowRunId?: string
    agentRunId?: string
    sessionId?: string
    integrationId?: string
    toolName?: string
    targetId?: string
  }
  detail?: Record<string, unknown>
}

let auditReady = false;
async function auditEnsure(): Promise<void> {
  if (!auditReady) {
    await fs.mkdir(AUDIT_DIR, { recursive: true });
    auditReady = true;
  }
}

function sanitizeDetail(detail: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!detail) {
    return {};
  }
  // Defensa en profundidad: ninguna clave que parezca un secreto viaja al log.
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(detail)) {
    if (/secret|password|token|key|credential/i.test(k)) {
      out[k] = '[redacted]';
    } else {
      out[k] = v;
    }
  }
  return out;
}

/** Registra un evento de auditoría (nunca lanza; el logging jamás rompe el flujo). */
export function audit(event: AuditEvent): void {
  void (async () => {
    try {
      await auditEnsure();
      // Rotación simple por tamaño.
      try {
        const st = await fs.stat(AUDIT_FILE);
        if (st.size > AUDIT_MAX_BYTES) {
          await fs.rename(AUDIT_FILE, `${AUDIT_FILE}.old`);
        }
      } catch {
        /* no existe aún */
      }
      const line = JSON.stringify({ ts: new Date().toISOString(), actor: event.actor, action: event.action, correlation: event.correlation ?? {}, detail: sanitizeDetail(event.detail) });
      await fs.appendFile(AUDIT_FILE, line + '\n', 'utf8');
    } catch {
      /* el logging jamás rompe el flujo */
    }
  })();
}

/** Cola de auditoría reciente (del final del fichero; la más nueva última). */
export async function auditTail(limit = 50): Promise<Array<AuditEvent & { ts: string }>> {
  try {
    const raw = await fs.readFile(AUDIT_FILE, 'utf8');
    const lines = raw.trim().split('\n').filter(Boolean);
    return lines.slice(-limit).map((l) => {
      try {
        return JSON.parse(l) as AuditEvent & { ts: string };
      } catch {
        return { ts: '', actor: { kind: 'system' as const }, action: 'corrupt_line' };
      }
    });
  } catch {
    return [];
  }
}

/* ── Métricas (contadores + latencia por etiquetas) ───────────────────────── */

export interface MetricSeries {
  calls: number
  errors: number
  latencySumMs: number
  latencyMaxMs: number
  lastErrorAt?: string
  lastError?: string
}

const metrics = new Map<string, MetricSeries>(); // key: '<plane>:<name>'

function metricKey(plane: string, name: string): string {
  return `${plane}:${name}`;
}

export function recordMetric(plane: 'integration' | 'tool' | 'agent' | 'workflow' | 'mcp', name: string, opts: { ok: boolean; latencyMs?: number; error?: string }): void {
  const key = metricKey(plane, name);
  const m = metrics.get(key) ?? { calls: 0, errors: 0, latencySumMs: 0, latencyMaxMs: 0 };
  m.calls += 1;
  if (!opts.ok) {
    m.errors += 1;
    m.lastErrorAt = new Date().toISOString();
    m.lastError = (opts.error ?? 'error').slice(0, 200);
  }
  if (opts.latencyMs !== undefined) {
    m.latencySumMs += opts.latencyMs;
    m.latencyMaxMs = Math.max(m.latencyMaxMs, opts.latencyMs);
  }
  metrics.set(key, m);
}

export function snapshotMetrics(): Array<MetricSeries & { key: string; avgMs: number | null }> {
  return [...metrics.entries()].map(([key, m]) => ({
    key,
    ...m,
    avgMs: m.calls > 0 ? Math.round(m.latencySumMs / m.calls) : null,
  }));
}

/** Logging estructurado (una línea JSON con correlación). */
export function logStructured(level: 'info' | 'warn' | 'error', scope: string, msg: string, correlation?: Record<string, unknown>, extra?: Record<string, unknown>): void {
  const line = JSON.stringify({ ts: new Date().toISOString(), level, scope, msg, correlation: correlation ?? {}, ...extra });
  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }
}
