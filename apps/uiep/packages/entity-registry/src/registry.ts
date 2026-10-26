import { v4 as uuid } from 'uuid';
import type { EntityConfig, EntityType, Framework } from '@uiep/entity-schema';
import type { PipelineResult } from '@uiep/design-engine';

export interface EntityVersion {
  version: string;
  entity: EntityConfig;
  pipelineResult: PipelineResult;
  createdAt: Date;
  changelog?: string;
}

export interface EntityRecord {
  id: string;
  current: EntityConfig;
  versions: EntityVersion[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export class EntityRegistry {
  private entities: Map<string, EntityRecord> = new Map();

  create(entity: EntityConfig, pipelineResult: PipelineResult, changelog?: string): EntityRecord {
    const id = uuid();
    const now = new Date();
    
    const record: EntityRecord = {
      id,
      current: entity,
      versions: [{
        version: entity.metadata.version,
        entity,
        pipelineResult,
        createdAt: now,
        changelog,
      }],
      tags: entity.tags,
      createdAt: now,
      updatedAt: now,
    };

    this.entities.set(id, record);
    return record;
  }

  get(id: string): EntityRecord | undefined {
    return this.entities.get(id);
  }

  update(id: string, entity: EntityConfig, pipelineResult: PipelineResult, changelog?: string): EntityRecord | null {
    const record = this.entities.get(id);
    if (!record) return null;

    record.current = entity;
    record.versions.push({
      version: entity.metadata.version,
      entity,
      pipelineResult,
      createdAt: new Date(),
      changelog,
    });
    record.updatedAt = new Date();

    return record;
  }

  delete(id: string): boolean {
    return this.entities.delete(id);
  }

  list(filter?: {
    type?: EntityType;
    framework?: Framework;
    tags?: string[];
    search?: string;
  }): EntityRecord[] {
    let results = Array.from(this.entities.values());

    if (filter?.type) {
      results = results.filter(r => r.current.entityType === filter.type);
    }
    if (filter?.framework) {
      results = results.filter(r => r.current.framework === filter.framework);
    }
    if (filter?.tags && filter.tags.length > 0) {
      results = results.filter(r => filter.tags!.some(t => r.tags.includes(t)));
    }
    if (filter?.search) {
      const lower = filter.search.toLowerCase();
      results = results.filter(r => 
        r.current.name.toLowerCase().includes(lower) ||
        r.current.description?.toLowerCase().includes(lower)
      );
    }

    return results.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  getVersion(id: string, version: string): EntityVersion | null {
    const record = this.entities.get(id);
    if (!record) return null;
    return record.versions.find(v => v.version === version) || null;
  }

  getHistory(id: string): EntityVersion[] {
    const record = this.entities.get(id);
    if (!record) return [];
    return record.versions;
  }

  search(query: string): EntityRecord[] {
    const lower = query.toLowerCase();
    return Array.from(this.entities.values())
      .filter(r => 
        r.current.name.toLowerCase().includes(lower) ||
        r.current.description?.toLowerCase().includes(lower) ||
        r.tags.some(t => t.toLowerCase().includes(lower))
      )
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  stats(): {
    total: number;
    byType: Record<string, number>;
    byFramework: Record<string, number>;
    totalVersions: number;
  } {
    const entities = Array.from(this.entities.values());
    
    const byType: Record<string, number> = {};
    const byFramework: Record<string, number> = {};
    let totalVersions = 0;

    for (const entity of entities) {
      byType[entity.current.entityType] = (byType[entity.current.entityType] || 0) + 1;
      byFramework[entity.current.framework] = (byFramework[entity.current.framework] || 0) + 1;
      totalVersions += entity.versions.length;
    }

    return {
      total: entities.length,
      byType,
      byFramework,
      totalVersions,
    };
  }
}
