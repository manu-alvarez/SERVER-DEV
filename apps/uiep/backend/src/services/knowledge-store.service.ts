import { promises as fs } from 'node:fs';
import path from 'node:path';

/**
 * knowledge-store (Fase 5) — persistencia de conocimiento documental.
 *
 * MISMA PAUTA que el spec-registry/runtime-store: ficheros JSON con escritura
 * atómica (tmp+rename) en DATA_DIR (cubierto por el backup de Fase 4.2).
 * Índice vectorial MVP: vectores junto al chunk + coseno bruto en proceso
 * (presupuesto: KNOWLEDGE_MAX_TOTAL_CHUNKS=3000 × 768 dims ≈ 9 MB RAM).
 * El reemplazo por SQLite/vec o un motor dedicado solo toca ESTE módulo.
 *
 * Layout:
 *   knowledge/sources.json      → lista de fuentes (estado de ingesta)
 *   knowledge/chunks/<id>.json  → chunks + vectores por fuente
 *   knowledge/bindings.json     → { agentSpecId: [sourceId] } deny-by-default
 */

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const KB_DIR = path.join(DATA_DIR, 'knowledge');
const CHUNKS_DIR = path.join(KB_DIR, 'chunks');
const SOURCES_FILE = path.join(KB_DIR, 'sources.json');
const BINDINGS_FILE = path.join(KB_DIR, 'bindings.json');

export type KnowledgeSourceType = 'text' | 'url';
export type KnowledgeSourceStatus = 'pending' | 'ingesting' | 'ingested' | 'failed';

export interface KnowledgeSource {
  sourceId: string; // kn-…
  type: KnowledgeSourceType;
  ref: string; // '' para text; URL para url
  title: string;
  status: KnowledgeSourceStatus;
  error?: string;
  hash?: string; // sha256 del contenido normalizado (idempotencia)
  chunkCount: number;
  dims?: number;
  createdAt: string;
  ingestedAt?: string;
}

export interface KnowledgeChunk {
  sourceId: string;
  idx: number;
  text: string;
  hash: string;
  vector: number[];
}

/** Bindings agente→fuentes (deny-by-default: ausente = sin acceso). */
export type KnowledgeBindings = Record<string, string[]>;

let ready = false;
async function ensure(): Promise<void> {
  if (!ready) {
    await fs.mkdir(CHUNKS_DIR, { recursive: true });
    ready = true;
  }
}

