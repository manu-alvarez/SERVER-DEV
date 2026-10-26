import { z } from 'zod';

export const EntityTypeSchema = z.enum([
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
  'saas',
  'enterprise-arch',
  'other',
]);
export type EntityType = z.infer<typeof EntityTypeSchema>;

export const AbstractionLevelSchema = z.enum([
  'conceptual',
  'architecture',
  'engineering',
  'implementation',
  'production',
]);
export type AbstractionLevel = z.infer<typeof AbstractionLevelSchema>;

export const FrameworkSchema = z.enum([
  'openai-agents',
  'openwebui',
  'flowise',
  'langgraph',
  'crewai',
  'autogen',
  'n8n',
  'claude',
  'gemini',
  'ollama',
  'llamaindex',
  'dspy',
  'custom',
]);
export type Framework = z.infer<typeof FrameworkSchema>;

export const DeploymentTypeSchema = z.enum([
  'local',
  'vps',
  'docker',
  'kubernetes',
  'cloud',
  'hybrid',
]);
export type DeploymentType = z.infer<typeof DeploymentTypeSchema>;

export const AutonomyLevelSchema = z.enum([
  'level-0-assistant',
  'level-1-tool-use',
  'level-2-workflow',
  'level-3-planning',
  'level-4-multiagent',
  'level-5-autonomous',
]);
export type AutonomyLevel = z.infer<typeof AutonomyLevelSchema>;

export const QualityLevelSchema = z.enum([
  'mvp',
  'professional',
  'enterprise',
  'research',
  'mission-critical',
]);
export type QualityLevel = z.infer<typeof QualityLevelSchema>;

export const OutputFormatSchema = z.enum([
  'markdown',
  'html',
  'json',
  'yaml',
  'xml',
  'mermaid',
  'openapi',
  'mcp-manifest',
  'flowise-flow',
  'n8n-workflow',
  'docker-compose',
  'kubernetes',
  'source-code',
  'documentation',
  'zip-project',
]);
export type OutputFormat = z.infer<typeof OutputFormatSchema>;
