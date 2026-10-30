import { z } from 'zod';

/**
 * Contrato HTTP de entrada de /api/generate — idéntico al demo (server.js @ 40a1042).
 * Cualquier ensanchamiento futuro (Fase 1 AgentSpec) es aditivo, nunca rompe este esquema.
 */
export const GenerateSchema = z.object({
  goal: z.string().min(1),
  type: z
    .enum(['agent', 'subagent', 'system', 'mcp', 'harness', 'adversarial', 'template'])
    .optional(),
  framework: z.enum(['langgraph', 'crewai', 'n8n', 'openai', 'custom']).optional(),
  templateId: z.string().optional(),
});

export type GenerateRequest = z.infer<typeof GenerateSchema>;
