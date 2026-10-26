import { z } from 'zod';

export const ArchitectureDesignSchema = z.object({
  components: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    description: z.string().optional(),
    dependencies: z.array(z.string()).default([]),
    config: z.record(z.unknown()).default({}),
  })).default([]),

  connections: z.array(z.object({
    from: z.string(),
    to: z.string(),
    type: z.enum(['data', 'control', 'event', 'dependency']).default('data'),
    label: z.string().optional(),
  })).default([]),

  layers: z.array(z.object({
    name: z.string(),
    components: z.array(z.string()),
    description: z.string().optional(),
  })).default([]),

  patterns: z.array(z.string()).default([]),
  constraints: z.array(z.string()).default([]),
});
export type ArchitectureDesign = z.infer<typeof ArchitectureDesignSchema>;

export const GeneratedArtifactSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: z.enum(['code', 'config', 'documentation', 'diagram', 'prompt', 'workflow', 'project']),
  format: z.string(),
  content: z.string(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.date(),
});
export type GeneratedArtifact = z.infer<typeof GeneratedArtifactSchema>;

export const EntityMetadataSchema = z.object({
  version: z.string().default('0.1.0'),
  author: z.string().optional(),
  license: z.string().optional(),
  repository: z.string().optional(),
  tags: z.array(z.string()).default([]),
  qualityScore: z.number().min(0).max(100).optional(),
  generationMethod: z.string().optional(),
  frameworkVersion: z.string().optional(),
});
export type EntityMetadata = z.infer<typeof EntityMetadataSchema>;
