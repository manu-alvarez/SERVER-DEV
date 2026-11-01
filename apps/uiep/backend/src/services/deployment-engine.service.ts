import { promises as fs } from 'node:fs';
import path from 'node:path';
import { getLatestArtifact, getArtifactVersion, getArtifactLifecycle } from './engineering-registry.service';
import { getLatestSpec } from './spec-registry.service';
import { sandboxHealth, sandboxExecute, sandboxConfigured } from './sandbox-client.service';
import { newRunId, type ExecutionRecord } from './execution-registry.service';
import { audit } from './observability.service';
import type { UserPrincipal } from './iam.service';
import { PLATFORM_TENANT } from './iam.service';

/**
 * deployment-engine (Misión FINAL) — despliegues CONTROLADOS al runtime del
 * sandbox. Un deployment = artefacto ejecutable (agentic-app / api-platform)
 * + entorno (únicamente 'sandbox-runtime') + versión PINNEADA + estado
 * deployed/stopped + health check real + historial de versiones (rollback =
 * redeploy de la versión anterior).
 *
 * NO hay routing público (Traefik): los despliegues solo son invocables por
 * los operadores autorizados vía el Execution Center — decisión de seguridad
 * registrada (docs/UIEP-DECISIONES.md). Sin tocar servicios del host ni de
 * otros proyectos.
 */

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const DEPLOYMENTS_FILE = path.join(DATA_DIR, 'engineering', 'deployments.json');

export const DEPLOY_ENVIRONMENTS = ['sandbox-runtime'] as const;
export type DeployEnvironment = (typeof DEPLOY_ENVIRONMENTS)[number];

export interface DeploymentRecord {
  deploymentId: string;
  tenantId: string;
  artifact: { kind: 'AgenticApp' | 'ApiPlatform'; id: string; version: string };
  environment: DeployEnvironment;
  status: 'deployed' | 'stopped';
  config: { timeoutMs: number };
  health: { lastOk: boolean | null; lastAt: string | null; detail: string };
  versions: Array<{ version: string; deployedAt: string; actor: string }>;
  deployedAt: string;
  updatedAt: string;
}

const DEPLOYMENT_ID_RE = /^dep-[a-z0-9-]{3,60}$/;

let mutex: Promise<unknown> = Promise.resolve();

async function readAll(): Promise<DeploymentRecord[]> {
  try {
    const raw = JSON.parse(await fs.readFile(DEPLOYMENTS_FILE, 'utf8')) as { deployments?: DeploymentRecord[] };
    return Array.isArray(raw.deployments) ? raw.deployments : [];
  } catch {
    return [];
  }
}

async function writeAll(deployments: DeploymentRecord[]): Promise<void> {
  await fs.mkdir(path.dirname(DEPLOYMENTS_FILE), { recursive: true });
  const tmp = `${DEPLOYMENTS_FILE}.tmp`;
  await fs.writeFile(tmp, JSON.stringify({ deployments }, null, 2), 'utf8');
  await fs.rename(tmp, DEPLOYMENTS_FILE);
}

export type DeploymentError = { ok: false; status: 400 | 403 | 404 | 503; reason: string };

