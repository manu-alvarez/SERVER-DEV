import type { Express, Request, Response } from 'express';
import { timingSafeEqual } from 'node:crypto';
import { createSession, startAgentRun, loadRun } from '../services/agent-runtime.service';
import { startWorkflowRun } from '../services/workflow-runtime.service';
import { loadWorkflowRun } from '../services/workflow-store.service';
import { audit } from '../services/observability.service';

/**
 * Runner (Misión 14) — superficie de EJECUCIÓN para el sandbox.
 *
 * El contenedor uiep-sandbox orquesta las ejecuciones agénticas llamando
 * AQUÍ con un token dedicado (UIEP_RUNNER_TOKEN, timing-safe). Reutiliza los
 * runtimes EXISTENTES (agent-runtime con backpressure, workflow-engine) —
 * no reimplementa nada.
 *
 * Sin UIEP_RUNNER_TOKEN la superficie queda deshabilitada (503) — fail-closed
 * igual que hooks. Los endpoints NUNCA devuelven secretos: los records ya
 * viajan por referencia (env:VAR).
 */

const RUNNER_TOKEN = () => process.env.UIEP_RUNNER_TOKEN || '';

function runnerAuth(req: Request): boolean {
  const token = RUNNER_TOKEN();
  if (!token) {
    return false;
  }
  const h = String(req.headers.authorization || '');
  if (!h.startsWith('Bearer ')) {
    return false;
  }
  const given = Buffer.from(h.slice(7));
  const expected = Buffer.from(token);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

const ID_RE = /^[a-z0-9][a-z0-9-]{2,80}$/;
const EXEC_RE = /^[a-z0-9-]{4,80}$/;

function guard401(res: Response): boolean {
  res.status(503).json({ error: 'runner_disabled' });
  return false;
}

export function registerRunnerRoute(app: Express): void {
  // Arrancar un turno de agente (asíncrono → el sandbox hace polling).
  app.post('/api/runner/agents/:agentSpecId/runs', (req, res) => {
    if (!RUNNER_TOKEN()) {
      return void guard401(res);
    }
    if (!runnerAuth(req)) {
      return void res.status(401).json({ error: 'unauthorized' });
    }
    const agentSpecId = String(req.params.agentSpecId ?? '');
    if (!ID_RE.test(agentSpecId)) {
      return void res.status(400).json({ error: 'invalid_agent_spec_id' });
    }
    const body = (req.body ?? {}) as { input?: unknown };
    const input = typeof body.input === 'string' ? body.input : JSON.stringify(body.input ?? '');
    createSession(agentSpecId)
      .then((s) => {
        if (!s.ok) {
          return void res.status(404).json({ ok: false, reason: s.reason, message: (s as { message?: string }).message });
        }
        startAgentRun(s.session.sessionId, input.slice(0, 4000))
          .then((r) => {
            if (!r.ok) {
              const status = r.reason === 'concurrency_limit' ? 429 : r.reason === 'input_too_large' ? 413 : 404;
              return void res.status(status).json({ ok: false, reason: r.reason });
            }
            audit({ actor: { kind: 'system' }, action: 'runner.agent.start', correlation: { sessionId: s.session.sessionId, agentRunId: r.executionId }, detail: { agentSpecId, chars: input.length } });
            res.status(201).json({ ok: true, executionId: r.executionId, status: r.status });
          })
          .catch((err) => {
            console.error('[UIEP] runner_agent_start_failed', err);
            res.status(500).json({ error: 'runner_agent_failed' });
          });
      })
      .catch((err) => {
        console.error('[UIEP] runner_session_failed', err);
        res.status(500).json({ error: 'runner_session_failed' });
      });
  });

  // Estado de un turno (el sandbox sondea hasta estado terminal).
  app.get('/api/runner/agents/runs/:executionId', (req, res) => {
    if (!RUNNER_TOKEN()) {
      return void guard401(res);
    }
    if (!runnerAuth(req)) {
      return void res.status(401).json({ error: 'unauthorized' });
    }
    const executionId = String(req.params.executionId ?? '');
    if (!EXEC_RE.test(executionId)) {
      return void res.status(400).json({ error: 'invalid_execution_id' });
    }
    loadRun(executionId)
      .then((rec) => {
        if (!rec) {
          return void res.status(404).json({ error: 'run_not_found' });
        }
        res.json({
          record: {
            executionId: rec.executionId,
            agentSpecId: rec.agentSpecId,
            status: rec.status,
            // El TEXTO solo viaja cuando el turno terminó (polling limpio).
            ...(rec.status !== 'running' ? { result: { text: rec.result?.text ?? '' } } : {}),
          },
        });
      })
      .catch((err) => {
        console.error('[UIEP] runner_agent_poll_failed', err);
        res.status(500).json({ error: 'runner_poll_failed' });
      });
  });

  // Arrancar un workflow.
  app.post('/api/runner/workflows/:workflowId/runs', (req, res) => {
    if (!RUNNER_TOKEN()) {
      return void guard401(res);
    }
    if (!runnerAuth(req)) {
      return void res.status(401).json({ error: 'unauthorized' });
    }
    const workflowId = String(req.params.workflowId ?? '');
    if (!ID_RE.test(workflowId)) {
      return void res.status(400).json({ error: 'invalid_workflow_id' });
    }
    const body = (req.body ?? {}) as { input?: unknown };
    const input = typeof body.input === 'string' ? body.input : JSON.stringify(body.input ?? '');
    startWorkflowRun(workflowId, input.slice(0, 4000))
      .then((r) => {
        if (!r.ok) {
          const status = r.reason === 'concurrency_limit' ? 429 : 404;
          return void res.status(status).json({ ok: false, reason: r.reason });
        }
        audit({ actor: { kind: 'system' }, action: 'runner.workflow.start', correlation: { targetId: workflowId }, detail: { workflowRunId: r.workflowRunId, chars: input.length } });
        res.status(201).json({ ok: true, workflowRunId: r.workflowRunId });
      })
      .catch((err) => {
        console.error('[UIEP] runner_workflow_start_failed', err);
        res.status(500).json({ error: 'runner_workflow_failed' });
      });
  });

  // Estado de un workflow run.
  app.get('/api/runner/workflows/runs/:workflowRunId', (req, res) => {
    if (!RUNNER_TOKEN()) {
      return void guard401(res);
    }
    if (!runnerAuth(req)) {
      return void res.status(401).json({ error: 'unauthorized' });
    }
    const workflowRunId = String(req.params.workflowRunId ?? '');
    if (!EXEC_RE.test(workflowRunId)) {
      return void res.status(400).json({ error: 'invalid_workflow_run_id' });
    }
    loadWorkflowRun(workflowRunId)
      .then((rec) => {
        if (!rec) {
          return void res.status(404).json({ error: 'run_not_found' });
        }
        res.json({
          record: {
            workflowRunId: rec.workflowRunId,
            workflowId: rec.workflowId,
            status: rec.status,
            output: rec.status === 'completed' ? (rec.output ?? '') : undefined,
            steps: rec.steps,
          },
        });
      })
      .catch((err) => {
        console.error('[UIEP] runner_workflow_poll_failed', err);
        res.status(500).json({ error: 'runner_poll_failed' });
      });
  });
}
