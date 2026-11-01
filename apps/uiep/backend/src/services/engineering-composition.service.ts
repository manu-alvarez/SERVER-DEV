import { z } from 'zod';
import {
  MetadataSchema,
  ArtifactTypeSchema,
  EntityIdSchema,
  SemVerSchema,
} from '@uiep/agent-spec';
import { getLatestSpec } from './spec-registry.service';
import {
  getLatestArtifact,
  isEngineeringArtifactKind,
  registerProject,
  topologicalOrder,
  transitionLifecycle,
} from './engineering-registry.service';
import {
  GENERATOR_ENGINE_VERSION,
  runGeneration,
  saveGenerationRecord,
  newGenerationId,
  sha256Hex,
  stableStringify,
  describeGenerator,
  type GenerationOutcome,
  type GenerationRecord,
} from './engineering-generator.service';
import { audit } from './observability.service';

/**
 * engineering-composition (Misión 12 §4) — generación COMPUESTA.
 *
 * Construye un proyecto UES (kind 'Project') a partir de artefactos:
 * · specRef → REUTILIZA un spec/aritfacto EXISTENTE (se verifica contra los
 *   almacenes reales; pin de versión si la declara).
 * · generate → GENERA el artefacto delegando en el Generator Engine
 *   (mismo registro de generación, misma validez, NADA duplicado).
 * · Los tokens '$ref:<ref>' en el input se resuelven al id del artefacto
 *   ya generado/reutilizado en la MISMA composición.
 *
 * Fases: validación total (schema, refs, tokens, topología, tipos) →
 * generación en ORDEN TOPOLÓGICO → registro del proyecto (registerProject,
 * M11) con procedencia por artefacto → ciclo draft→validated→generated.
 *
 * Rollback lógico: si una generación falla, el proyecto NO se registra; el
 * grupo queda registrado con su estado y los hijos completados, y cada
 * upsert (id@version) hace la re-ejecución idempotente.
 */

const DependencySchema = z.object({
  ref: z.string().min(1).max(64),
  required: z.boolean().default(true),
  versionRange: z.string().max(32).optional(),
});

const CompositionArtifactSchema = z
  .object({
    ref: z.string().min(1).max(64),
    type: ArtifactTypeSchema,
    name: z.string().min(1).max(120).optional(),
    dependencies: z.array(DependencySchema).max(16).default([]),
    specRef: z
      .object({
        id: EntityIdSchema,
        kind: z.string().min(1).max(40),
        version: SemVerSchema.optional(),
      })
      .optional(),
    generate: z.record(z.string(), z.unknown()).optional(),
  })
  .superRefine((a, ctx) => {
    if (a.specRef && a.generate) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['specRef'], message: `el artefacto '${a.ref}' tiene specRef Y generate: exclusivos` });
    }
    if (!a.specRef && !a.generate) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['ref'], message: `el artefacto '${a.ref}' necesita specRef (reutilizar) o generate (generar)` });
    }
    for (const dep of a.dependencies) {
      if (dep.ref === a.ref) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['dependencies'], message: `el artefacto '${a.ref}' depende de sí mismo` });
      }
    }
  });

const CompositionProjectSchema = z.object({
  apiVersion: z.literal('uiep.io/ues/v1'),
  kind: z.literal('Project'),
  metadata: MetadataSchema.extend({}),
  description: z.string().max(2000).optional(),
  artifacts: z.array(CompositionArtifactSchema).min(1).max(32),
  dependencies: z.array(DependencySchema).max(16).default([]),
  configuration: z.record(z.string(), z.unknown()).optional(),
  evaluation: z
    .object({
      suite: z.string().max(80).optional(),
      criteria: z.array(z.string().max(160)).max(16).optional(),
    })
    .optional(),
  security: z
    .object({
      isolation: z.enum(['none', 'container', 'sandbox']).default('none'),
      notes: z.string().max(500).optional(),
    })
    .optional(),
});

type CompositionProject = z.infer<typeof CompositionProjectSchema>;

