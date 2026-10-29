import type { Plugin, PluginHook, PluginContext, PluginResult, PluginManifest } from './types';

export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private hookListeners: Map<PluginHook, Set<string>> = new Map();

  async register(plugin: Plugin): Promise<void> {
    await plugin.initialize();
    this.plugins.set(plugin.manifest.id, plugin);

    for (const hook of plugin.manifest.hooks) {
      if (!this.hookListeners.has(hook)) {
        this.hookListeners.set(hook, new Set());
      }
      this.hookListeners.get(hook)!.add(plugin.manifest.id);
    }
  }

  async unregister(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return;

    await plugin.cleanup();

    for (const hook of plugin.manifest.hooks) {
      this.hookListeners.get(hook)?.delete(pluginId);
    }

    this.plugins.delete(pluginId);
  }

  async executeHook(hook: PluginHook, context: PluginContext): Promise<PluginResult[]> {
    const pluginIds = this.hookListeners.get(hook);
    if (!pluginIds || pluginIds.size === 0) {
      return [];
    }

    const results: PluginResult[] = [];
    let currentContext = { ...context };

    for (const pluginId of pluginIds) {
      const plugin = this.plugins.get(pluginId);
      if (!plugin) continue;

      const start = Date.now();
      try {
        currentContext = await plugin.execute(hook, currentContext);
        results.push({
          success: true,
          pluginId,
          hook,
          duration: Date.now() - start,
        });
      } catch (error) {
        results.push({
          success: false,
          pluginId,
          hook,
          error: error instanceof Error ? error.message : 'Unknown error',
          duration: Date.now() - start,
        });
      }
    }

    return results;
  }

  getPlugin(id: string): Plugin | undefined {
    return this.plugins.get(id);
  }

  listPlugins(): PluginManifest[] {
    return Array.from(this.plugins.values()).map(p => p.manifest);
  }

  getPluginsForHook(hook: PluginHook): Plugin[] {
    const pluginIds = this.hookListeners.get(hook) || new Set();
    return Array.from(pluginIds)
      .map(id => this.plugins.get(id))
      .filter((p): p is Plugin => p !== undefined);
  }
}
