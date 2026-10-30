import { v4 as uuid } from 'uuid';
import {
  FrameworkSchema,
  type AbstractionLevel,
  type AutonomyLevel,
  type DeploymentType,
  type EntityType,
  type Framework,
  type QualityLevel,
} from '@uiep/entity-schema';

export interface IntentAnalysisInput {
  goal: string;
  context?: string;
  constraints?: string[];
  targetFrameworks?: Framework[];
  entityType?: EntityType;
  abstractionLevel?: AbstractionLevel;
}

export interface IntentAnalysisResult {
  id: string;
  goal: string;
  refinedGoal: string;
  entityType: EntityType;
  abstractionLevel: AbstractionLevel;
  framework: Framework;
  deployment: DeploymentType;
  autonomyLevel: AutonomyLevel;
  quality: QualityLevel;
  constraints: string[];
  expectedOutputs: string[];
  risks: string[];
  confidence: number;
}

const DEFAULT_FRAMEWORK: Framework = 'openai-agents';
const DEFAULT_DEPLOYMENT: DeploymentType = 'local';
const DEFAULT_QUALITY: QualityLevel = 'professional';

/** Catálogo de frameworks que el motor puede seleccionar (fuente única: entity-schema). */
const SUPPORTED_FRAMEWORKS: readonly string[] = FrameworkSchema.options;

/** Error explícito cuando se solicita un framework fuera del catálogo soportado (Fase 0.1). */
export class UnsupportedFrameworkError extends Error {
  readonly name = 'UnsupportedFrameworkError';
  constructor(readonly requested: string) {
    super(
      `Unsupported framework '${requested}'. Supported frameworks: ${SUPPORTED_FRAMEWORKS.join(', ')}`
    );
  }
}

/**
 * Resolución de framework (Fase 0.1 — selección explícita):
 * - Con targetFrameworks explícito: se respeta el PRIMERO, validado contra el catálogo
 *   de entity-schema. Sin fallback silencioso: si no está soportado → UnsupportedFrameworkError.
 * - Sin selección explícita: heurística por defecto del motor (DEFAULT_FRAMEWORK).
 */
function resolveFramework(input: IntentAnalysisInput): Framework {
  const requested = input.targetFrameworks?.[0];
  if (!requested) {
    return DEFAULT_FRAMEWORK;
  }
  if (!SUPPORTED_FRAMEWORKS.includes(requested)) {
    throw new UnsupportedFrameworkError(requested);
  }
  return requested;
}

function inferEntityType(goal: string): EntityType {
  const lower = goal.toLowerCase();
  if (lower.includes('multi-agent') || lower.includes('multiagent')) return 'multi-agent-system';
  if (lower.includes('workflow') || lower.includes('pipeline')) return 'workflow';
  if (lower.includes('mcp') || lower.includes('tool server')) return 'mcp-server';
  if (lower.includes('skill') || lower.includes('capability pack')) return 'skill-pack';
  if (lower.includes('rag') || lower.includes('retrieval')) return 'rag-system';
  if (lower.includes('knowledge') || lower.includes('kb')) return 'knowledge-base';
  if (lower.includes('evaluation') || lower.includes('eval') || lower.includes('harness')) return 'evaluation';
  if (lower.includes('saas') || lower.includes('platform')) return 'saas';
  if (lower.includes('app') || lower.includes('application')) return 'application';
  if (lower.includes('framework') || lower.includes('scaffold')) return 'framework';
  if (lower.includes('prompt') || lower.includes('system prompt')) return 'prompt-system';
  if (lower.includes('tool') || lower.includes('function')) return 'tool-collection';
  return 'agent';
}

function inferAbstractionLevel(goal: string): AbstractionLevel {
  const lower = goal.toLowerCase();
  if (lower.includes('concept') || lower.includes('ideate') || lower.includes('brainstorm')) return 'conceptual';
  if (lower.includes('architecture') || lower.includes('design') || lower.includes('system')) return 'architecture';
  if (lower.includes('implement') || lower.includes('build') || lower.includes('code') || lower.includes('create')) return 'implementation';
  if (lower.includes('deploy') || lower.includes('production') || lower.includes('ship')) return 'production';
  return 'engineering';
}

function inferAutonomyLevel(goal: string): AutonomyLevel {
  const lower = goal.toLowerCase();
  if (lower.includes('autonomous') || lower.includes('self-managing')) return 'level-5-autonomous';
  if (lower.includes('multi-agent') || lower.includes('orchestrat')) return 'level-4-multiagent';
  if (lower.includes('plan') || lower.includes('reason')) return 'level-3-planning';
  if (lower.includes('workflow') || lower.includes('automat')) return 'level-2-workflow';
  if (lower.includes('tool') || lower.includes('function call')) return 'level-1-tool-use';
  return 'level-0-assistant';
}

function extractConstraints(input: IntentAnalysisInput): string[] {
  const constraints = [...(input.constraints || [])];
  const lower = input.goal.toLowerCase();

  if (lower.includes('no external') || lower.includes('local only')) {
    constraints.push('No external API calls');
  }
  if (lower.includes('fast') || lower.includes('low latency')) {
    constraints.push('Low latency requirement');
  }
  if (lower.includes('secure') || lower.includes('security')) {
    constraints.push('Security-first design');
  }
  if (lower.includes('scalable') || lower.includes('scale')) {
    constraints.push('Scalability required');
  }

  return [...new Set(constraints)];
}

function assessRisks(input: IntentAnalysisInput, entityType: EntityType): string[] {
  const risks: string[] = [];

  if (entityType === 'multi-agent-system') {
    risks.push('Agent coordination complexity');
    risks.push('Potential for infinite loops between agents');
  }
  if (entityType === 'rag-system') {
    risks.push('Retrieval quality depends on embedding model');
    risks.push('Context window limitations');
  }
  if (entityType === 'saas') {
    risks.push('Multi-tenancy security');
    risks.push('Scaling costs');
  }
  if (input.goal.toLowerCase().includes('external')) {
    risks.push('External dependency reliability');
  }

  return risks;
}

export function analyzeIntent(input: IntentAnalysisInput): IntentAnalysisResult {
  const entityType = input.entityType || inferEntityType(input.goal);
  const abstractionLevel = input.abstractionLevel || inferAbstractionLevel(input.goal);
  const framework = resolveFramework(input);
  const autonomyLevel = inferAutonomyLevel(input.goal);
  const constraints = extractConstraints(input);
  const risks = assessRisks(input, entityType);

  const expectedOutputs: string[] = [];
  if (abstractionLevel === 'conceptual' || abstractionLevel === 'architecture') {
    expectedOutputs.push('documentation', 'diagram');
  }
  if (abstractionLevel === 'engineering' || abstractionLevel === 'implementation') {
    expectedOutputs.push('source-code', 'configuration');
  }
  if (abstractionLevel === 'production') {
    expectedOutputs.push('source-code', 'docker-compose', 'documentation');
  }

  const confidence = input.context ? 0.85 : 0.7;

  return {
    id: uuid(),
    goal: input.goal,
    refinedGoal: `${entityType} for: ${input.goal}`,
    entityType,
    abstractionLevel,
    framework,
    deployment: DEFAULT_DEPLOYMENT,
    autonomyLevel,
    quality: DEFAULT_QUALITY,
    constraints,
    expectedOutputs,
    risks,
    confidence,
  };
}