export interface CompositionArtifactResult {
  ref: string;
  type: string;
  action: 'reused-existing' | 'reused-generated' | 'created';
  specRef: { id: string; kind: string; version: string };
  generationId?: string;
}

export type CompositionResult =
  | {
      ok: true;
      projectId: string;
      version: string;
      artifacts: CompositionArtifactResult[];
      warnings: string[];
      generationId: string;
      durationMs: number;
    }
  | {
      ok: false;
      status: 400 | 409 | 422 | 500;
      phase: 'validation' | 'generation' | 'registration';
      errors: Record<string, string[]>;
      artifacts?: CompositionArtifactResult[];
      generationId?: string;
      childGenerationId?: string;
      warnings?: string[];
    };

function compositionErr(
  status: 400 | 409 | 422 | 500,
  phase: 'validation' | 'generation' | 'registration',
  errors: Record<string, string[]>,
  extra: { artifacts?: CompositionArtifactResult[]; generationId?: string; childGenerationId?: string; warnings?: string[] } = {},
): CompositionResult {
  return { ok: false, status, phase, errors, ...extra };
}

/** Sustituye tokens '$ref:<token>' por el id resuelto en la composición. */
function resolveTokens(value: unknown, map: Map<string, string>): { value: unknown; error?: string } {
  if (typeof value === 'string') {
    if (value.startsWith('$ref:')) {
      const token = value.slice(5);
      const resolved = map.get(token);
      return resolved ? { value: resolved } : { value, error: token };
    }
    return { value };
  }
  if (Array.isArray(value)) {
    const out: unknown[] = [];
    for (const item of value) {
      const r = resolveTokens(item, map);
      if (r.error) {
        return { value, error: r.error };
      }
      out.push(r.value);
    }
    return { value: out };
  }
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const r = resolveTokens(v, map);
      if (r.error) {
        return { value, error: r.error };
      }
      out[k] = r.value;
    }
    return { value: out };
  }
  return { value };
}

function zodErrors(error: z.ZodError): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.join('.') : '(raíz)';
    (errors[key] ??= []).push(issue.message);
  }
  return errors;
}

/** Referencias de un artefacto declaradas como tokens. */
function checkTokens(value: unknown, refs: Set<string>): string[] {
  const missing: string[] = [];
  if (typeof value === 'string') {
    if (value.startsWith('$ref:') && !refs.has(value.slice(5))) {
      missing.push(value.slice(5));
    }
    return missing;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      missing.push(...checkTokens(item, refs));
    }
    return missing;
  }
  if (value !== null && typeof value === 'object') {
    for (const v of Object.values(value as Record<string, unknown>)) {
      missing.push(...checkTokens(v, refs));
    }
  }
  return missing;
}

function specRefOf(outcome: GenerationOutcome): { id: string; kind: string; version: string } {
  return outcome.store === 'specs'
    ? { id: outcome.id, kind: outcome.specKind, version: outcome.version }
    : { id: outcome.id, kind: outcome.artifactKind, version: outcome.version };
}

