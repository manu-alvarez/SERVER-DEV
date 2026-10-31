import type { Express, Request, Response } from 'express';
import { timingSafeEqual } from 'node:crypto';
import { getLatestSpec } from '../services/spec-registry.service';
import { startWorkflowRun } from '../services/workflow-runtime.service';

/**
 * Webhooks ENTRANTES (Fase 7) — puentes de eventos externos hacia workflows.
 *
 *   POST /api/hooks/:hookId   (header x-uiep-hook-token)
 *
 * Cada hookId se define en UIEP_HOOKS (env, formato JSON): hookId →
 * { workflowId, tokenEnv } — el TOKEN viaja POR REFERENCIA (env del
 * despliegue, nunca en el repo). El payload del webhook se entrega como
 * {{input}} del workflow (serializado JSON). Autenticación timing-safe;
 * sin UIEP_HOOKS la superficie queda deshabilitada (503).
 */

interface HookDef {
  workflowId: string
  tokenEnv: string
}

function hooks(): Record<string, HookDef> {
  try {
    const parsed = JSON.parse(process.env.UIEP_HOOKS || '{}') as Record<string, HookDef>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function registerHooksRoute(app: Express): void {
  app.post('/api/hooks/:hookId', (req: Request, res: Response) => {
    const hookId = String(req.params.hookId);
    const def = hooks()[hookId];
    if (!def) {
      return void res.status(404).json({ error: 'hook_not_found' });
    }
    const expected = process.env[def.tokenEnv] ?? '';
    const provided = req.headers['x-uiep-hook-token'] ?? '';
    if (!expected || typeof provided !== 'string' || provided.length !== expected.length || !timingSafeEqual(Buffer.from(provided), Buffer.from(expected))) {
      return void res.status(401).json({ error: 'unauthorized' });
    }
    const payload = JSON.stringify({ hook: hookId, receivedAt: new Date().toISOString(), body: req.body ?? {} });
    // El workflow arranca en background (persistente, 202-style); el webhook
    // responde al instante — el resultado se consulta en la ejecución.
    startWorkflowRun(def.workflowId, payload.slice(0, 4000))
      .then((r) => {
        if (!r.ok) {
          return void res.status(409).json({ error: r.reason });
        }
        res.status(202).json({ accepted: true, workflowRunId: r.workflowRunId });
      })
      .catch((err) => {
        console.error('[UIEP] hook_run_failed', err);
        res.status(500).json({ error: 'hook_run_failed' });
      });
  });
}