async function writeAtomic(file: string, data: unknown): Promise<void> {
  const tmp = `${file}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf8');
  await fs.rename(tmp, file);
}

export function newKnowledgeSourceId(): string {
  return `kn-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/* ── Fuentes ──────────────────────────────────────────────────────────────── */

export async function listSources(): Promise<KnowledgeSource[]> {
  await ensure();
  try {
    const list = JSON.parse(await fs.readFile(SOURCES_FILE, 'utf8')) as KnowledgeSource[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export async function getSource(sourceId: string): Promise<KnowledgeSource | null> {
  const list = await listSources();
  return list.find((s) => s.sourceId === sourceId) ?? null;
}

export async function saveSource(source: KnowledgeSource): Promise<void> {
  await ensure();
  const list = await listSources();
  const idx = list.findIndex((s) => s.sourceId === source.sourceId);
  if (idx >= 0) {
    list[idx] = source;
  } else {
    list.push(source);
  }
  await writeAtomic(SOURCES_FILE, list);
}

export async function deleteSource(sourceId: string): Promise<boolean> {
  await ensure();
  const list = await listSources();
  const filtered = list.filter((s) => s.sourceId !== sourceId);
  if (filtered.length === list.length) {
    return false;
  }
  await writeAtomic(SOURCES_FILE, filtered);
  await fs.rm(path.join(CHUNKS_DIR, `${sourceId}.json`), { force: true });
  await deleteSourceContent(sourceId);
  // Limpieza de bindings que apunten a la fuente borrada.
  const bindings = await getBindings();
  let changed = false;
  for (const [agent, sources] of Object.entries(bindings)) {
    const kept = sources.filter((id) => id !== sourceId);
    if (kept.length !== sources.length) {
      if (kept.length === 0) {
        delete bindings[agent];
      } else {
        bindings[agent] = kept;
      }
      changed = true;
    }
  }
  if (changed) {
    await writeAtomic(BINDINGS_FILE, bindings);
    invalidateCache();
  }
  invalidateCache(sourceId);
  return true;
}

/* ── Contenido crudo de fuentes textuales ─────────────────────────────────── */

const CONTENT_DIR = path.join(KB_DIR, 'content');

/** Guarda el contenido original de una fuente textual (creación). */
export async function saveSourceContent(sourceId: string, text: string): Promise<void> {
  await ensure();
  await fs.mkdir(CONTENT_DIR, { recursive: true });
  const tmp = path.join(CONTENT_DIR, `${sourceId}.txt.tmp`);
  await fs.writeFile(tmp, text, 'utf8');
  await fs.rename(tmp, path.join(CONTENT_DIR, `${sourceId}.txt`));
}

export async function loadSourceContent(sourceId: string): Promise<string | null> {
  await ensure();
  try {
    return await fs.readFile(path.join(CONTENT_DIR, `${sourceId}.txt`), 'utf8');
  } catch {
    return null;
  }
}

/** Borra el contenido crudo (cascade delete). */
async function deleteSourceContent(sourceId: string): Promise<void> {
  await fs.rm(path.join(CONTENT_DIR, `${sourceId}.txt`), { force: true });
}

/* ── Chunks ───────────────────────────────────────────────────────────────── */

export async function saveChunks(sourceId: string, chunks: KnowledgeChunk[]): Promise<void> {
  await ensure();
  await writeAtomic(path.join(CHUNKS_DIR, `${sourceId}.json`), chunks);
  invalidateCache(sourceId);
}

export async function loadChunks(sourceId: string): Promise<KnowledgeChunk[]> {
  await ensure();
  try {
    const chunks = JSON.parse(await fs.readFile(path.join(CHUNKS_DIR, `${sourceId}.json`), 'utf8')) as KnowledgeChunk[];
    return Array.isArray(chunks) ? chunks : [];
  } catch {
    return [];
  }
}

/* ── Bindings (deny-by-default) ───────────────────────────────────────────── */

export async function getBindings(): Promise<KnowledgeBindings> {
  await ensure();
  try {
    const b = JSON.parse(await fs.readFile(BINDINGS_FILE, 'utf8')) as KnowledgeBindings;
    return b && typeof b === 'object' ? b : {};
  } catch {
    return {};
  }
}

export async function setBindingsForAgent(agentSpecId: string, sourceIds: string[]): Promise<void> {
  await ensure();
  const bindings = await getBindings();
  if (sourceIds.length === 0) {
    delete bindings[agentSpecId];
  } else {
    bindings[agentSpecId] = [...new Set(sourceIds)];
  }
  await writeAtomic(BINDINGS_FILE, bindings);
}

/* ── Caché en proceso (coseno bruto) ──────────────────────────────────────── */

const cache = new Map<string, KnowledgeChunk[]>();

function invalidateCache(sourceId?: string): void {
  if (sourceId) {
    cache.delete(sourceId);
  } else {
    cache.clear();
  }
}

/** Chunks de las fuentes indicadas (desde caché o disco). Deny-by-default
 *  resuelto por el llamador: solo se pasan sourceIds autorizados. */
export async function loadChunksCached(sourceIds: string[]): Promise<KnowledgeChunk[]> {
  const out: KnowledgeChunk[] = [];
  for (const id of sourceIds) {
    let chunks = cache.get(id);
    if (!chunks) {
      chunks = await loadChunks(id);
      cache.set(id, chunks);
    }
    out.push(...chunks);
  }
  return out;
}
