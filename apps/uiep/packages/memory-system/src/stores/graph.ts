import { v4 as uuid } from 'uuid';
import type { MemoryStore, MemoryEntry, MemoryQuery } from '../types';

interface GraphNode {
  entry: MemoryEntry;
  neighbors: Map<string, { relation: string; weight: number }>;
}

export class GraphMemoryStore implements MemoryStore {
  type = 'graph' as const;
  private nodes: Map<string, GraphNode> = new Map();

  async add(entry: Omit<MemoryEntry, 'id' | 'timestamp'>): Promise<MemoryEntry> {
    const newEntry: MemoryEntry = {
      ...entry,
      id: uuid(),
      timestamp: new Date(),
    };

    this.nodes.set(newEntry.id, {
      entry: newEntry,
      neighbors: new Map(),
    });

    return newEntry;
  }

  async query(query: MemoryQuery): Promise<MemoryEntry[]> {
    let results = Array.from(this.nodes.values());

    if (query.type) {
      results = results.filter(n => n.entry.type === query.type);
    }

    if (query.text) {
      const lower = query.text.toLowerCase();
      results = results.filter(n => n.entry.content.toLowerCase().includes(lower));
    }

    return results.slice(0, query.limit || 10).map(n => n.entry);
  }

  async get(id: string): Promise<MemoryEntry | null> {
    const node = this.nodes.get(id);
    return node ? node.entry : null;
  }

  async delete(id: string): Promise<boolean> {
    const node = this.nodes.get(id);
    if (node) {
      for (const [neighborId] of node.neighbors) {
        const neighbor = this.nodes.get(neighborId);
        if (neighbor) {
          neighbor.neighbors.delete(id);
        }
      }
    }
    return this.nodes.delete(id);
  }

  async clear(): Promise<void> {
    this.nodes.clear();
  }

  async size(): Promise<number> {
    return this.nodes.size;
  }

  addEdge(fromId: string, toId: string, relation: string, weight: number = 1): void {
    const from = this.nodes.get(fromId);
    const to = this.nodes.get(toId);
    if (from && to) {
      from.neighbors.set(toId, { relation, weight });
      to.neighbors.set(fromId, { relation, weight });
    }
  }

  getNeighbors(nodeId: string): MemoryEntry[] {
    const node = this.nodes.get(nodeId);
    if (!node) return [];
    return Array.from(node.neighbors.keys())
      .map(id => this.nodes.get(id)?.entry)
      .filter((e): e is MemoryEntry => e !== undefined);
  }

  traverse(startId: string, maxDepth: number = 3): MemoryEntry[] {
    const visited = new Set<string>();
    const result: MemoryEntry[] = [];
    const queue: { id: string; depth: number }[] = [{ id: startId, depth: 0 }];

    while (queue.length > 0) {
      const { id, depth } = queue.shift()!;
      if (visited.has(id) || depth > maxDepth) continue;
      visited.add(id);

      const node = this.nodes.get(id);
      if (node) {
        result.push(node.entry);
        for (const [neighborId] of node.neighbors) {
          if (!visited.has(neighborId)) {
            queue.push({ id: neighborId, depth: depth + 1 });
          }
        }
      }
    }

    return result;
  }
}
