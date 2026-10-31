import { z } from 'zod';
import { ApiVersionSchema, MetadataSchema, SpecKindSchema, ToolRefSchema } from './common.schema';

export const MemoryStrategySchema = z.enum([
  'none',
  'working',
  'episodic',
  'semantic',
  'procedural',
  'shared',
  'graph',
  'hybrid',
]);

export const OrchestrationModeSchema = z.enum(['single-agent', 'supervised-team', 'workflow']);

/** AgentSpec v1 — documento declarativo, versionado e independiente de framework.
 *  Describe QUÉ es el agente; los adaptadores (runtime nativo, LangGraph, CrewAI,
 *  externos) deciden CÓMO se ejecuta. `model.profile` es una referencia a un
 *  ModelProfile (Model Gateway, Fase 2) — nunca un modelo concreto incrustado. */
export const AgentSpecV1Schema = z.object({
  apiVersion: ApiVersionSchema,
  kind: SpecKindSchema,
  metadata: MetadataSchema,
  spec: z
    .object({
      identity: z.object({
        role: z.string().min(1).max(80),
        objective: z.string().min(1).max(2000),
      }),
      model: z.object({
        profile: z.string().min(1).max(80),
      }),
      instructions: z.object({
        system: z.string().min(1).max(20000),
      }),
      capabilities: z.array(z.string().min(1).max(64)).max(32).default([]),
      tools: z.array(ToolRefSchema).max(64).default([]),
      memory: z
        .object({
          enabled: z.boolean().default(false),
          strategy: MemoryStrategySchema.default('none'),
        })
        .default({ enabled: false, strategy: 'none' }),
      orchestration: z
        .object({
          mode: OrchestrationModeSchema.default('single-agent'),
          maxIterations: z.number().int().min(1).max(200).default(8),
        })
        .default({ mode: 'single-agent', maxIterations: 8 }),
      security: z
        .object({
          approvalRequired: z.array(z.string().min(1)).default([]),
        })
        .default({ approvalRequired: [] }),
      evaluation: z
        .object({
          testSuite: z.string().max(120).optional(),
        })
        .default({}),
    })
    .default({
      identity: { role: 'assistant', objective: 'Assist the user' },
      model: { profile: 'default' },
      instructions: { system: 'You are a helpful assistant.' },
    }),
});

export type AgentSpecV1 = z.infer<typeof AgentSpecV1Schema>;
export type AgentSpecMetadata = z.infer<typeof MetadataSchema>;
