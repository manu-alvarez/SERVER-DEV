import type { Express } from 'express';
import { EntityIdSchema } from '@uiep/agent-spec';
import { validateAgentSpec } from '@uiep/agent-spec';
import { getLatestSpec, listSpecs, saveSpec } from '../services/spec-registry.service';

/**
 * Registro de especificaciones (Fase 1) — endpoints aditivos, no consumidos por
 * el frontend actual, sin tocar los contratos existentes:
 *   POST /api/specs      — registra/actualiza un AgentSpec validado (201)
 *   GET  /api/specs      — listado resumido (200)
 *   GET  /api/specs/:id — documento con la versión más reciente (200/404)
 */
export function registerSpecsRoute(app: Express): void {
  app.post('/api/specs', (req, res) => {
    const result = validateAgentSpec(req.body);
    if (!result.ok) {
      return res.status(400).json({ error: result.errors });
    }
    saveSpec(result.spec)
      .then(() => {
        res.status(201).json({
          stored: true,
          id: result.spec.metadata.id,
          version: result.spec.metadata.version,
        });
      })
      .catch((err) => {
        console.error('[UIEP] spec_store_failed', err);
        res.status(500).json({ error: 'spec_store_failed' });
      });
  });

  app.get('/api/specs', (_req, res) => {
    listSpecs()
      .then((specs) => res.json(specs))
      .catch((err) => {
        console.error('[UIEP] spec_list_failed', err);
        res.status(500).json({ error: 'spec_list_failed' });
      });
  });

  app.get('/api/specs/:id', (req, res) => {
    const id = String(req.params.id);
    // Saneo estricto antes de tocar el sistema de ficheros (evita path traversal).
    if (!EntityIdSchema.safeParse(id).success) {
      return res.status(400).json({ error: { id: ['formato de id inválido'] } });
    }
    getLatestSpec(id)
      .then((spec) => {
        if (!spec) {
          return res.status(404).json({ error: 'spec_not_found' });
        }
        res.json(spec);
      })
      .catch((err) => {
        console.error('[UIEP] spec_get_failed', err);
        res.status(500).json({ error: 'spec_get_failed' });
      });
  });
}
