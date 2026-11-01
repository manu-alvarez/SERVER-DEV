import { validateEngineeringArtifact, type EngineeringArtifactValidationResult } from '@uiep/agent-spec';
import { getLatestArtifact, getArtifactVersion, getLifecycle, getLatestProject } from './engineering-registry.service';
import { executeArtifact, getExecution } from './execution-orchestrator.service';
import { audit } from './observability.service';

/**
 * quality-engine (Misión 14) — evalúa artefactos en 4 dimensiones:
 *
 *   1. schema      → documento válido según su zod (fail-closed).
 *   2. referencias → componentRefs/specRefs resueltas contra los almacenes.
 *   3. seguridad   → sin secretos/valores sensibles incrustados en el doc.
 *   4. comportamiento → dataset/harness EJECUTADOS en el sandbox contra el
 *      target indicado, con métricas y thresholds del propio artefacto.
 *
 * El veredicto es honesto: 'pass' solo si TODO pasa; los umbrales del corpus
 * (uiep-rag-corpus-v1) se respetan tal cual — el gate runtime 0.70 no se toca.
 */

export interface QualityCheck {
  dimension: 'schema' | 'references' | 'security' | 'behavior';
  passed: boolean;
  detail: Record<string, unknown>;
}

export interface QualityReport {
  artifact: { kind: string; id: string; version: string };
  verdict: 'pass' | 'fail';
  checks: QualityCheck[];
  behaviorRunId?: string;
  evaluatedAt: string;
}

/** Escáner de secretos SOBRE EL DOCUMENTO (nombres/valores — nunca contenido ajeno). */
function scanDocumentForSecrets(doc: unknown): { findings: string[] } {
  const findings: string[] = [];
  const SUSPICIOUS_KEYS = /^(password|passwd|secret|token|apikey|api_key|authorization|privatekey|private_key)$/i;
  const walk = (node: unknown, path: string): void => {
    if (node === null || typeof node !== 'object') {
      return;
    }
    if (Array.isArray(node)) {
      node.forEach((v, i) => walk(v, `${path}[${i}]`));
      return;
    }
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      if (SUSPICIOUS_KEYS.test(k) && typeof v === 'string' && v.length > 0 && !/env:/i.test(v)) {
        findings.push(`${path}.${k}: valor literal en campo sensible (debe viajar por referencia env:VAR)`);
      }
      if (/envVar/i.test(k) && Array.isArray(v)) {
        for (const item of v) {
          if (typeof item === 'string' && !/^[A-Z][A-Z0-9_]+$/.test(item)) {
            findings.push(`${path}.${k}: nombre de variable no conforme (${item.slice(0, 3)}… de ${item.length} chars)`);
          }
        }
      }
      walk(v, `${path}.${k}`);
    }
  };
  walk(doc, '$');
  return { findings: findings.slice(0, 10) };
}

/** Referencias del doc resueltas contra los almacenes reales. */
async function checkReferences(doc: Record<string, unknown>): Promise<QualityCheck> {
  const missing: string[] = [];
  const refs: Array<{ kind: string; id: string }> = [];
  const spec = (doc.spec ?? {}) as Record<string, unknown>;
  for (const m of (spec.modules as Array<{ componentRef?: { kind: string; id: string } }> | undefined) ?? []) {
    if (m.componentRef) {
      refs.push(m.componentRef);
    }
  }
  for (const c of (spec.components as Array<{ ref: { kind: string; id: string } }> | undefined) ?? []) {
    refs.push(c.ref);
  }
  for (const e of (spec.endpoints as Array<{ agentBinding?: string }> | undefined) ?? []) {
    if (e.agentBinding) {
      refs.push({ kind: 'Agent', id: e.agentBinding });
    }
  }
  for (const a of (spec.agents as Array<{ agentSpecId: string }> | undefined) ?? []) {
    refs.push({ kind: 'Agent', id: a.agentSpecId });
  }
  for (const r of refs) {
    const target = await getLatestArtifact(r.kind, r.id);
    if (target) {
      continue;
    }
    const spec2 = await (await import('./spec-registry.service')).getLatestSpec(r.id);
    if (!spec2) {
      missing.push(`${r.kind}:${r.id}`);
    }
  }
  return { dimension: 'references', passed: missing.length === 0, detail: { checked: refs.length, missing } };
}

