import {
  getLatestArtifact,
  getArtifactVersion,
} from './engineering-registry.service';
import {
  ExecutionRecord,
  newRunId,
  saveExecution,
  updateExecution,
  getExecution,
  listExecutions,
  summarizeInvocation,
  auditExecution,
  tryAcquireExecutionSlot,
  releaseExecutionSlot,
  markCancelled,
} from './execution-registry.service';
import { sandboxExecute, sandboxCancel, sandboxConfigured, sandboxInfo, SANDBOX_IMAGE } from './sandbox-client.service';
import { validateEngineeringArtifact } from '@uiep/agent-spec';
import { getLatestSpec, listSpecVersions } from './spec-registry.service';
import { audit } from './observability.service';
import { z } from 'zod';

/**
 * execution-orchestrator (Misión 14) — puente Registry → Sandbox.
 *
 * Resuelve el artefacto (kind/id/version), lo VALIDA contra su schema, monta
 * el envelope del job (artefacto + invocación + límites) y lo envía al
 * sandbox. NUNCA interpreta nada en el proceso principal como fallback:
 * sin sandbox configurado → 503 fail-closed. Cada ejecución queda registrada
 * (Execution Registry) con trazabilidad completa artefacto↔versión↔run.
 */

const INVOCATION_LIMITS = { timeoutMs: z.number().int().min(2000).max(120_000).optional() };

/** Parse del envelope interno de invocación (según el tipo de ejecución). */
const InvocationSchema = z.object({
  input: z.string().max(4000).optional(),
  agentSpecId: z.string().regex(/^[a-z0-9][a-z0-9-]{2,80}$/).optional(),
  endpointId: z.string().max(80).optional(),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).optional(),
  path: z.string().max(200).optional(),
  body: z.record(z.string(), z.unknown()).optional(),
  query: z.record(z.string(), z.unknown()).optional(),
  timeoutMs: z.number().int().min(2000).max(300_000).optional(),
});

export type ExecutionRequest =
  | { ok: false; status: 400 | 404 | 409 | 429 | 503; code: string; errors?: Record<string, string[]>; detail?: string }
  | { ok: true; record: ExecutionRecord };

async function resolveArtifactDoc(kind: string, id: string, version?: string): Promise<{ doc: Record<string, unknown> } | { err: { status: 404; code: string } }> {
  let doc: Record<string, unknown> | null;
  if (['Agent', 'Workflow'].includes(kind)) {
    doc = version ? ((await listSpecVersions(id)).find((d: { metadata?: { version?: string } }) => d.metadata?.version === version) as unknown as Record<string, unknown> | undefined) ?? null : ((await getLatestSpec(id)) as unknown as Record<string, unknown> | null);
  } else {
    doc = version ? await getArtifactVersion(kind, id, version) : await getLatestArtifact(kind, id);
  }
  if (!doc) {
    return { err: { status: 404, code: 'artifact_not_found' } };
  }
  return { doc };
}

const KIND_TO_JOB: Record<string, { jobKind: 'agentic-app' | 'api-request' | 'dataset' | 'harness'; docKind: string }> = {
  'agentic-app': { jobKind: 'agentic-app', docKind: 'AgenticApp' },
  'api-platform': { jobKind: 'api-request', docKind: 'ApiPlatform' },
  evaluation: { jobKind: 'dataset', docKind: 'EvaluationDataset' },
  harness: { jobKind: 'harness', docKind: 'Harness' },
};

