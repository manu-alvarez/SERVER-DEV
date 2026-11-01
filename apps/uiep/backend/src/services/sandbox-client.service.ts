/**
 * sandbox-client (Misión 14) — cliente del contenedor de ejecución aislado.
 *
 * SANDBOX_URL define el punto de ejecución (producción: http://uiep-sandbox:4100,
 * en la red interna SIN salida a internet). Fail-closed: sin SANDBOX_URL o
 * SANDBOX_EXEC_TOKEN el sistema responde 503 sandbox_disabled — NUNCA se
 * ejecuta nada en el proceso principal como fallback.
 */

const SANDBOX_URL = (process.env.SANDBOX_URL || '').replace(/\/+$/, '');
const SANDBOX_TOKEN = process.env.SANDBOX_EXEC_TOKEN || '';

export const SANDBOX_IMAGE = 'msbrossai-uiep-sandbox:latest';

export type SandboxDisabledReason = 'sandbox_disabled' | 'sandbox_unreachable' | 'sandbox_busy' | 'sandbox_rejected';

export type SandboxCallResult =
  | {
      ok: true;
      runId: string;
      status: 'succeeded' | 'cancelled' | 'timeout';
      durationMs: number;
      result?: Record<string, unknown>;
      logs?: string[];
      reason?: string;
      httpStatus: number;
    }
  | { ok: false; reason: SandboxDisabledReason; detail?: string; httpStatus: number };

export function sandboxConfigured(): boolean {
  return SANDBOX_URL.length > 0 && SANDBOX_TOKEN.length > 0;
}

export function sandboxInfo(): { url: string | null; mode: 'container-internal-net' } {
  return { url: SANDBOX_URL || null, mode: 'container-internal-net' };
}

/** Ejecuta un job en el sandbox. El envelope va VALIDADO por el llamador
 *  (el backend valida el artefacto contra su schema ANTES de enviarlo). */
export async function sandboxExecute(envelope: { runId: string; kind: string; artifact: unknown; invocation: unknown; limits?: { timeoutMs?: number } }, opts: { timeoutMs?: number } = {}): Promise<SandboxCallResult> {
  if (!sandboxConfigured()) {
    return { ok: false, reason: 'sandbox_disabled', httpStatus: 503 };
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), (opts.timeoutMs ?? 150_000) + 10_000);
  try {
    const res = await fetch(`${SANDBOX_URL}/v1/execute`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${SANDBOX_TOKEN}` },
      body: JSON.stringify(envelope),
      signal: controller.signal,
    });
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (res.status === 429) {
      return { ok: false, reason: 'sandbox_busy', httpStatus: 429 };
    }
    if (res.status === 401 || res.status === 503) {
      return { ok: false, reason: 'sandbox_rejected', detail: String(json?.error ?? ''), httpStatus: res.status };
    }
    if (res.status !== 200) {
      return { ok: false, reason: 'sandbox_rejected', detail: String(json?.error ?? `http_${res.status}`), httpStatus: res.status };
    }
    return {
      ok: true,
      runId: String(json.runId ?? envelope.runId),
      status: (json.status as 'succeeded' | 'cancelled' | 'timeout') ?? 'succeeded',
      durationMs: Number(json.durationMs ?? 0),
      result: (json.result as Record<string, unknown>) ?? undefined,
      logs: (json.logs as string[]) ?? undefined,
      reason: json.reason ? String(json.reason) : undefined,
      httpStatus: res.status,
    };
  } catch (err) {
    const aborted = (err as Error)?.name === 'AbortError';
    return { ok: false, reason: 'sandbox_unreachable', detail: aborted ? 'client_timeout' : String((err as Error)?.message ?? err), httpStatus: 504 };
  } finally {
    clearTimeout(timeout);
  }
}

/** Cancelación: pide al sandbox abortar el job en curso. */
export async function sandboxCancel(runId: string): Promise<{ ok: boolean; reason?: string }> {
  if (!sandboxConfigured()) {
    return { ok: false, reason: 'sandbox_disabled' };
  }
  try {
    const res = await fetch(`${SANDBOX_URL}/v1/cancel/${encodeURIComponent(runId)}`, {
      method: 'POST',
      headers: { authorization: `Bearer ${SANDBOX_TOKEN}` },
      signal: AbortSignal.timeout(5000),
    });
    return { ok: res.status === 200, reason: res.status === 404 ? 'run_not_found' : undefined };
  } catch {
    return { ok: false, reason: 'sandbox_unreachable' };
  }
}

export async function sandboxHealth(): Promise<boolean> {
  if (!SANDBOX_URL) {
    return false;
  }
  try {
    const res = await fetch(`${SANDBOX_URL}/v1/health`, { signal: AbortSignal.timeout(3000) });
    return res.status === 200;
  } catch {
    return false;
  }
}

/** Jobs EN CURSO en el sandbox (para reconciliación de runs zombis). */
export async function sandboxRunningJobs(): Promise<string[] | null> {
  if (!sandboxConfigured()) {
    return null;
  }
  try {
    const res = await fetch(`${SANDBOX_URL}/v1/jobs`, {
      headers: { authorization: `Bearer ${SANDBOX_TOKEN}` },
      signal: AbortSignal.timeout(5000),
    });
    if (res.status !== 200) {
      return null;
    }
    const json = (await res.json()) as { running?: string[] };
    return Array.isArray(json.running) ? json.running : null;
  } catch {
    return null;
  }
}
