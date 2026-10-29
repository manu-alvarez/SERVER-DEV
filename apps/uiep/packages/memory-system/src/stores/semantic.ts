import { v4 as uuid } from 'uuid';
import type { MemoryStore, MemoryEntry, MemoryQuery } from '../types';

interface SemanticNode {
  entry: MemoryEntry;
  relations: Set<string>;
  frequency: number;
}

export class SemanticMemoryStore implements MemoryStore {
  type = 'semantic' as const;
  private nodes: Map<string, SemanticNode> = new Map();
  private embeddings: Map<string, number[]> = new Map();

  async add(entry: Omit<MemoryEntry, 'id' | 'timestamp'>): Promise<MemoryEntry> {
    const newEntry: MemoryEntry = {
      ...entry,
      id: uuid(),
      timestamp: new Date(),
    };

    this.nodes.set(newEntry.id, {
      entry: newEntry,
      relations: new Set(),
      frequency: 0,
    });

    if (newEntry.embedding) {
      this.embeddings.set(newEntry.id, newEntry.embedding);
    }

    return newEntry;
  }

  async query(query: MemoryQuery): Promise<MemoryEntry[]> {
    let results = Array.from(this.nodes.values());

    if (query.type) {
      results = results.filter(n => n.entry.type === query.type);
    }

    if (query.text && this.embeddings.size > 0) {
      const queryEmbedding = this.textToEmbedding(query.text);
      results = results.map(n => {
        const emb = this.embeddings.get(n.entry.id);
        if (emb) {
          const score = this.cosineSimilarity(queryEmbedding, emb);
          return { ...n, entry: { ...n.entry, score } };
        }
        return n;
      });
      results.sort((a, b) => (b.entry.score || 0) - (a.entry.score || 0));
    } else {
      results.sort((a, b) => b.frequency - a.frequency);
    }

    return results.slice(0, query.limit || 10).map(n => {
      n.frequency++;
      return n.entry;
    });
  }

  async get(id: string): Promise<MemoryEntry | null> {
    const node = this.nodes.get(id);
    if (!node) return null;
    node.frequency++;
    return node.entry;
  }

  async delete(id: string): Promise<boolean> {
    this.embeddings.delete(id);
    return this.nodes.delete(id);
  }

  async clear(): Promise<void> {
    this.nodes.clear();
    this.embeddings.clear();
  }

  async size(): Promise<number> {
    return this.nodes.size;
  }

  addRelation(fromId: string, toId: string): void {
    const from = this.nodes.get(fromId);
    const to = this.nodes.get(toId);
    if (from && to) {
      from.relations.add(toId);
      to.relations.add(fromId);
    }
  }

  private textToEmbedding(text: string): number[] {
    const hash: number[] = [];
    for (let i = 0; i < 128; i++) {
      hash.push(Math.sin(text.charCodeAt(i % text.length) * (i + 1)) * 0.5 + 0.5);
    }
    return hash;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}
