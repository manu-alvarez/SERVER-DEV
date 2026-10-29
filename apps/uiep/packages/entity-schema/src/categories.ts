import { z } from 'zod';
import {
  EntityTypeSchema,
  AbstractionLevelSchema,
  FrameworkSchema,
  DeploymentTypeSchema,
  AutonomyLevelSchema,
  QualityLevelSchema,
  OutputFormatSchema,
} from './entity';
import { MemoryConfigSchema, KnowledgeConfigSchema, CapabilitySchema } from './config';
import { EntityMetadataSchema } from './memory';

export const EntityConfigSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),

  entityType: EntityTypeSchema,
  abstractionLevel: AbstractionLevelSchema,
  framework: FrameworkSchema,
  deployment: DeploymentTypeSchema,
  autonomyLevel: AutonomyLevelSchema,
  quality: QualityLevelSchema,

  memory: MemoryConfigSchema,
  knowledge: KnowledgeConfigSchema,
  capabilities: z.array(CapabilitySchema).default([]),
  outputs: z.array(OutputFormatSchema).default([]),

  tags: z.array(z.string()).default([]),
  metadata: EntityMetadataSchema.default({ version: '0.1.0' }),

  createdAt: z.date(),
  updatedAt: z.date(),
});
export type EntityConfig = z.infer<typeof EntityConfigSchema>;

export const EntityConfigInputSchema = EntityConfigSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type EntityConfigInput = z.infer<typeof EntityConfigInputSchema>;
