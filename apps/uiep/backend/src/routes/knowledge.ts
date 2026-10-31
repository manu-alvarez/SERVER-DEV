import type { Express } from 'express';
import { createSource, ingestSource } from '../services/ingestion.service';
import { deleteSource, getSource, getBindings, setBindingsForAgent } from '../services/knowledge-store.service';
import { queryAll } from '../services/retrieval.service';
import { bearerAuth, bearerGuard } from '../services/bearer-guard';

/**
 * Knowledge API (Fase 5) — superficie PROTEGIDA con Bearer UIEP_RUNTIME_TOKEN
 * (simétrica al Agent Runtime). La consola del Control Center usa sus propios
 * endpoints delegados (/api/console/knowledge/*, cookie+CSRF) — ningún
 * credential llega al navegador.
 *
 *   POST   /api/knowledge/sources               — alta (text|url) (201)
 *   POST   /api/knowledge/sources/:id/ingest    — ingesta idempotente (200)
 *   GET    /api/knowledge/sources               — listado (200)
 *   GET    /api/knowledge/sources/:id           — detalle + preview de chunks
 *   DELETE /api/knowledge/sources/:id           — borrado en cascada (200)
 *   POST   /api/knowledge/query                 — consulta semántica libre
 *   GET    /api/knowledge/bindings              — mapa agente→fuentes
 *   PUT    /api/knowledge/bindings/:agentSpecId — fijar autorizaciones
 */

const ID_RE = /^[a-z0-9-]{3,80}$/;
const KN_ID_RE = /^kn-[a-z0-9-]{3,80}$/;

