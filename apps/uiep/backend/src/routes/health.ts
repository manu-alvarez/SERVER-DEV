import type { Express } from 'express';

/**
 * GET /api/health — contrato exacto del demo (server.js @ 40a1042).
 */
export function registerHealthRoute(app: Express): void {
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'uiep-backend', timestamp: new Date().toISOString() });
  });
}
