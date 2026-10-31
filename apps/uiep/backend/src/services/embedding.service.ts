import { createHash } from 'node:crypto';

/**
 * embedding-service (Fase 5) — adaptador de embeddings SUSTITUIBLE.
 *
 * MVP: Ollama `/api/embed` (el modelo viaja por nombre, default
 * `nomic-embed-text:latest` ya presente en el VPS; 768 dims verificados).
 * La interfaz `embed()` es la única dependencia del resto del sistema:
 * cambiar de proveedor (API externa, modelo distinto, SQLite/vec en el
 * índice…) no toca ingestion/retrieval/runtime.
 *
 * Vectores NORMALIZADOS a norma 1 → similitud coseno = producto escalar.
 * Sin secretos: el endpoint viaja por referencia (env:OLLAMA_BASE_URL).
 */

export interface EmbeddingResult {
  ok: boolean;
  vectors?: number[][];
  dims?: number;
  error?: string;
}

function embeddingModel(): string {
  return process.env.UIEP_EMBEDDING_MODEL || 'nomic-embed-text:latest';
}

function embeddingBase(): string {
  return (process.env.OLLAMA_BASE_URL || 'http://172.20.0.1:11434').replace(/\/+$/, '');
}

/** Normaliza a norma euclídea 1 (evita división por cero → vector nulo). */
function normalize(v: number[]): number[] {
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
  return norm > 0 ? v.map((x) => x / norm) : v;
}

export async function embed(texts: string[]): Promise<EmbeddingResult> {
  if (texts.length === 0) {
    return { ok: true, vectors: [], dims: 0 };
  }
  try {
    const res = await fetch(`${embeddingBase()}/api/embed`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ model: embeddingModel(), input: texts }),
      signal: AbortSignal.timeout(60000),
    });
    if (!res.ok) {
      return { ok: false, error: `embed_provider_status_${res.status}` };
    }
    const data = (await res.json()) as { embeddings?: number[][]; embedding?: number[] };
    const raw = data.embeddings ?? (data.embedding ? [data.embedding] : null);
    if (!raw || raw.length !== texts.length || raw.some((v) => !Array.isArray(v) || v.length === 0)) {
      return { ok: false, error: 'embed_provider_shape_invalid' };
    }
    const vectors = raw.map(normalize);
    return { ok: true, vectors, dims: vectors[0].length };
  } catch (err) {
    return { ok: false, error: `embed_provider_error: ${(err as Error).message}` };
  }
}

/** Hash estable del contenido normalizado (idempotencia de ingesta). */
export function contentHash(text: string): string {
  return createHash('sha256').update(text).digest('hex').slice(0, 32);
}
