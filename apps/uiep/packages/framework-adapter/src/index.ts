import type { Framework } from '@uiep/entity-schema';
import { type FrameworkAdapter, type AdapterContext, type AdapterOutput } from './base';
import { OpenAIAdapter, LangGraphAdapter, CrewAIAdapter, N8nAdapter, FlowiseAdapter } from './adapters';

class AdapterRegistry {
  private adapters = new Map<Framework, FrameworkAdapter>();

  constructor() {
    this.register(new OpenAIAdapter());
    this.register(new LangGraphAdapter());
    this.register(new CrewAIAdapter());
    this.register(new N8nAdapter());
    this.register(new FlowiseAdapter());
  }

  register(adapter: FrameworkAdapter): void {
    this.adapters.set(adapter.framework, adapter);
  }

  get(framework: Framework): FrameworkAdapter | undefined {
    return this.adapters.get(framework);
  }

  list(): FrameworkAdapter[] {
    return Array.from(this.adapters.values());
  }

  supportedFrameworks(): Framework[] {
    return Array.from(this.adapters.keys());
  }
}

export const registry = new AdapterRegistry();

export function adaptToFramework(ctx: AdapterContext): AdapterOutput {
  const adapter = registry.get(ctx.framework);
  if (!adapter) {
    throw new Error(`No adapter registered for framework: ${ctx.framework}`);
  }
  return adapter.adapt(ctx);
}

export { FrameworkAdapter } from './base';
export type { AdapterContext, AdapterOutput, AdapterFile } from './base';
