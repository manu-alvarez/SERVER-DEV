import { promises as fs } from 'node:fs';
import path from 'node:path';
import {
  getLatestSpec,
} from './spec-registry.service';
import {
  satisfiesRange,
  validateUESProject,
  type LifecycleState,
  type UESProjectV1,
} from '@uiep/agent-spec';
import { audit } from './observability.service';

/**
 * engineering-registry (Misión 11) — Universal Artifact Registry.
 *
 * Evolución del spec-registry: misma persistencia ATÓMICA (tmp + rename) y
 * misma convención id@version, en un espacio propio (data/engineering/)
 * para que los proyectos UES (kind 'Project') no aparezcan en los listados
 * de specs existentes (compatibilidad total con clientes actuales).
 *
 * · CATÁLOGO: tipos de artefacto con capacidades REALES (esquema/generador/
 *   ejecución/validación). Nunca se declara generable sin generador funcional.
 * · GRAFO: dependencias internas (schema), detección de ciclos (DFS), orden
 *   topológico (Kahn), compatibilidad de versiones (rangos ^, ~, exacto) y
 *   resolución de referencias externas contra el registry de specs.
 * · CICLO DE VIDA: estados explícitos con transiciones permitidas y eventos
 *   de auditoría por cambio.
 * · PROCEDENCIA: vive dentro del documento UES (generation + artifacts[].provenance);
 *   este módulo la expone y consulta — nunca almacena secretos.
 */

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const PROJECTS_DIR = path.join(DATA_DIR, 'engineering', 'projects');
const LIFECYCLE_FILE = path.join(DATA_DIR, 'engineering', 'lifecycle.json');

/* ── Catálogo de tipos (capacidades reales, no aspiraciones) ─────────────── */

export interface CatalogEntry {
  type: string;
  schema?: 'uiep.io/ues/v1';
  capabilities: { schema: true; generator: boolean; execution: boolean; validation: boolean };
  via?: { generator?: string; execution?: string; validation?: string };
  notes?: string;
}

export const ARTIFACT_CATALOG: CatalogEntry[] = [
  { type: 'agent', capabilities: { schema: true, generator: true, execution: true, validation: true }, via: { generator: 'design-engine (/api/generate)', execution: 'agent-runtime', validation: 'zod + estructura' } },
  { type: 'workflow', capabilities: { schema: true, generator: true, execution: true, validation: true }, via: { generator: 'blueprint-installer', execution: 'workflow-engine', validation: 'zod + DAG' } },
  { type: 'knowledge-base', capabilities: { schema: true, generator: true, execution: true, validation: true }, via: { generator: 'blueprint-installer', execution: 'ingesta + retrieval', validation: 'gate RAG' } },
  { type: 'tool-collection', capabilities: { schema: true, generator: false, execution: true, validation: true }, via: { execution: 'tool-registry (deny-by-default)', validation: 'zod' }, notes: 'no hay generador de colecciones: las tools se registran individualmente' },
  { type: 'evaluation', capabilities: { schema: true, generator: false, execution: false, validation: true }, via: { validation: 'gate RAG (Recall/Precision/MRR)' }, notes: 'evaluación de agentes/datasets pendiente como capacidad runtime' },
  { type: 'rag-system', capabilities: { schema: true, generator: false, execution: false, validation: true }, via: { validation: 'gate RAG' }, notes: 'el pipeline knowledge completo ya es evaluable' },
  { type: 'multi-agent-system', capabilities: { schema: true, generator: false, execution: false, validation: false }, notes: 'coordinación hoy vía workflow; sin spec propia dedicada' },
  { type: 'mcp-server', capabilities: { schema: true, generator: false, execution: false, validation: false }, notes: 'la plataforma EXPONE sus tools vía MCP, pero no genera servidores MCP nuevos' },
  { type: 'prompt-system', capabilities: { schema: true, generator: false, execution: false, validation: false }, notes: 'instrucciones inline en AgentSpec; sin plantillas/versiones de prompt' },
  { type: 'skill-pack', capabilities: { schema: true, generator: false, execution: false, validation: false } },
  { type: 'framework', capabilities: { schema: true, generator: false, execution: false, validation: false } },
  { type: 'harness', capabilities: { schema: true, generator: false, execution: false, validation: false } },
  { type: 'application', capabilities: { schema: true, generator: false, execution: false, validation: false } },
  { type: 'agentic-app', capabilities: { schema: true, generator: false, execution: false, validation: false } },
  { type: 'api-platform', capabilities: { schema: true, generator: false, execution: false, validation: false } },
  { type: 'saas', capabilities: { schema: true, generator: false, execution: false, validation: false } },
  { type: 'enterprise-architecture', capabilities: { schema: true, generator: false, execution: false, validation: false } },
  { type: 'infrastructure-stack', capabilities: { schema: true, generator: false, execution: false, validation: false } },
  { type: 'deployment-architecture', capabilities: { schema: true, generator: false, execution: false, validation: false } },
];

