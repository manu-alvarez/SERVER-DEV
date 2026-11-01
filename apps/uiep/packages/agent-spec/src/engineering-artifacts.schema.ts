import { z } from 'zod';
import { EntityIdSchema, MetadataSchema, SemVerSchema } from './common.schema';

/**
 * Artefactos de INGENIERÍA (Misión 12) — documentos registrables en el
 * Universal Artifact Registry (data/engineering/artifacts/{kind}/) que NO son
 * specs de runtime (esos 5 viven en data/specs y NO cambian).
 *
 * Todos siguen el envelope v1 (apiVersion uiep.io/v1 + kind + metadata + spec).
 * Cada generator valida su entrada, verifica referencias contra los servicios
 * reales y registra procedencia. Sin secretos en ningún campo.
 */

export const EngineeringApiVersionSchema = z.literal('uiep.io/v1');

/* ── Prompt System ───────────────────────────────────────────────────────── */

export const PromptVariableSchema = z.object({
  name: z.string().regex(/^[a-z][a-zA-Z0-9_]{0,31}$/),
  type: z.enum(['string', 'number', 'boolean']),
  required: z.boolean().default(true),
  default: z.unknown().optional(),
});

export const PromptTemplateSchema = z.object({
  id: EntityIdSchema,
  name: z.string().min(1).max(120),
  description: z.string().max(300).optional(),
  /** Plantilla con variables {{nombre}} — sin código, solo texto sustituible. */
  template: z.string().min(1).max(20_000),
  variables: z.array(PromptVariableSchema).max(32).default([]),
});

export const PromptCompositionStepSchema = z.object({
  promptId: EntityIdSchema,
  /** Valores literales o referencias {{otraVariable}} — sin ejecución. */
  inputs: z.record(z.string().max(64), z.string().max(4000)).default({}),
});

export const PromptSystemV1Schema = z
  .object({
    apiVersion: EngineeringApiVersionSchema,
    kind: z.literal('PromptSystem'),
    metadata: MetadataSchema,
    spec: z.object({
      prompts: z.array(PromptTemplateSchema).min(1).max(64),
      compositions: z.array(z.object({ id: EntityIdSchema, steps: z.array(PromptCompositionStepSchema).min(1).max(16) })).max(16).default([]),
    }),
  })
  .superRefine((doc, ctx) => {
    const ids = new Set<string>();
    for (const p of doc.spec.prompts) {
      if (ids.has(p.id)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['spec', 'prompts'], message: `prompt duplicado: ${p.id}` });
      }
      ids.add(p.id);
    }
    // Variables usadas en la plantilla {{x}} ⊆ variables declaradas
    for (const p of doc.spec.prompts) {
      const declared = new Set(p.variables.map((v) => v.name));
      for (const used of p.template.match(/\{\{([a-zA-Z0-9_]+)\}\}/g) ?? []) {
        const name = used.slice(2, -2);
        if (!declared.has(name)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['spec', 'prompts'], message: `${p.id}: variable {{${name}}} usada pero no declarada` });
        }
      }
    }
    // Composiciones: prompt existe, inputs ⊆ variables, requeridas cubiertas
    for (const c of doc.spec.compositions) {
      for (const step of c.steps) {
        if (Object.keys(step.inputs).length > 32) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['spec', 'compositions'], message: `${c.id}: demasiados inputs en un paso (máx 32)` });
        }
        if (!ids.has(step.promptId)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['spec', 'compositions'], message: `composición ${c.id} referencia un prompt inexistente: ${step.promptId}` });
          continue;
        }
        const p = doc.spec.prompts.find((x) => x.id === step.promptId)!;
        for (const key of Object.keys(step.inputs)) {
          if (!declaredHas(p, key)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['spec', 'compositions'], message: `${c.id}: input '${key}' no es variable de ${step.promptId}` });
          }
        }
        for (const v of p.variables) {
          const covered = step.inputs[v.name] !== undefined || v.default !== undefined || !v.required;
          if (!covered) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['spec', 'compositions'], message: `${c.id}: falta la variable requerida '${v.name}' de ${step.promptId}` });
          }
        }
      }
    }

    function declaredHas(p: z.infer<typeof PromptTemplateSchema>, name: string): boolean {
      return p.variables.some((v) => v.name === name);
    }
  });

