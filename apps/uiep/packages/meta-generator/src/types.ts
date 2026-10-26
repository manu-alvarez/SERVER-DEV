import type { EntityType, Framework } from '@uiep/entity-schema';
import type { PipelineResult, PipelineInput } from '@uiep/design-engine';

export interface GeneratorTemplate {
  id: string;
  name: string;
  description: string;
  entityType: EntityType;
  framework: Framework;
  template: PipelineInput;
  tags: string[];
}

export interface GeneratedGenerator {
  id: string;
  name: string;
  description: string;
  sourceTemplate: GeneratorTemplate;
  output: {
    pipelineResult: PipelineResult;
    code: string;
    config: string;
    documentation: string;
  };
  metadata: {
    generatedAt: Date;
    version: string;
  };
}

export interface MetaGeneratorOutput {
  generators: GeneratedGenerator[];
  summary: string;
  totalGenerated: number;
}
