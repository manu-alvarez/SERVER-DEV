/**
 * Golden del pipeline @uiep/design-engine — Fase 0 ETAPA 5.
 *
 * Valores capturados del motor en su estado Fase 0 (determinista, sin LLM) para
 * goal='Research assistant with web search and episodic memory', constraints=['privacy'],
 * entityType='agent'. El id del intent (uuid v4) se normaliza a '<uuid>' antes de comparar.
 */
export const GOLDEN_INPUT = {
  goal: 'Research assistant with web search and episodic memory',
  constraints: ['privacy'],
  entityType: 'agent' as const,
};

/** Campos variables (no deterministas) que se normalizan en la comparación. */
export const VARIABLE_FIELDS = {
  intentId: '<uuid>',
};

export const GOLDEN = {
  intent: {
    id: VARIABLE_FIELDS.intentId,
    goal: 'Research assistant with web search and episodic memory',
    refinedGoal: 'agent for: Research assistant with web search and episodic memory',
    entityType: 'agent',
    abstractionLevel: 'engineering',
    framework: 'openai-agents',
    deployment: 'local',
    autonomyLevel: 'level-0-assistant',
    quality: 'professional',
    constraints: ['privacy'],
    expectedOutputs: ['source-code', 'configuration'],
    risks: [],
    confidence: 0.7,
  },
  factory: {
    roles: [{ name: 'Main Agent' }],
    interactionPatterns: ['react-loop', 'tool-use'],
  },
  architecture: {
    componentIds: ['llm-core', 'memory', 'tools', 'orchestrator'],
    memoryRecommendations: ['working', 'episodic'],
    toolRecommendations: ['web-search', 'code-execution', 'file-operations'],
    securityConsiderations: ['Secret management', 'Audit logging'],
    observabilityPlan: ['Request/response logging', 'Performance metrics', 'Error tracking'],
  },
  generation: {
    artifactNames: ['agent.ts', 'config.json', 'README.md', 'architecture.mmd'],
  },
  verification: {
    passed: true,
    overallScore: 100,
    recommendations: [],
    checks: [
      { name: 'Consistency Check', passed: true, severity: 'info', message: 'All consistency checks passed', score: 100 },
      { name: 'Dependency Check', passed: true, severity: 'info', message: 'All dependencies resolved', score: 100 },
      { name: 'Security Check', passed: true, severity: 'info', message: 'Security review passed', score: 100 },
      { name: 'Quality Check', passed: true, severity: 'info', message: 'Quality standards met', score: 100 },
      { name: 'Output Check', passed: true, severity: 'info', message: 'Output validation passed', score: 100 },
    ],
  },
};
