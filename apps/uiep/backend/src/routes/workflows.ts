import type { Express, Response } from 'express';
import { validateSpec } from '@uiep/agent-spec';
import { bearerAuth, bearerGuard } from '../services/bearer-guard';
import { saveSpec, listSpecs } from '../services/spec-registry.service';
import { loadWorkflow, startWorkflowRun, cancelWorkflowRun, resumeWorkflowRun } from '../services/workflow-runtime.service';
import {
  listWorkflowRuns,
  loadWorkflowRun,
  countWorkflowRuns,
} from '../services/workflow-store.service';

/**
 * Workflow API (Fase 6) — superficie PROTEGIDA (Bearer UIEP_RUNTIME_TOKEN),
 * simétrica al runtime. La consola delega por /api/console/workflows/*.
 *
 *   POST /api/workflows                — registra WorkflowSpec (validación estructural)
 *   GET  /api/workflows                — listado
 *   GET  /api/workflows/:id            — spec (última versión)
 *   POST /api/workflows/:id/run        — ejecución ASÍNCRONA → 202 {workflowRunId}
 *   GET  /api/workflow-runs/:id        — registro completo con pasos por nodo
 *   GET  /api/workflow-runs            — listado (resumen)
 *   POST /api/workflow-runs/:id/cancel — cancelación en el siguiente punto seguro
 *   POST /api/workflow-runs/:id/resume — reanudación desde el primer nodo no completado
 */

const ID_RE = /^[a-z0-9-]{3,80}$/;
const RUN_ID_RE = /^wfr-[a-z0-9-]{3,80}$/;

export function registerWorkflowRoutes(app: Express): void {
  app.post('/api/workflows', (req, res) => {
    if (!bearerGuard(res, bearerAuth(req))) {
      return;
    }
    const result = validateSpec(req.body);
    if (!result.ok) {
      return void res.status(400).json({ error: result.errors });
    }
    if (result.kind !== 'Workflow') {
      return void res.status(400).json({ error: { kind: ['este endpoint registra solo WorkflowSpecs'] } });
    }
    saveSpec(result.spec)
      .then(() => res.status(201).json({ stored: true, id: result.spec.metadata.id, version: result.spec.metadata.version }))
      .catch((err) => {
        console.error('[UIEP] workflow_save_failed', err);
        res.status(500).json({ error: 'workflow_save_failed' });
      });
  });

  app.get('/api/workflows', (req, res) => {
    if (!bearerGuard(res, bearerAuth(req))) {
      return;
    }
    listSpecs({ kind: 'Workflow' })
      .then((w) => res.json(w))
      .catch((err) => {
        console.error('[UIEP] workflow_list_failed', err);
        res.status(500).json({ error: 'workflow_list_failed' });
      });
  });

  app.get('/api/workflows/:id', (req, res) => {
    if (!bearerGuard(res, bearerAuth(req))) {
      return;
    }
    const id = String(req.params.id);
    if (!ID_RE.test(id)) {
      return void res.status(400).json({ error: { id: ['formato de id inválido'] } });
    }
    loadWorkflow(id)
      .then((loaded) => {
        if (!loaded.ok) {
          return void res.status(404).json({ error: loaded.reason, errors: loaded.errors });
        }
        res.json(loaded.spec);
      })
      .catch((err) => {
        console.error('[UIEP] workflow_get_failed', err);
        res.status(500).json({ error: 'workflow_get_failed' });
      });
  });

  app.post('/api/workflows/:id/run', (req, res) => {
    if (!bearerGuard(res, bearerAuth(req))) {
      return;
    }
    const id = String(req.params.id);
    if (!ID_RE.test(id)) {
      return void res.status(400).json({ error: { id: ['formato de id inválido'] } });
    }
    const body = (req.body ?? {}) as { input?: unknown };
    if (typeof body.input !== 'string' || body.input.trim().length === 0) {
      return void res.status(400).json({ error: { input: ['falta la entrada del workflow'] } });
    }
    startWorkflowRun(id, body.input)
      .then((result) => {
        if (!result.ok) {
          return void res.status(result.reason === 'concurrency_limit' ? 429 : result.reason === 'input_too_large' ? 413 : 404).json({ error: result.reason, errors: result.errors });
        }
        res.status(202).json({ workflowRunId: result.workflowRunId });
      })
      .catch((err) => {
        console.error('[UIEP] workflow_run_failed', err);
        res.status(500).json({ error: 'workflow_run_failed' });
      });
  });

  app.get('/api/workflow-runs', (req, res) => {
    if (!bearerGuard(res, bearerAuth(req))) {
      return;
    }
    const count = req.query.count === '1';
    const p = count ? countWorkflowRuns().then((n) => [{ count: n }]) : listWorkflowRuns(25);
    p.then((runs) => res.json(runs)).catch((err) => {
      console.error('[UIEP] workflow_runs_failed', err);
      res.status(500).json({ error: 'workflow_runs_failed' });
    });
  });

  app.get('/api/workflow-runs/:id', (req, res) => {
    if (!bearerGuard(res, bearerAuth(req))) {
      return;
    }
    loadWorkflowRun(String(req.params.id))
      .then((run) => {
        if (!run) {
          return void res.status(404).json({ error: 'run_not_found' });
        }
        res.json(run);
      })
      .catch((err) => {
        console.error('[UIEP] workflow_run_get_failed', err);
        res.status(500).json({ error: 'workflow_run_get_failed' });
      });
  });

  const cancelHandler = (req: { params: { id: string } }, res: Response): void => {
    if (!bearerGuard(res, bearerAuth(req as never))) {
      return;
    }
    const id = String(req.params.id);
    if (!RUN_ID_RE.test(id)) {
      return void res.status(400).json({ error: { id: ['formato de workflowRunId inválido'] } });
    }
    cancelWorkflowRun(id)
      .then((r) => {
        if (!r.ok) {
          return void res.status(409).json({ error: r.reason });
        }
        res.json({ cancelling: true });
      })
      .catch((err) => {
        console.error('[UIEP] workflow_cancel_failed', err);
        res.status(500).json({ error: 'workflow_cancel_failed' });
      });
  };
  const resumeHandler = (req: { params: { id: string } }, res: Response): void => {
    if (!bearerGuard(res, bearerAuth(req as never))) {
      return;
    }
    const id = String(req.params.id);
    if (!RUN_ID_RE.test(id)) {
      return void res.status(400).json({ error: { id: ['formato de workflowRunId inválido'] } });
    }
    resumeWorkflowRun(id)
      .then((r) => {
        if (!r.ok) {
          return void res.status(409).json({ error: r.reason });
        }
        res.json({ resumed: true });
      })
      .catch((err) => {
        console.error('[UIEP] workflow_resume_failed', err);
        res.status(500).json({ error: 'workflow_resume_failed' });
      });
  };

  app.post('/api/workflow-runs/:id/cancel', cancelHandler);
  app.post('/api/workflow-runs/:id/resume', resumeHandler);
}
