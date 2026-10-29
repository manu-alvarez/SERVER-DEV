import type { MemoryType, MemoryConfig } from '@uiep/entity-schema';
import type { MemoryStore, MemoryEntry, MemoryQuery } from './types';
import { WorkingMemoryStore } from './stores/working';
import { EpisodicMemoryStore } from './stores/episodic';
import { SemanticMemoryStore } from './stores/semantic';
import { ProceduralMemoryStore } from './stores/procedural';
import { SharedMemoryStore } from './stores/shared';
import { GraphMemoryStore } from './stores/graph';

export class MemoryManager {
  private stores: Map<MemoryType, MemoryStore> = new Map();

  constructor(config: MemoryConfig) {
    for (const type of config.enabled) {
      this.stores.set(type, this.createStore(type, config));
    }
  }

  private createStore(type: MemoryType, config: MemoryConfig): MemoryStore {
    switch (type) {
      case 'working':
        return new WorkingMemoryStore(config.maxEntries);
      case 'episodic':
        return new EpisodicMemoryStore(config.maxEntries);
      case 'semantic':
        return new SemanticMemoryStore();
      case 'procedural':
        return new ProceduralMemoryStore();
      case 'shared':
        return new SharedMemoryStore();
      case 'graph':
        return new GraphMemoryStore();
      default:
        return new WorkingMemoryStore(config.maxEntries);
    }
  }

  async add(type: MemoryType, entry: Omit<MemoryEntry, 'id' | 'timestamp'>): Promise<MemoryEntry | null> {
    const store = this.stores.get(type);
    if (!store) return null;
    return store.add(entry);
  }

  async query(type: MemoryType, query: MemoryQuery): Promise<MemoryEntry[]> {
    const store = this.stores.get(type);
    if (!store) return [];
    return store.query(query);
  }

  async queryAll(query: MemoryQuery): Promise<MemoryEntry[]> {
    const results: MemoryEntry[] = [];
    for (const [, store] of this.stores) {
      const entries = await store.query(query);
      results.push(...entries);
    }
    results.sort((a, b) => {
      const scoreA = (a as MemoryEntry & { score?: number }).score || 0;
      const scoreB = (b as MemoryEntry & { score?: number }).score || 0;
      return scoreB - scoreA;
    });
    return results.slice(0, query.limit || 10);
  }

  async get(type: MemoryType, id: string): Promise<MemoryEntry | null> {
    const store = this.stores.get(type);
    if (!store) return null;
    return store.get(id);
  }

  async delete(type: MemoryType, id: string): Promise<boolean> {
    const store = this.stores.get(type);
    if (!store) return false;
    return store.delete(id);
  }

  async clear(type?: MemoryType): Promise<void> {
    if (type) {
      const store = this.stores.get(type);
      if (store) await store.clear();
    } else {
      for (const [, store] of this.stores) {
        await store.clear();
      }
    }
  }

  async stats(): Promise<Record<MemoryType, number>> {
    const stats = {} as Record<MemoryType, number>;
    for (const [type, store] of this.stores) {
      stats[type] = await store.size();
    }
    return stats;
  }

  getStore(type: MemoryType): MemoryStore | undefined {
    return this.stores.get(type);
  }

  getAvailableTypes(): MemoryType[] {
    return Array.from(this.stores.keys());
  }
}
