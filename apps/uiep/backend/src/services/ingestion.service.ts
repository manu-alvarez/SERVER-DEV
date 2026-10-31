import { contentHash, embed } from './embedding.service';
import {
  getSource,
  loadSourceContent,
  newKnowledgeSourceId,
  saveChunks,
  saveSource,
  saveSourceContent,
  type KnowledgeChunk,
  type KnowledgeSource,
  type KnowledgeSourceType,
} from './knowledge-store.service';

/**
 * ingestion-pipeline (Fase 5) — extracción → normalización → fragmentación
 * → embeddings → persistencia. Operación IDEMPOTENTE: reingestar el mismo
 * contenido (mismo hash) no recrea chunks. Estados reales: pending →
 * ingesting → ingested | failed (nunca se simula éxito).
 *
 * Límites (env con defaults): KNOWLEDGE_MAX_SOURCES (50),
 * KNOWLEDGE_MAX_CHUNKS_PER_SOURCE (200), KNOWLEDGE_MAX_CHUNK_CHARS (1200),
 * KNOWLEDGE_CHUNK_OVERLAP_CHARS (150), KNOWLEDGE_MAX_TOTAL_CHUNKS (3000),
 * KNOWLEDGE_FETCH_TIMEOUT_MS (15000), KNOWLEDGE_MAX_SOURCE_BYTES (500000).
 */

function envLimit(name: string, fallback: number): number {
  const v = Number(process.env[name]);
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

const MAX_CHUNK_CHARS = envLimit('KNOWLEDGE_MAX_CHUNK_CHARS', 1200);
const OVERLAP_CHARS = envLimit('KNOWLEDGE_CHUNK_OVERLAP_CHARS', 150);
const MAX_CHUNKS_PER_SOURCE = envLimit('KNOWLEDGE_MAX_CHUNKS_PER_SOURCE', 200);
const MAX_TOTAL_CHUNKS = envLimit('KNOWLEDGE_MAX_TOTAL_CHUNKS', 3000);
const FETCH_TIMEOUT_MS = envLimit('KNOWLEDGE_FETCH_TIMEOUT_MS', 15000);
const MAX_SOURCE_BYTES = envLimit('KNOWLEDGE_MAX_SOURCE_BYTES', 500000);

export type CreateSourceResult =
  | { ok: false; reason: 'invalid_source' | 'max_sources_reached'; message?: string }
  | { ok: true; source: KnowledgeSource };

/** Alta de fuente (estado pending; la ingesta es un paso explícito). */
export async function createSource(input: {
  type: KnowledgeSourceType;
  ref?: string;
  title?: string;
  text?: string;
}): Promise<CreateSourceResult> {
  const type = input.type;
  if (type !== 'text' && type !== 'url') {
    return { ok: false, reason: 'invalid_source', message: 'type debe ser text o url' };
  }
  if (type === 'url' && !/^https?:\/\/.+/i.test(input.ref ?? '')) {
    return { ok: false, reason: 'invalid_source', message: 'ref debe ser una URL http(s) válida' };
  }
  if (type === 'text' && (input.text ?? '').trim().length < 20) {
    return { ok: false, reason: 'invalid_source', message: 'text: una fuente textual necesita al menos 20 caracteres' };
  }
  const { listSources } = await import('./knowledge-store.service');
  if ((await listSources()).length >= envLimit('KNOWLEDGE_MAX_SOURCES', 50)) {
    return { ok: false, reason: 'max_sources_reached' };
  }
  const source: KnowledgeSource = {
    sourceId: newKnowledgeSourceId(),
    type,
    ref: type === 'url' ? (input.ref ?? '').trim() : '',
    title: (input.title ?? '').trim().slice(0, 200) || (type === 'url' ? new URL(input.ref!).hostname : 'Fuente textual'),
    status: 'pending',
    chunkCount: 0,
    createdAt: new Date().toISOString(),
  };
  await saveSource(source);
  if (type === 'text') {
    // El contenido crudo se persiste en la creación: la ingesta posterior es
    // re-ejecutable e idempotente sin reenviar el texto.
    await saveSourceContent(source.sourceId, input.text ?? '');
  }
  return { ok: true, source };
}

/* ── Extracción ───────────────────────────────────────────────────────────── */

/** HTML → texto plano mínimo (sin dependencias): fuera script/style/tags. */
function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');
}

/** Extrae el contenido de una fuente URL (las textuales leen su fichero). */
async function extractContent(source: KnowledgeSource): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  if (source.type !== 'url') {
    return { ok: false, error: 'text_source_requires_content' };
  }
  try {
    const res = await fetch(source.ref, {
      headers: { 'user-agent': 'UIEP-Knowledge/1.0 (+ingestion)' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) {
      return { ok: false, error: `fetch_status_${res.status}` };
    }
    const type = res.headers.get('content-type') ?? '';
    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_SOURCE_BYTES) {
      return { ok: false, error: `source_too_large_${MAX_SOURCE_BYTES}` };
    }
    const raw = Buffer.from(buf).toString('utf8');
    const text = type.includes('html') ? htmlToText(raw) : raw;
    return { ok: true, text };
  } catch (err) {
    return { ok: false, error: `fetch_error: ${(err as Error).message}` };
  }
}

