import { getLatestSpec, listSpecs } from './spec-registry.service';
import type { IntegrationSpecV1 } from '@uiep/agent-spec';

/**
 * integration-service (Fase 7) — registro y ejecución de integraciones.
 *
 * · Las IntegrationSpecs viven en el spec-registry existente (kind
 *   'Integration') — mismo versionado/idempotencia que el resto de contratos.
 * · Auth POR REFERENCIA: el spec guarda el NOMBRE de la env var; el valor se
 *   resuelve SOLO en el proceso del servidor y jamás se registra ni devuelve.
 * · Circuit breaker por integración: N fallos consecutivos (5) abren el
 *   circuito durante un cooldown (60 s) → fallo explícito rápido (sin
 *   martillear al proveedor); los éxitos lo cierran.
 * · Invariante anti-SSRF del conector: la URL la define el OPERADOR en la
 *   ToolSpec/integración (host+path); el dato del AGENTE viaja como body/
 *   query VALUE — nunca construye el destino.
 */

export async function getIntegration(integrationId: string): Promise<IntegrationSpecV1 | null> {
  const envelope = await getLatestSpec(integrationId);
  if (!envelope || (envelope as { kind?: string }).kind !== 'Integration') {
    return null;
  }
  return envelope as unknown as IntegrationSpecV1;
}

export async function listIntegrations(): Promise<IntegrationSpecV1[]> {
  const summaries = await listSpecs({ kind: 'Integration' });
  const out: IntegrationSpecV1[] = [];
  for (const s of summaries) {
    const doc = await getIntegration(s.id);
    if (doc) {
      out.push(doc);
    }
  }
  return out;
}

/** Resuelve la cabecera de auth desde la env var REFERENCIADA. Sin valor
 *  configurado → sin cabecera (la integración degrada; error visible si el
 *  endpoint exige auth). Nunca devuelve el valor hacia fuera. */
function authHeaders(spec: IntegrationSpecV1): Record<string, string> {
  const auth = spec.spec.auth;
  if (!auth || auth.type === 'none' || !auth.secretEnv) {
    return {};
  }
  const value = process.env[auth.secretEnv];
  if (!value) {
    return {};
  }
  if (auth.type === 'bearer') {
    return { authorization: `Bearer ${value}` };
  }
  return { [auth.headerName ?? 'x-api-key']: value };
}

/* ── Circuit breaker (por integrationId, en proceso) ──────────────────────── */

const breaker = new Map<string, { failures: number; openedAt: number | null }>();

const FAILURE_THRESHOLD = 5;
const COOLDOWN_MS = 60_000;

function breakerState(id: string): { open: boolean; retryInMs: number } {
  const st = breaker.get(id);
  if (!st || st.openedAt === null) {
    return { open: false, retryInMs: 0 };
  }
  const elapsed = Date.now() - st.openedAt;
  if (elapsed >= COOLDOWN_MS) {
    st.openedAt = null; // semiabierto: se permite el intento
    st.failures = 0;
    return { open: false, retryInMs: 0 };
  }
  return { open: true, retryInMs: COOLDOWN_MS - elapsed };
}

function breakerSuccess(id: string): void {
  breaker.set(id, { failures: 0, openedAt: null });
}

function breakerFailure(id: string): boolean {
  const st = breaker.get(id) ?? { failures: 0, openedAt: null };
  st.failures += 1;
  const opened = st.failures >= FAILURE_THRESHOLD;
  if (opened) {
    st.openedAt = Date.now();
  }
  breaker.set(id, st);
  return opened;
}

export interface ConnectorCallResult {
  ok: boolean
  status?: number
  body?: string
  error?: string
  durationMs: number
}

/** Llamada HTTP del conector con timeout, circuit breaker y auth inyectada
 *  desde la referencia. `path` viene de la CONFIG de la ToolSpec (operador);
 *  los argumentos del agente van en el body (nunca en el destino). */
export async function callIntegration(spec: IntegrationSpecV1, opts: { method: string; path?: string; body?: unknown }): Promise<ConnectorCallResult> {
  const started = Date.now();
  const st = breakerState(spec.metadata.id);
  if (st.open) {
    return { ok: false, error: `circuit_open_retry_in_${Math.ceil(st.retryInMs / 1000)}s`, durationMs: 0 };
  }
  const base = spec.spec.baseUrl.replace(/\/+$/, '');
  const pathPart = (opts.path ?? '').replace(/\/+$/, '');
  const url = `${base}${pathPart}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: opts.method,
      headers: {
        'content-type': 'application/json',
        ...spec.spec.headers,
        ...authHeaders(spec),
      },
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
      // Default defensivo: specs guardados sin parsear zod no llevan defaults.
      signal: AbortSignal.timeout(spec.spec.timeoutMs ?? 15000),
    });
  } catch (err) {
    const opened = breakerFailure(spec.metadata.id);
    return { ok: false, error: `connector_error${opened ? '_circuit_opened' : ''}: ${(err as Error).message}`, durationMs: Date.now() - started };
  }
  if (!res.ok) {
    const opened = breakerFailure(spec.metadata.id);
    return { ok: false, status: res.status, error: `connector_status_${res.status}${opened ? '_circuit_opened' : ''}`, durationMs: Date.now() - started };
  }
  breakerSuccess(spec.metadata.id);
  const buf = await res.arrayBuffer();
  return { ok: true, status: res.status, body: Buffer.from(buf).toString('utf8').slice(0, 100_000), durationMs: Date.now() - started };
}

/** Health check de una integración (GET baseUrl + healthPath). */
export async function integrationHealth(spec: IntegrationSpecV1): Promise<{ ok: boolean; status?: number; detail: string; durationMs: number }> {
  const r = await callIntegration(spec, { method: 'GET', path: spec.spec.healthPath });
  return {
    ok: r.ok,
    status: r.status,
    durationMs: r.durationMs,
    detail: r.ok ? `accesible (${r.status})` : (r.error ?? 'fallo'),
  };
}