/** Despliega (o actualiza) un artefacto ejecutable en el entorno sandbox. */
export async function deploy(
  input: { deploymentId?: string; kind: 'AgenticApp' | 'ApiPlatform'; id: string; version?: string; timeoutMs?: number },
  principal: UserPrincipal,
): Promise<{ ok: true; deployment: DeploymentRecord } | DeploymentError> {
  if (!sandboxConfigured()) {
    return { ok: false, status: 503, reason: 'sandbox_disabled' };
  }
  const deploymentId = input.deploymentId ?? `dep-${input.id}`;
  if (!DEPLOYMENT_ID_RE.test(deploymentId)) {
    return { ok: false, status: 400, reason: 'deploymentId_inválido' };
  }
  // El artefacto DEBE existir y estar 'generated' (o ser un spec ejecutable).
  let resolvedVersion = input.version ?? '';
  let tenant = PLATFORM_TENANT;
  if (input.kind === 'AgenticApp' || input.kind === 'ApiPlatform') {
    const doc = input.version ? await getArtifactVersion(input.kind, input.id, input.version) : await getLatestArtifact(input.kind, input.id);
    if (!doc) {
      return { ok: false, status: 404, reason: 'artefacto_no_encontrado' };
    }
    resolvedVersion = resolvedVersion || (doc as { metadata?: { version?: string } }).metadata?.version ?? '';
    const lc = await getArtifactLifecycle(input.kind, input.id);
    if (lc && !['generated', 'tested', 'ready', 'deployed'].includes(lc.state)) {
      return { ok: false, status: 400, reason: `el artefacto está en estado ${lc.state} (no desplegable)` };
    }
    // Tenancy del deployment: los despliegues de un usuario quedan en SU
    // tenant; los del admin de plataforma son 'platform' (visibles a todos).
    tenant = principal.via === 'user-session' ? principal.tenantId : PLATFORM_TENANT;
  } else {
    return { ok: false, status: 400, reason: 'solo se despliegan AgenticApp/ApiPlatform' };
  }
  const run = mutex.then(async () => {
    const all = await readAll();
    const existing = all.find((d) => d.deploymentId === deploymentId);
    if (existing && existing.status === 'deployed' && existing.artifact.version === resolvedVersion) {
      return { ok: true as const, deployment: existing }; // idempotente
    }
    // Aislamiento por tenant: solo admin o mismo tenant.
    if (existing && existing.tenantId !== PLATFORM_TENANT && existing.tenantId !== principal.tenantId && principal.role !== 'admin' && principal.via !== 'console-admin') {
      return { ok: false as const, status: 403 as const, reason: 'tenant_distinto' };
    }
    const now = new Date().toISOString();
    const record: DeploymentRecord = existing ?? {
      deploymentId,
      tenantId: tenant,
      artifact: { kind: input.kind, id: input.id, version: resolvedVersion },
      environment: 'sandbox-runtime',
      status: 'deployed',
      config: { timeoutMs: input.timeoutMs ?? 300_000 },
      health: { lastOk: null, lastAt: null, detail: '' },
      versions: [],
      deployedAt: now,
      updatedAt: now,
    };
    record.artifact = { kind: input.kind, id: input.id, version: resolvedVersion };
    record.status = 'deployed';
    record.config.timeoutMs = input.timeoutMs ?? record.config.timeoutMs;
    record.versions.push({ version: resolvedVersion, deployedAt: now, actor: `${principal.via}:${principal.username}` });
    record.updatedAt = now;
    record.health = { lastOk: null, lastAt: null, detail: 'desplegado (sin health check aún)' };
    const idx = all.findIndex((d) => d.deploymentId === deploymentId);
    if (idx >= 0) {
      all[idx] = record;
    } else {
      all.push(record);
    }
    await writeAll(all);
    audit({ actor: { kind: 'system' }, action: 'deployment.deploy', correlation: { targetId: deploymentId }, detail: { kind: input.kind, id: input.id, version: resolvedVersion, tenant: record.tenantId } });
    return { ok: true as const, deployment: record };
  });
  mutex = run.catch(() => undefined);
  return run;
}

export async function stopDeployment(deploymentId: string, principal: UserPrincipal): Promise<{ ok: boolean; reason?: string; status?: string }> {
  const run = mutex.then(async () => {
    const all = await readAll();
    const dep = all.find((d) => d.deploymentId === deploymentId);
    if (!dep) {
      return { ok: false, reason: 'deployment_no_encontrado' };
    }
    if (dep.tenantId !== PLATFORM_TENANT && dep.tenantId !== principal.tenantId && principal.role !== 'admin' && principal.via !== 'console-admin') {
      return { ok: false, reason: 'tenant_distinto' };
    }
    dep.status = 'stopped';
    dep.updatedAt = new Date().toISOString();
    await writeAll(all);
    audit({ actor: { kind: 'system' }, action: 'deployment.stop', correlation: { targetId: deploymentId }, detail: {} });
    return { ok: true, status: 'stopped' };
  });
  mutex = run.catch(() => undefined);
  return run;
}

