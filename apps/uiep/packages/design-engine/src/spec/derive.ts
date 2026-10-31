import { API_VERSION, type AgentSpecV1 } from '@uiep/agent-spec';
import type { PipelineResult } from '../pipeline';

/**
 * deriveAgentSpec — Fase 1: el motor produce un documento AgentSpec v1 declarativo,
 * versionado e independiente de framework a partir del resultado del pipeline.
 *
 * Reglas: el spec SIEMPRE valida contra @uiep/agent-spec (los campos de texto se
 * acotan a los límites del contrato y los identificadores se normalizan a slug);
 * ningún valor requiere LLM ni configuración externa. `model.profile` queda como
 * referencia 'default' hasta que el Model Gateway (Fase 2) defina perfiles reales.
 */

const MEMORY_STRATEGIES = new Set([
  'none',
  'working',
  'episodic',
  'semantic',
  'procedural',
  'shared',
  'graph',
]);

function clamp(text: string, max: number): string {
  return text.length <= max ? text : text.slice(0, max);
}

/** Normaliza un nombre de herramienta/capacidad al formato EntityId del contrato. */
function toEntityId(raw: string): string | null {
  const slug = raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug.length >= 3 && slug.length <= 64 ? slug : null;
}

function memoryStrategy(recommendations: string[]): {
  enabled: boolean;
  strategy: AgentSpecV1['spec']['memory']['strategy'];
} {
  if (recommendations.length === 0) {
    return { enabled: false, strategy: 'none' };
  }
  if (recommendations.length > 1) {
    return { enabled: true, strategy: 'hybrid' };
  }
  const single = recommendations[0];
  return {
    enabled: true,
    strategy: (MEMORY_STRATEGIES.has(single) ? single : 'semantic') as AgentSpecV1['spec']['memory']['strategy'],
  };
}

export function deriveAgentSpec(result: PipelineResult): AgentSpecV1 {
  const id = result.intent.id;
  const mainRole =
    result.factory.roles.find((r) => r.name === 'Main Agent') || result.factory.roles[0];

  const capabilities = [
    ...new Set(
      result.architecture.recommendedCapabilities
        .map((c) => toEntityId(c))
        .filter((c): c is string => c !== null),
    ),
  ].slice(0, 32);

  const tools = [
    ...new Set(
      result.architecture.toolRecommendations
        .map((t) => toEntityId(t))
        .filter((t): t is string => t !== null),
    ),
  ].slice(0, 64);

  return {
    apiVersion: API_VERSION,
    kind: 'Agent',
    metadata: {
      id,
      name: `agent-${id.slice(0, 8)}`,
      version: '1.0.0',
      description: clamp(result.intent.refinedGoal, 2000),
      tags: [result.intent.entityType],
      createdAt: new Date().toISOString(),
    },
    spec: {
      identity: {
        role: clamp(mainRole?.name || 'assistant', 80),
        objective: clamp(result.intent.goal, 2000),
      },
      model: { profile: 'default' },
      instructions: {
        system: clamp(mainRole?.systemPrompt || 'You are a helpful assistant.', 20000),
      },
      capabilities,
      tools: tools.map((t) => ({ id: t })),
      memory: memoryStrategy(result.architecture.memoryRecommendations),
      orchestration: { mode: 'single-agent', maxIterations: 8 },
      security: { approvalRequired: [] },
      evaluation: {},
    },
  };
}
