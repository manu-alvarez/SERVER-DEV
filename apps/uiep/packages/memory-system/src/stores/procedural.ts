import { v4 as uuid } from 'uuid';
import type { MemoryStore, MemoryEntry, MemoryQuery } from '../types';

interface ProceduralStep {
  id: string;
  action: string;
  condition?: string;
  next?: string;
}

export class ProceduralMemoryStore implements MemoryStore {
  type = 'procedural' as const;
  private procedures: Map<string, { entry: MemoryEntry; steps: ProceduralStep[] }> = new Map();

  async add(entry: Omit<MemoryEntry, 'id' | 'timestamp'>): Promise<MemoryEntry> {
    const newEntry: MemoryEntry = {
      ...entry,
      id: uuid(),
      timestamp: new Date(),
    };

    const steps = this.parseSteps(entry.content);
    this.procedures.set(newEntry.id, { entry: newEntry, steps });

    return newEntry;
  }

  async query(query: MemoryQuery): Promise<MemoryEntry[]> {
    let results = Array.from(this.procedures.values());

    if (query.type) {
      results = results.filter(p => p.entry.type === query.type);
    }

    if (query.text) {
      const lower = query.text.toLowerCase();
      results = results.filter(p => 
        p.entry.content.toLowerCase().includes(lower) ||
        p.steps.some(s => s.action.toLowerCase().includes(lower))
      );
    }

    return results.slice(0, query.limit || 10).map(p => p.entry);
  }

  async get(id: string): Promise<MemoryEntry | null> {
    const proc = this.procedures.get(id);
    return proc ? proc.entry : null;
  }

  async delete(id: string): Promise<boolean> {
    return this.procedures.delete(id);
  }

  async clear(): Promise<void> {
    this.procedures.clear();
  }

  async size(): Promise<number> {
    return this.procedures.size;
  }

  getSteps(procedureId: string): ProceduralStep[] {
    const proc = this.procedures.get(procedureId);
    return proc ? proc.steps : [];
  }

  private parseSteps(content: string): ProceduralStep[] {
    const lines = content.split('\n').filter(l => l.trim());
    return lines.map((line, i) => ({
      id: `step-${i}`,
      action: line.trim(),
      next: i < lines.length - 1 ? `step-${i + 1}` : undefined,
    }));
  }
}
