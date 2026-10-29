import type { EntityType, Framework } from '@uiep/entity-schema';

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  entityType: EntityType[];
  framework: Framework[];
  hooks: PluginHook[];
  permissions: PluginPermission[];
}

export type PluginHook = 
  | 'before-generate'
  | 'after-generate'
  | 'before-verify'
  | 'after-verify'
  | 'before-export'
  | 'after-export'
  | 'on-error';

export type PluginPermission = 
  | 'read-entities'
  | 'write-entities'
  | 'read-memory'
  | 'write-memory'
  | 'execute-code'
  | 'network-access';

export interface PluginContext {
  entityType: EntityType;
  framework: Framework;
  goal: string;
  config: Record<string, unknown>;
}

export interface Plugin {
  manifest: PluginManifest;
  initialize(): Promise<void>;
  execute(hook: PluginHook, context: PluginContext): Promise<PluginContext>;
  cleanup(): Promise<void>;
}

export interface PluginResult {
  success: boolean;
  pluginId: string;
  hook: PluginHook;
  error?: string;
  duration: number;
}
