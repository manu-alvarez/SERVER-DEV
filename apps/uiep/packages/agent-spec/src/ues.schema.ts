import { z } from 'zod';
import { EntityIdSchema, MetadataSchema, SemVerSchema } from './common.schema';

/**
 * UES — Universal Engineering Specification (uiep.io/ues/v1).
 *
 * Contrato común para PROYECTOS COMPUESTOS: un proyecto agrupa artefactos
 * (agentes, workflows, conocimiento, herramientas, …) con dependencias
 * explícitas, configuración, procedencia de generación y ciclo de vida.
 *
 * Principios (Misión 11):
 * · Aditivo: NO sustituye AgentSpec/WorkflowSpec/ToolSpec/ModelProfile/
 *   IntegrationSpec — los REFERENCIA (specRef) o los embebe (Blueprint).
 * · El catálogo distingue esquema soportado / generador disponible /
 *   ejecución disponible / validación disponible. Nadie declara un
 *   artefacto como generable sin generador funcional (ver catalog en
 *   engineering-registry.service).
 * · Sin secretos: la procedencia guarda referencias y hashes, nunca valores.
 */

export const UES_API_VERSION = 'uiep.io/ues/v1' as const;
export const UesApiVersionSchema = z.literal(UES_API_VERSION);

/** Catálogo de tipos de artefacto (Misión 11 §3). Crece por adición. */
export const ArtifactTypeSchema = z.enum([
  'agent',
  'multi-agent-system',
  'workflow',
  'framework',
  'mcp-server',
  'skill-pack',
  'prompt-system',
  'knowledge-base',
  'rag-system',
  'tool-collection',
  'harness',
  'evaluation',
  'application',
  'agentic-app',
  'api-platform',
  'saas',
  'enterprise-architecture',
  'infrastructure-stack',
  'deployment-architecture',
]);
export type ArtifactType = z.infer<typeof ArtifactTypeSchema>;

/** Dependencia entre artefactos (interna al proyecto) o externa (a nivel de proyecto). */
export const ArtifactDependencySchema = z.object({
  ref: z.string().min(1).max(64),
  required: z.boolean().default(true),
  versionRange: z.string().max(32).optional(),
});

/** Procedencia de generación — referencias y hashes, JAMÁS valores sensibles. */
export const ProvenanceSchema = z.object({
  generator: z
    .object({ id: z.string().min(1).max(80), version: SemVerSchema.optional() })
    .optional(),
  model: z
    .object({ provider: z.string().min(1).max(40), model: z.string().min(1).max(80) })
    .optional(),
  inputSpecVersion: z.string().max(40).optional(),
  generatedAt: z.string().datetime().optional(),
  inputHash: z.string().max(80).optional(),
  outputHash: z.string().max(80).optional(),
  validations: z
    .array(
      z.object({
        name: z.string().min(1).max(80),
        passed: z.boolean(),
        at: z.string().datetime().optional(),
      }),
    )
    .max(64)
    .optional(),
  evidence: z
    .array(z.object({ type: z.string().min(1).max(40), ref: z.string().min(1).max(160) }))
    .max(64)
    .optional(),
});
export type Provenance = z.infer<typeof ProvenanceSchema>;

/** Referencia a un spec REGISTRADO en el registry (data/specs, envelope id@version). */
export const RegisteredSpecRefSchema = z.object({
  id: EntityIdSchema,
  /** kinds de specs de RUNTIME (data/specs) + kinds de ARTEFACTO DE
   *  INGENIERÍA (M12: data/engineering/artifacts) — aditivo y compatible:
   *  los documentos v1 existentes siguen siendo válidos. */
  kind: z.enum([
    'Agent',
    'ModelProfile',
    'Tool',
    'Workflow',
    'Integration',
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
  ]),
  version: SemVerSchema.optional(),
});

/** Artefacto dentro de un proyecto UES. */
export const UESArtifactSchema = z.object({
  ref: z.string().min(1).max(64),
  type: ArtifactTypeSchema,
  version: SemVerSchema.default('1.0.0'),
  name: z.string().min(1).max(120).optional(),
  specRef: RegisteredSpecRefSchema.optional(),
  dependencies: z.array(ArtifactDependencySchema).max(32).default([]),
  configuration: z.record(z.string(), z.unknown()).optional(),
  provenance: ProvenanceSchema.optional(),
});
export type UESArtifact = z.infer<typeof UESArtifactSchema>;

/** Estados del ciclo de vida (explícitos y auditables — el histórico vive en el Registry). */
export const LifecycleStateSchema = z.enum([
  'draft',
  'validated',
  'generated',
  'tested',
  'ready',
  'deployed',
  'failed',
  'archived',
]);
export type LifecycleState = z.infer<typeof LifecycleStateSchema>;

export const UESProjectV1Schema = z
  .object({
    apiVersion: UesApiVersionSchema,
    kind: z.literal('Project'),
    metadata: MetadataSchema,
    description: z.string().max(2000).optional(),
    artifacts: z
      .array(UESArtifactSchema)
      .min(1, 'un proyecto UES requiere al menos un artefacto')
      .max(64),
    /** Dependencias EXTERNAS (fuera del proyecto — p. ej. specs registrados). */
    dependencies: z.array(ArtifactDependencySchema).max(32).default([]),
    configuration: z.record(z.string(), z.unknown()).optional(),
    /** Procedencia del proyecto cuando es generado (opcional en proyectos manuales). */
    generation: ProvenanceSchema.optional(),
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
    /** Estado inicial del ciclo de vida (el histórico lo lleva el Registry). */
    lifecycle: z
      .object({
        state: LifecycleStateSchema.default('draft'),
        note: z.string().max(500).optional(),
      })
      .default({ state: 'draft' }),
  })
  .superRefine((doc, ctx) => {
    const seen = new Set<string>();
    const refs = new Set<string>();
    for (const a of doc.artifacts) {
      if (seen.has(a.ref)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['artifacts'], message: `ref de artefacto duplicado: ${a.ref}` });
      }
      seen.add(a.ref);
      refs.add(a.ref);
    }
    for (const a of doc.artifacts) {
      for (const dep of a.dependencies) {
        if (dep.ref === a.ref) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['artifacts'], message: `el artefacto ${a.ref} depende de sí mismo` });
        } else if (!refs.has(dep.ref)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['artifacts'],
            message: `dependencia interna inexistente: ${a.ref} → ${dep.ref} (usa project.dependencies para referencias externas)`,
          });
        }
      }
    }
  });
export type UESProjectV1 = z.infer<typeof UESProjectV1Schema>;

/** Validación estructurada (sin lanzar) — misma convención que validateSpec. */
export type UESValidationResult =
  | { ok: true; spec: UESProjectV1 }
  | { ok: false; errors: Record<string, string[]> };

export function validateUESProject(input: unknown): UESValidationResult {
  const parsed = UESProjectV1Schema.safeParse(input);
  if (parsed.success) {
    return { ok: true, spec: parsed.data };
  }
  const errors: Record<string, string[]> = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path.length > 0 ? issue.path.join('.') : '(raíz)';
    (errors[key] ??= []).push(issue.message);
  }
  return { ok: false, errors };
}
