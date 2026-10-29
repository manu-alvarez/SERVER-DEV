import { v4 as uuid } from 'uuid';
import type { MemoryStore, MemoryEntry, MemoryQuery } from '../types';

export class WorkingMemoryStore implements MemoryStore {
  type = 'working' as const;
  private entries: Map<string, MemoryEntry> = new Map();
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  async add(entry: Omit<MemoryEntry, 'id' | 'timestamp'>): Promise<MemoryEntry> {
    const newEntry: MemoryEntry = {
      ...entry,
      id: uuid(),
      timestamp: new Date(),
    };

    if (this.entries.size >= this.maxSize) {
      const oldest = Array.from(this.entries.values())
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())[0];
      if (oldest) this.entries.delete(oldest.id);
    }

    this.entries.set(newEntry.id, newEntry);
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

    results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return results.slice(0, query.limit || 10);
  }

  async get(id: string): Promise<MemoryEntry | null> {
    return this.entries.get(id) || null;
  }

  async delete(id: string): Promise<boolean> {
    return this.entries.delete(id);
  }

  async clear(): Promise<void> {
    this.entries.clear();
  }

  async size(): Promise<number> {
    return this.entries.size;
  }
}
