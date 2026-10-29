import type { Capability, ArchitectureDesign } from '@uiep/entity-schema';
import type { IntentAnalysisResult } from './intent';

export interface ArchitectureSynthesisResult {
  architecture: ArchitectureDesign;
  recommendedCapabilities: Capability[];
  memoryRecommendations: string[];
  toolRecommendations: string[];
  securityConsiderations: string[];
  observabilityPlan: string[];
}

const CAPABILITY_MAP: Record<string, Capability[]> = {
  agent: ['reasoning', 'planning'],
  'multi-agent-system': ['reasoning', 'planning', 'monitoring'],
  workflow: ['planning', 'evaluation'],
  'mcp-server': ['monitoring'],
  'skill-pack': ['reasoning'],
  'rag-system': ['research', 'reasoning'],
  'knowledge-base': ['research'],
  evaluation: ['evaluation', 'verification'],
  application: ['monitoring'],
  'agentic-app': ['reasoning', 'planning', 'monitoring'],
  saas: ['monitoring', 'security', 'testing'],
};

function buildAgentArchitecture(intent: IntentAnalysisResult): ArchitectureDesign {
  return {
    components: [
      { id: 'llm-core', name: 'LLM Core', type: 'ai-model', description: 'Language model inference', dependencies: [], config: {} },
      { id: 'memory', name: 'Memory Store', type: 'storage', description: 'Working and episodic memory', dependencies: [], config: {} },
      { id: 'tools', name: 'Tool Executor', type: 'executor', description: 'Function calling and tool use', dependencies: [], config: {} },
      { id: 'orchestrator', name: 'Orchestrator', type: 'controller', description: 'Agent loop and control flow', dependencies: [], config: {} },
    ],
    connections: [
      { from: 'orchestrator', to: 'llm-core', type: 'control', label: 'prompts' },
      { from: 'llm-core', to: 'tools', type: 'data', label: 'tool calls' },
      { from: 'tools', to: 'orchestrator', type: 'data', label: 'results' },
      { from: 'orchestrator', to: 'memory', type: 'data', label: 'read/write' },
    ],
    layers: [
      { name: 'Inference', components: ['llm-core'] },
      { name: 'Execution', components: ['tools', 'orchestrator'] },
      { name: 'Storage', components: ['memory'] },
    ],
    patterns: ['ReAct', 'Tool Use'],
    constraints: intent.constraints,
  };
}

function buildMultiAgentArchitecture(intent: IntentAnalysisResult): ArchitectureDesign {
  return {
    components: [
      { id: 'supervisor', name: 'Supervisor Agent', type: 'agent', description: 'Routes tasks to specialized agents', dependencies: [], config: {} },
      { id: 'researcher', name: 'Research Agent', type: 'agent', description: 'Information gathering', dependencies: [], config: {} },
      { id: 'planner', name: 'Planning Agent', type: 'agent', description: 'Task decomposition', dependencies: [], config: {} },
      { id: 'executor', name: 'Execution Agent', type: 'agent', description: 'Task execution', dependencies: [], config: {} },
      { id: 'reviewer', name: 'Review Agent', type: 'agent', description: 'Quality assurance', dependencies: [], config: {} },
      { id: 'message-bus', name: 'Message Bus', type: 'infrastructure', description: 'Inter-agent communication', dependencies: [], config: {} },
      { id: 'shared-memory', name: 'Shared Memory', type: 'storage', description: 'Cross-agent state', dependencies: [], config: {} },
    ],
    connections: [
      { from: 'supervisor', to: 'planner', type: 'control', label: 'decompose' },
      { from: 'planner', to: 'researcher', type: 'control', label: 'research' },
      { from: 'planner', to: 'executor', type: 'control', label: 'execute' },
      { from: 'executor', to: 'reviewer', type: 'data', label: 'results' },
      { from: 'reviewer', to: 'supervisor', type: 'event', label: 'feedback' },
      { from: 'supervisor', to: 'message-bus', type: 'data', label: 'messages' },
      { from: 'message-bus', to: 'shared-memory', type: 'data', label: 'persist' },
    ],
    layers: [
      { name: 'Orchestration', components: ['supervisor', 'message-bus'] },
      { name: 'Specialization', components: ['researcher', 'planner', 'executor', 'reviewer'] },
      { name: 'State', components: ['shared-memory'] },
    ],
    patterns: ['Supervisor', 'Specialization', 'Message Passing'],
    constraints: intent.constraints,
  };
}

