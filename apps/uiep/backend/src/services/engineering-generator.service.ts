import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import {
  API_VERSION,
  EntityIdSchema,
  SemVerSchema,
  validateSpec,
  validateWorkflowStructure,
  validateEngineeringArtifact,
} from '@uiep/agent-spec';
import { getLatestSpec, listSpecVersions, saveSpec } from './spec-registry.service';
import { getToolSpec } from './tool-registry.service';
import { resolveModelRef } from './model-gateway.service';
import { listSources, getSource, getBindings, setBindingsForAgent } from './knowledge-store.service';
import { createSource, ingestSource } from './ingestion.service';
import { audit } from './observability.service';
import {
  getCatalogEntry,
  saveArtifact,
  getLatestArtifact,
  getArtifactVersion,
  topologicalOrder,
  transitionArtifactLifecycle,
} from './engineering-registry.service';

/**
 * engineering-generator (Misión 12) — Generator Engine de UIEP.
 *
 * Motor central de GENERACIÓN: resuelve el tipo contra el CATÁLOGO con
 * capacidades reales (M11), valida la entrada contra su schema, verifica las
 * referencias contra los servicios REALES (spec/tool/model/knowledge),
 * genera documentos deterministas, valida el resultado, lo REGISTRA
 * (data/specs para Agent/Workflow — el runtime los ejecuta — o
 * data/engineering/artifacts/ para los 8 kinds de documento) y guarda un
 * REGISTRO de generación con hashes de entrada/salida y procedencia.
 *
 * Principios:
 * · Determinista: mismas entradas + misma versión de generador → mismo doc
 *   (hash idéntico en re-ejecución → reutilización, nunca reescritura).
 * · Sin ejecución de código generado, sin shell, sin red salvo los servicios
 *   existentes (ingesta/embeddings). Todo artefacto es un documento validado.
 * · Los conflictos de versión fail-closed: id@version existente con contenido
 *   distinto NO se sobrescribe (bump explícito a partir de 1.0.0).
 * · La procedencia guarda hashes/referencias — JAMÁS el contenido de entrada
 *   (evita persistir documentos potencialmente sensibles del usuario).
 */

/** Versión de la LÓGICA de generación — cambia con cada cambio de lógica.
 *  1.1.0 (Misión 13): +4 generadores de aplicación/sistema (api-platform,
 *  application, agentic-app, saas) y framework con módulos. Aditivo. */
export const GENERATOR_ENGINE_VERSION = '1.1.0';

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const GENERATIONS_DIR = path.join(DATA_DIR, 'engineering', 'generations');

export interface GeneratorCheck {
  name: string;
  passed: boolean;
  detail?: string;
}

export type SpecRefKind = 'Agent' | 'ModelProfile' | 'Tool' | 'Workflow' | 'Integration';

export type GenerationOutcome =
  | { store: 'specs'; specKind: SpecRefKind; id: string; version: string }
  | { store: 'engineering'; artifactKind: string; id: string; version: string };

export interface GeneratorError {
  ok: false;
  status: 400 | 409;
  code?: string;
  errors: Record<string, string[]>;
}

export type GeneratorValidateResult = { ok: true; checks: GeneratorCheck[] } | GeneratorError;

export type GeneratorGenerateResult =
  | {
      ok: true;
      outcome: GenerationOutcome;
      reused: boolean;
      warnings: string[];
      docHash: string;
      extraOutcomes?: GenerationOutcome[];
    }
  | GeneratorError;

export interface GeneratorModule {
  type: string;
  label: string;
  docKind: string;
  outStore: 'specs' | 'engineering';
  inputShape: string;
  validate(input: unknown): Promise<GeneratorValidateResult>;
  generate(input: unknown): Promise<GeneratorGenerateResult>;
}

/* ── Utilidades (estables — determinismo) ────────────────────────────────── */

export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value) ?? 'null';
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  const obj = value as Record<string, unknown>;
  return `{${Object.keys(obj).sort().map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`;
}

export function sha256Hex(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

/** Huella de contenido (metadata.createdAt excluido — no forma parte del contrato). */
function fingerprintOf(doc: unknown): string {
  const clone = structuredClone(doc);
  if (clone && typeof clone === 'object') {
    const meta = (clone as { metadata?: Record<string, unknown> }).metadata;
    if (meta) {
      delete meta.createdAt;
    }
  }
  return sha256Hex(stableStringify(clone)).slice(0, 32);
}

function toErrors(error: z.ZodError): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.join('.') : '(raíz)';
    (errors[key] ??= []).push(issue.message);
  }
  return errors;
}

function parseErr<T extends z.ZodTypeAny>(schema: T, input: unknown): { ok: true; data: z.infer<T> } | GeneratorError {
  const parsed = schema.safeParse(input);
  if (parsed.success) {
    return { ok: true, data: parsed.data };
  }
  return { ok: false, status: 400, errors: toErrors(parsed.error) };
}

function slugify(raw: string): string {
  const slug = raw
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // diacríticos descompuestos (ó→o, ¬ salto a '-x-s')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63);
  return slug.length >= 3 ? slug : `gen-${slug}`;
}

function bumpPatch(version: string): string {
  const [maj, minor, patch] = version.split('.');
  return `${maj}.${minor}.${Number(patch) + 1}`;
}

function summarizeInput(input: unknown): Record<string, unknown> {
  if (input === null || typeof input !== 'object') {
    return {};
  }
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    out[key] = Array.isArray(value) ? { count: value.length } : typeof value === 'object' && value !== null ? {} : value;
  }
  return out;
}

/* ── Upserts con política de conflictos fail-closed ──────────────────────── */

type UpsertResultOk = { ok: true; id: string; version: string; reused: boolean; finalDoc: unknown };
type UpsertResult = UpsertResultOk | GeneratorError;

async function upsertRuntimeSpec(rawDoc: unknown, onConflict: 'error' | 'bump'): Promise<UpsertResult> {
  const doc = rawDoc as { kind: string; metadata: { id: string; version: string } & Record<string, unknown> } & Record<string, unknown>;
  const validated = validateSpec(doc);
  if (!validated.ok) {
    return { ok: false, status: 400, code: 'invalid_spec', errors: validated.errors };
  }
  let current = doc;
  for (let i = 0; i < 50; i++) {
    const id = current.metadata.id;
    const version = current.metadata.version;
    // Política version-aware: se compara contra el fichero id@version CONCRETO
    // (no contra el latest — si el latest es una versión posterior, re-guardar
    // id@version idéntico sigue siendo reutilización, no reescritura).
    const atVersion = (await listSpecVersions(id)).find((v) => (v as { metadata?: { version?: string } }).metadata?.version === version) as { metadata?: { version?: string } } | undefined;
    if (atVersion) {
      if (fingerprintOf(atVersion) === fingerprintOf(current)) {
        return { ok: true, id, version, reused: true, finalDoc: atVersion };
      }
      if (onConflict === 'error') {
        return {
          ok: false,
          status: 409,
          code: 'version_conflict',
          errors: {
            version: [
              `ya existe '${id}@${version}' con contenido distinto (huella ${fingerprintOf(atVersion)} ≠ ${fingerprintOf(current)}); usa version distinta u onConflict='bump'`,
            ],
          },
        };
      }
      current = { ...current, metadata: { ...current.metadata, version: bumpPatch(version) } };
      continue;
    }
    await saveSpec(current as never);
    return { ok: true, id, version, reused: false, finalDoc: current };
  }
  return { ok: false, status: 409, code: 'version_conflict', errors: { version: ['no se pudo resolver un bloque de versiones (50 intentos)'] } };
}

async function upsertEngineeringArtifact(rawDoc: unknown, onConflict: 'error' | 'bump'): Promise<UpsertResult> {
  const validated = validateEngineeringArtifact(rawDoc);
  if (!validated.ok) {
    return { ok: false, status: 400, code: 'invalid_artifact', errors: validated.errors };
  }
  const kind = validated.spec.kind;
  let current = rawDoc as { kind: string; metadata: { id: string; version: string } & Record<string, unknown> };
  for (let i = 0; i < 50; i++) {
    const id = current.metadata.id;
    const version = current.metadata.version;
    // Política version-aware (idéntica a los specs de runtime): compara contra
    // el fichero id@version concreto; un latest posterior NO obliga a reescribir.
    const atVersion = await getArtifactVersion(kind, id, version);
    if (atVersion) {
      if (fingerprintOf(atVersion) === fingerprintOf(current)) {
        return { ok: true, id, version, reused: true, finalDoc: atVersion };
      }
      if (onConflict === 'error') {
        return {
          ok: false,
          status: 409,
          code: 'version_conflict',
          errors: {
            version: [
              `ya existe ${kind} '${id}@${version}' con contenido distinto (huella ${fingerprintOf(atVersion)} ≠ ${fingerprintOf(current)}); usa version distinta u onConflict='bump'`,
            ],
          },
        };
      }
      current = { ...current, metadata: { ...current.metadata, version: bumpPatch(version) } };
      continue;
    }
    await saveArtifact(current);
    await lifecycleInit(kind, id);
    return { ok: true, id, version, reused: false, finalDoc: current };
  }
  return { ok: false, status: 409, code: 'version_conflict', errors: { version: ['no se pudo resolver un bloque de versiones (50 intentos)'] } };
}

/** Estados de vida iniciales de un artefacto NUEVO: draft → validated → generated. */
async function lifecycleInit(kind: string, id: string): Promise<void> {
  const t1 = await transitionArtifactLifecycle(kind, id, 'validated', { actor: `generator-engine@${GENERATOR_ENGINE_VERSION}` });
  if (t1.ok) {
    await transitionArtifactLifecycle(kind, id, 'generated');
  }
}

/* ── Registros de generación persistentes ────────────────────────────────── */

export interface GenerationRecord {
  id: string;
  type: string;
  status: 'succeeded' | 'failed';
  startedAt: string;
  durationMs: number;
  inputHash: string;
  inputSummary: Record<string, unknown>;
  outputHash?: string;
  outcome?: (GenerationOutcome & { reused?: boolean }) | null;
  extraOutcomes?: GenerationOutcome[];
  warnings?: string[];
  children?: string[];
  error?: { status?: number; code?: string; keys?: string[]; message?: string };
  provenance?: { generator: { id: string; version: string }; generatedAt: string };
}

let generationsDirReady = false;

async function ensureGenerationsDir(): Promise<void> {
  if (!generationsDirReady) {
    await fs.mkdir(GENERATIONS_DIR, { recursive: true });
    generationsDirReady = true;
  }
}

const GEN_ID_RE = /^gen-[a-z0-9]{8,14}-[a-z0-9]{6}$/;

/** Id de generación (usado también por el service de composición). */
export function newGenerationId(): string {
  const ts = Date.now().toString(36);
  const rnd = createHash('sha256')
    .update(`${Date.now()}-${Math.random()}`)
    .digest('hex')
    .slice(0, 6);
  return `gen-${ts}-${rnd}`;
}