/* ── Skill Pack ──────────────────────────────────────────────────────────── */

export const SkillIOSchema = z.object({ name: z.string().max(64), type: z.enum(['string', 'number', 'boolean', 'object']) });

export const SkillPackV1Schema = z
  .object({
    apiVersion: EngineeringApiVersionSchema,
    kind: z.literal('SkillPack'),
    metadata: MetadataSchema,
    spec: z.object({
      skills: z
        .array(
          z.object({
            id: EntityIdSchema,
            name: z.string().min(1).max(120),
            description: z.string().max(500),
            instructions: z.string().min(1).max(10_000),
            inputs: z.array(SkillIOSchema).max(16).default([]),
            outputs: z.array(SkillIOSchema).max(16).default([]),
            dependencies: z.array(EntityIdSchema).max(8).default([]),
          }),
        )
        .min(1)
        .max(32),
      compatibility: z.object({ notes: z.string().max(300).optional() }).optional(),
    }),
  })
  .superRefine((doc, ctx) => {
    const ids = new Set<string>();
    for (const s of doc.spec.skills) {
      if (ids.has(s.id)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['spec'], message: `skill duplicada: ${s.id}` });
      }
      ids.add(s.id);
    }
    for (const s of doc.spec.skills) {
      for (const d of s.dependencies) {
        if (d === s.id) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['spec'], message: `${s.id} depende de sí misma` });
        } else if (!ids.has(d)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['spec'], message: `${s.id} depende de una skill inexistente: ${d}` });
        }
      }
    }
  });

/* ── MCP Server manifest (genera el MANIFIESTO — nunca despliega/expone) ─── */

export const McpServerManifestV1Schema = z
  .object({
    apiVersion: EngineeringApiVersionSchema,
    kind: z.literal('McpServerManifest'),
    metadata: MetadataSchema,
    spec: z.object({
      serverId: EntityIdSchema,
      transport: z.literal('http-json-rpc').default('http-json-rpc'),
      tools: z
        .array(
          z.object({
            name: z.string().regex(/^[a-z0-9_-]{1,64}$/),
            sourceToolId: EntityIdSchema,
            description: z.string().max(200).optional(),
            exposed: z.boolean().default(true),
          }),
        )
        .min(1)
        .max(64),
      resources: z.array(z.object({ uri: z.string().min(1).max(200), name: z.string().min(1).max(120), description: z.string().max(300).optional() })).max(32).default([]),
      prompts: z.array(z.object({ name: z.string().regex(/^[a-z0-9_-]{1,64}$/), template: z.string().min(1).max(5000) })).max(32).default([]),
      notes: z.string().max(300).optional(),
    }),
  })
  .superRefine((doc, ctx) => {
    const seen = new Set<string>();
    for (const t of doc.spec.tools) {
      if (seen.has(t.name)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['spec'], message: `nombre de tool duplicado: ${t.name}` });
      }
      seen.add(t.name);
    }
  });

/* ── Tool Collection ─────────────────────────────────────────────────────── */

export const ToolCollectionV1Schema = z.object({
  apiVersion: EngineeringApiVersionSchema,
  kind: z.literal('ToolCollection'),
  metadata: MetadataSchema,
  spec: z.object({
    /** Solo herramientas YA registradas en el ToolRegistry (el generator lo verifica). */
    tools: z
      .array(
        z.object({
          toolId: EntityIdSchema,
          permissions: z.array(z.string().min(1).max(80)).max(16).default([]),
          policy: z
            .object({
              approvalRequired: z.boolean().default(false),
              maxConcurrency: z.number().int().min(1).max(8).optional(),
            })
            .optional(),
        }),
      )
      .min(1)
      .max(32),
    notes: z.string().max(300).optional(),
  }),
});

/* ── RAG System ──────────────────────────────────────────────────────────── */

const SafeIdSchema = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9._-]{2,80}$/);

