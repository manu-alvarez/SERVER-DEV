import { v4 as uuid } from 'uuid';
import type { MemoryStore, MemoryEntry, MemoryQuery } from '../types';

interface EpisodicEvent {
  entry: MemoryEntry;
  importance: number;
  accessCount: number;
}

export class EpisodicMemoryStore implements MemoryStore {
  type = 'episodic' as const;
  private episodes: Map<string, EpisodicEvent> = new Map();
  private maxEpisodes: number;

  constructor(maxEpisodes: number = 500) {
    this.maxEpisodes = maxEpisodes;
  }

  async add(entry: Omit<MemoryEntry, 'id' | 'timestamp'>): Promise<MemoryEntry> {
    const newEntry: MemoryEntry = {
      ...entry,
      id: uuid(),
      timestamp: new Date(),
    };

    if (this.episodes.size >= this.maxEpisodes) {
      this.consolidate();
    }

    this.episodes.set(newEntry.id, {
      entry: newEntry,
      importance: (entry.metadata.importance as number) || 0.5,
      accessCount: 0,
    });

    return newEntry;
  }

  async query(query: MemoryQuery): Promise<MemoryEntry[]> {
    let results = Array.from(this.episodes.values());

    if (query.type) {
      results = results.filter(e => e.entry.type === query.type);
    }

    if (query.text) {
      const lower = query.text.toLowerCase();
      results = results.filter(e => e.entry.content.toLowerCase().includes(lower));
    }

    results.sort((a, b) => {
      const scoreA = a.importance * (1 + a.accessCount * 0.1);
      const scoreB = b.importance * (1 + b.accessCount * 0.1);
      return scoreB - scoreA;
    });

    const limited = results.slice(0, query.limit || 10);

    for (const ep of limited) {
      ep.accessCount++;
    }

    return limited.map(e => ({ ...e.entry, score: e.importance }));
  }

  async get(id: string): Promise<MemoryEntry | null> {
    const episode = this.episodes.get(id);
    if (!episode) return null;
    episode.accessCount++;
    return episode.entry;
  }

  async delete(id: string): Promise<boolean> {
    return this.episodes.delete(id);
  }

  async clear(): Promise<void> {
    this.episodes.clear();
  }

  async size(): Promise<number> {
    return this.episodes.size;
  }

  private consolidate(): void {
    const entries = Array.from(this.episodes.entries());
    entries.sort((a, b) => {
      const scoreA = a[1].importance * (1 + a[1].accessCount * 0.1);
      const scoreB = b[1].importance * (1 + b[1].accessCount * 0.1);
      return scoreA - scoreB;
    });

    const toRemove = entries.slice(0, Math.floor(this.maxEpisodes * 0.2));
    for (const [id] of toRemove) {
      this.episodes.delete(id);
    }
  }
}