export function getCatalog(): CatalogEntry[] {
  return ARTIFACT_CATALOG;
}

export function getCatalogEntry(type: string): CatalogEntry | null {
  return ARTIFACT_CATALOG.find((e) => e.type === type) ?? null;
}

/* ── Store de proyectos (atómico, id@version — mismo patrón que spec-registry) ── */

let projectsDirReady = false;

async function ensureProjectsDir(): Promise<void> {
  if (!projectsDirReady) {
    await fs.mkdir(PROJECTS_DIR, { recursive: true });
    projectsDirReady = true;
  }
}

function projectFile(id: string, version: string): string {
  return path.join(PROJECTS_DIR, `${id}@${version}.json`);
}

/** Upsert idempotente: (id, version) identifica el documento. */
export async function saveProject(doc: UESProjectV1): Promise<void> {
  await ensureProjectsDir();
  const file = projectFile(doc.metadata.id, doc.metadata.version);
  const tmp = `${file}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(doc, null, 2), 'utf8');
  await fs.rename(tmp, file);
}

export interface ProjectSummary {
  id: string;
  name: string;
  version: string;
  description?: string;
  artifacts: number;
  lifecycle: LifecycleState;
  createdAt?: string;
}

export async function listProjects(): Promise<ProjectSummary[]> {
  await ensureProjectsDir();
  let files: string[] = [];
  try {
    files = (await fs.readdir(PROJECTS_DIR)).filter((f) => f.endsWith('.json'));
  } catch {
    return [];
  }
  const out: ProjectSummary[] = [];
  for (const f of files) {
    try {
      const doc = JSON.parse(await fs.readFile(path.join(PROJECTS_DIR, f), 'utf8')) as UESProjectV1;
      const lc = await getLifecycle(doc.metadata.id);
      out.push({
        id: doc.metadata.id,
        name: doc.metadata.name,
        version: doc.metadata.version,
        description: doc.metadata.description,
        artifacts: doc.artifacts.length,
        lifecycle: lc?.state ?? 'draft',
        createdAt: doc.metadata.createdAt,
      });
    } catch {
      /* corrupto: ignorar */
    }
  }
  return out.sort((a, b) => (a.createdAt || a.id).localeCompare(b.createdAt || b.id));
}

function compareSemVer(a: string, b: string): number {
  const [ax, ay, az] = a.split('.').map(Number);
  const [bx, by, bz] = b.split('.').map(Number);
  return ax - bx || ay - by || az - bz;
}

export async function listProjectVersions(id: string): Promise<UESProjectV1[]> {
  await ensureProjectsDir();
  const safe = id.replace(/[^a-zA-Z0-9-]/g, '');
  const files = (await fs.readdir(PROJECTS_DIR)).filter((f) => f.startsWith(`${safe}@`) && f.endsWith('.json'));
  const docs: UESProjectV1[] = [];
  for (const file of files) {
    try {
      docs.push(JSON.parse(await fs.readFile(path.join(PROJECTS_DIR, file), 'utf8')) as UESProjectV1);
    } catch {
      /* corrupto: ignorar */
    }
  }
  docs.sort((a, b) => compareSemVer(b.metadata.version, a.metadata.version));
  return docs;
}

export async function getLatestProject(id: string): Promise<UESProjectV1 | null> {
  const versions = await listProjectVersions(id);
  return versions[0] ?? null;
}

/** Valida y registra un proyecto UES (ciclos → rechazo). Sin lanzar. */
export async function registerProject(
  input: unknown,
): Promise<{ ok: true; doc: UESProjectV1 } | { ok: false; status: 400; errors: Record<string, string[]> }> {
  const v = validateUESProject(input);
  if (!v.ok) {
    return { ok: false, status: 400, errors: v.errors };
  }
  const cycles = detectCycles(v.spec.artifacts);
  if (cycles.length > 0) {
    return { ok: false, status: 400, errors: { artifacts: [`ciclo de dependencias: ${cycles[0].join(' → ')}`] } };
  }
  await saveProject(v.spec);
  audit({
    actor: { kind: 'console' },
    action: 'engineering.project.register',
    correlation: { targetId: v.spec.metadata.id },
    detail: { version: v.spec.metadata.version, artifacts: v.spec.artifacts.length },
  });
  return { ok: true, doc: v.spec };
}

/* ── Grafo de dependencias ───────────────────────────────────────────────── */

export interface DepEdge {
  ref: string;
  required: boolean;
  versionRange?: string;
}

/** Detecta ciclos (DFS con back-edges). Devuelve al menos un ciclo si existe. */
export function detectCycles(artifacts: Array<{ ref: string; dependencies: DepEdge[] }>): string[][] {
  const byRef = new Map(artifacts.map((a) => [a.ref, a]));
  const color = new Map<string, 0 | 1 | 2>(); // 0=blanco 1=gris 2=negro
  const cycles: string[][] = [];
  const stack: string[] = [];

  const visit = (ref: string): void => {
    color.set(ref, 1);
    stack.push(ref);
    const node = byRef.get(ref);
    if (node) {
      for (const dep of node.dependencies) {
        const target = byRef.get(dep.ref);
        if (!target) {
          continue; // inexistente: lo detecta el check de refs
        }
        const c = color.get(dep.ref) ?? 0;
        if (c === 1) {
          const start = stack.indexOf(dep.ref);
          cycles.push([...stack.slice(start === -1 ? 0 : start), dep.ref]);
        } else if (c === 0) {
          visit(dep.ref);
        }
      }
    }
    stack.pop();
    color.set(ref, 2);
  };

  for (const a of artifacts) {
    if ((color.get(a.ref) ?? 0) === 0) {
      visit(a.ref);
    }
  }
  return cycles;
}

/** Orden topológico (dependencias primero). Falla si hay ciclo. */
export function topologicalOrder(artifacts: Array<{ ref: string; dependencies: DepEdge[] }>): { ok: true; order: string[] } | { ok: false; cycle: string[] } {
  const byRef = new Map(artifacts.map((a) => [a.ref, a]));
  const indegree = new Map<string, number>();
  const dependents = new Map<string, string[]>();
  for (const a of artifacts) {
    indegree.set(a.ref, indegree.get(a.ref) ?? 0);
    for (const dep of a.dependencies) {
      if (!byRef.has(dep.ref)) {
        continue;
      }
      dependents.set(dep.ref, [...(dependents.get(dep.ref) ?? []), a.ref]);
      indegree.set(a.ref, (indegree.get(a.ref) ?? 0) + 1);
    }
  }
  const queue = [...artifacts.map((a) => a.ref)].filter((r) => (indegree.get(r) ?? 0) === 0).sort();
  const order: string[] = [];
  while (queue.length > 0) {
    const ref = queue.shift()!;
    order.push(ref);
    for (const next of dependents.get(ref) ?? []) {
      const left = (indegree.get(next) ?? 0) - 1;
      indegree.set(next, left);
      if (left === 0) {
        queue.push(next);
      }
    }
  }
  if (order.length !== artifacts.length) {
    const cycle = detectCycles(artifacts)[0] ?? artifacts.map((a) => a.ref);
    return { ok: false, cycle };
  }
  return { ok: true, order };
}

/** Incompatibilidades de versión entre dependencias internas (rangos vs versión declarada). */
export function checkVersionCompat(artifacts: Array<{ ref: string; version: string; dependencies: DepEdge[] }>): Array<{ from: string; ref: string; reason: string }> {
  const byRef = new Map(artifacts.map((a) => [a.ref, a]));
  const issues: Array<{ from: string; ref: string; reason: string }> = [];
  for (const a of artifacts) {
    for (const dep of a.dependencies) {
      const target = byRef.get(dep.ref);
      if (!target) {
        continue;
      }
      if (dep.versionRange && !satisfiesRange(target.version, dep.versionRange)) {
        issues.push({ from: a.ref, ref: dep.ref, reason: `${dep.ref}@${target.version} no satisface '${dep.versionRange}' exigido por ${a.ref}` });
      }
    }
  }
  return issues;
}

export interface ProjectGraph {
  id: string;
  artifacts: number;
  internal: { missing: string[]; cycles: string[][]; order: string[] | null; compatIssues: Array<{ from: string; ref: string; reason: string }> };
  external: Array<{ ref: string; required: boolean; resolved: boolean; specId?: string; registeredKind?: string; registeredVersion?: string }>;
  specRefs: Array<{ artifact: string; ref: string; expectedKind: string; found: boolean; kindMatch?: boolean; versionMatch?: boolean | null; registeredVersion?: string }>;
  ok: boolean;
}

/** Resuelve el grafo completo de un proyecto: interno + externo (registry de specs). */
export async function resolveProjectGraph(doc: UESProjectV1): Promise<ProjectGraph> {
  const missing = new Set<string>();
  const byRef = new Map(doc.artifacts.map((a) => [a.ref, a]));
  for (const a of doc.artifacts) {
    for (const dep of a.dependencies) {
      if (!byRef.has(dep.ref)) {
        missing.add(dep.ref);
      }
    }
  }
  const cycles = detectCycles(doc.artifacts);
  const topo = topologicalOrder(doc.artifacts);
  const compatIssues = checkVersionCompat(doc.artifacts);

  const external: ProjectGraph['external'] = [];
  for (const dep of doc.dependencies) {
    const latest = await getLatestSpec(dep.ref);
    external.push({
      ref: dep.ref,
      required: dep.required,
      resolved: Boolean(latest),
      specId: latest?.metadata.id,
      registeredKind: latest?.kind,
      registeredVersion: latest?.metadata.version,
    });
  }

  const specRefs: ProjectGraph['specRefs'] = [];
  for (const a of doc.artifacts) {
    if (!a.specRef) {
      continue;
    }
    const latest = await getLatestSpec(a.specRef.id);
    specRefs.push({
      artifact: a.ref,
      ref: a.specRef.id,
      expectedKind: a.specRef.kind,
      found: Boolean(latest),
      kindMatch: latest ? latest.kind === a.specRef.kind : undefined,
      versionMatch: latest && a.specRef.version ? latest.metadata.version === a.specRef.version : null,
      registeredVersion: latest?.metadata.version,
    });
  }

  const ok =
    missing.size === 0 && cycles.length === 0 && compatIssues.length === 0 && external.every((e) => e.resolved || !e.required) && specRefs.every((s) => s.found && s.kindMatch !== false);

  return {
    id: doc.metadata.id,
    artifacts: doc.artifacts.length,
    internal: { missing: [...missing], cycles, order: topo.ok ? topo.order : null, compatIssues },
    external,
    specRefs,
    ok,
  };
}

/* ── Ciclo de vida (estados explícitos + auditables) ─────────────────────── */

export const LIFECYCLE_TRANSITIONS: Record<LifecycleState, LifecycleState[]> = {
  draft: ['validated', 'archived'],
  validated: ['generated', 'archived'],
  generated: ['tested', 'archived'],
  tested: ['ready', 'failed', 'archived'],
  ready: ['deployed', 'failed', 'archived'],
  deployed: ['archived'],
  failed: ['draft', 'archived'],
  archived: [],
};

export interface LifecycleEntry {
  state: LifecycleState;
  history: Array<{ from: LifecycleState; to: LifecycleState; at: string; actor: string; note?: string }>;
}

let lifecycleMutex: Promise<unknown> = Promise.resolve();

export async function getLifecycle(id: string): Promise<LifecycleEntry | null> {
  try {
    const raw = JSON.parse(await fs.readFile(LIFECYCLE_FILE, 'utf8')) as Record<string, LifecycleEntry>;
    return raw[id] ?? null;
  } catch {
    return null;
  }
}

/** Transición explícita y auditable. Falla si el proyecto no existe o el salto no está permitido. */
export async function transitionLifecycle(
  projectId: string,
  to: LifecycleState,
  opts: { actor?: string; note?: string } = {},
): Promise<{ ok: true; entry: LifecycleEntry } | { ok: false; status: 400 | 404; reason: string }> {
  const doc = await getLatestProject(projectId);
  if (!doc) {
    return { ok: false, status: 404, reason: 'project_not_found' };
  }
  const run = lifecycleMutex.then(async () => {
    const current = await getLifecycle(projectId);
    const from: LifecycleState = current?.state ?? doc.lifecycle.state;
    const allowed = LIFECYCLE_TRANSITIONS[from] ?? [];
    if (!allowed.includes(to)) {
      return { ok: false as const, status: 400 as const, reason: `transición no permitida: ${from} → ${to} (permitidas: ${allowed.join(', ') || 'ninguna'})` };
    }
    const entry: LifecycleEntry = {
      state: to,
      history: [
        ...(current?.history ?? []),
        { from, to, at: new Date().toISOString(), actor: opts.actor ?? 'console', note: opts.note },
      ],
    };
    await fs.mkdir(path.dirname(LIFECYCLE_FILE), { recursive: true });
    const tmp = `${LIFECYCLE_FILE}.tmp`;
    const all = JSON.parse(await fs.readFile(LIFECYCLE_FILE, 'utf8').catch(() => '{}')) as Record<string, LifecycleEntry>;
    all[projectId] = entry;
    await fs.writeFile(tmp, JSON.stringify(all, null, 2), 'utf8');
    await fs.rename(tmp, LIFECYCLE_FILE);
    audit({
      actor: { kind: 'console' },
      action: 'engineering.lifecycle',
      correlation: { targetId: projectId },
      detail: { from, to, note: opts.note ?? null },
    });
    return { ok: true as const, entry };
  });
  lifecycleMutex = run.catch(() => undefined);
  return run;
}