/** Ejecuta un artefacto en el sandbox (agentic-app, api-request, dataset, harness). */
export async function executeArtifact(kind: string, id: string, version: string | undefined, invocation: unknown, actor: string = 'console'): Promise<ExecutionRequest> {
  const jobDef = KIND_TO_JOB[kind];
  if (!jobDef) {
    return { ok: false, status: 400, code: 'kind_not_executable', errors: { kind: [`el tipo '${kind}' no tiene runtime de ejecución (ejecutables: ${Object.keys(KIND_TO_JOB).join(', ')})`] } };
  }
  const parsedInv = InvocationSchema.safeParse(invocation ?? {});
  if (!parsedInv.success) {
    return { ok: false, status: 400, code: 'invalid_invocation', errors: { invocation: parsedInv.error.issues.slice(0, 5).map((i) => `${i.path.join('.')}: ${i.message}`) } };
  }
  // Por-kind: los datasets/harness SIEMPRE necesitan target (fail fast).
  if ((kind === 'evaluation' || kind === 'harness') && !parsedInv.data.agentSpecId) {
    return { ok: false, status: 400, code: 'invalid_invocation', errors: { agentSpecId: ['las ejecuciones de dataset/harness requieren agentSpecId objetivo'] } };
  }
  if (!sandboxConfigured()) {
    return { ok: false, status: 503, code: 'sandbox_disabled', detail: 'SANDBOX_URL/SANDBOX_EXEC_TOKEN no configurados — la ejecución NUNCA ocurre en el proceso principal' };
  }
  const resolved = await resolveArtifactDoc(jobDef.docKind, id, version);
  if ('err' in resolved) {
    return { ok: false, status: 404, code: resolved.err.code };
  }
  const doc = resolved.doc;
  // Validación previa contra el schema del artefacto (fail-closed).
  const specKind = doc.kind as string;
  const validated = validateEngineeringArtifact(doc);
  if (!validated.ok) {
    return { ok: false, status: 409, code: 'artifact_invalid', errors: validated.errors };
  }
  const docMeta = doc.metadata as { id: string; version: string };
  if (!tryAcquireExecutionSlot()) {
    return { ok: false, status: 429, code: 'execution_busy' };
  }
  const record: ExecutionRecord = {
    runId: newRunId(),
    kind: jobDef.jobKind,
    artifact: { kind: specKind, id: docMeta.id, version: docMeta.version },
    invocationSummary: summarizeInvocation(parsedInv.data),
    status: 'running',
    sandbox: { image: SANDBOX_IMAGE, mode: sandboxInfo().mode },
    limits: { timeoutMs: parsedInv.data.timeoutMs ?? 30_000 },
    startedAt: new Date().toISOString(),
  };
  await saveExecution(record);
  try {
    const job = {
      runId: record.runId,
      kind: jobDef.jobKind,
      artifact: doc,
      invocation: parsedInv.data,
      limits: { timeoutMs: record.limits.timeoutMs },
    };
    const res = await sandboxExecute(job, { timeoutMs: record.limits.timeoutMs + 20_000 });
    if (!res.ok) {
      const failed = await updateExecution(record.runId, {
        status: 'failed',
        finishedAt: new Date().toISOString(),
        error: `${res.reason}: ${res.detail ?? ''}`.slice(0, 300),
      });
      auditExecution(failed ?? record, false);
      const status = res.reason === 'sandbox_busy' ? 429 : 503;
      return { ok: false, status, code: res.reason, detail: res.detail };
    }
    const terminal: ExecutionRecord['status'] = res.status === 'succeeded' ? 'succeeded' : res.status === 'timeout' ? 'timeout' : 'cancelled';
    const done = await updateExecution(record.runId, {
      status: terminal,
      finishedAt: new Date().toISOString(),
      durationMs: res.durationMs,
      result: res.result,
      logs: res.logs,
      error: res.reason,
      ...(terminal === 'cancelled' ? { cancelled: true } : {}),
    });
    auditExecution(done ?? record, terminal === 'succeeded');
    return { ok: true, record: done ?? record };
  } finally {
    releaseExecutionSlot();
  }
}

/** Cancela una ejecución en curso (best-effort: el sandbox aborta el job). */
export async function cancelExecution(runId: string): Promise<{ ok: boolean; status?: string; reason?: string }> {
  const rec = await getExecution(runId);
  if (!rec) {
    return { ok: false, reason: 'run_not_found' };
  }
  if (rec.status !== 'running' && rec.status !== 'queued') {
    return { ok: false, status: rec.status, reason: 'run_not_running' };
  }
  const res = await sandboxCancel(runId);
  if (res.ok) {
    await markCancelled(runId);
    audit({ actor: { kind: 'system' }, action: 'engineering.execution.cancel', correlation: { targetId: runId }, detail: {} });
  }
  return res;
}

/** Reconciliación manual (desde la consola) o automática (intervalo del server). */
export async function reconcileExecutions(): Promise<{ reconciled: string[]; sandboxReachable: boolean }> {
  const { reconcileZombieExecutions } = await import('./execution-registry.service');
  return reconcileZombieExecutions();
}

export { getExecution, listExecutions };