export async function saveGenerationRecord(record: GenerationRecord): Promise<void> {
  await ensureGenerationsDir();
  const file = path.join(GENERATIONS_DIR, `${record.id}.json`);
  const tmp = `${file}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(record, null, 2), 'utf8');
  await fs.rename(tmp, file);
}

export async function listGenerationRecords(limit = 100): Promise<GenerationRecord[]> {
  let files: string[] = [];
  try {
    files = (await fs.readdir(GENERATIONS_DIR)).filter((f) => f.endsWith('.json'));
  } catch {
    return [];
  }
  const records: GenerationRecord[] = [];
  for (const f of files) {
    try {
      const rec = JSON.parse(await fs.readFile(path.join(GENERATIONS_DIR, f), 'utf8')) as GenerationRecord;
      records.push(rec);
    } catch {
      /* corrupto: ignorar */
    }
  }
  records.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  return limit > 0 ? records.slice(0, limit) : records;
}

export async function getGenerationRecord(id: string): Promise<GenerationRecord | null> {
  if (!GEN_ID_RE.test(id)) {
    return null;
  }
  try {
    return JSON.parse(await fs.readFile(path.join(GENERATIONS_DIR, `${id}.json`), 'utf8')) as GenerationRecord;
  } catch {
    return null;
  }
}

/** Último registro de generación cuyo resultado coincide con la referencia indicada. */
export async function latestGenerationFor(store: string, kind: string, id: string): Promise<GenerationRecord | null> {
  const all = await listGenerationRecords(200);
  return (
    all.find(
      (r) =>
        r.status === 'succeeded' &&
        r.outcome &&
        (r.outcome as { store: string; specKind?: string; artifactKind?: string; id?: string }).store === store &&
        ((r.outcome as { specKind?: string; artifactKind?: string }).specKind === kind || (r.outcome as { artifactKind?: string }).artifactKind === kind) &&
        r.outcome.id === id,
    ) ?? null
  );
}

/* ── Definición de los 12 generadores ────────────────────────────────────── */

const OnConflictSchema = z.enum(['error', 'bump']).default('error');

/* 1) AGENT — genera un AgentSpec REAL (ejecutable por el runtime). */

const AgentGenInputSchema = z.object({
  id: EntityIdSchema.optional(),
  name: z.string().min(1).max(110),
  role: z.string().min(1).max(120),
  objective: z.string().min(1).max(500),
  system: z.string().min(1).max(4000),
  profile: z.string().min(1).max(64).default('default'),
  tools: z
    .array(z.object({ id: EntityIdSchema, permissions: z.array(z.string().min(1).max(80)).max(16).default([]) }))
    .max(8)
    .default([]),
  knowledge: z.array(z.string().min(1).max(64)).max(8).default([]),
  memory: z
    .object({ enabled: z.boolean().default(true), strategy: z.enum(['none', 'semantic']).default('semantic') })
    .default({ enabled: true, strategy: 'semantic' }),
  maxIterations: z.number().int().min(1).max(16).default(4),
  version: SemVerSchema.default('1.0.0'),
  onConflict: OnConflictSchema,
});

type AgentGenInput = z.infer<typeof AgentGenInputSchema>;

async function buildAgentSpec(input: AgentGenInput): Promise<{ ok: true; doc: Record<string, unknown>; id: string } | GeneratorError> {
  const id = input.id ?? slugify(input.name);
  if (!EntityIdSchema.safeParse(id).success) {
    return { ok: false, status: 400, errors: { id: [`id derivado de '${input.name}' no es válido: '${id}'`] } };
  }
  const modelRef = await resolveModelRef(input.profile);
  if (!modelRef.ok) {
    const errors: Record<string, string[]> = {};
    (errors.profile ??= []).push(modelRef.message);
    return { ok: false, status: 400, errors };
  }
  for (const tool of input.tools) {
    const spec = await getToolSpec(tool.id);
    if (!spec) {
      return { ok: false, status: 400, errors: { tools: [`herramienta no registrada: '${tool.id}'`] } };
    }
  }
  for (const sourceId of input.knowledge) {
    const source = await getSource(sourceId);
    if (!source) {
      return { ok: false, status: 400, errors: { knowledge: [`fuente de conocimiento inexistente: '${sourceId}'`] } };
    }
  }
  const doc = {
    apiVersion: API_VERSION,
    kind: 'Agent',
    metadata: { id, name: input.name, version: input.version, description: 'Agente generado por el agent-generator de UIEP (Misión 12).' },
    spec: {
      identity: { role: input.role, objective: input.objective },
      model: { profile: input.profile },
      instructions: { system: input.system },
      tools: input.tools.map((t) => ({ id: t.id, permissions: t.permissions })),
      memory: { enabled: input.memory.enabled, strategy: input.memory.strategy },
      orchestration: { mode: 'single-agent', maxIterations: input.maxIterations },
      security: { approvalRequired: [] },
      evaluation: {},
    },
  };
  return { ok: true, doc, id };
}

/* 2) WORKFLOW — genera un WorkflowSpec REAL (DAG validado + agentes existentes). */

const WorkflowGenInputSchema = z.object({
  id: EntityIdSchema.optional(),
  name: z.string().min(1).max(110),
  steps: z
    .array(
      z.object({
        id: z.string().min(1).max(64).optional(),
        agent: EntityIdSchema,
        input: z.string().min(1).max(2000).optional(),
        retries: z.number().int().min(0).max(3).optional(),
      }),
    )
    .min(1)
    .max(24),
  branches: z
    .array(
      z.object({
        after: z.string().min(1).max(64),
        op: z.enum(['contains', 'equals', 'not_empty', 'starts_with']),
        value: z.string().max(1000).default(''),
        caseSensitive: z.boolean().default(false),
        then: z.string().min(1).max(64),
        else: z.string().min(1).max(64),
      }),
    )
    .max(4)
    .default([]),
  version: SemVerSchema.default('1.0.0'),
  onConflict: OnConflictSchema,
});

type WorkflowGenInput = z.infer<typeof WorkflowGenInputSchema>;

type WfNode = Record<string, unknown> & { id: string };

async function buildWorkflowSpec(input: WorkflowGenInput): Promise<{ ok: true; doc: Record<string, unknown>; id: string; warnings: string[] } | GeneratorError> {
  const id = input.id ?? slugify(input.name);
  if (!EntityIdSchema.safeParse(id).success) {
    return { ok: false, status: 400, errors: { id: [`id derivado de '${input.name}' no es válido: '${id}'`] } };
  }
  const nodes: WfNode[] = [];
  const stepIds = new Map<string, number>(); // id declarado/derivado → índice
  for (let i = 0; i < input.steps.length; i++) {
    const step = input.steps[i];
    const nodeId = step.id ?? `paso-${i + 1}`;
    if (stepIds.has(nodeId)) {
      return { ok: false, status: 400, errors: { steps: [`id de paso duplicado: '${nodeId}'`] } };
    }
    stepIds.set(nodeId, nodes.length);
    nodes.push({
      id: nodeId,
      type: 'agent',
      agentSpecId: step.agent,
      input: step.input ?? (i === 0 ? '{{input}}' : '{{prev}}'),
      ...(step.retries === undefined ? {} : { retries: step.retries }),
    });
  }
  // Verificación de agentes referenciados (real, contra data/specs).
  for (const agentId of new Set(input.steps.map((s) => s.agent))) {
    const envelope = await getLatestSpec(agentId);
    if (!envelope || (envelope as { kind?: string }).kind !== 'Agent') {
      return { ok: false, status: 400, errors: { steps: [`agente inexistente o de otro kind: '${agentId}'`] } };
    }
  }
  const usedConditionIds = new Set<string>();
  for (const br of input.branches) {
    const idx = stepIds.get(br.after);
    if (idx === undefined) {
      return { ok: false, status: 400, errors: { branches: [`la rama trasera referencia un paso inexistente: '${br.after}'`] } };
    }
    for (const target of [br.then, br.else]) {
      if (!stepIds.has(target)) {
        return { ok: false, status: 400, errors: { branches: [`destino de rama inexistente: '${target}'`] } };
      }
    }
    const condId = `${br.after}-ramificar`;
    if (usedConditionIds.has(condId)) {
      return { ok: false, status: 400, errors: { branches: [`rama duplicada tras '${br.after}'`] } };
    }
    usedConditionIds.add(condId);
    nodes.splice(idx + 1, 0, {
      id: condId,
      type: 'condition',
      input: `{{${br.after}}}`,
      check: { op: br.op, value: br.value, caseSensitive: br.caseSensitive },
      then: br.then,
      else: br.else,
    });
  }
  if (nodes.length > 32) {
    return { ok: false, status: 400, errors: { nodes: ['demasiados nodos tras ramificar (máx 32)'] } };
  }
  const struct = validateWorkflowStructure({ spec: { start: String(nodes[0].id), nodes: nodes as never } });
  if (!struct.ok) {
    return { ok: false, status: 400, errors: { structure: struct.errors.slice(0, 6) } };
  }
  const doc = {
    apiVersion: API_VERSION,
    kind: 'Workflow',
    metadata: { id, name: input.name, version: input.version, description: 'Workflow generado por el workflow-generator de UIEP (Misión 12).' },
    spec: { start: nodes[0].id, nodes },
  };
  const warnings: string[] = [];
  if (input.branches.length > 0) {
    warnings.push('los nodos situados tras un condition en el array solo se alcanzan siguiendo su rama (then/else)');
  }
  return { ok: true, doc, id, warnings };
}

/* 3) MULTI-AGENT-SYSTEM — genera el workflow de coordinación REAL + registro del sistema. */

const MultiAgentInputSchema = z.object({
  id: EntityIdSchema.optional(),
  name: z.string().min(1).max(110),
  members: z
    .array(
      z.object({
        agent: z.union([EntityIdSchema, z.object({ generate: z.record(z.string(), z.unknown()) })]),
        role: z.string().min(1).max(80),
        responsibilities: z.string().max(400).optional(),
      }),
    )
    .min(2)
    .max(8),
  style: z.enum(['pipeline', 'orchestrator']).default('pipeline'),
  sharedMemory: z.boolean().default(false),
  version: SemVerSchema.default('1.0.0'),
  onConflict: OnConflictSchema,
});

type MultiAgentInput = z.infer<typeof MultiAgentInputSchema>;

interface ResolvedMember {
  agentSpecId: string;
  role: string;
  responsibilities?: string;
}

/* 4..8) Documentos de ingeniería (kinds del artefacto). */

/** Referencias comunes de rag-system (usada por validate y generate). */
async function validateRagReferences(parsed: z.infer<typeof RagSystemInputSchema>): Promise<GeneratorError | null> {
  for (const agentId of parsed.agents) {
    const envelope = await getLatestSpec(agentId);
    if (!envelope || (envelope as { kind?: string }).kind !== 'Agent') {
      return { ok: false, status: 400, errors: { agents: [`agente inexistente: '${agentId}'`] } };
    }
  }
  const known = new Set((await listSources()).map((s) => s.sourceId));
  for (const bind of parsed.bindings) {
    if (!parsed.agents.includes(bind.agent)) {
      return { ok: false, status: 400, errors: { bindings: [`binding para agente fuera de la lista: '${bind.agent}'`] } };
    }
    for (const sourceId of bind.sourceIds) {
      if (!known.has(sourceId)) {
        return { ok: false, status: 400, errors: { bindings: [`fuente inexistente: '${sourceId}'`] } };
      }
    }
  }
  return null;
}

/** Referencias comunes de harness. */
async function validateHarnessReferences(parsed: z.infer<typeof HarnessInputSchema>): Promise<GeneratorError | null> {
  for (const target of parsed.targets) {
    const envelope = await getLatestSpec(target);
    const kind = (envelope as { kind?: string } | null)?.kind;
    if (!envelope || (kind !== 'Agent' && kind !== 'Workflow')) {
      const art = await getLatestArtifact('Harness', target);
      if (!art) {
        return { ok: false, status: 400, errors: { targets: [`target inexistente (no es Agent/Workflow válido): '${target}'`] } };
      }
    }
  }
  for (const toolId of parsed.allowedTools) {
    if (!(await getToolSpec(toolId))) {
      return { ok: false, status: 400, errors: { allowedTools: [`herramienta no registrada: '${toolId}'`] } };
    }
  }
  for (const tc of parsed.testCases) {
    if (tc.dataset) {
      const ds = await getLatestArtifact('EvaluationDataset', tc.dataset);
      if (!ds) {
        return { ok: false, status: 400, errors: { testCases: [`dataset de evaluación inexistente: '${tc.dataset}'`] } };
      }
    }
  }
  return null;
}

/** Referencias comunes de framework (componentes + módulos M13). */
async function validateFrameworkComponents(parsed: z.infer<typeof FrameworkInputSchema>): Promise<GeneratorError | null> {
  for (const comp of parsed.components) {
    const resolved = await resolveComponentRef(comp.ref.kind, comp.ref.id);
    if (!resolved.found) {
      return { ok: false, status: 400, errors: { components: [`componente inexistente: ${comp.type} → ${comp.ref.kind} '${comp.ref.id}'`] } };
    }
  }
  // M13: módulos — refs verificadas + dependencias existentes + acíclico.
  const errs: Record<string, string[]> = {};
  await validateModuleGraph(
    parsed.modules.map((m) => ({ id: m.id, components: m.components, dependencies: m.dependencies })),
    errs,
  );
  if (Object.keys(errs).length > 0) {
    return { ok: false, status: 400, errors: errs };
  }
  return null;
}

const PromptSysInputSchema = z.object({
  id: EntityIdSchema.optional(),
  name: z.string().min(1).max(110),
  prompts: z
    .array(
      z.object({
        name: z.string().min(1).max(80),
        description: z.string().max(250).optional(),
        template: z.string().min(1).max(8000),
        variables: z
          .array(z.object({ name: z.string().regex(/^[a-z][a-zA-Z0-9_]{0,31}$/), type: z.enum(['string', 'number', 'boolean']), required: z.boolean().optional(), default: z.unknown().optional() }))
          .max(16)
          .default([]),
      }),
    )
    .min(1)
    .max(16),
  compositions: z
    .array(
      z.object({
        id: EntityIdSchema.optional(),
        steps: z
          .array(z.object({ prompt: z.string().min(1).max(80), inputs: z.record(z.string().max(64), z.string().max(2000)).default({}) }))
          .min(1)
          .max(8),
      }),
    )
    .max(4)
    .default([]),
  version: SemVerSchema.default('1.0.0'),
  onConflict: OnConflictSchema,
});

const ToolCollectionInputSchema = z.object({
  id: EntityIdSchema.optional(),
  name: z.string().min(1).max(110),
  tools: z
    .array(
      z.object({
        toolId: EntityIdSchema,
        permissions: z.array(z.string().min(1).max(80)).max(16).optional(),
        policy: z.object({ approvalRequired: z.boolean().optional(), maxConcurrency: z.number().int().min(1).max(8).optional() }).optional(),
      }),
    )
    .min(1)
    .max(16),
  notes: z.string().max(300).optional(),
  version: SemVerSchema.default('1.0.0'),
  onConflict: OnConflictSchema,
});

const KnowledgeBaseInputSchema = z.object({
  id: EntityIdSchema.optional(),
  name: z.string().min(1).max(110),
  sources: z.array(z.object({ title: z.string().min(1).max(160), text: z.string().min(1).max(100_000) })).min(1).max(16),
  bindings: z.array(z.object({ agent: EntityIdSchema, sourceTitles: z.array(z.string().min(1).max(160)).max(16) })).max(8).default([]),
  notes: z.string().max(300).optional(),
  version: SemVerSchema.default('1.0.0'),
  onConflict: OnConflictSchema,
});

const RagSystemInputSchema = z.object({
  id: EntityIdSchema.optional(),
  name: z.string().min(1).max(110),
  agents: z.array(EntityIdSchema).min(1).max(8),
  bindings: z.array(z.object({ agent: EntityIdSchema, sourceIds: z.array(z.string().min(1).max(64)).max(16) })).max(8).default([]),
  minScore: z.number().min(0).max(1).optional(),
  topK: z.number().int().min(1).max(20).optional(),
  citationsFormat: z.string().min(1).max(40).optional(),
  thresholds: z
    .object({
      recall: z.number().min(0).max(1).optional(),
      precision: z.number().min(0).max(1).optional(),
      mrr: z.number().min(0).max(1).optional(),
    })
    .optional(),
  version: SemVerSchema.default('1.0.0'),
  onConflict: OnConflictSchema,
});

const McpServerInputSchema = z.object({
  serverId: EntityIdSchema,
  name: z.string().min(1).max(110),
  tools: z.array(EntityIdSchema).min(1).max(16),
  prompts: z.array(z.object({ name: z.string().regex(/^[a-z0-9_-]{1,64}$/), template: z.string().min(1).max(3000) })).max(8).default([]),
  resources: z.array(z.object({ uri: z.string().min(1).max(200), name: z.string().min(1).max(120), description: z.string().max(200).optional() })).max(8).default([]),
  version: SemVerSchema.default('1.0.0'),
  onConflict: OnConflictSchema,
});

const SkillPackInputSchema = z.object({
  id: EntityIdSchema.optional(),
  name: z.string().min(1).max(110),
  skills: z
    .array(
      z.object({
        id: z.string().min(1).max(64),
        description: z.string().min(1).max(500),
        instructions: z.string().min(1).max(4000),
        inputs: z.array(z.object({ name: z.string().max(64), type: z.enum(['string', 'number', 'boolean', 'object']) })).max(8).default([]),
        outputs: z.array(z.object({ name: z.string().max(64), type: z.enum(['string', 'number', 'boolean', 'object']) })).max(8).default([]),
      }),
    )
    .min(1)
    .max(16),
  compatibility: z.string().max(300).optional(),
  version: SemVerSchema.default('1.0.0'),
  onConflict: OnConflictSchema,
});

const EvaluationInputSchema = z.object({
  id: EntityIdSchema.optional(),
  name: z.string().min(1).max(110),
  cases: z.array(z.object({ query: z.string().min(1).max(2000), expected: z.string().min(1).max(2000), refs: z.array(z.string().max(80)).max(8).default([]) })).min(1).max(100),
  thresholds: z
    .object({
      recall: z.number().min(0).max(1).optional(),
      precision: z.number().min(0).max(1).optional(),
      mrr: z.number().min(0).max(1).optional(),
    })
    .optional(),
  version: SemVerSchema.default('1.0.0'),
  onConflict: OnConflictSchema,
});

const HarnessInputSchema = z.object({
  id: EntityIdSchema.optional(),
  name: z.string().min(1).max(110),
  targets: z.array(EntityIdSchema).min(1).max(8),
  allowedTools: z.array(EntityIdSchema).max(8).default([]),
  limits: z
    .object({
      maxIterations: z.number().int().min(1).max(50).optional(),
      timeoutMs: z.number().int().min(1000).max(300_000).optional(),
      maxConcurrency: z.number().int().min(1).max(8).optional(),
    })
    .default({}),
  fixtures: z.array(z.object({ name: z.string().min(1).max(80), input: z.string().min(1).max(2000), expected: z.string().max(2000).optional() })).max(50).default([]),
  testCases: z.array(z.object({ dataset: EntityIdSchema.optional(), description: z.string().max(200).optional() })).max(32).default([]),
  version: SemVerSchema.default('1.0.0'),
  onConflict: OnConflictSchema,
});

const FrameworkInputSchema = z.object({
  id: EntityIdSchema.optional(),
  name: z.string().min(1).max(110),
  description: z.string().max(300).optional(),
  conventions: z.object({ description: z.string().max(500).optional(), config: z.record(z.string().max(64), z.unknown()).optional() }).optional(),
  components: z
    .array(
      z.object({
        type: z.string().min(1).max(40),
        ref: z.object({ id: EntityIdSchema, kind: z.string().min(1).max(40), version: SemVerSchema.optional() }),
        use: z.string().max(120).optional(),
      }),
    )
    .min(1)
    .max(16),
  extensionPoints: z.array(z.object({ name: z.string().min(1).max(60), description: z.string().max(200) })).max(8).default([]),
  modules: z
    .array(
      z.object({
        id: z.string().min(1).max(64),
        description: z.string().max(200).optional(),
        components: z
          .array(z.object({ type: z.string().min(1).max(40), ref: z.object({ id: EntityIdSchema, kind: z.string().min(1).max(40), version: SemVerSchema.optional() }), use: z.string().max(120).optional() }))
          .min(1)
          .max(16),
        dependencies: z.array(z.string().min(1).max(64)).max(8).default([]),
      }),
    )
    .max(12)
    .default([]),
  version: SemVerSchema.default('1.0.0'),
  onConflict: OnConflictSchema,
});

/* ── Misión 13 — Application & System generators ─────────────────────────── */

const ApiFieldInputSchema = z.object({
  name: z.string().regex(/^[a-zA-Z][a-zA-Z0-9_]{0,63}$/),
  type: z.enum(['string', 'number', 'boolean', 'object', 'array']),
  required: z.boolean().optional(),
  constraints: z
    .array(z.object({ kind: z.enum(['min', 'max', 'pattern', 'enum', 'maxLength']), value: z.union([z.string().max(200), z.number()]) }))
    .max(8)
    .default([]),
  description: z.string().max(200).optional(),
});

const ApiPlatformInputSchema = z.object({
  id: EntityIdSchema.optional(),
  name: z.string().min(1).max(110),
  description: z.string().max(500).optional(),
  auth: z.enum(['console-session', 'bearer', 'none']).default('console-session'),
  endpoints: z
    .array(
      z.object({
        id: EntityIdSchema,
        method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
        path: z.string().min(1).max(200),
        summary: z.string().min(1).max(200),
        request: z.array(ApiFieldInputSchema).max(16).default([]),
        response: z.array(ApiFieldInputSchema).max(16).default([]),
        errors: z.array(z.object({ status: z.number().int().min(400).max(599), code: z.string().min(1).max(60), when: z.string().max(160) })).max(6).default([]),
        rateLimit: z.object({ max: z.number().int().min(1).max(10_000), windowMs: z.number().int().min(1000).max(3_600_000) }).optional(),
        agentBinding: EntityIdSchema.optional(),
      }),
    )
    .min(1)
    .max(32),
  version: SemVerSchema.default('1.0.0'),
  onConflict: OnConflictSchema,
});

const ApplicationInputSchema = z.object({
  id: EntityIdSchema.optional(),
  name: z.string().min(1).max(110),
  description: z.string().max(500).optional(),
  entryModule: z.string().min(1).max(64),
  modules: z
    .array(
      z.object({
        ref: z.string().min(1).max(64),
        kind: z.enum(['api-platform', 'frontend', 'backend', 'config', 'library', 'agent-runtime']),
        description: z.string().max(200).optional(),
        componentRef: z.object({ kind: z.string().min(1).max(40), id: EntityIdSchema, version: SemVerSchema.optional() }).optional(),
        dependencies: z.array(z.string().min(1).max(64)).max(16).default([]),
      }),
    )
    .min(1)
    .max(24),
  envVarNames: z.array(z.string().regex(/^[A-Z][A-Z0-9_]{1,63}$/)).max(24).default([]),
  runtime: z.enum(['uiep-backend', 'static-www']).default('uiep-backend'),
  version: SemVerSchema.default('1.0.0'),
  onConflict: OnConflictSchema,
});

const AgenticAppInputSchema = z.object({
  id: EntityIdSchema.optional(),
  name: z.string().min(1).max(110),
  description: z.string().max(500).optional(),
  agents: z
    .array(
      z.object({
        agent: z.union([EntityIdSchema, z.object({ generate: z.record(z.string(), z.unknown()) })]),
        role: z.string().min(1).max(80),
      }),
    )
    .min(1)
    .max(12),
  workflows: z.array(EntityIdSchema).max(8).default([]),
  tools: z.array(EntityIdSchema).max(16).default([]),
  knowledge: z.array(z.object({ sourceId: EntityIdSchema, purpose: z.string().max(160).optional() })).max(8).default([]),
  surfaces: z
    .array(z.object({ type: z.enum(['console', 'http', 'mcp', 'workflow-engine']), note: z.string().max(160).optional() }))
    .min(1)
    .max(6),
  guardrails: z
    .object({
      maxIterations: z.number().int().min(1).max(16).optional(),
      approvalRequired: z.array(z.string().max(60)).max(8).default([]),
      notes: z.string().max(300).optional(),
    })
    .default({}),
  version: SemVerSchema.default('1.0.0'),
  onConflict: OnConflictSchema,
});

const SaasInputSchema = z.object({
  id: EntityIdSchema.optional(),
  name: z.string().min(1).max(110),
  description: z.string().max(500).optional(),
  entryModule: z.string().min(1).max(64),
  modules: z
    .array(
      z.object({
        ref: z.string().min(1).max(64),
        kind: z.enum(['api-platform', 'application', 'auth', 'billing-config', 'config', 'library', 'agent-runtime']),
        description: z.string().max(200).optional(),
        componentRef: z.object({ kind: z.string().min(1).max(40), id: EntityIdSchema, version: SemVerSchema.optional() }).optional(),
        dependencies: z.array(z.string().min(1).max(64)).max(16).default([]),
      }),
    )
    .min(1)
    .max(24),
  roles: z
    .array(z.object({ name: z.string().min(1).max(40), permissions: z.array(z.string().min(1).max(80)).max(16).default([]) }))
    .min(1)
    .max(8)
    .default([{ name: 'admin', permissions: [] }]),
  tenancy: z.enum(['single-tenant-prep', 'multi-tenant-ready']).default('multi-tenant-ready'),
  envVarNames: z.array(z.string().regex(/^[A-Z][A-Z0-9_]{1,63}$/)).max(24).default([]),
  version: SemVerSchema.default('1.0.0'),
  onConflict: OnConflictSchema,
});

/* ── Implementación de los generadores ───────────────────────────────────── */

async function resolveComponentRef(kind: string, id: string): Promise<{ found: boolean; registeredVersion?: string; store: 'specs' | 'engineering' }> {
  const engineeringKinds = new Set([
    'PromptSystem',
    'SkillPack',
    'McpServerManifest',
    'ToolCollection',
    'RagSystem',
    'KnowledgeBase',
    'MultiAgentSystem',
    'EvaluationDataset',
    'Harness',
    'Framework',
    'ApiPlatform',
    'Application',
    'AgenticApp',
    'Saas',
  ]);
  if (engineeringKinds.has(kind)) {
    const doc = await getLatestArtifact(kind, id);
    return doc ? { found: true, registeredVersion: (doc as { metadata?: { version?: string } }).metadata?.version, store: 'engineering' } : { found: false, store: 'engineering' };
  }
  const spec = await getLatestSpec(id);
  return spec && (spec as { kind?: string }).kind === kind
    ? { found: true, registeredVersion: spec.metadata.version, store: 'specs' }
    : { found: false, store: 'specs' };
}

function withMeta(apiVersion: string, kind: string, id: string, name: string, version: string, description: string, spec: unknown): Record<string, unknown> {
  return { apiVersion, kind, metadata: { id, name, version, description }, spec };
}

/* ── M13: validación compartida de módulos (application/saas/framework) ──── */

interface ModuleLike {
  ref?: string;
  id?: string;
  componentRef?: { kind: string; id: string; version?: string };
  components?: Array<{ type: string; ref: { kind: string; id: string; version?: string } }>;
  dependencies: string[];
}

/** Verifica TODAS las componentRefs contra los almacenes reales, la existencia
 *  de dependencias y la ACICLICIDAD del grafo de módulos. Fail-closed. */
async function validateModuleGraph(
  modules: ModuleLike[],
  errs: Record<string, string[]>,
): Promise<void> {
  let n = 0;
  for (const m of modules) {
    const key = m.ref ?? m.id ?? `modulo-${n++}`;
    for (const comp of m.components ?? [{ type: 'component', ref: m.componentRef ?? { kind: '', id: '' } }]) {
      if (!comp.ref?.kind) {
        continue; // módulo sin componentRef (p. ej. config) — permitido
      }
      const resolved = await resolveComponentRef(comp.ref.kind, comp.ref.id);
      if (!resolved.found) {
        (errs.modules ??= []).push(`'${key}': componente inexistente → ${comp.ref.kind} '${comp.ref.id}'`);
      }
    }
    for (const dep of m.dependencies) {
      if (!modules.some((x) => (x.ref ?? x.id) === dep)) {
        (errs.modules ??= []).push(`'${key}': dependencia inexistente '${dep}'`);
      }
    }
  }
  const edges = modules.map((m) => ({ ref: m.ref ?? m.id ?? '', dependencies: m.dependencies.map((ref) => ({ ref, required: true })) }));
  const topo = topologicalOrder(edges);
  if (!topo.ok) {
    (errs.modules ??= []).push(`grafo de módulos con ciclo: ${topo.cycle.join(' → ')}`);
  }
}

/** Resuelve las versiones registradas de las componentRefs para el doc final. */
async function resolveModuleVersions(modules: ModuleLike[]): Promise<Array<Record<string, unknown>>> {
  const out: Array<Record<string, unknown>> = [];
  for (const m of modules) {
    const comp = m.components?.[0];
    const cr = m.componentRef ?? (comp ? { kind: comp.ref.kind, id: comp.ref.id } : undefined);
    let registeredVersion: string | undefined;
    if (cr) {
      const resolved = await resolveComponentRef(cr.kind, cr.id);
      registeredVersion = resolved.registeredVersion;
    }
    out.push({
      ...m,
      ...(m.componentRef ? { componentRef: { ...m.componentRef, ...(registeredVersion ? { registeredVersion } : {}) } } : {}),
    });
  }
  return out;
}

function buildPromptSystemDoc(input: z.infer<typeof PromptSysInputSchema>): { ok: true; doc: Record<string, unknown> } | GeneratorError {
  const prompts = input.prompts.map((p) => ({
    id: slugify(p.name),
    name: p.name,
    ...(p.description === undefined ? {} : { description: p.description }),
    template: p.template,
    variables: p.variables.map((v) => ({
      name: v.name,
      type: v.type,
      required: v.required ?? true,
      ...(v.default === undefined ? {} : { default: v.default }),
    })),
  }));
  const byName = new Map(input.prompts.map((p, i) => [p.name, prompts[i].id]));
  const seen = new Set<string>();
  for (const p of prompts) {
    if (seen.has(p.id)) {
      return { ok: false, status: 400, errors: { prompts: [`nombre de prompt produce id duplicado: '${p.id}' (renombrar '${p.name}')`] } };
    }
    seen.add(p.id);
  }
  const compositions = input.compositions.map((c, i) => ({
    id: c.id ?? `composicion-${i + 1}`,
    steps: c.steps.map((s) => {
      const promptId = byName.get(s.prompt);
      if (!promptId) {
        return { promptId: null, inputs: s.inputs };
      }
      return { promptId, inputs: s.inputs };
    }),
  }));
  for (const c of compositions) {
    if (c.steps.some((s) => s.promptId === null)) {
      return { ok: false, status: 400, errors: { compositions: [`composición referencia un prompt inexistente (usa un nombre declarado)`] } };
    }
  }
  const id = input.id ?? slugify(input.name);
  if (!EntityIdSchema.safeParse(id).success) {
    return { ok: false, status: 400, errors: { id: [`id derivado de '${input.name}' no es válido`] } };
  }
  const doc = withMeta(API_VERSION, 'PromptSystem', id, input.name, input.version, 'Sistema de prompts versionado generado por UIEP (Misión 12).', {
    prompts,
    compositions: compositions.map((c) => ({ id: c.id, steps: c.steps })),
  });
  return { ok: true, doc };
}

function buildToolCollectionDoc(input: z.infer<typeof ToolCollectionInputSchema>): { ok: true; doc: Record<string, unknown> } | GeneratorError {
  const seen = new Set<string>();
  for (const t of input.tools) {
    if (seen.has(t.toolId)) {
      return { ok: false, status: 400, errors: { tools: [`tool duplicada en la colección: '${t.toolId}'`] } };
    }
    seen.add(t.toolId);
  }
  const id = input.id ?? slugify(input.name);
  if (!EntityIdSchema.safeParse(id).success) {
    return { ok: false, status: 400, errors: { id: [`id derivado de '${input.name}' no es válido`] } };
  }
  const doc = withMeta(API_VERSION, 'ToolCollection', id, input.name, input.version, 'Colección de herramientas registradas (solo tools existentes).', {
    tools: input.tools.map((t) => ({
      toolId: t.toolId,
      permissions: t.permissions ?? [],
      ...(t.policy === undefined ? {} : { policy: t.policy }),
    })),
    ...(input.notes === undefined ? {} : { notes: input.notes }),
  });
  return { ok: true, doc };
}

function buildSkillPackDoc(input: z.infer<typeof SkillPackInputSchema>): { ok: true; doc: Record<string, unknown> } | GeneratorError {
  const skills = input.skills.map((s) => ({
    id: slugify(s.id),
    name: s.id,
    description: s.description,
    instructions: s.instructions,
    inputs: s.inputs,
    outputs: s.outputs,
    dependencies: [],
  }));
  const seen = new Set<string>();
  for (const s of skills) {
    if (seen.has(s.id)) {
      return { ok: false, status: 400, errors: { skills: [`skill duplicada: '${s.id}'`] } };
    }
    seen.add(s.id);
  }
  const id = input.id ?? slugify(input.name);
  if (!EntityIdSchema.safeParse(id).success) {
    return { ok: false, status: 400, errors: { id: [`id derivado de '${input.name}' no es válido`] } };
  }
  const doc = withMeta(API_VERSION, 'SkillPack', id, input.name, input.version, 'Pack de skills versionadas (instrucciones + contratos de E/S).', {
    skills,
    ...(input.compatibility === undefined ? {} : { compatibility: { notes: input.compatibility } }),
  });
  return { ok: true, doc };
}

function buildEvaluationDoc(input: z.infer<typeof EvaluationInputSchema>): { ok: true; doc: Record<string, unknown> } | GeneratorError {
  const id = input.id ?? slugify(input.name);
  if (!EntityIdSchema.safeParse(id).success) {
    return { ok: false, status: 400, errors: { id: [`id derivado de '${input.name}' no es válido`] } };
  }
  const doc = withMeta(API_VERSION, 'EvaluationDataset', id, input.name, input.version, 'Dataset de evaluación (formato corpus uiep-rag-corpus-v1).', {
    cases: input.cases.map((c, i) => ({ id: `caso-${i + 1}`, query: c.query, expected: c.expected, refs: c.refs })),
    metrics: ['recall', 'precision', 'mrr'],
    thresholds: input.thresholds ?? {},
  });
  return { ok: true, doc };
}

async function buildMcpManifestDoc(input: z.infer<typeof McpServerInputSchema>): Promise<{ ok: true; doc: Record<string, unknown> } | GeneratorError> {
  const tools: Array<{ name: string; sourceToolId: string; description?: string; exposed: boolean }> = [];
  const seen = new Set<string>();
  for (const toolId of input.tools) {
    const spec = await getToolSpec(toolId);
    if (!spec) {
      return { ok: false, status: 400, errors: { tools: [`herramienta no registrada: '${toolId}'`] } };
    }
    const mcpName = slugify(toolId);
    if (!/^[a-z0-9_-]{1,64}$/.test(mcpName) || seen.has(mcpName)) {
      return { ok: false, status: 400, errors: { tools: [`nombre MCP no válido o duplicado para '${toolId}': '${mcpName}'`] } };
    }
    seen.add(mcpName);
    tools.push({ name: mcpName, sourceToolId: toolId, description: String((spec.spec as { description?: string }).description ?? '').slice(0, 200) || undefined, exposed: true });
  }
  const doc = withMeta(API_VERSION, 'McpServerManifest', input.serverId, input.name, input.version, 'Manifiesto MCP (no desplegado — exportación para uso externo).', {
    serverId: input.serverId,
    transport: 'http-json-rpc',
    tools: tools.map((t) => ({ ...t, description: t.description ?? '' })),
    resources: input.resources,
    prompts: input.prompts,
  });
  return { ok: true, doc };
}

/* ── Catálogo de generadores ─────────────────────────────────────────────── */

const GENERATORS: Record<string, GeneratorModule> = {
  agent: {
    type: 'agent',
    label: 'AgentSpec ejecutable',
    docKind: 'Agent',
    outStore: 'specs',
    inputShape: "{ name, role, objective, system, profile?, tools?, knowledge?, memory?, maxIterations?, version?, onConflict? }",
    async validate(input) {
      const parsed = parseErr(AgentGenInputSchema, input);
      if (!parsed.ok) {
        return parsed;
      }
      const built = await buildAgentSpec(parsed.data);
      if (!built.ok) {
        return built;
      }
      return { ok: true, checks: [{ name: 'schema', passed: true }, { name: 'references', passed: true }] };
    },
    async generate(input) {
      const parsed = parseErr(AgentGenInputSchema, input);
      if (!parsed.ok) {
        return parsed;
      }
      const built = await buildAgentSpec(parsed.data);
      if (!built.ok) {
        return built;
      }
      const up = await upsertRuntimeSpec(built.doc, parsed.data.onConflict);
      if (!up.ok) {
        return up;
      }
      if (parsed.data.knowledge.length > 0) {
        const current = await getBindings();
        const merged = new Set(current[built.id] ?? []);
        for (const sourceId of parsed.data.knowledge) {
          merged.add(sourceId);
        }
        await setBindingsForAgent(built.id, [...merged]);
      }
      return {
        ok: true,
        outcome: { store: 'specs', specKind: 'Agent', id: up.id, version: up.version },
        reused: up.reused,
        warnings: [],
        docHash: fingerprintOf(up.finalDoc),
      };
    },
  },
  workflow: {
    type: 'workflow',
    label: 'WorkflowSpec ejecutable (DAG validado)',
    docKind: 'Workflow',
    outStore: 'specs',
    inputShape: '{ name, steps: [{ agent, input?, retries? }], branches?: [{ after, op, value, then, else }], version?, onConflict? }',
    async validate(input) {
      const parsed = parseErr(WorkflowGenInputSchema, input);
      if (!parsed.ok) {
        return parsed;
      }
      const built = await buildWorkflowSpec(parsed.data);
      if (!built.ok) {
        return built;
      }
      return { ok: true, checks: [{ name: 'schema', passed: true }, { name: 'structure', passed: true }] };
    },
    async generate(input) {
      const parsed = parseErr(WorkflowGenInputSchema, input);
      if (!parsed.ok) {
        return parsed;
      }
      const built = await buildWorkflowSpec(parsed.data);
      if (!built.ok) {
        return built;
      }
      const up = await upsertRuntimeSpec(built.doc, parsed.data.onConflict);
      if (!up.ok) {
        return up;
      }
      return {
        ok: true,
        outcome: { store: 'specs', specKind: 'Workflow', id: up.id, version: up.version },
        reused: up.reused,
        warnings: built.warnings,
        docHash: fingerprintOf(up.finalDoc),
      };
    },
  },
  'multi-agent-system': {
    type: 'multi-agent-system',
    label: 'Sistema multiagente (workflow de coordinación + registro del sistema)',
    docKind: 'MultiAgentSystem',
    outStore: 'engineering',
    inputShape: '{ name, members: [{ agent: id | { generate: {...agentInput} }, role, responsibilities? }], style?, sharedMemory?, version?, onConflict? }',
    async validate(input) {
      const parsed = parseErr(MultiAgentInputSchema, input);
      if (!parsed.ok) {
        return parsed;
      }
      for (const member of parsed.data.members) {
        if (typeof member.agent === 'string') {
          const envelope = await getLatestSpec(member.agent);
          if (!envelope || (envelope as { kind?: string }).kind !== 'Agent') {
            return { ok: false, status: 400, errors: { members: [`agente inexistente: '${member.agent}' (o declara generate para crearlo en la misma generación)`] } };
          }
        }
      }
      return { ok: true, checks: [{ name: 'schema', passed: true }, { name: 'references', passed: true }] };
    },
    async generate(input) {
      const parsed = parseErr(MultiAgentInputSchema, input);
      if (!parsed.ok) {
        return parsed;
      }
      const warnings: string[] = [];
      const resolved: ResolvedMember[] = [];
      const childIds: string[] = [];
      for (const member of parsed.data.members) {
        if (typeof member.agent === 'string') {
          const envelope = await getLatestSpec(member.agent);
          if (!envelope || (envelope as { kind?: string }).kind !== 'Agent') {
            return { ok: false, status: 400, errors: { members: [`agente inexistente: '${member.agent}'`] } };
          }
          resolved.push({ agentSpecId: member.agent, role: member.role, ...(member.responsibilities === undefined ? {} : { responsibilities: member.responsibilities }) });
        } else {
          const child = await runGeneration('agent', member.agent.generate, { queue: false });
          if (!child.ok) {
            return { ok: false, status: child.status === 400 ? 400 : 409, errors: { members: [`subgeneración de agente falló: ${JSON.stringify(child.errors).slice(0, 200)}`] } };
          }
          childIds.push(child.generationId);
          resolved.push({ agentSpecId: (child.outcome as { id: string }).id, role: member.role, ...(member.responsibilities === undefined ? {} : { responsibilities: member.responsibilities }) });
        }
      }
      // Workflow de coordinación REAL (el runtime lo ejecuta).
      const wfName = `${parsed.data.name} — coordinación`;
      const wfId = `${slugify(parsed.data.name) || 'sistema'}-coordinacion`.slice(0, 63);
      const generateSteps = async (): Promise<GeneratorGenerateResult> => {
        let nodes: WfNode[];
        if (parsed.data.style === 'pipeline') {
          nodes = resolved.map((m, i) => ({
            id: `paso-${i + 1}`,
            type: 'agent',
            agentSpecId: m.agentSpecId,
            input: i === 0 ? '{{input}}' : `Entrada previa: {{prev}}. Rol: ${m.role}. ${m.responsibilities ?? ''}`.slice(0, 2000),
            retries: 1,
          }));
        } else {
          warnings.push('estilo orchestrator: el primer miembro planifica y los siguientes ejecutan por orden (orquestación secuencial, sin paralelismo); composiciones complejas → workflow-generator con ramas');
          nodes = [];
          resolved.forEach((m, i) => {
            if (i === 0) {
              nodes.push({ id: 'orquestador', type: 'agent', agentSpecId: m.agentSpecId, input: 'Planifica la tarea para los roles siguientes: {{input}}', retries: 1 });
            } else {
              nodes.push({
                id: `especialista-${i}`,
                type: 'agent',
                agentSpecId: m.agentSpecId,
                input: `Plan del orquestador: {{prev}}. Rol: ${m.role}. ${m.responsibilities ?? ''}`.slice(0, 2000),
                retries: 1,
              });
            }
          });
        }
        const doc = {
          apiVersion: API_VERSION,
          kind: 'Workflow',
          metadata: { id: wfId, name: wfName, version: parsed.data.version, description: 'Workflow de coordinación de sistema multiagente (Misión 12).' },
          spec: { start: String(nodes[0].id), nodes },
        };
        const struct = validateWorkflowStructure({ spec: { start: String(nodes[0].id), nodes: nodes as never } });
        if (!struct.ok) {
          return { ok: false, status: 400, errors: { structure: struct.errors.slice(0, 6) } };
        }
        const up = await upsertRuntimeSpec(doc, parsed.data.onConflict);
        if (!up.ok) {
          return up;
        }
        return { ok: true, outcome: { store: 'specs', specKind: 'Workflow', id: up.id, version: up.version }, reused: up.reused, warnings, docHash: fingerprintOf(up.finalDoc) };
      };
      const wf = await generateSteps();
      if (!wf.ok) {
        return wf as GeneratorError;
      }
      const systemId = parsed.data.id ?? slugify(parsed.data.name);
      if (!EntityIdSchema.safeParse(systemId).success) {
        return { ok: false, status: 400, errors: { id: [`id derivado de '${parsed.data.name}' no es válido`] } };
      }
      const doc = withMeta(API_VERSION, 'MultiAgentSystem', systemId, parsed.data.name, parsed.data.version, 'Sistema multiagente registrado (workflow de coordinación real + roles).', {
        coordinationWorkflowId: (wf.outcome as { id: string }).id,
        style: parsed.data.style,
        members: resolved.map((m) => ({ agentSpecId: m.agentSpecId, role: m.role, ...(m.responsibilities === undefined ? {} : { responsibilities: m.responsibilities }) })),
        sharedMemory: parsed.data.sharedMemory,
      });
      const mart = await upsertEngineeringArtifact(doc, parsed.data.onConflict);
      if (!mart.ok) {
        return mart;
      }
      return {
        ok: true,
        outcome: { store: 'engineering', artifactKind: 'MultiAgentSystem', id: mart.id, version: mart.version },
        extraOutcomes: [wf.outcome],
        reused: mart.reused && wf.reused,
        warnings,
        docHash: fingerprintOf(mart.finalDoc),
        ...(childIds.length > 0 ? { childGenerationIds: childIds } : {}),
      } as GeneratorGenerateResult & { childGenerationIds?: string[] };
    },
  },
  'prompt-system': {
    type: 'prompt-system',
    label: 'Sistema de prompts versionados',
    docKind: 'PromptSystem',
    outStore: 'engineering',
    inputShape: '{ name, prompts: [{ name, description?, template, variables? }], compositions?: ... }',
    async validate(input) {
      const parsed = parseErr(PromptSysInputSchema, input);
      if (!parsed.ok) {
        return parsed;
      }
      const built = buildPromptSystemDoc(parsed.data);
      if (!built.ok) {
        return built;
      }
      return { ok: true, checks: [{ name: 'schema', passed: true }] };
    },
    async generate(input) {
      const parsed = parseErr(PromptSysInputSchema, input);
      if (!parsed.ok) {
        return parsed;
      }
      const built = buildPromptSystemDoc(parsed.data);
      if (!built.ok) {
        return built;
      }
      const up = await upsertEngineeringArtifact(built.doc, parsed.data.onConflict);
      if (!up.ok) {
        return up;
      }
      return {
        ok: true,
        outcome: { store: 'engineering', artifactKind: 'PromptSystem', id: up.id, version: up.version },
        reused: up.reused,
        warnings: [],
        docHash: fingerprintOf(up.finalDoc),
      };
    },
  },
  'tool-collection': {
    type: 'tool-collection',
    label: 'Colección de herramientas (solo tools registradas)',
    docKind: 'ToolCollection',
    outStore: 'engineering',
    inputShape: '{ name, tools: [{ toolId, permissions?, policy? }], notes? }',
    async validate(input) {
      const parsed = parseErr(ToolCollectionInputSchema, input);
      if (!parsed.ok) {
        return parsed;
      }
      for (const t of parsed.data.tools) {
        if (!(await getToolSpec(t.toolId))) {
          return { ok: false, status: 400, errors: { tools: [`herramienta no registrada: '${t.toolId}'`] } };
        }
      }
      const built = buildToolCollectionDoc(parsed.data);
      if (!built.ok) {
        return built;
      }
      return { ok: true, checks: [{ name: 'schema', passed: true }] };
    },
    async generate(input) {
      const parsed = parseErr(ToolCollectionInputSchema, input);
      if (!parsed.ok) {
        return parsed;
      }
      for (const t of parsed.data.tools) {
        if (!(await getToolSpec(t.toolId))) {
          return { ok: false, status: 400, errors: { tools: [`herramienta no registrada: '${t.toolId}'`] } };
        }
      }
      const built = buildToolCollectionDoc(parsed.data);
      if (!built.ok) {
        return built;
      }
      const up = await upsertEngineeringArtifact(built.doc, parsed.data.onConflict);
      if (!up.ok) {
        return up;
      }
      return {
        ok: true,
        outcome: { store: 'engineering', artifactKind: 'ToolCollection', id: up.id, version: up.version },
        reused: up.reused,
        warnings: [],
        docHash: fingerprintOf(up.finalDoc),
      };
    },
  },
  'knowledge-base': {
    type: 'knowledge-base',
    label: 'Conocimiento real (creación/ingesta/bindings) registrado',
    docKind: 'KnowledgeBase',
    outStore: 'engineering',
    inputShape: '{ name, sources: [{ title, text }], bindings?: [{ agent, sourceTitles }], notes? }',
    async validate(input) {
      const parsed = parseErr(KnowledgeBaseInputSchema, input);
      if (!parsed.ok) {
        return parsed;
      }
      const titles = new Set<string>();
      for (const s of parsed.data.sources) {
        if (titles.has(s.title)) {
          return { ok: false, status: 400, errors: { sources: [`título duplicado: '${s.title}'`] } };
        }
        titles.add(s.title);
      }
      for (const bind of parsed.data.bindings) {
        const envelope = await getLatestSpec(bind.agent);
        if (!envelope || (envelope as { kind?: string }).kind !== 'Agent') {
          return { ok: false, status: 400, errors: { bindings: [`agente inexistente: '${bind.agent}'`] } };
        }
        for (const t of bind.sourceTitles) {
          if (!titles.has(t)) {
            return { ok: false, status: 400, errors: { bindings: [`binding a fuente no declarada: '${t}'`] } };
          }
        }
      }
      return { ok: true, checks: [{ name: 'schema', passed: true }, { name: 'agents', passed: true }] };
    },
    async generate(input) {
      const parsed = parseErr(KnowledgeBaseInputSchema, input);
      if (!parsed.ok) {
        return parsed;
      }
      const warnings: string[] = [];
      const installed: Array<{ sourceId: string; title: string }> = [];
      for (const s of parsed.data.sources) {
        const existing = (await listSources()).find((x) => x.title === s.title);
        if (existing) {
          const sourceKinds = existing as unknown as { state?: string };
          if (sourceKinds.state !== 'ingested') {
            await ingestSource(existing.sourceId);
          }
          installed.push({ sourceId: existing.sourceId, title: existing.title });
          continue;
        }
        const created = await createSource({ type: 'text', title: s.title, text: s.text });
        if (!created.ok) {
          const why = (created as { message?: string; reason?: string }).message ?? (created as { reason?: string }).reason ?? 'razón desconocida';
          return { ok: false, status: 400, code: 'generation_failed', errors: { sources: [`no se pudo crear la fuente '${s.title}': ${why}`] } };
        }
        const ingested = await ingestSource(created.source.sourceId);
        if (!ingested.ok && (ingested as { reason?: string }).reason !== 'invalid_state') {
          const retry = await ingestSource(created.source.sourceId);
          if (!retry.ok) {
            return { ok: false, status: 409, code: 'generation_failed', errors: { sources: [`la ingesta falló para '${s.title}'`] } };
          }
        }
        installed.push({ sourceId: created.source.sourceId, title: s.title });
      }
      const bindings: Array<{ agentSpecId: string; sourceIds: string[] }> = [];
      for (const bind of parsed.data.bindings) {
        const current = await getBindings();
        const merged = new Set(current[bind.agent] ?? []);
        for (const t of bind.sourceTitles) {
          const found = installed.find((x) => x.title === t);
          if (found) {
            merged.add(found.sourceId);
          }
        }
        const list = [...merged];
        await setBindingsForAgent(bind.agent, list);
        bindings.push({ agentSpecId: bind.agent, sourceIds: list });
      }
      const id = parsed.data.id ?? slugify(parsed.data.name);
      if (!EntityIdSchema.safeParse(id).success) {
        return { ok: false, status: 400, errors: { id: [`id derivado no válido: '${id}'`] } };
      }
      const doc = withMeta(API_VERSION, 'KnowledgeBase', id, parsed.data.name, parsed.data.version, 'Conocimiento instalado con bindings verificados (servicio real).', {
        sources: installed,
        bindings,
        ...(parsed.data.notes === undefined ? {} : { notes: parsed.data.notes }),
      });
      const up = await upsertEngineeringArtifact(doc, parsed.data.onConflict);
      if (!up.ok) {
        return up;
      }
      return {
        ok: true,
        outcome: { store: 'engineering', artifactKind: 'KnowledgeBase', id: up.id, version: up.version },
        reused: up.reused,
        warnings,
        docHash: fingerprintOf(up.finalDoc),
      };
    },
  },
  'rag-system': {
    type: 'rag-system',
    label: 'Configuración del pipeline RAG verificada (bindings + umbral declarado)',
    docKind: 'RagSystem',
    outStore: 'engineering',
    inputShape: '{ name, agents: [ids], bindings?: [{ agent, sourceIds }], minScore?, topK?, citationsFormat?, thresholds? }',
    async validate(input) {
      const parsed = parseErr(RagSystemInputSchema, input);
      if (!parsed.ok) {
        return parsed;
      }
      const refErr = await validateRagReferences(parsed.data);
      if (refErr) {
        return refErr;
      }
      return { ok: true, checks: [{ name: 'schema', passed: true }, { name: 'references', passed: true }] };
    },
    async generate(input) {
      const parsed = parseErr(RagSystemInputSchema, input);
      if (!parsed.ok) {
        return parsed;
      }
      const refErr = await validateRagReferences(parsed.data);
      if (refErr) {
        return refErr;
      }
      const warnings: string[] = [];
      if (parsed.data.minScore !== undefined && parsed.data.minScore < 0.7) {
        warnings.push(`minScore declarado ${parsed.data.minScore} < 0.70: el GATE runtime manda (env KNOWLEDGE_RETRIEVAL_MIN_SCORE, intocable) — el valor declarado queda como documentación`);
      }
      const bindings: Array<{ agentSpecId: string; sourceIds: string[] }> = [];
      const current = await getBindings();
      for (const bind of parsed.data.bindings) {
        const merged = new Set([...(current[bind.agent] ?? []), ...bind.sourceIds]);
        await setBindingsForAgent(bind.agent, [...merged]);
        bindings.push({ agentSpecId: bind.agent, sourceIds: [...merged] });
      }
      const id = parsed.data.id ?? slugify(parsed.data.name);
      if (!EntityIdSchema.safeParse(id).success) {
        return { ok: false, status: 400, errors: { id: [`id derivado no válido: '${id}'`] } };
      }
      const doc = withMeta(API_VERSION, 'RagSystem', id, parsed.data.name, parsed.data.version, 'Configuración declarativa del pipeline RAG (recordatorio: el umbral EFECTIVO lo posee el runtime).', {
        bindings,
        retrieval: { minScore: parsed.data.minScore ?? 0.7, topK: parsed.data.topK ?? 4 },
        citations: { format: parsed.data.citationsFormat ?? '[n]' },
        ...(parsed.data.thresholds === undefined ? {} : { evaluation: { thresholds: parsed.data.thresholds } }),
      });
      const up = await upsertEngineeringArtifact(doc, parsed.data.onConflict);
      if (!up.ok) {
        return up;
      }
      return {
        ok: true,
        outcome: { store: 'engineering', artifactKind: 'RagSystem', id: up.id, version: up.version },
        reused: up.reused,
        warnings,
        docHash: fingerprintOf(up.finalDoc),
      };
    },
  },
  'mcp-server': {
    type: 'mcp-server',
    label: 'Manifiesto MCP (no desplegado — exportación)',
    docKind: 'McpServerManifest',
    outStore: 'engineering',
    inputShape: '{ serverId, name, tools: [toolIds], prompts?, resources? }',
    async validate(input) {
      const parsed = parseErr(McpServerInputSchema, input);
      if (!parsed.ok) {
        return parsed;
      }
      for (const toolId of parsed.data.tools) {
        if (!(await getToolSpec(toolId))) {
          return { ok: false, status: 400, errors: { tools: [`herramienta no registrada: '${toolId}'`] } };
        }
      }
      const built = await buildMcpManifestDoc(parsed.data);
      if (!built.ok) {
        return built;
      }
      return { ok: true, checks: [{ name: 'schema', passed: true }, { name: 'tools', passed: true }] };
    },
    async generate(input) {
      const parsed = parseErr(McpServerInputSchema, input);
      if (!parsed.ok) {
        return parsed;
      }
      const built = await buildMcpManifestDoc(parsed.data);
      if (!built.ok) {
        return built;
      }
      const up = await upsertEngineeringArtifact(built.doc, parsed.data.onConflict);
      if (!up.ok) {
        return up;
      }
      return {
        ok: true,
        outcome: { store: 'engineering', artifactKind: 'McpServerManifest', id: up.id, version: up.version },
        reused: up.reused,
        warnings: ['el manifiesto NO se despliega ni expone — exportar y usar externamente (M14 pondrá sandbox)'],
        docHash: fingerprintOf(up.finalDoc),
      };
    },
  },
  'skill-pack': {
    type: 'skill-pack',
    label: 'Pack de skills versionadas',
    docKind: 'SkillPack',
    outStore: 'engineering',
    inputShape: '{ name, skills: [{ id, description, instructions, inputs?, outputs? }], compatibility? }',
    async validate(input) {
      const parsed = parseErr(SkillPackInputSchema, input);
      if (!parsed.ok) {
        return parsed;
      }
      const built = buildSkillPackDoc(parsed.data);
      if (!built.ok) {
        return built;
      }
      return { ok: true, checks: [{ name: 'schema', passed: true }] };
    },
    async generate(input) {
      const parsed = parseErr(SkillPackInputSchema, input);
      if (!parsed.ok) {
        return parsed;
      }
      const built = buildSkillPackDoc(parsed.data);
      if (!built.ok) {
        return built;
      }
      const up = await upsertEngineeringArtifact(built.doc, parsed.data.onConflict);
      if (!up.ok) {
        return up;
      }
      return {
        ok: true,
        outcome: { store: 'engineering', artifactKind: 'SkillPack', id: up.id, version: up.version },
        reused: up.reused,
        warnings: [],
        docHash: fingerprintOf(up.finalDoc),
      };
    },
  },
  evaluation: {
    type: 'evaluation',
    label: 'Dataset de evaluación (formato corpus uiep-rag-corpus-v1)',
    docKind: 'EvaluationDataset',
    outStore: 'engineering',
    inputShape: '{ name, cases: [{ query, expected, refs? }], thresholds? }',
    async validate(input) {
      const parsed = parseErr(EvaluationInputSchema, input);
      if (!parsed.ok) {
        return parsed;
      }
      const built = buildEvaluationDoc(parsed.data);
      if (!built.ok) {
        return built;
      }
      return { ok: true, checks: [{ name: 'schema', passed: true }] };
    },
    async generate(input) {
      const parsed = parseErr(EvaluationInputSchema, input);
      if (!parsed.ok) {
        return parsed;
      }
      const built = buildEvaluationDoc(parsed.data);
      if (!built.ok) {
        return built;
      }
      const up = await upsertEngineeringArtifact(built.doc, parsed.data.onConflict);
      if (!up.ok) {
        return up;
      }
      return {
        ok: true,
        outcome: { store: 'engineering', artifactKind: 'EvaluationDataset', id: up.id, version: up.version },
        reused: up.reused,
        warnings: ['la EJECUCIÓN de la evaluación sigue en el runner eval:rag (cableado completo → M14); el dataset es consumible por el formato corpus v1'],
        docHash: fingerprintOf(up.finalDoc),
      };
    },
  },
  harness: {
    type: 'harness',
    label: 'Entorno de pruebas (fixtures + límites; ejecución → M14)',
    docKind: 'Harness',
    outStore: 'engineering',
    inputShape: '{ name, targets: [ids], allowedTools?, limits?, fixtures?, testCases?: [{ dataset?, description? }] }',
    async validate(input) {
      const parsed = parseErr(HarnessInputSchema, input);
      if (!parsed.ok) {
        return parsed;
      }
      const refErr = await validateHarnessReferences(parsed.data);
      if (refErr) {
        return refErr;
      }
      return { ok: true, checks: [{ name: 'schema', passed: true }, { name: 'references', passed: true }] };
    },
    async generate(input) {
      const parsed = parseErr(HarnessInputSchema, input);
      if (!parsed.ok) {
        return parsed;
      }
      const refErr = await validateHarnessReferences(parsed.data);
      if (refErr) {
        return refErr;
      }
      const id = parsed.data.id ?? slugify(parsed.data.name);
      if (!EntityIdSchema.safeParse(id).success) {
        return { ok: false, status: 400, errors: { id: [`id derivado no válido: '${id}'`] } };
      }
      const doc = withMeta(API_VERSION, 'Harness', id, parsed.data.name, parsed.data.version, 'Entorno de pruebas registrado (ejecución en M14 con sandbox).', {
        targetRefs: parsed.data.targets,
        allowedTools: parsed.data.allowedTools,
        limits: parsed.data.limits,
        fixtures: parsed.data.fixtures,
        testCases: parsed.data.testCases.map((tc, i) => ({
          id: `caja-${i + 1}`,
          ...(tc.dataset ? { datasetRef: tc.dataset } : {}),
        })),
      });
      const up = await upsertEngineeringArtifact(doc, parsed.data.onConflict);
      if (!up.ok) {
        return up;
      }
      return {
        ok: true,
        outcome: { store: 'engineering', artifactKind: 'Harness', id: up.id, version: up.version },
        reused: up.reused,
        warnings: ['la ejecución del harness requiere el sandbox de M14 — hoy SOLO se registra y exporta'],
        docHash: fingerprintOf(up.finalDoc),
      };
    },
  },
  framework: {
    type: 'framework',
    label: 'Framework (composición verificada + puntos de extensión)',
    docKind: 'Framework',
    outStore: 'engineering',
    inputShape: '{ name, description?, conventions?, components: [{ type, ref: { id, kind, version? }, use? }], extensionPoints? }',
    async validate(input) {
      const parsed = parseErr(FrameworkInputSchema, input);
      if (!parsed.ok) {
        return parsed;
      }
      const refErr = await validateFrameworkComponents(parsed.data);
      if (refErr) {
        return refErr;
      }
      return { ok: true, checks: [{ name: 'schema', passed: true }, { name: 'components', passed: true }] };
    },
    async generate(input) {
      const parsed = parseErr(FrameworkInputSchema, input);
      if (!parsed.ok) {
        return parsed;
      }
      const refErr = await validateFrameworkComponents(parsed.data);
      if (refErr) {
        return refErr;
      }
      const components: Array<{ type: string; ref: unknown; registeredVersion?: string; use?: string }> = [];
      for (const comp of parsed.data.components) {
        const resolved = await resolveComponentRef(comp.ref.kind, comp.ref.id);
        components.push({
          type: comp.type,
          ref: { id: comp.ref.id, kind: comp.ref.kind, ...(comp.ref.version === undefined ? {} : { version: comp.ref.version }) },
          registeredVersion: resolved.registeredVersion,
          ...(comp.use === undefined ? {} : { use: comp.use }),
        });
      }
      const id = parsed.data.id ?? slugify(parsed.data.name);
      if (!EntityIdSchema.safeParse(id).success) {
        return { ok: false, status: 400, errors: { id: [`id derivado no válido: '${id}'`] } };
      }
      const doc = withMeta(API_VERSION, 'Framework', id, parsed.data.name, parsed.data.version, 'Framework registrado: composición de componentes YA existentes (verificados) + extension points.', {
        ...(parsed.data.description === undefined ? {} : { description: parsed.data.description }),
        ...(parsed.data.conventions === undefined ? {} : { conventions: parsed.data.conventions }),
        components,
        extensionPoints: parsed.data.extensionPoints,
        // M13: módulos con versiones registradas resueltas.
        modules: await (async () => {
          const resolved: Array<Record<string, unknown>> = [];
          for (const m of parsed.data.modules) {
            const comps: Array<Record<string, unknown>> = [];
            for (const c of m.components) {
              const r = await resolveComponentRef(c.ref.kind, c.ref.id);
              comps.push({
                type: c.type,
                ref: { id: c.ref.id, kind: c.ref.kind, ...(c.ref.version === undefined ? {} : { version: c.ref.version }) },
                registeredVersion: r.registeredVersion,
                ...(c.use === undefined ? {} : { use: c.use }),
              });
            }
            resolved.push({ id: m.id, ...(m.description === undefined ? {} : { description: m.description }), components: comps, dependencies: m.dependencies });
          }
          return resolved;
        })(),
      });
      const up = await upsertEngineeringArtifact(doc, parsed.data.onConflict);
      if (!up.ok) {
        return up;
      }
      return {
        ok: true,
        outcome: { store: 'engineering', artifactKind: 'Framework', id: up.id, version: up.version },
        reused: up.reused,
        warnings: [],
        docHash: fingerprintOf(up.finalDoc),
      };
    },
  },
  /* ── Misión 13 — Application & System generators ─────────────────────────── */

  'api-platform': {
    type: 'api-platform',
    label: 'Plataforma API: contratos tipados + validación declarativa + documentación determinista',
    docKind: 'ApiPlatform',
    outStore: 'engineering',
    inputShape: "{ name, auth?, endpoints: [{ id, method, path, summary, request?, response?, errors?, rateLimit?, agentBinding? }] }",
    async validate(input) {
      const parsed = parseErr(ApiPlatformInputSchema, input);
      if (!parsed.ok) {
        return parsed;
      }
      const errs: Record<string, string[]> = {};
      const seenIds = new Set<string>();
      const methodPath = new Set<string>();
      for (const e of parsed.data.endpoints) {
        if (seenIds.has(e.id)) {
          (errs.endpoints ??= []).push(`id de endpoint duplicado: '${e.id}'`);
        }
        seenIds.add(e.id);
        const mp = `${e.method} ${e.path}`;
        if (methodPath.has(mp)) {
          (errs.endpoints ??= []).push(`método+ruta duplicados: '${mp}'`);
        }
        methodPath.add(mp);
        if (!e.path.startsWith('/')) {
          (errs.endpoints ??= []).push(`'${e.id}': la ruta debe empezar por '/'`);
        }
        if (e.agentBinding) {
          const envelope = await getLatestSpec(e.agentBinding);
          if (!envelope || (envelope as { kind?: string }).kind !== 'Agent') {
            (errs.endpoints ??= []).push(`'${e.id}': agente vinculado inexistente: '${e.agentBinding}'`);
          }
        }
      }
      if (Object.keys(errs).length > 0) {
        return { ok: false, status: 400, errors: errs };
      }
      return { ok: true, checks: [{ name: 'schema', passed: true }, { name: 'endpoints', passed: true }, { name: 'agent-bindings', passed: true }] };
    },
    async generate(input) {
      const parsed = parseErr(ApiPlatformInputSchema, input);
      if (!parsed.ok) {
        return parsed;
      }
      // Validación de referencias reutilizando la lógica de validate (misma rutina).
      const errs: Record<string, string[]> = {};      for (const e of parsed.data.endpoints) {
        if (e.agentBinding) {
          const envelope = await getLatestSpec(e.agentBinding);
          if (!envelope || (envelope as { kind?: string }).kind !== 'Agent') {
            (errs.endpoints ??= []).push(`'${e.id}': agente vinculado inexistente: '${e.agentBinding}'`);
          }
        }
      }
      if (Object.keys(errs).length > 0) {
        return { ok: false, status: 400, errors: errs };
      }
      const id = parsed.data.id ?? slugify(parsed.data.name);
      if (!EntityIdSchema.safeParse(id).success) {
        return { ok: false, status: 400, errors: { id: [`id derivado no válido: '${id}'`] } };
      }
      // Documentación determinista estilo OpenAPI (contenido REAL derivado de
      // los contratos — no un placeholder): paths, métodos, schemas y errores.
      const paths: Record<string, Record<string, unknown>> = {};
      for (const e of parsed.data.endpoints) {
        paths[e.path] ??= {};
        paths[e.path][e.method.toLowerCase()] = {
          operationId: e.id,
          summary: e.summary,
          ...(e.request.length > 0 ? { requestBody: { fields: e.request } } : {}),
          responses: {
            '200': { description: 'éxito', ...(e.response.length > 0 ? { fields: e.response } : {}) },
            ...Object.fromEntries(e.errors.map((err) => [String(err.status), { code: err.code, when: err.when }])),
          },
          ...(e.rateLimit ? { 'x-rate-limit': e.rateLimit } : {}),
          ...(e.agentBinding ? { 'x-agent-binding': e.agentBinding } : {}),
        };
      }
      const doc = withMeta(API_VERSION, 'ApiPlatform', id, parsed.data.name, parsed.data.version, 'Plataforma API generada: contratos validados + documentación determinista (los endpoints SE sirven en M14; los agentes vinculados ya corren hoy).', {
        title: parsed.data.name,
        ...(parsed.data.description === undefined ? {} : { description: parsed.data.description }),
        auth: { type: parsed.data.auth, ...(parsed.data.auth === 'console-session' ? { csrfHeader: 'x-uiep-console' } : {}) },
        endpoints: parsed.data.endpoints.map((e) => ({
          ...e,
          request: e.request.map((f) => ({ ...f, required: f.required ?? true })),
          response: e.response.map((f) => ({ ...f, required: f.required ?? true })),
        })),
        openapiLike: { version: '3.1.0-uiep-declarative', info: { title: parsed.data.name, version: parsed.data.version }, paths },
      });
      const up = await upsertEngineeringArtifact(doc, parsed.data.onConflict);
      if (!up.ok) {
        return up;
      }
      return {
        ok: true,
        outcome: { store: 'engineering', artifactKind: 'ApiPlatform', id: up.id, version: up.version },
        reused: up.reused,
        warnings: ['el SERVIDOR de estos endpoints requiere el sandbox M14 — hoy el contrato se valida, documenta y vincula a agentes ejecutables'],
        docHash: fingerprintOf(up.finalDoc),
      };
    },
  },
  application: {
    type: 'application',
    label: 'Aplicación compuesta: módulos verificados + entrypoint + config SIN valores',
    docKind: 'Application',
    outStore: 'engineering',
    inputShape: "{ name, entryModule, modules: [{ ref, kind, componentRef?, dependencies? }], envVarNames?, runtime? }",
    async validate(input) {
      const parsed = parseErr(ApplicationInputSchema, input);
      if (!parsed.ok) {
        return parsed;
      }
      if (!parsed.data.modules.some((m) => m.ref === parsed.data.entryModule)) {
        return { ok: false, status: 400, errors: { entryModule: [`'${parsed.data.entryModule}' no declara ningún módulo`] } };
      }
      const errs: Record<string, string[]> = {};
      await validateModuleGraph(parsed.data.modules, errs);
      if (Object.keys(errs).length > 0) {
        return { ok: false, status: 400, errors: errs };
      }
      return { ok: true, checks: [{ name: 'schema', passed: true }, { name: 'modules', passed: true }, { name: 'component-refs', passed: true }] };
    },
    async generate(input) {
      const parsed = parseErr(ApplicationInputSchema, input);
      if (!parsed.ok) {
        return parsed;
      }
      if (!parsed.data.modules.some((m) => m.ref === parsed.data.entryModule)) {
        return { ok: false, status: 400, errors: { entryModule: [`'${parsed.data.entryModule}' no declara ningún módulo`] } };
      }
      const errs: Record<string, string[]> = {};
      await validateModuleGraph(parsed.data.modules, errs);
      if (Object.keys(errs).length > 0) {
        return { ok: false, status: 400, errors: errs };
      }
      const id = parsed.data.id ?? slugify(parsed.data.name);
      if (!EntityIdSchema.safeParse(id).success) {
        return { ok: false, status: 400, errors: { id: [`id derivado no válido: '${id}'`] } };
      }
      const doc = withMeta(API_VERSION, 'Application', id, parsed.data.name, parsed.data.version, 'Aplicación generada: módulos con componentRefs REALES verificados, entrypoint declarado y configuración SIN valores sensibles.', {
        entryModule: parsed.data.entryModule,
        modules: await resolveModuleVersions(parsed.data.modules),
        config: { envVarNames: parsed.data.envVarNames, runtime: parsed.data.runtime },
        ...(parsed.data.description === undefined ? {} : { description: parsed.data.description }),
      });
      const up = await upsertEngineeringArtifact(doc, parsed.data.onConflict);
      if (!up.ok) {
        return up;
      }
      return {
        ok: true,
        outcome: { store: 'engineering', artifactKind: 'Application', id: up.id, version: up.version },
        reused: up.reused,
        warnings: ['la estructura se valida y documenta; la EJECUCIÓN del paquete completo requiere el sandbox M14 (los componentes individuales sí corren en sus runtimes)'],
        docHash: fingerprintOf(up.finalDoc),
      };
    },
  },
  'agentic-app': {
    type: 'agentic-app',
    label: 'App agéntica: SOLO componentes ejecutables (agentes/workflows/tools/knowledge reales)',
    docKind: 'AgenticApp',
    outStore: 'engineering',
    inputShape: '{ name, agents: [{ agent: id | { generate }, role }], workflows?, tools?, knowledge?, surfaces, guardrails? }',
    async validate(input) {
      const parsed = parseErr(AgenticAppInputSchema, input);
      if (!parsed.ok) {
        return parsed;
      }
      for (const a of parsed.data.agents) {
        if (typeof a.agent === 'string') {
          const envelope = await getLatestSpec(a.agent);
          if (!envelope || (envelope as { kind?: string }).kind !== 'Agent') {
            return { ok: false, status: 400, errors: { agents: [`agente inexistente: '${a.agent}' (o declara { generate } para crearlo en la misma generación)`] } };
          }
        }
      }
      for (const wfId of parsed.data.workflows) {
        const envelope = await getLatestSpec(wfId);
        if (!envelope || (envelope as { kind?: string }).kind !== 'Workflow') {
          return { ok: false, status: 400, errors: { workflows: [`workflow inexistente: '${wfId}'`] } };
        }
      }
      for (const toolId of parsed.data.tools) {
        if (!(await getToolSpec(toolId))) {
          return { ok: false, status: 400, errors: { tools: [`herramienta no registrada: '${toolId}'`] } };
        }
      }
      for (const k of parsed.data.knowledge) {
        const source = await getSource(k.sourceId);
        if (!source) {
          return { ok: false, status: 400, errors: { knowledge: [`fuente de conocimiento inexistente: '${k.sourceId}'`] } };
        }
      }
      return { ok: true, checks: [{ name: 'schema', passed: true }, { name: 'executable-components', passed: true }] };
    },
    async generate(input) {
      const parsed = parseErr(AgenticAppInputSchema, input);
      if (!parsed.ok) {
        return parsed;
      }
      const warnings: string[] = [];
      const childIds: string[] = [];
      const agents: Array<{ agentSpecId: string; role: string }> = [];
      for (const a of parsed.data.agents) {
        if (typeof a.agent === 'string') {
          const envelope = await getLatestSpec(a.agent);
          if (!envelope || (envelope as { kind?: string }).kind !== 'Agent') {
            return { ok: false, status: 400, errors: { agents: [`agente inexistente: '${a.agent}'`] } };
          }
          agents.push({ agentSpecId: a.agent, role: a.role });
        } else {
          const child = await runGeneration('agent', a.agent.generate, { queue: false });
          if (!child.ok) {
            return { ok: false, status: child.status === 400 ? 400 : 409, errors: { agents: [`subgeneración de agente falló: ${JSON.stringify(child.errors).slice(0, 200)}`] } };
          }
          childIds.push(child.generationId);
          agents.push({ agentSpecId: (child.outcome as { id: string }).id, role: a.role });
        }
      }
      for (const wfId of parsed.data.workflows) {
        const envelope = await getLatestSpec(wfId);
        if (!envelope || (envelope as { kind?: string }).kind !== 'Workflow') {
          return { ok: false, status: 400, errors: { workflows: [`workflow inexistente: '${wfId}'`] } };
        }
      }
      for (const toolId of parsed.data.tools) {
        if (!(await getToolSpec(toolId))) {
          return { ok: false, status: 400, errors: { tools: [`herramienta no registrada: '${toolId}'`] } };
        }
      }
      for (const k of parsed.data.knowledge) {
        const source = await getSource(k.sourceId);
        if (!source) {
          return { ok: false, status: 400, errors: { knowledge: [`fuente de conocimiento inexistente: '${k.sourceId}'`] } };
        }
      }
      const id = parsed.data.id ?? slugify(parsed.data.name);
      if (!EntityIdSchema.safeParse(id).success) {
        return { ok: false, status: 400, errors: { id: [`id derivado no válido: '${id}'`] } };
      }
      const doc = withMeta(API_VERSION, 'AgenticApp', id, parsed.data.name, parsed.data.version, 'Aplicación agéntica generada sobre componentes REALES (agentes/workflows registrados y ejecutables, tools deny-by-default, knowledge con gate RAG).', {
        ...(parsed.data.description === undefined ? {} : { description: parsed.data.description }),
        agents,
        workflows: parsed.data.workflows,
        tools: parsed.data.tools,
        knowledge: parsed.data.knowledge,
        surfaces: parsed.data.surfaces,
        guardrails: parsed.data.guardrails,
      });
      const up = await upsertEngineeringArtifact(doc, parsed.data.onConflict);
      if (!up.ok) {
        return up;
      }
      warnings.push('todos los agentes/workflows listados SON ejecutables hoy (workflow-engine/agent-runtime); la app como paquete único se sirve en M14');
      return {
        ok: true,
        outcome: { store: 'engineering', artifactKind: 'AgenticApp', id: up.id, version: up.version },
        reused: up.reused,
        warnings,
        docHash: fingerprintOf(up.finalDoc),
        ...(childIds.length > 0 ? { childGenerationIds: childIds } : {}),
      } as GeneratorGenerateResult & { childGenerationIds?: string[] };
    },
  },
  saas: {
    type: 'saas',
    label: 'SaaS compuesto: módulos verificados + roles/tenancy preparados',
    docKind: 'Saas',
    outStore: 'engineering',
    inputShape: "{ name, entryModule, modules: [{ ref, kind, componentRef?, dependencies? }], roles?, tenancy?, envVarNames? }",
    async validate(input) {
      const parsed = parseErr(SaasInputSchema, input);
      if (!parsed.ok) {
        return parsed;
      }
      if (!parsed.data.modules.some((m) => m.ref === parsed.data.entryModule)) {
        return { ok: false, status: 400, errors: { entryModule: [`'${parsed.data.entryModule}' no declara ningún módulo`] } };
      }
      const errs: Record<string, string[]> = {};
      await validateModuleGraph(parsed.data.modules, errs);
      if (Object.keys(errs).length > 0) {
        return { ok: false, status: 400, errors: errs };
      }
      return { ok: true, checks: [{ name: 'schema', passed: true }, { name: 'modules', passed: true }, { name: 'component-refs', passed: true }] };
    },
    async generate(input) {
      const parsed = parseErr(SaasInputSchema, input);
      if (!parsed.ok) {
        return parsed;
      }
      if (!parsed.data.modules.some((m) => m.ref === parsed.data.entryModule)) {
        return { ok: false, status: 400, errors: { entryModule: [`'${parsed.data.entryModule}' no declara ningún módulo`] } };
      }
      const errs: Record<string, string[]> = {};
      await validateModuleGraph(parsed.data.modules, errs);
      if (Object.keys(errs).length > 0) {
        return { ok: false, status: 400, errors: errs };
      }
      const id = parsed.data.id ?? slugify(parsed.data.name);
      if (!EntityIdSchema.safeParse(id).success) {
        return { ok: false, status: 400, errors: { id: [`id derivado no válido: '${id}'`] } };
      }
      const doc = withMeta(API_VERSION, 'Saas', id, parsed.data.name, parsed.data.version, 'SaaS generado: módulos verificados con separation of concerns, roles declarados y tenancy preparada (multi-tenancy REAL → fases posteriores).', {
        ...(parsed.data.description === undefined ? {} : { description: parsed.data.description }),
        entryModule: parsed.data.entryModule,
        modules: await resolveModuleVersions(parsed.data.modules),
        tenancy: { model: parsed.data.tenancy, isolation: 'logical', identity: 'console-session', roles: parsed.data.roles },
        config: { envVarNames: parsed.data.envVarNames },
      });
      const up = await upsertEngineeringArtifact(doc, parsed.data.onConflict);
      if (!up.ok) {
        return up;
      }
      return {
        ok: true,
        outcome: { store: 'engineering', artifactKind: 'Saas', id: up.id, version: up.version },
        reused: up.reused,
        warnings: ['tenancy multiusuario PREPARADA (roles + isolation declarados); el aislamiento REAL por tenant requiere ejecución aislada (M14) y persistencia por-tenant (fases posteriores)'],
        docHash: fingerprintOf(up.finalDoc),
      };
    },
  },
};

/* ── Motor de generación (cola + registros + auditoría) ──────────────────── */

export interface GenerationOkResponse {
  ok: true;
  generationId: string;
  type: string;
  outcome: GenerationOutcome;
  extraOutcomes?: GenerationOutcome[];
  reused: boolean;
  warnings: string[];
  provenance: { generator: { id: string; version: string }; generatedAt: string; inputHash: string; outputHash: string };
  durationMs: number;
  children?: string[];
}

export interface GenerationErrorResponse {
  ok: false;
  status: 400 | 404 | 409 | 500;
  code: 'unknown_type' | 'not_generable' | 'invalid_input' | 'version_conflict' | 'generation_failed';
  errors?: Record<string, string[]>;
  generationId?: string;
}

export type GenerationResponse = GenerationOkResponse | GenerationErrorResponse;

let generationQueue: Promise<unknown> = Promise.resolve();
let insideGeneration = false;

export function listGenerators(): Array<{
  type: string;
  label: string;
  docKind: string;
  outStore: string;
  inputShape: string;
  capabilities: { schema: true; generator: boolean; execution: boolean; validation: boolean } | null;
}> {
  return Object.values(GENERATORS).map((g) => ({
    type: g.type,
    label: g.label,
    docKind: g.docKind,
    outStore: g.outStore,
    inputShape: g.inputShape,
    capabilities: getCatalogEntry(g.type)?.capabilities ?? null,
  }));
}

export function describeGenerator(type: string): (ReturnType<typeof listGenerators>[number]) | null {
  return listGenerators().find((g) => g.type === type) ?? null;
}

/** Validación sin escrituras (dry-run). */
export async function validateGeneration(type: string, input: unknown): Promise<{ ok: true; type: string; checks: GeneratorCheck[] } | { ok: false; status: 400 | 404 | 409; code?: string; errors: Record<string, string[]> }> {
  const gen = GENERATORS[type];
  if (!gen) {
    return getCatalogEntry(type)
      ? { ok: false, status: 404, code: 'not_generable', errors: { type: [`el tipo '${type}' está en el catálogo pero no tiene generador implementado`] } }
      : { ok: false, status: 400, code: 'unknown_type', errors: { type: [`tipo desconocido: '${String(type)}'`] } };
  }
  const result = await gen.validate(input);
  if (result.ok) {
    return { ok: true, type, checks: result.checks };
  }
  return result;
}

async function executeGeneration(type: string, input: unknown): Promise<GenerationResponse> {
  const gen = GENERATORS[type];
  if (!gen) {
    return getCatalogEntry(type)
      ? { ok: false, status: 404, code: 'not_generable', errors: { type: [`el tipo '${type}' está en el catálogo pero no tiene generador implementado`] } }
      : { ok: false, status: 400, code: 'unknown_type', errors: { type: [`tipo desconocido: '${String(type)}'`] } };
  }
  const record: GenerationRecord = {
    id: newGenerationId(),
    type,
    status: 'failed',
    startedAt: new Date().toISOString(),
    durationMs: 0,
    inputHash: sha256Hex(stableStringify(input ?? null)),
    inputSummary: summarizeInput(input),
  };
  const t0 = Date.now();
  try {
    const result = await gen.generate(input);
    record.durationMs = Date.now() - t0;
    if (result.ok) {
      record.status = 'succeeded';
      record.outcome = { ...result.outcome, reused: result.reused };
      record.extraOutcomes = result.extraOutcomes;
      record.outputHash = result.docHash;
      record.warnings = result.warnings;
      record.provenance = { generator: { id: `uiep-gen-${type}`, version: GENERATOR_ENGINE_VERSION }, generatedAt: record.startedAt };
      record.children = (result as { childGenerationIds?: string[] }).childGenerationIds;
      await saveGenerationRecord(record);
      const oc = result.outcome;
      const kindName = oc.store === 'specs' ? oc.specKind : oc.artifactKind;
      audit({
        actor: { kind: 'console' },
        action: 'engineering.generate',
        correlation: { targetId: result.outcome.id },
        detail: { type, store: oc.store, kind: kindName, version: oc.version, reused: result.reused, inputHash: record.inputHash.slice(0, 16), outputHash: result.docHash, warnings: result.warnings.length },
      });
      return {
        ok: true,
        generationId: record.id,
        type,
        outcome: result.outcome,
        ...(result.extraOutcomes ? { extraOutcomes: result.extraOutcomes } : {}),
        reused: result.reused,
        warnings: result.warnings,
        provenance: { generator: record.provenance.generator, generatedAt: record.startedAt, inputHash: record.inputHash, outputHash: result.docHash },
        durationMs: record.durationMs,
        ...(record.children ? { children: record.children } : {}),
      };
    }
    record.status = 'failed';
    record.error = { status: result.status, code: result.code, keys: Object.keys(result.errors).slice(0, 10), message: JSON.stringify(result.errors).slice(0, 500) };
    await saveGenerationRecord(record);
    audit({
      actor: { kind: 'console' },
      action: 'engineering.generate',
      correlation: {},
      detail: { type, passed: false, status: result.status, code: result.code ?? 'generation_failed' },
    });
    return { ok: false, status: result.status, code: result.code === 'version_conflict' ? 'version_conflict' : 'generation_failed', errors: result.errors, generationId: record.id };
  } catch (err) {
    record.durationMs = Date.now() - t0;
    record.status = 'failed';
    record.error = { status: 500, message: String((err as Error)?.message ?? err).slice(0, 300) };
    await saveGenerationRecord(record).catch(() => undefined);
    audit({ actor: { kind: 'console' }, action: 'engineering.generate', correlation: {}, detail: { type, passed: false, unexpected: true } });
    return { ok: false, status: 500, code: 'generation_failed', errors: { engine: ['falla inesperada del generador (ver registro)'] }, generationId: record.id };
  }
}

/** Punto de entrada principal: serializa las generaciones del proceso. */
export async function runGeneration(type: string, input: unknown, opts: { queue?: boolean } = {}): Promise<GenerationResponse> {
  if (opts.queue === false) {
    return executeGeneration(type, input);
  }
  if (insideGeneration) {
    return executeGeneration(type, input); // anidado: ya estamos dentro de la sección serializada
  }
  const execution = generationQueue.then(() => {
    insideGeneration = true;
    return executeGeneration(type, input).finally(() => {
      insideGeneration = false;
    });
  });
  generationQueue = execution.then(
    () => undefined,
    () => undefined,
  );
  return execution;
}