export function registerKnowledgeRoute(app: Express): void {
  app.post('/api/knowledge/sources', (req, res) => {
    if (!bearerGuard(res, bearerAuth(req))) return;
    const body = (req.body ?? {}) as { type?: string; ref?: string; title?: string; text?: string };
    createSource({ type: (body.type as 'text' | 'url') ?? 'text', ref: body.ref, title: body.title, text: body.text })
      .then((result) => {
        if (!result.ok) {
          return void res
            .status(result.reason === 'max_sources_reached' ? 429 : 400)
            .json({ error: result.reason, message: result.message });
        }
        res.status(201).json(result.source);
      })
      .catch((err) => {
        console.error('[UIEP] knowledge_source_create_failed', err);
        res.status(500).json({ error: 'source_create_failed' });
      });
  });

  app.post('/api/knowledge/sources/:id/ingest', (req, res) => {
    if (!bearerGuard(res, bearerAuth(req))) return;
    const id = String(req.params.id);
    if (!KN_ID_RE.test(id)) {
      return void res.status(400).json({ error: { id: ['formato de sourceId inválido'] } });
    }
    ingestSource(id)
      .then((result) => {
        if (!result.ok) {
          return void res
            .status(result.reason === 'source_not_found' ? 404 : result.reason === 'max_total_chunks' ? 429 : 422)
            .json({ error: result.reason, message: result.message });
        }
        res.json({ source: result.source, skipped: result.skipped });
      })
      .catch((err) => {
        console.error('[UIEP] knowledge_ingest_failed', err);
        res.status(500).json({ error: 'ingest_failed' });
      });
  });

  app.get('/api/knowledge/sources', (_req, res) => {
    if (!bearerGuard(res, bearerAuth(_req))) return;
    listSourcesWithPreview(0)
      .then((sources) => res.json(sources))
      .catch((err) => {
        console.error('[UIEP] knowledge_sources_failed', err);
        res.status(500).json({ error: 'sources_failed' });
      });
  });

  app.get('/api/knowledge/sources/:id', (req, res) => {
    if (!bearerGuard(res, bearerAuth(req))) return;
    const id = String(req.params.id);
    if (!KN_ID_RE.test(id)) {
      return void res.status(400).json({ error: { id: ['formato de sourceId inválido'] } });
    }
    getSource(id)
      .then(async (source) => {
        if (!source) {
          return void res.status(404).json({ error: 'source_not_found' });
        }
        const { loadChunks } = await import('../services/knowledge-store.service');
        const chunks = await loadChunks(id);
        res.json({ ...source, chunks: chunks.slice(0, 20).map((c) => ({ idx: c.idx, hash: c.hash, preview: c.text.slice(0, 200) })) });
      })
      .catch((err) => {
        console.error('[UIEP] knowledge_source_get_failed', err);
        res.status(500).json({ error: 'source_get_failed' });
      });
  });

  app.delete('/api/knowledge/sources/:id', (req, res) => {
    if (!bearerGuard(res, bearerAuth(req))) return;
    const id = String(req.params.id);
    if (!KN_ID_RE.test(id)) {
      return void res.status(400).json({ error: { id: ['formato de sourceId inválido'] } });
    }
    deleteSource(id)
      .then((deleted) => {
        if (!deleted) {
          return void res.status(404).json({ error: 'source_not_found' });
        }
        res.json({ deleted: true });
      })
      .catch((err) => {
        console.error('[UIEP] knowledge_source_delete_failed', err);
        res.status(500).json({ error: 'source_delete_failed' });
      });
  });

  app.post('/api/knowledge/query', (req, res) => {
    if (!bearerGuard(res, bearerAuth(req))) return;
    const body = (req.body ?? {}) as { query?: unknown; topK?: unknown };
    if (typeof body.query !== 'string' || body.query.trim().length === 0) {
      return void res.status(400).json({ error: { query: ['falta la consulta'] } });
    }
    queryAll(body.query, typeof body.topK === 'number' ? body.topK : undefined)
      .then((result) => {
        if (!result.ok) {
          return void res
            .status(result.reason === 'query_too_large' ? 413 : result.reason === 'no_authorized_sources' ? 404 : 502)
            .json({ error: result.reason, message: result.message });
        }
        res.json(result);
      })
      .catch((err) => {
        console.error('[UIEP] knowledge_query_failed', err);
        res.status(500).json({ error: 'query_failed' });
      });
  });

  app.get('/api/knowledge/bindings', (_req, res) => {
    if (!bearerGuard(res, bearerAuth(_req))) return;
    getBindings()
      .then((b) => res.json(b))
      .catch((err) => {
        console.error('[UIEP] knowledge_bindings_get_failed', err);
        res.status(500).json({ error: 'bindings_get_failed' });
      });
  });

  app.put('/api/knowledge/bindings/:agentSpecId', (req, res) => {
    if (!bearerGuard(res, bearerAuth(req))) return;
    const agentSpecId = String(req.params.agentSpecId);
    if (!ID_RE.test(agentSpecId)) {
      return void res.status(400).json({ error: { agentSpecId: ['formato de agentSpecId inválido'] } });
    }
    const body = (req.body ?? {}) as { sourceIds?: unknown };
    const sourceIds = Array.isArray(body.sourceIds) ? body.sourceIds.filter((s): s is string => typeof s === 'string') : null;
    if (sourceIds === null) {
      return void res.status(400).json({ error: { sourceIds: ['falta el array de sourceIds'] } });
    }
    setBindingsForAgent(agentSpecId, sourceIds)
      .then(() => res.json({ bound: true, agentSpecId, sourceIds }))
      .catch((err) => {
        console.error('[UIEP] knowledge_bindings_set_failed', err);
        res.status(500).json({ error: 'bindings_set_failed' });
      });
  });
}

/** Listado con preview opcional (0 = sin chunks, payload pequeño). */
async function listSourcesWithPreview(chunkPreview: number) {
  const { listSources, loadChunks } = await import('../services/knowledge-store.service');
  const sources = await listSources();
  if (chunkPreview <= 0) {
    return sources;
  }
  return Promise.all(
    sources.map(async (s) => ({
      ...s,
      chunks: (await loadChunks(s.sourceId)).slice(0, chunkPreview).map((c) => ({ idx: c.idx, hash: c.hash, preview: c.text.slice(0, 200) })),
    })),
  );
}