/** Rollback: despliega la versión ANTERIOR del artefacto en el deployment. */
export async function rollbackDeployment(deploymentId: string, principal: UserPrincipal): Promise<{ ok: true; deployment: DeploymentRecord } | DeploymentError> {
  const all = await readAll();
  const dep = all.find((d) => d.deploymentId === deploymentId);
  if (!dep) {
    return { ok: false, status: 404, reason: 'deployment_no_encontrado' };
  }
  const seen = dep.versions.map((v) => v.version);
  if (seen.length < 2) {
    return { ok: false, status: 400, reason: 'sin_versión_anterior_para_rollback' };
  }
  const previous = seen[seen.length - 2];
  return deploy({ deploymentId, kind: dep.artifact.kind, id: dep.artifact.id, version: previous, timeoutMs: dep.config.timeoutMs }, principal);
}

/** Health check REAL: sandbox vivo + artefacto resoluble en su versión. */
export async function healthCheck(deploymentId: string): Promise<{ ok: boolean; detail: string }> {
  const all = await readAll();
  const dep = all.find((d) => d.deploymentId === deploymentId);
  if (!dep) {
    return { ok: false, detail: 'deployment_no_encontrado' };
  }
  if (dep.status !== 'deployed') {
    const detail = `deployment ${dep.status}`;
    await updateHealth(dep, false, detail);
    return { ok: false, detail };
  }
  const sandboxUp = await sandboxHealth();
  if (!sandboxUp) {
    await updateHealth(dep, false, 'sandbox sin respuesta');
    return { ok: false, detail: 'sandbox sin respuesta' };
  }
  const doc = await getArtifactVersion(dep.artifact.kind, dep.artifact.id, dep.artifact.version);
  const ok = Boolean(doc);
  const detail = ok ? `sandbox OK · artefacto ${dep.artifact.id}@${dep.artifact.version} resoluble` : `artefacto ${dep.artifact.id}@${dep.artifact.version} NO resoluble`;
  await updateHealth(dep, ok, detail);
  return { ok, detail };
}

async function updateHealth(dep: DeploymentRecord, ok: boolean, detail: string): Promise<void> {
  const all = await readAll();
  const idx = all.findIndex((d) => d.deploymentId === dep.deploymentId);
  if (idx >= 0) {
    all[idx].health = { lastOk: ok, lastAt: new Date().toISOString(), detail };
    await writeAll(all);
  }
}

/** Lista con aislamiento por tenant (los 'platform' los ve todo el mundo). */
export async function listDeployments(principal?: UserPrincipal): Promise<DeploymentRecord[]> {
  const all = await readAll();
  if (!principal || principal.via === 'console-admin' || principal.role === 'admin') {
    return all.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
  return all
    .filter((d) => d.tenantId === PLATFORM_TENANT || d.tenantId === principal.tenantId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getDeployment(deploymentId: string): Promise<DeploymentRecord | null> {
  return (await readAll()).find((d) => d.deploymentId === deploymentId) ?? null;
}

/** Invoca un deployment desplegado (atajo del Execution Center con trazabilidad de deployment). */
export async function invokeDeployment(deploymentId: string, invocation: Record<string, unknown>): Promise<{ ok: true; run: ExecutionRecord } | DeploymentError> {
  const dep = await getDeployment(deploymentId);
  if (!dep) {
    return { ok: false, status: 404, reason: 'deployment_no_encontrado' };
  }
  if (dep.status !== 'deployed') {
    return { ok: false, status: 400, reason: `deployment_${dep.status}` };
  }
  const { executeArtifact } = await import('./execution-orchestrator.service');
  const kind = dep.artifact.kind === 'AgenticApp' ? 'agentic-app' : 'api-platform';
  const r = await executeArtifact(kind, dep.artifact.id, dep.artifact.version, { ...invocation, timeoutMs: Math.min(Number(invocation?.timeoutMs) || dep.config.timeoutMs, dep.config.timeoutMs) }, `deployment:${deploymentId}`);
  if (!r.ok) {
    return { ok: false, status: r.status === 429 ? 503 : (r.status as 503 | 404 | 400), reason: r.code };
  }
  return { ok: true, run: r.record };
}

/** Id usado para runs con trazabilidad de deployment (export). */
export function deploymentRunTag(deploymentId: string): string {
  return `${deploymentId}:${newRunId()}`;
}