export const RagSystemV1Schema = z.object({
  apiVersion: EngineeringApiVersionSchema,
  kind: z.literal('RagSystem'),
  metadata: MetadataSchema,
  spec: z.object({
    bindings: z
      .array(
        z.object({
          agentSpecId: EntityIdSchema,
          sourceIds: z.array(SafeIdSchema).max(16).default([]),
        }),
      )
      .max(32)
      .default([]),
    retrieval: z.object({
      minScore: z.number().min(0).max(1).default(0.7),
      topK: z.number().int().min(1).max(20).default(4),
    }),
    citations: z.object({ format: z.string().max(40).default('[n]') }).default({ format: '[n]' }),
    evaluation: z
      .object({
        thresholds: z.object({
          recall: z.number().min(0).max(1).optional(),
          precision: z.number().min(0).max(1).optional(),
          mrr: z.number().min(0).max(1).optional(),
        }),
      })
      .optional(),
  }),
});

/* ── Knowledge Base (registro de lo instalado por el generator) ──────────── */

export const KnowledgeBaseV1Schema = z.object({
  apiVersion: EngineeringApiVersionSchema,
  kind: z.literal('KnowledgeBase'),
  metadata: MetadataSchema,
  spec: z.object({
    sources: z.array(z.object({ sourceId: SafeIdSchema, title: z.string().min(1).max(160) })).max(64).default([]),
    bindings: z.array(z.object({ agentSpecId: EntityIdSchema, sourceIds: z.array(SafeIdSchema).max(16) })).max(32).default([]),
    notes: z.string().max(300).optional(),
  }),
});

/* ── Multi-Agent System (registro de composición + workflow real) ────────── */

export const MultiAgentSystemV1Schema = z.object({
  apiVersion: EngineeringApiVersionSchema,
  kind: z.literal('MultiAgentSystem'),
  metadata: MetadataSchema,
  spec: z.object({
    coordinationWorkflowId: EntityIdSchema,
    style: z.enum(['pipeline', 'orchestrator']),
    members: z
      .array(
        z.object({
          agentSpecId: EntityIdSchema,
          role: z.string().min(1).max(80),
          responsibilities: z.string().max(500).optional(),
        }),
      )
      .min(1)
      .max(12),
    sharedMemory: z.boolean().default(false),
  }),
});

/* ── Evaluation dataset ──────────────────────────────────────────────────── */

export const EvaluationDatasetV1Schema = z
  .object({
    apiVersion: EngineeringApiVersionSchema,
    kind: z.literal('EvaluationDataset'),
    metadata: MetadataSchema,
    spec: z.object({
      corpusFormat: z.literal('uiep-rag-corpus-v1').default('uiep-rag-corpus-v1'),
      cases: z
        .array(
          z.object({
            id: EntityIdSchema,
            query: z.string().min(1).max(2000),
            expected: z.string().min(1).max(2000),
            refs: z.array(z.string().max(80)).max(8).default([]),
          }),
        )
        .min(1)
        .max(200),
      metrics: z.array(z.enum(['recall', 'precision', 'mrr'])).min(1).default(['recall', 'precision', 'mrr']),
      thresholds: z
        .object({
          recall: z.number().min(0).max(1).optional(),
          precision: z.number().min(0).max(1).optional(),
          mrr: z.number().min(0).max(1).optional(),
        })
        .default({}),
    }),
  })
  .superRefine((doc, ctx) => {
    const seen = new Set<string>();
    for (const c of doc.spec.cases) {
      if (seen.has(c.id)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['spec'], message: `caso duplicado: ${c.id}` });
      }
      seen.add(c.id);
    }
  });

/* ── Harness ─────────────────────────────────────────────────────────────── */

export const HarnessV1Schema = z.object({
  apiVersion: EngineeringApiVersionSchema,
  kind: z.literal('Harness'),
  metadata: MetadataSchema,
  spec: z.object({
    targetRefs: z.array(EntityIdSchema).max(16).default([]),
    allowedTools: z.array(EntityIdSchema).max(16).default([]),
    limits: z
      .object({
        maxIterations: z.number().int().min(1).max(50).optional(),
        timeoutMs: z.number().int().min(1000).max(300_000).optional(),
        maxConcurrency: z.number().int().min(1).max(8).optional(),
      })
      .default({}),
    fixtures: z.array(z.object({ name: z.string().min(1).max(80), input: z.string().max(2000), expected: z.string().max(2000).optional() })).max(100).default([]),
    testCases: z.array(z.object({ id: EntityIdSchema, datasetRef: EntityIdSchema.optional() })).max(64).default([]),
  }),
});