/** Informe de calidad completo (estático + opcionalmente conductual). */
export async function runQualityChecks(kind: string, id: string, version: string | undefined, behaviorTarget?: { agentSpecId: string; timeoutMs?: number }): Promise<QualityReport | { ok: false; status: 404 | 503; code: string; detail?: string }> {
  let doc: Record<string, unknown> | null = version ? await getArtifactVersion(kind, id, version) : await getLatestArtifact(kind, id);
  if (!doc && !version) {
    // El kind puede ser un SPEC de runtime (Agent/Workflow) — se evalúa igual.
    doc = (await (await import('./spec-registry.service')).getLatestSpec(id)) as unknown as Record<string, unknown> | null;
  }
  if (!doc) {
    return { ok: false, status: 404, code: 'artifact_not_found' };
  }
  const docMeta = doc.metadata as { id: string; version: string };
  const checks: QualityCheck[] = [];

  // 1) schema
  const v = validateEngineeringArtifact(doc);
  checks.push({ dimension: 'schema', passed: v.ok, detail: v.ok ? { kind: v.spec.kind } : { errors: v.errors } });

  // 2) referencias
  checks.push(await checkReferences(doc));

  // 3) seguridad (el documento jamás incrusta secretos)
  const scan = scanDocumentForSecrets(doc);
  checks.push({ dimension: 'security', passed: scan.findings.length === 0, detail: { findings: scan.findings } });

  // 4) comportamiento (solo si se pide target y hay sandbox configurado)
  let behaviorRunId: string | undefined;
  const behaviorEnabled = behaviorTarget !== undefined;
  if (behaviorEnabled) {
    // El engine conoce los tipos por su clave (minúsculas); el docKind del
    // artefacto (PascalCase) se normaliza aquí.
    const docKindToType: Record<string, string> = { EvaluationDataset: 'evaluation', Harness: 'harness', AgenticApp: 'agentic-app', ApiPlatform: 'api-platform' };
    const engineType = docKindToType[(doc.kind as string) ?? kind] ?? kind;
    const behavior = await executeArtifact(engineType, docMeta.id, docMeta.version, { agentSpecId: behaviorTarget!.agentSpecId, input: 'quality-check automático (M14)', timeoutMs: behaviorTarget!.timeoutMs ?? 30_000 }, 'quality-engine');
    if (behavior.ok) {
      behaviorRunId = behavior.record.runId;
      // El sandbox envuelve el resultado del handler en { status, body }.
      const raw = (behavior.record.result ?? {}) as { body?: Record<string, unknown> };
      const result = (raw.body ?? raw) as { metrics?: { verdict?: string }; verdict?: string; fixtures?: Array<{ passed: boolean }> };
      const metricsVerdict = result.metrics?.verdict ?? result.verdict;
      const fixturesOk = result.fixtures ? result.fixtures.every((f) => f.passed) : undefined;
      const passed = metricsVerdict !== 'fail' && fixturesOk !== false && behavior.record.status === 'succeeded';
      checks.push({ dimension: 'behavior', passed, detail: { runId: behaviorRunId, metrics: result.metrics ?? result } });
    } else {
      checks.push({ dimension: 'behavior', passed: false, detail: { error: behavior.code, detail: behavior.detail } });
    }
  }

  const report: QualityReport = {
    artifact: { kind: (doc.kind as string) ?? kind, id: docMeta.id, version: docMeta.version },
    verdict: checks.every((c) => c.passed) ? 'pass' : 'fail',
    checks,
    ...(behaviorRunId ? { behaviorRunId } : {}),
    evaluatedAt: new Date().toISOString(),
  };
  audit({ actor: { kind: 'system' }, action: 'engineering.quality', correlation: { targetId: docMeta.id }, detail: { kind, verdict: report.verdict, checks: checks.map((c) => `${c.dimension}:${c.passed ? 'ok' : 'fail'}`).join(',') } });
  return report;
}

/** Ejecución de calidad por lotes: TODOS los artefactos de un proyecto UES. */
export async function runProjectQuality(projectId: string, behavior: boolean): Promise<{ ok: true; project: string; reports: Array<QualityReport | { artifact: string; error: string }> } | { ok: false; status: 404; code: string }> {
  const project = await getLatestProject(projectId);
  if (!project) {
    return { ok: false, status: 404, code: 'project_not_found' };
  }
  const reports: Array<QualityReport | { artifact: string; error: string }> = [];
  for (const a of project.artifacts) {
    if (!a.specRef) {
      continue;
    }
    const r = await runQualityChecks(a.specRef.kind, a.specRef.id, a.specRef.version, behavior ? { agentSpecId: (await firstAgentOfProject(project)) ?? '', timeoutMs: 30_000 } : undefined);
    if ('ok' in r && r.ok === false) {
      reports.push({ artifact: `${a.specRef.kind}/${a.specRef.id}`, error: r.code });
    } else {
      reports.push(r as QualityReport);
    }
  }
  return { ok: true, project: projectId, reports };
}

async function firstAgentOfProject(project: { artifacts: Array<{ specRef?: { kind: string; id: string } }> }): Promise<string | null> {
  for (const a of project.artifacts) {
    if (a.specRef?.kind === 'Agent') {
      return a.specRef.id;
    }
  }
  return null;
}

/** Re-export de tipos para rutas. */
export type { EngineeringArtifactValidationResult };
export { getLifecycle, getExecution };
