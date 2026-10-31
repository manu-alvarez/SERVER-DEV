import type { Express } from 'express';
import { snapshotMetrics, auditTail, logStructured } from '../services/observability.service';
import { globalSlots } from '../services/reliability.service';
import { listIntegrations } from '../services/integration.service';
import { consoleAuth, guard } from './console';

/**
 * Observabilidad (Fase 8) — vista transversal SOLO consola (cookie+CSRF):
 * métricas por plano (integraciones/tools/agentes/workflows/mcp), auditoría
 * reciente, límites vigentes y salud de integraciones. Sin secretos.
 */

export function registerObservabilityRoute(app: Express): void {
  app.get('/api/console/observability', (req, res) => {
    if (!guard(res, consoleAuth(req))) {
      return;
    }
    void (async () => {
      const integrations = await listIntegrations();
      res.json({
        generatedAt: new Date().toISOString(),
        limits: globalSlots(),
        metrics: snapshotMetrics(),
        integrations: integrations.map((i) => ({ id: i.metadata.id, type: i.spec.type, baseUrl: i.spec.baseUrl, authRef: i.spec.auth.secretEnv ?? null })),
        audit: await auditTail(60),
      });
    })().catch((err) => {
      logStructured('error', 'observability', 'overview_failed', {}, { err: String(err) });
      res.status(500).json({ error: 'observability_failed' });
    });
  });
}
