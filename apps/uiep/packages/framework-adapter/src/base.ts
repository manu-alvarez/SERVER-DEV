import type { Framework, EntityType } from '@uiep/entity-schema';
import type { PipelineResult } from '@uiep/design-engine';

export interface AdapterContext {
  pipelineResult: PipelineResult;
  framework: Framework;
  entityType: EntityType;
}

export interface AdapterOutput {
  framework: Framework;
  projectName: string;
  files: AdapterFile[];
  instructions: string;
  dependencies: Record<string, string>;
}

export interface AdapterFile {
  path: string;
  content: string;
  type: 'code' | 'config' | 'documentation' | 'other';
}

export abstract class FrameworkAdapter {
  abstract readonly framework: Framework;
  abstract readonly name: string;
  abstract readonly description: string;

  abstract adapt(ctx: AdapterContext): AdapterOutput;

  protected createFile(path: string, content: string, type: AdapterFile['type'] = 'code'): AdapterFile {
    return { path, content, type };
  }
}