function buildWorkflowArchitecture(intent: IntentAnalysisResult): ArchitectureDesign {
  return {
    components: [
      { id: 'trigger', name: 'Trigger', type: 'input', description: 'Workflow trigger', dependencies: [], config: {} },
      { id: 'router', name: 'Router', type: 'logic', description: 'Conditional routing', dependencies: [], config: {} },
      { id: 'processor-a', name: 'Processor A', type: 'transform', description: 'First processing step', dependencies: [], config: {} },
      { id: 'processor-b', name: 'Processor B', type: 'transform', description: 'Second processing step', dependencies: [], config: {} },
      { id: 'output', name: 'Output', type: 'output', description: 'Final output', dependencies: [], config: {} },
    ],
    connections: [
      { from: 'trigger', to: 'router', type: 'control' },
      { from: 'router', to: 'processor-a', type: 'control', label: 'path-a' },
      { from: 'router', to: 'processor-b', type: 'control', label: 'path-b' },
      { from: 'processor-a', to: 'output', type: 'data' },
      { from: 'processor-b', to: 'output', type: 'data' },
    ],
    layers: [
      { name: 'Input', components: ['trigger'] },
      { name: 'Processing', components: ['router', 'processor-a', 'processor-b'] },
      { name: 'Output', components: ['output'] },
    ],
    patterns: ['Pipeline', 'Fan-out'],
    constraints: intent.constraints,
  };
}

function buildGenericArchitecture(intent: IntentAnalysisResult): ArchitectureDesign {
  return {
    components: [
      { id: 'input', name: 'Input Handler', type: 'input', description: 'Receives requests', dependencies: [], config: {} },
      { id: 'core', name: 'Core Logic', type: 'processor', description: 'Main processing', dependencies: [], config: {} },
      { id: 'output', name: 'Output Handler', type: 'output', description: 'Produces results', dependencies: [], config: {} },
    ],
    connections: [
      { from: 'input', to: 'core', type: 'data' },
      { from: 'core', to: 'output', type: 'data' },
    ],
    layers: [
      { name: 'Interface', components: ['input', 'output'] },
      { name: 'Core', components: ['core'] },
    ],
    patterns: ['Layered'],
    constraints: intent.constraints,
  };
}

export function synthesizeArchitecture(intent: IntentAnalysisResult): ArchitectureSynthesisResult {
  let architecture: ArchitectureDesign;

  switch (intent.entityType) {
    case 'agent':
      architecture = buildAgentArchitecture(intent);
      break;
    case 'multi-agent-system':
      architecture = buildMultiAgentArchitecture(intent);
      break;
    case 'workflow':
      architecture = buildWorkflowArchitecture(intent);
      break;
    default:
      architecture = buildGenericArchitecture(intent);
  }

  const recommendedCapabilities = CAPABILITY_MAP[intent.entityType] || ['reasoning'];

  const memoryRecommendations: string[] = [];
  if (intent.entityType === 'agent' || intent.entityType === 'multi-agent-system') {
    memoryRecommendations.push('working', 'episodic');
  }
  if (intent.entityType === 'rag-system' || intent.entityType === 'knowledge-base') {
    memoryRecommendations.push('semantic');
  }
  if (intent.entityType === 'multi-agent-system') {
    memoryRecommendations.push('shared');
  }

  const toolRecommendations: string[] = [];
  if (intent.entityType === 'agent' || intent.entityType === 'multi-agent-system') {
    toolRecommendations.push('web-search', 'code-execution', 'file-operations');
  }
  if (intent.entityType === 'rag-system') {
    toolRecommendations.push('vector-search', 'document-loader');
  }

  const securityConsiderations: string[] = [];
  if (intent.entityType === 'saas') {
    securityConsiderations.push('Authentication required', 'Rate limiting', 'Input validation');
  }
  if (intent.entityType === 'multi-agent-system') {
    securityConsiderations.push('Agent permission boundaries', 'Sandboxed execution');
  }
  securityConsiderations.push('Secret management', 'Audit logging');

  const observabilityPlan = [
    'Request/response logging',
    'Performance metrics',
    'Error tracking',
  ];

  return {
    architecture,
    recommendedCapabilities,
    memoryRecommendations,
    toolRecommendations,
    securityConsiderations,
    observabilityPlan,
  };
}
