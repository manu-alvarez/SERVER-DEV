import { embed } from './embedding.service';
import { getBindings, getSource, loadChunksCached, type KnowledgeChunk } from './knowledge-store.service';

/**
 * retrieval-engine (Fase 5) — búsqueda semántica con TRAZABILIDAD.
 *
 * Coseno bruto sobre los chunks de las fuentes AUTORIZADAS del agente
 * (deny-by-default vía bindings). Cada resultado referencia su origen:
 * sourceId, título, ref, idx del fragmento, score y el texto original.
 * Vectores normalizados a la escritura → score = producto escalar.
 *
 * Límites: KNOWLEDGE_RETRIEVAL_TOPK (3), KNOWLEDGE_RETRIEVAL_MIN_SCORE (0.30),
 * KNOWLEDGE_QUERY_MAX_CHARS (2000).
 */

function envLimit(name: string, fallback: number): number {
  const v = Number(process.env[name]);
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

export interface RetrievalHit {
  sourceId: string
  title: string
  ref: string
  chunkIdx: number
  score: number
  text: string
}

export type RetrievalResult =
  | { ok: false; reason: 'query_too_large' | 'no_authorized_sources' | 'embedding_failed'; message?: string }
  | { ok: true; hits: RetrievalHit[]; dims: number };

function dot(a: number[], b: number[]): number {
  let s = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i += 1) {
    s += a[i] * b[i];
  }
  return s;
}

/** Consulta libre (consola): todas las fuentes registradas. */
export async function queryAll(rawQuery: string, topK?: number): Promise<RetrievalResult> {
  const { listSources } = await import('./knowledge-store.service');
  const all = await listSources();
  const ingested = all.filter((s) => s.status === 'ingested').map((s) => s.sourceId);
  return retrieve(rawQuery, ingested, topK);
}

/** Consulta con aislamiento por agente: solo sus fuentes autorizadas. */
export async function retrieveForAgent(agentSpecId: string, rawQuery: string, topK?: number): Promise<RetrievalResult> {
  const bindings = await getBindings();
  const authorized = bindings[agentSpecId] ?? [];
  if (authorized.length === 0) {
    return { ok: false, reason: 'no_authorized_sources' };
  }
  // Solo fuentes que SIGUEN existiendo y están ingested.
  const valid: string[] = [];
  for (const id of authorized) {
    const source = await getSource(id);
    if (source?.status === 'ingested') {
      valid.push(id);
    }
  }
  if (valid.length === 0) {
    return { ok: false, reason: 'no_authorized_sources' };
  }
  return retrieve(rawQuery, valid, topK);
}

/** Núcleo: embed de la consulta + coseno sobre los chunks indicados. */
export async function retrieve(rawQuery: string, sourceIds: string[], topK?: number): Promise<RetrievalResult> {
  if (rawQuery.length > envLimit('KNOWLEDGE_QUERY_MAX_CHARS', 2000)) {
    return { ok: false, reason: 'query_too_large' };
  }
  const k = Math.min(Math.max(1, topK ?? envLimit('KNOWLEDGE_RETRIEVAL_TOPK', 3)), 20);
  const minScore = Number(process.env.KNOWLEDGE_RETRIEVAL_MIN_SCORE) || 0.3;

  const queryVec = await embed([rawQuery.slice(0, 2000)]);
  if (!queryVec.ok || !queryVec.vectors?.[0]) {
    return { ok: false, reason: 'embedding_failed', message: queryVec.error };
  }
  const qv = queryVec.vectors[0];

  const chunks = await loadChunksCached(sourceIds);
  const bySource = new Map<string, KnowledgeChunk[]>();
  for (const chunk of chunks) {
    bySource.set(chunk.sourceId, [...(bySource.get(chunk.sourceId) ?? []), chunk]);
  }

  const scored: RetrievalHit[] = [];
  for (const [sourceId, sourceChunks] of bySource) {
    const source = await getSource(sourceId);
    if (!source) {
      continue;
    }
    for (const chunk of sourceChunks) {
      const score = dot(qv, chunk.vector);
      if (score >= minScore) {
        scored.push({
          sourceId,
          title: source.title,
          ref: source.ref,
          chunkIdx: chunk.idx,
          score: Number(score.toFixed(4)),
          text: chunk.text,
        });
      }
    }
  }
  scored.sort((a, b) => b.score - a.score);
  return { ok: true, hits: scored.slice(0, k), dims: qv.length };
}