/* ── Normalización + fragmentación ────────────────────────────────────────── */

function normalizeText(text: string): string {
  return text.replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

/** Fragmentación por párrafos con presupuesto de caracteres y solape. */
export function fragment(text: string): Array<{ text: string; offset: number }> {
  const clean = normalizeText(text);
  if (clean.length === 0) {
    return [];
  }
  const paragraphs = clean.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const pieces: Array<{ text: string; offset: number }> = [];
  let cursor = 0;
  const push = (t: string, offset: number) => {
    if (t.length > 0) {
      pieces.push({ text: t, offset });
    }
  };
  for (const para of paragraphs) {
    const start = clean.indexOf(para, cursor);
    const paraOffset = start >= 0 ? start : cursor;
    cursor = paraOffset + para.length;
    if (para.length <= MAX_CHUNK_CHARS) {
      // ¿Cabe junto a la pieza anterior (misma ventana)? Solo si no es URL larga.
      push(para, paraOffset);
      continue;
    }
    // Párrafo largo: ventana deslizante con solape.
    let off = 0;
    while (off < para.length) {
      const window = para.slice(off, off + MAX_CHUNK_CHARS);
      if (window.length < 40 && pieces.length > 0) {
        break;
      }
      push(window, paraOffset + off);
      if (off + MAX_CHUNK_CHARS >= para.length) {
        break;
      }
      off += MAX_CHUNK_CHARS - OVERLAP_CHARS;
    }
  }
  return pieces.slice(0, MAX_CHUNKS_PER_SOURCE);
}

/* ── Ingesta ──────────────────────────────────────────────────────────────── */

export type IngestResult =
  | { ok: false; reason: 'source_not_found' | 'invalid_state' | 'extraction_failed' | 'embedding_failed' | 'max_total_chunks'; message?: string }
  | { ok: true; source: KnowledgeSource; skipped: boolean };

/**
 * Ingesta completa de una fuente. Síncrona (MVP: documentos acotados por los
 * límites — peor caso ~200 chunks ≈ segundos). Idempotente por hash.
 */
export async function ingestSource(sourceId: string): Promise<IngestResult> {
  const source = await getSource(sourceId);
  if (!source) {
    return { ok: false, reason: 'source_not_found' };
  }
  if (source.status === 'ingesting') {
    return { ok: false, reason: 'invalid_state', message: 'ingesta ya en curso' };
  }

  // 1) Extracción del contenido crudo.
  let raw: string;
  if (source.type === 'text') {
    const stored = await loadSourceContent(sourceId);
    if (stored === null || stored.trim().length === 0) {
      return { ok: false, reason: 'invalid_state', message: 'la fuente textual no tiene contenido persistido' };
    }
    raw = stored;
  } else {
    const extracted = await extractContent(source);
    if (!extracted.ok) {
      await saveSource({ ...source, status: 'failed', error: extracted.error });
      return { ok: false, reason: 'extraction_failed', message: extracted.error };
    }
    raw = extracted.text;
  }

  // 2) Normalización + idempotencia por hash.
  const normalized = normalizeText(raw);
  const hash = contentHash(normalized);
  const existing = await getSource(sourceId);
  if (existing?.hash === hash && existing.status === 'ingested') {
    return { ok: true, source: existing, skipped: true };
  }

  // 3) Fragmentación + límite global.
  const pieces = fragment(normalized);
  if (pieces.length === 0) {
    await saveSource({ ...source, status: 'failed', error: 'sin contenido fragmentable' });
    return { ok: false, reason: 'extraction_failed', message: 'sin contenido fragmentable' };
  }
  const { listSources, loadChunks } = await import('./knowledge-store.service');
  const all = await listSources();
  const otherChunks = all.filter((s) => s.sourceId !== sourceId).reduce((n, s) => n + s.chunkCount, 0);
  if (otherChunks + pieces.length > MAX_TOTAL_CHUNKS) {
    return { ok: false, reason: 'max_total_chunks', message: `límite ${MAX_TOTAL_CHUNKS} chunks` };
  }

  // 4) Embeddings reales (batch).
  await saveSource({ ...source, status: 'ingesting', hash, error: undefined });
  const vectors = await embed(pieces.map((p) => p.text));
  if (!vectors.ok || !vectors.vectors) {
    const error = vectors.error ?? 'embed_failed';
    await saveSource({ ...(await getSource(sourceId))!, status: 'failed', error });
    return { ok: false, reason: 'embedding_failed', message: error };
  }

  // 5) Persistencia trazable (offset → posición original; hash → contenido).
  const chunks: KnowledgeChunk[] = pieces.map((p, i) => ({
    sourceId,
    idx: i,
    text: p.text,
    hash: contentHash(p.text),
    vector: vectors.vectors![i],
  }));
  await saveChunks(sourceId, chunks);
  const done = await getSource(sourceId);
  const final: KnowledgeSource = {
    ...done!,
    status: 'ingested',
    chunkCount: chunks.length,
    dims: vectors.dims,
    ingestedAt: new Date().toISOString(),
  };
  await saveSource(final);
  return { ok: true, source: final, skipped: false };
}