export type PromptSystemV1 = z.infer<typeof PromptSystemV1Schema>;
export type SkillPackV1 = z.infer<typeof SkillPackV1Schema>;
export type McpServerManifestV1 = z.infer<typeof McpServerManifestV1Schema>;
export type ToolCollectionV1 = z.infer<typeof ToolCollectionV1Schema>;
export type RagSystemV1 = z.infer<typeof RagSystemV1Schema>;
export type KnowledgeBaseV1 = z.infer<typeof KnowledgeBaseV1Schema>;
export type MultiAgentSystemV1 = z.infer<typeof MultiAgentSystemV1Schema>;
export type EvaluationDatasetV1 = z.infer<typeof EvaluationDatasetV1Schema>;
export type HarnessV1 = z.infer<typeof HarnessV1Schema>;

/* ── Framework (composición verificada de componentes ya registrados) ────── */

export const FrameworkV1Schema = z.object({
  apiVersion: EngineeringApiVersionSchema,
  kind: z.literal('Framework'),
  metadata: MetadataSchema,
  spec: z.object({
    description: z.string().max(300).optional(),
    conventions: z
      .object({
        description: z.string().max(500).optional(),
        config: z.record(z.string().max(64), z.unknown()).optional(),
      })
      .optional(),
    components: z
      .array(
        z.object({
          type: z.string().min(1).max(40),
          ref: z.object({ id: EntityIdSchema, kind: z.string().min(1).max(40), version: SemVerSchema.optional() }),
          // Versión REAL registrada, verificada por el generador al componer.
          registeredVersion: SemVerSchema.optional(),
          use: z.string().max(120).optional(),
        }),
      )
      .min(1)
      .max(16),
    extensionPoints: z.array(z.object({ name: z.string().min(1).max(60), description: z.string().min(1).max(200) })).max(8).default([]),
  }),
});

export type FrameworkV1 = z.infer<typeof FrameworkV1Schema>;

/** Despachador de artefactos de ingeniería (sin lanzar).
 *  Unión SIMPLE (los 7 kinds con superRefine son ZodEffects — incompatible
 *  con discriminatedUnion); la validación real va por despacho de kind en
 *  validateEngineeringArtifact (errores por campo, como el resto de schemas). */
export const EngineeringArtifactSchema = z.union([
  PromptSystemV1Schema,
  SkillPackV1Schema,
  McpServerManifestV1Schema,
  ToolCollectionV1Schema,
  RagSystemV1Schema,
  KnowledgeBaseV1Schema,
  MultiAgentSystemV1Schema,
  EvaluationDatasetV1Schema,
  HarnessV1Schema,
  FrameworkV1Schema,
]);
export type EngineeringArtifact = z.infer<typeof EngineeringArtifactSchema>;

export type EngineeringArtifactValidationResult =
  | { ok: true; spec: EngineeringArtifact }
  | { ok: false; errors: Record<string, string[]> };

const KIND_SCHEMAS: Record<string, z.ZodTypeAny> = {
  PromptSystem: PromptSystemV1Schema,
  SkillPack: SkillPackV1Schema,
  McpServerManifest: McpServerManifestV1Schema,
  ToolCollection: ToolCollectionV1Schema,
  RagSystem: RagSystemV1Schema,
  KnowledgeBase: KnowledgeBaseV1Schema,
  MultiAgentSystem: MultiAgentSystemV1Schema,
  EvaluationDataset: EvaluationDatasetV1Schema,
  Harness: HarnessV1Schema,
  Framework: FrameworkV1Schema,
};

export function validateEngineeringArtifact(input: unknown): EngineeringArtifactValidationResult {
  const kind = (input as { kind?: unknown } | null)?.kind;
  if (typeof kind !== 'string' || !KIND_SCHEMAS[kind]) {
    return { ok: false, errors: { kind: [`kind de artefacto de ingeniería desconocido: ${String(kind)}`] } };
  }
  const parsed = KIND_SCHEMAS[kind].safeParse(input);
  if (parsed.success) {
    return { ok: true, spec: parsed.data as EngineeringArtifact };
  }
  const errors: Record<string, string[]> = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path.length > 0 ? issue.path.join('.') : '(raíz)';
    (errors[key] ??= []).push(issue.message);
  }
  return { ok: false, errors };
}
