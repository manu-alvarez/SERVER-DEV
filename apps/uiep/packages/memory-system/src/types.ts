import type { MemoryType } from '@uiep/entity-schema';

export interface MemoryEntry {
  id: string;
  content: string;
  type: MemoryType;
  metadata: Record<string, unknown>;
  timestamp: Date;
  embedding?: number[];
  score?: number;
}

export interface MemoryQuery {
  text?: string;
  type?: MemoryType;
  limit?: number;
  minScore?: number;
  filters?: Record<string, unknown>;
}

export interface MemoryStore {
  type: MemoryType;
  add(entry: Omit<MemoryEntry, 'id' | 'timestamp'>): Promise<MemoryEntry>;
  query(query: MemoryQuery): Promise<MemoryEntry[]>;
  get(id: string): Promise<MemoryEntry | null>;
  delete(id: string): Promise<boolean>;
  clear(): Promise<void>;
  size(): Promise<number>;
}