/** Genera (o ensambla) un proyecto completo a partir de su contrato UES. */
export async function generateComposition(projectInput: unknown, opts: { onConflict?: 'error' | 'bump' } = {}): Promise<CompositionResult> {
  const t0 = Date.now();
  const parsed = CompositionProjectSchema.safeParse(projectInput);
  if (!parsed.success) {
    return compositionErr(400, 'validation', zodErrors(parsed.error));
  }
  const project = parsed.data;

  /* ── FASE 0 — coherencia del grafo (refs, tokens, topología, generadores) ─ */
  const errors: Record<string, string[]> = {};
  const refs = new Set(project.artifacts.map((a) => a.ref));
  if (refs.size !== project.artifacts.length) {
    errors.artifacts = ['refs de artefacto duplicadas'];
  }
  for (const a of project.artifacts) {
    for (const dep of a.dependencies) {
      if (!refs.has(dep.ref)) {
        (errors.artifacts ??= []).push(`la dependencia '${a.ref}' → '${dep.ref}' apunta a un ref inexistente`);
      }
    }
    for (const missing of checkTokens(a.generate ?? {}, refs)) {
      (errors.artifacts ??= []).push(`'${a.ref}': token '$ref:${missing}' no declara ningún ref del proyecto`);
    }
    if (a.generate && !describeGenerator(a.type)) {
      (errors.artifacts ??= []).push(`'${a.ref}': el tipo '${a.type}' no tiene generador implementado (solo specRef)`);
    }
  }
  const topo = topologicalOrder(project.artifacts.map((a) => ({ ref: a.ref, dependencies: a.dependencies })));
  if (!topo.ok) {
    (errors.artifacts ??= []).push(`ciclo de dependencias: ${topo.cycle.join(' → ')}`);
  }
  if (Object.keys(errors).length > 0) {
    return compositionErr(400, 'validation', errors);
  }

  /* ── FASE 1 — verificar los specRef EXISTENTES contra los almacenes reales ─ */
  const results = new Map<string, CompositionArtifactResult>();
  for (const a of project.artifacts) {
    if (!a.specRef) {
      continue;
    }
    const isEng = isEngineeringArtifactKind(a.specRef.kind);
    const target = isEng ? await getLatestArtifact(a.specRef.kind, a.specRef.id) : await getLatestSpec(a.specRef.id);
    if (!target) {
      (errors.specRef ??= []).push(`'%s' inexistente para reutilizar (%s de '${a.ref}')`.replace('%s', `'${a.specRef.id}'`).replace('%s', `${a.specRef.kind} requerido`));
      continue;
    }
    const meta = (target as { kind?: string; metadata?: { version?: string } }).metadata;
    const registeredKind = (target as { kind?: string }).kind;
    if (!isEng && registeredKind !== a.specRef.kind) {
      (errors.specRef ??= []).push(`'${a.specRef.id}' está registrado como kind '${registeredKind}', no como '${a.specRef.kind}'`);
      continue;
    }
    if (a.specRef.version && meta?.version !== a.specRef.version) {
      (errors.specRef ??= []).push(`'${a.specRef.id}' está en versión '${meta?.version}', exigida '${a.specRef.version}'`);
      continue;
    }
    results.set(a.ref, {
      ref: a.ref,
      type: a.type,
      action: 'reused-existing',
      specRef: { id: a.specRef.id, kind: a.specRef.kind, version: meta?.version ?? a.specRef.version ?? '0.0.0' },
    });
  }
  if (Object.keys(errors).length > 0) {
    return compositionErr(400, 'validation', errors);
  }

  /* ── FASE 2 — generación en ORDEN TOPOLÓGICO (con registro del grupo) ───── */
  const group: GenerationRecord = {
    id: newGenerationId(),
    type: 'composition',
    status: 'failed',
    startedAt: new Date().toISOString(),
    durationMs: 0,
    inputHash: sha256Hex(stableStringify({ projectId: project.metadata.id, version: project.metadata.version, artifacts: project.artifacts.map((a) => a.ref) })),
    inputSummary: { project: project.metadata.id, artifacts: project.artifacts.map((a) => ({ ref: a.ref, type: a.type, mode: a.specRef ? 'specRef' : 'generate' })) },
    warnings: [],
    children: [],
  };
  const warnings: string[] = [];
  for (const ref of topo.ok ? topo.order : []) {
    const a = project.artifacts.find((x) => x.ref === ref)!;
    if (results.has(a.ref)) {
      continue;
    }
    const tokenMap = new Map<string, string>([...results.values()].map((r) => [r.ref, r.specRef.id]));
    const resolved = resolveTokens(a.generate ?? {}, tokenMap);
    const input = (resolved.value ?? {}) as Record<string, unknown>;
    if (!('onConflict' in input) && opts.onConflict) {
      input.onConflict = opts.onConflict;
    }
    const gen = await runGeneration(a.type, input);
    if (!gen.ok) {
      group.durationMs = Date.now() - t0;
      group.error = { status: gen.status, code: gen.code, message: JSON.stringify(gen.errors ?? {}).slice(0, 400) };
      group.children = [...results.values()].filter((r) => r.generationId).map((r) => r.generationId!);
      await saveGenerationRecord(group).catch(() => undefined);
      audit({ actor: { kind: 'console' }, action: 'engineering.compose', correlation: {}, detail: { project: project.metadata.id, passed: false, phase: 'generation', artifact: a.ref } });
      return compositionErr(gen.status === 409 ? 409 : 422, 'generation', { [a.ref]: [JSON.stringify(gen.errors ?? {}).slice(0, 300)] }, {
        artifacts: [...results.values()],
        generationId: group.id,
        childGenerationId: gen.generationId,
      });
    }
    warnings.push(...gen.warnings);
    (group.children ??= []).push(gen.generationId);
    const specRef = specRefOf(gen.outcome);
    results.set(a.ref, {
      ref: a.ref,
      type: a.type,
      action: gen.reused ? 'reused-generated' : 'created',
      specRef,
      generationId: gen.generationId,
    });
  }

  /* ── FASE 3 — registrar el proyecto UES con su procedencia ──────────────── */
  const childIds = [...results.values()].filter((r) => r.generationId).map((r) => r.generationId!);
  const finalDoc = {
    apiVersion: 'uiep.io/ues/v1' as const,
    kind: 'Project' as const,
    metadata: {
      id: project.metadata.id,
      name: project.metadata.name,
      version: project.metadata.version,
      description: project.metadata.description,
    },
    description: project.description,
    artifacts: project.artifacts.map((a) => {
      const r = results.get(a.ref)!;
      return {
        ref: a.ref,
        type: a.type,
        version: r.specRef.version,
        name: a.name,
        specRef: { id: r.specRef.id, kind: r.specRef.kind, version: r.specRef.version },
        dependencies: a.dependencies,
        provenance: r.generationId
          ? {
              generator: { id: 'uiep-composition-engine', version: GENERATOR_ENGINE_VERSION },
              generatedAt: group.startedAt,
              evidence: [{ type: 'generation', ref: r.generationId }],
            }
          : undefined,
      };
    }),
    dependencies: project.dependencies,
    configuration: project.configuration,
    generation: {
      generator: { id: 'uiep-composition-engine', version: GENERATOR_ENGINE_VERSION },
      generatedAt: group.startedAt,
      evidence: [{ type: 'generation', ref: group.id }],
    },
    evaluation: project.evaluation,
    security: project.security,
    lifecycle: { state: 'draft' as const },
  };
  const registered = await registerProject(finalDoc);
  if (!registered.ok) {
    group.status = 'succeeded';
    group.durationMs = Date.now() - t0;
    group.children = childIds;
    group.warnings = warnings;
    await saveGenerationRecord(group).catch(() => undefined);
    return compositionErr(registered.status, 'registration', registered.errors, {
      artifacts: [...results.values()],
      generationId: group.id,
      warnings,
    });
  }
  const t1 = await transitionLifecycle(project.metadata.id, 'validated', { actor: `composition@${GENERATOR_ENGINE_VERSION}`, note: 'composición: validación total + grafo íntegro' });
  if (t1.ok) {
    await transitionLifecycle(project.metadata.id, 'generated', { note: 'artefactos generados/reutilizados en orden topológico' });
  }
  group.status = 'succeeded';
  group.durationMs = Date.now() - t0;
  group.children = childIds;
  group.warnings = warnings;
  await saveGenerationRecord(group).catch(() => undefined);
  audit({
    actor: { kind: 'console' },
    action: 'engineering.compose',
    correlation: { targetId: project.metadata.id },
    detail: {
      project: project.metadata.id,
      version: project.metadata.version,
      artifacts: results.size,
      created: [...results.values()].filter((r) => r.action === 'created').length,
      warnings: warnings.length,
    },
  });
  return {
    ok: true,
    projectId: project.metadata.id,
    version: project.metadata.version,
    artifacts: [...results.values()],
    warnings,
    generationId: group.id,
    durationMs: group.durationMs,
  };
}
