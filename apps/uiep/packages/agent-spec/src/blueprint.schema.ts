import { z } from 'zod';
import {
  AgentSpecV1Schema,
  IntegrationSpecV1Schema,
  ModelProfileV1Schema,
  ToolSpecV1Schema,
  WorkflowSpecV1Schema,
} from './index';
import { EntityIdSchema, MetadataSchema, SemVerSchema } from './common.schema';
import { ArtifactDependencySchema, ProvenanceSchema, UesApiVersionSchema, ArtifactTypeSchema } from './ues.schema';

/**
 * Blueprint v1 (uiep.io/ues/v1, kind 'Blueprint') — primer ARTEFACTO COMPUESTO
 * formal de UIEP (Misión 11 §5): describe un conjunto de specs embebidos
 * (Agent/Workflow/Tool/ModelProfile/Integration), conocimiento con bindings,
 * orden de instalación, parámetros, compatibilidad e idempotencia.
 *
 * Migra los blueprints históricos (formato libre `specs`+`knowledge`) sin
 * alterar su comportamiento: mismas specs, mismo conocimiento, mismos bindings.
 */

/** Spec embebido en un blueprint (unión discriminada por kind — sin ambigüedad). */
export const EmbeddedSpecSchema = z.discriminatedUnion('kind', [
  AgentSpecV1Schema,
  WorkflowSpecV1Schema,
  ToolSpecV1Schema,
  ModelProfileV1Schema,
  IntegrationSpecV1Schema,
]);
export type EmbeddedSpec = z.infer<typeof EmbeddedSpecSchema>;

export const UESParameterSchema = z.object({
  name: z.string().min(1).max(64),
  description: z.string().max(300).optional(),
  required: z.boolean().default(false),
  default: z.unknown().optional(),
});
export type UESParameter = z.infer<typeof UESParameterSchema>;

export const BlueprintArtifactSchema = z.object({
  /** Identificador estable del artefacto — DEBE coincidir con spec.metadata.id. */
  id: EntityIdSchema,
  type: ArtifactTypeSchema,
  version: SemVerSchema.default('1.0.0'),
  name: z.string().min(1).max(120).optional(),
  spec: EmbeddedSpecSchema,
  /** Dependencias internas: refs a otros artefactos del MISMO blueprint. */
  dependencies: z.array(ArtifactDependencySchema).max(32).default([]),
  configuration: z.record(z.string(), z.unknown()).optional(),
  provenance: ProvenanceSchema.optional(),
});
export type BlueprintArtifact = z.infer<typeof BlueprintArtifactSchema>;

export const BlueprintKnowledgeSchema = z.object({
  title: z.string().min(1).max(160),
  text: z.string().min(1).max(100_000),
  /** AgentSpec ids (artefactos de este blueprint) a los que se autoriza. */
  bindTo: z.array(EntityIdSchema).max(16).default([]),
});
export type BlueprintKnowledge = z.infer<typeof BlueprintKnowledgeSchema>;

export const BlueprintV1Schema = z
  .object({
    apiVersion: UesApiVersionSchema,
    kind: z.literal('Blueprint'),
    metadata: MetadataSchema,
    title: z.string().min(1).max(120),
    description: z.string().max(2000).optional(),
    parameters: z.array(UESParameterSchema).max(32).default([]),
    artifacts: z.array(BlueprintArtifactSchema).min(1).max(32),
    knowledge: z.array(BlueprintKnowledgeSchema).max(32).default([]),
    /** Orden de instalación — si falta, orden topológico por dependencias. */
    installOrder: z.array(EntityIdSchema).max(32).optional(),
    compatibility: z
      .object({
        minRuntime: z.string().max(32).optional(),
        notes: z.string().max(300).optional(),
      })
      .optional(),
    /** Idempotencia: re-instalar reutiliza fuentes de conocimiento por título. */
    idempotency: z.object({ knowledgeByTitle: z.boolean().default(true) }).default({ knowledgeByTitle: true }),
    provenance: ProvenanceSchema.optional(),
  })
  .superRefine((doc, ctx) => {
    const ids = new Set<string>();
    for (const a of doc.artifacts) {
      if (ids.has(a.id)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['artifacts'], message: `id de artefacto duplicado: ${a.id}` });
      }
      ids.add(a.id);
    }
    for (const a of doc.artifacts) {
      if (a.id !== a.spec.metadata.id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['artifacts'],
          message: `el artefacto ${a.id} debe usar el mismo id que su spec embebido (${a.spec.metadata.id})`,
        });
      }
      for (const dep of a.dependencies) {
        if (dep.ref === a.id) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['artifacts'], message: `el artefacto ${a.id} depende de sí mismo` });
        } else if (!ids.has(dep.ref)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['artifacts'],
            message: `dependencia inexistente dentro del blueprint: ${a.id} → ${dep.ref}`,
          });
        }
      }
    }
    for (const k of doc.knowledge) {
      for (const b of k.bindTo) {
        if (!ids.has(b)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['knowledge'],
            message: `binding a artefacto inexistente: ${k.title} → ${b}`,
          });
        }
      }
    }
    if (doc.installOrder) {
      for (const id of doc.installOrder) {
        if (!ids.has(id)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['installOrder'], message: `installOrder referencia un artefacto inexistente: ${id}` });
        }
      }
    }
  });
export type BlueprintV1 = z.infer<typeof BlueprintV1Schema>;

export type BlueprintValidationResult =
  | { ok: true; spec: BlueprintV1 }
  | { ok: false; errors: Record<string, string[]> };

export function validateBlueprint(input: unknown): BlueprintValidationResult {
  const parsed = BlueprintV1Schema.safeParse(input);
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
