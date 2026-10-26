import type { EntityType, AgentRole } from '@uiep/entity-schema';
import type { IntentAnalysisResult } from './intent';
import type { ArchitectureSynthesisResult } from './architecture';

export interface EntityFactoryResult {
  roles: AgentRole[];
  entityBlueprint: {
    type: EntityType;
    name: string;
    description: string;
    systemPrompt: string;
    tools: string[];
    config: Record<string, unknown>;
  };
  interactionPatterns: string[];
}

function buildAgentRoles(entityType: EntityType, arch: ArchitectureSynthesisResult): AgentRole[] {
  const roles: AgentRole[] = [];

  if (entityType === 'agent' || entityType === 'multi-agent-system') {
    roles.push({
      name: 'Main Agent',
      description: 'Primary agent responsible for task execution',
      capabilities: arch.recommendedCapabilities,
      systemPrompt: 'You are a helpful assistant with access to tools.',
    });
  }

  if (entityType === 'multi-agent-system') {
    roles.push(
      {
        name: 'Researcher',
        description: 'Gathers information from various sources',
        capabilities: ['research', 'reasoning'],
        systemPrompt: 'You are a research specialist. Gather accurate information.',
      },
      {
        name: 'Planner',
        description: 'Decomposes complex tasks into actionable steps',
        capabilities: ['planning', 'reasoning'],
        systemPrompt: 'You are a planning specialist. Break down tasks effectively.',
      },
      {
        name: 'Executor',
        description: 'Executes planned tasks using available tools',
        capabilities: ['coding', 'verification'],
        systemPrompt: 'You are an execution specialist. Complete tasks efficiently.',
      },
      {
        name: 'Reviewer',
        description: 'Reviews and validates outputs for quality',
        capabilities: ['evaluation', 'self-critique'],
        systemPrompt: 'You are a quality reviewer. Ensure high standards.',
      },
    );
  }

  if (entityType === 'workflow') {
    roles.push({
      name: 'Workflow Step',
      description: 'A single step in the workflow pipeline',
      capabilities: arch.recommendedCapabilities,
    });
  }

  if (roles.length === 0) {
    roles.push({
      name: 'Default Entity',
      description: 'Generic entity for the specified type',
      capabilities: arch.recommendedCapabilities,
    });
  }

  return roles;
}

function buildSystemPrompt(entityType: EntityType, intent: IntentAnalysisResult): string {
  const base = `You are a ${entityType.replace(/-/g, ' ')} designed to: ${intent.goal}`;

  const constraints = intent.constraints.length > 0
    ? `\nConstraints:\n${intent.constraints.map(c => `- ${c}`).join('\n')}`
    : '';

  const tools = intent.entityType === 'agent' || intent.entityType === 'multi-agent-system'
    ? '\nYou have access to tools. Use them when appropriate.'
    : '';

  return `${base}${constraints}${tools}`;
}

export function factoryEntity(
  intent: IntentAnalysisResult,
  arch: ArchitectureSynthesisResult
): EntityFactoryResult {
  const roles = buildAgentRoles(intent.entityType, arch);

  const entityBlueprint = {
    type: intent.entityType,
    name: intent.refinedGoal,
    description: intent.goal,
    systemPrompt: buildSystemPrompt(intent.entityType, intent),
    tools: arch.toolRecommendations,
    config: {
      framework: intent.framework,
      deployment: intent.deployment,
      autonomyLevel: intent.autonomyLevel,
      quality: intent.quality,
    },
  };

  const interactionPatterns: string[] = [];
  if (intent.entityType === 'multi-agent-system') {
    interactionPatterns.push('supervisor-worker', 'publish-subscribe', 'request-response');
  } else if (intent.entityType === 'agent') {
    interactionPatterns.push('react-loop', 'tool-use');
  } else if (intent.entityType === 'workflow') {
    interactionPatterns.push('pipeline', 'fan-out-fan-in');
  }

  return {
    roles,
    entityBlueprint,
    interactionPatterns,
  };
}
