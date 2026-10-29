import { v4 as uuid } from 'uuid';
import type { MemoryStore, MemoryEntry, MemoryQuery } from '../types';

export class SharedMemoryStore implements MemoryStore {
  type = 'shared' as const;
  private entries: Map<string, MemoryEntry> = new Map();
  private scopes: Map<string, Set<string>> = new Map();

  async add(entry: Omit<MemoryEntry, 'id' | 'timestamp'>, scope: string = 'default'): Promise<MemoryEntry> {
    const newEntry: MemoryEntry = {
      ...entry,
      id: uuid(),
      timestamp: new Date(),
    };

    this.entries.set(newEntry.id, newEntry);

    if (!this.scopes.has(scope)) {
      this.scopes.set(scope, new Set());
    }
    this.scopes.get(scope)!.add(newEntry.id);

    return newEntry;
  }

  async query(query: MemoryQuery): Promise<MemoryEntry[]> {
    let results = Array.from(this.entries.values());

    if (query.type) {
      results = results.filter(e => e.type === query.type);
    }

    if (query.text) {
      const lower = query.text.toLowerCase();
      results = results.filter(e => e.content.toLowerCase().includes(lower));
    }

    if (query.filters?.scope) {
      const scope = query.filters.scope as string;
      const scopeIds = this.scopes.get(scope);
      if (scopeIds) {
        results = results.filter(e => scopeIds.has(e.id));
      }
    }

    results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return results.slice(0, query.limit || 10);
  }

  async get(id: string): Promise<MemoryEntry | null> {
    return this.entries.get(id) || null;
  }

  async delete(id: string): Promise<boolean> {
    for (const [, ids] of this.scopes) {
      ids.delete(id);
    }
    return this.entries.delete(id);
  }

  async clear(): Promise<void> {
    this.entries.clear();
    this.scopes.clear();
  }

  async size(): Promise<number> {
    return this.entries.size;
  }

  getScopes(): string[] {
    return Array.from(this.scopes.keys());
  }
}
