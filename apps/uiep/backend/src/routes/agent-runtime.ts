import type { Express, Request, Response } from 'express';
import { timingSafeEqual } from 'node:crypto';
import { EntityIdSchema } from '@uiep/agent-spec';
import {
  createSession,
  getSession,
  loadRun,
  listSessionRuns,
  runAgent,
} from '../services/agent-runtime.service';

/**
 * Agent Runtime (Fase 3) — endpoints NO públicos: protegidos con token Bearer
 * (`UIEP_RUNTIME_TOKEN` del despliegue). Sin token configurado o vacío, el
 * runtime queda DESHABILITADO (503) — seguridad por defecto:
 *
 *   POST /api/runtime/sessions/{id}/run — ejecuta un turno del agente
 *   POST /api/runtime/sessions          — crea sesión para un AgentSpec registrado
 *   GET  /api/runtime/sessions/:id      — sesión + historial + ejecuciones
 *   GET  /api/runtime/runs/:id          — registro de una ejecución
 *
 * Todos los demás endpoints (legacy, specs, profiles) NO cambian.
 */

type AuthState = 'ok' | 'disabled' | 'unauthorized';

function runtimeAuth(req: Request): AuthState {
  const token = process.env.UIEP_RUNTIME_TOKEN;
  if (!token || token.length < 8) {
    return 'disabled';
  }
  const header = req.headers.authorization;
  if (typeof header !== 'string' || !header.startsWith('Bearer ')) {
    return 'unauthorized';
  }
  const provided = header.slice('Bearer '.length);
  if (provided.length !== token.length) {
    return 'unauthorized';
  }
  return timingSafeEqual(Buffer.from(provided), Buffer.from(token)) ? 'ok' : 'unauthorized';
}

function guard(res: Response, state: AuthState): boolean {
  if (state === 'disabled') {
    res.status(503).json({ error: 'runtime_disabled', message: 'UIEP_RUNTIME_TOKEN no configurado en el despliegue' });
    return false;
  }
  if (state === 'unauthorized') {
    res.status(401).json({ error: 'unauthorized' });
    return false;
  }
  return true;
}

const SESSION_ID_RE = /^[a-z0-9-]{3,80}$/;
const EXECUTION_ID_RE = /^run-[a-f0-9]{12}$/;

export function registerAgentRuntimeRoute(app: Express): void {
  app.post('/api/runtime/sessions', (req, res) => {
    if (!guard(res, runtimeAuth(req))) {
      return;
    }
    const body = (req.body ?? {}) as { agentSpecId?: string };
    if (typeof body.agentSpecId !== 'string' || !EntityIdSchema.safeParse(body.agentSpecId).success) {
      return void res.status(400).json({ error: { agentSpecId: ['falta agentSpecId válido'] } });
    }
    createSession(body.agentSpecId)
      .then((result) => {
        if (!result.ok) {
          return void res.status(result.reason === 'profile_not_resolvable' ? 422 : 404).json({
            error: result.reason,
            message: (result as { message?: string }).message,
          });
        }
        res.status(201).json(result.session);
      })
      .catch((err) => {
        console.error('[UIEP] runtime_session_failed', err);
        res.status(500).json({ error: 'session_failed' });
      });
  });

  app.post('/api/runtime/sessions/:id/run', (req, res) => {
    if (!guard(res, runtimeAuth(req))) {
      return;
    }
    const sessionId = String(req.params.id);
    if (!SESSION_ID_RE.test(sessionId)) {
      return void res.status(400).json({ error: { id: ['formato de sessionId inválido'] } });
    }
    const body = (req.body ?? {}) as { input?: unknown };
    if (typeof body.input !== 'string' || body.input.trim().length === 0) {
      return void res.status(400).json({ error: { input: ['falta el mensaje del usuario'] } });
    }
    runAgent(sessionId, body.input)
      .then((result) => {
        if (!result.ok) {
          return void res.status(result.reason === 'session_not_found' ? 404 : 413).json({ error: result.reason });
        }
        res.json(result.record);
      })
      .catch((err) => {
        console.error('[UIEP] runtime_run_failed', err);
        res.status(500).json({ error: 'run_failed' });
      });
  });

  app.get('/api/runtime/sessions/:id', (req, res) => {
    if (!guard(res, runtimeAuth(req))) {
      return;
    }
    const sessionId = String(req.params.id);
    if (!SESSION_ID_RE.test(sessionId)) {
      return void res.status(400).json({ error: { id: ['formato de sessionId inválido'] } });
    }
    Promise.all([getSession(sessionId), listSessionRuns(sessionId)])
      .then(([session, runs]) => {
        if (!session) {
          return void res.status(404).json({ error: 'session_not_found' });
        }
        res.json({ ...session, runs });
      })
      .catch((err) => {
        console.error('[UIEP] runtime_session_get_failed', err);
        res.status(500).json({ error: 'session_get_failed' });
      });
  });

  app.get('/api/runtime/runs/:id', (req, res) => {
    if (!guard(res, runtimeAuth(req))) {
      return;
    }
    const executionId = String(req.params.id);
    if (!EXECUTION_ID_RE.test(executionId)) {
      return void res.status(400).json({ error: { id: ['formato de executionId inválido'] } });
    }
    loadRun(executionId)
      .then((record) => {
        if (!record) {
          return void res.status(404).json({ error: 'run_not_found' });
        }
        res.json(record);
      })
      .catch((err) => {
        console.error('[UIEP] runtime_run_get_failed', err);
        res.status(500).json({ error: 'run_get_failed' });
      });
  });
}
