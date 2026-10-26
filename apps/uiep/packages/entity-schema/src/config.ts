import { z } from 'zod';

export const MemoryTypeSchema = z.enum([
  'working',
  'episodic',
  'semantic',
  'procedural',
  'shared',
  'graph',
]);
export type MemoryType = z.infer<typeof MemoryTypeSchema>;

export const MemoryConfigSchema = z.object({
  enabled: z.array(MemoryTypeSchema).default([]),
  backend: z.enum(['in-memory', 'redis', 'postgres', 'vector', 'graph']).default('in-memory'),
  maxEntries: z.number().min(1).default(1000),
  ttlSeconds: z.number().optional(),
  embeddingModel: z.string().optional(),
});
export type MemoryConfig = z.infer<typeof MemoryConfigSchema>;

export const KnowledgeSourceSchema = z.enum([
  'rag-local',
  'web-search',
  'vector-db',
  'graph-db',
  'sql',
  'document-repo',
  'api-knowledge',
  'mcp-knowledge',
]);
export type KnowledgeSource = z.infer<typeof KnowledgeSourceSchema>;

export const KnowledgeConfigSchema = z.object({
  sources: z.array(KnowledgeSourceSchema).default([]),
  vectorStore: z.enum(['chromadb', 'pinecone', 'weaviate', 'qdrant', 'in-memory']).optional(),
  embeddingModel: z.string().default('text-embedding-3-small'),
  chunkSize: z.number().default(512),
  chunkOverlap: z.number().default(50),
  retrieverTopK: z.number().default(5),
});
export type KnowledgeConfig = z.infer<typeof KnowledgeConfigSchema>;

export const CapabilitySchema = z.enum([
  'reasoning',
  'planning',
  'reflection',
  'self-critique',
  'verification',
  'evaluation',
  'simulation',
  'research',
  'coding',
  'architecture',
  'security',
  'testing',
  'monitoring',
]);
export type Capability = z.infer<typeof CapabilitySchema>;

export const ToolDefinitionSchema = z.object({
  name: z.string(),
  description: z.string(),
  parameters: z.record(z.unknown()).optional(),
  returnType: z.string().optional(),
});
export type ToolDefinition = z.infer<typeof ToolDefinitionSchema>;

export const AgentRoleSchema = z.object({
  name: z.string(),
  description: z.string(),
  capabilities: z.array(CapabilitySchema),
  tools: z.array(ToolDefinitionSchema).optional(),
  systemPrompt: z.string().optional(),
});
export type AgentRole = z.infer<typeof AgentRoleSchema>;
