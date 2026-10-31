import type { Express, Request, Response } from 'express';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import rateLimit from 'express-rate-limit';
import { EntityIdSchema, validateSpec } from '@uiep/agent-spec';
import { listToolSpecs } from '../services/tool-registry.service';
import { listSpecs, getLatestSpec, saveSpec, listSpecVersions } from '../services/spec-registry.service';
import { resolveModelRef, modelCapabilities } from '../services/model-gateway.service';
import {
  countRuns,
  countSessions,
  listRuns,
  listSessions,
  loadRun,
  loadSession,
} from '../services/agent-runtime-store.service';
import {
  listSources,
  loadChunks,
  getSource,
  deleteSource,
  getBindings,
  setBindingsForAgent,
} from '../services/knowledge-store.service';
import { createSource, ingestSource } from '../services/ingestion.service';
import { queryAll } from '../services/retrieval.service';
import { listAll as listAllMemories, deleteMemory, isExpired } from '../services/memory-store.service';
import { audit, recordMetric, snapshotMetrics, auditTail, logStructured } from '../services/observability.service';
import { globalSlots } from '../services/reliability.service';
import { loadWorkflow, startWorkflowRun, cancelWorkflowRun, resumeWorkflowRun } from '../services/workflow-runtime.service';
import { listWorkflowRuns, loadWorkflowRun } from '../services/workflow-store.service';
import { listIntegrations, getIntegration, integrationHealth } from '../services/integration.service';
import { mcpListTools } from '../services/mcp-client.service';
import { exportProject, importProject, cloneAgentSpec, installTemplate, listTemplates, type ProjectBundle } from '../services/project.service';
import { createSession, startAgentRun } from '../services/agent-runtime.service';

/**
 * Control Center BFF (Fase 4) — capa de interfaz con autenticación propia.
 *
 * PRINCIPIO CLAVE: `UIEP_RUNTIME_TOKEN` NUNCA llega al navegador. Esta capa
 * autentica al operador con la contraseña de consola del despliegue
 * (`UIEP_CONSOLE_PASSWORD`, gitignored) y entrega una cookie HttpOnly firmada
 * (HMAC-SHA256, 12 h). Los endpoints de control invocan los servicios del
 * runtime DIRECTAMENTE (sin hop HTTP): el BFF actúa de frontera y el token de
 * runtime permanece exclusivamente en el servidor.
 *
 * Seguridad por defecto, igual que el runtime: sin contraseña configurada
 * (≥8 chars) los endpoints de consola devuelven 503 console_disabled.
 * Mutaciones exigen el header `x-uiep-console: 1` (anti-CSRF: la cookie
 * SameSite=Lax no viaja en POST cruzados y el header lo refuerza). Fallos de
 * login añaden espera fija (frena fuerza bruta). Sin secretos en logs.
 *
 *   POST /api/console/auth/login        — {password} → cookie de sesión
 *   GET  /api/console/auth/session      — ¿sesión válida? {authenticated}
 *   POST /api/console/auth/logout       — borra la cookie del navegador
 *   GET  /api/console/overview          — estado para el Dashboard
 *   GET  /api/console/tools             — ToolSpecs completos (permisos/adapter)
 *   GET  /api/console/sessions[/:id]    — sesiones con su historial
 *   GET  /api/console/runs[/:id]        — ejecuciones (resumen / registro completo)
 *   POST /api/console/runtime/sessions  — crea sesión
 *   POST /api/console/runtime/sessions/:id/run — turno ASÍNCRONO → 202 {executionId}
 *
 * sweepInterruptedRuns se ejecuta al arrancar (server.ts), no es un endpoint.
 */

const COOKIE_NAME = 'uiep_console';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 h
const CSRF_HEADER = 'x-uiep-console';
const ID_RE = /^[a-z0-9-]{3,80}$/;
const RUN_ID_RE = /^run-[a-z0-9-]{3,80}$/;

/** Límites anti fuerza bruta del login de consola (Fase 4.2), por IP.
 *  El proxy edge (Traefik) reemplaza el X-Forwarded-For entrante por la IP
 *  real del cliente y el backend confía SOLO en el bridge docker
 *  (PRODUCTION_TRUST_PROXY): el contador es por cliente, no por proxy. */
function envLimit(name: string, fallback: number): number {
  const v = Number(process.env[name]);
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

const loginLimiter = rateLimit({
  windowMs: envLimit('LOGIN_RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
  limit: envLimit('LOGIN_RATE_LIMIT_MAX', 5),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'too_many_attempts', message: 'demasiados intentos de login; reintenta cuando expire la ventana' },
});

function readCookie(req: Request, name: string): string | null {
  const header = req.headers.cookie;
  if (!header) {
    return null;
  }
  for (const part of header.split(/; */)) {
    const eq = part.indexOf('=');
    if (eq <= 0) {
      continue;
    }
    if (part.slice(0, eq).trim() === name) {
      const raw = part.slice(eq + 1).trim();
      try {
        return decodeURIComponent(raw);
      } catch {
        return raw;
      }
    }
  }
  return null;
}

function consolePassword(): string | null {
  const password = process.env.UIEP_CONSOLE_PASSWORD || '';
  return password.length >= 8 ? password : null;
}

/** MAC de la cookie: HMAC-SHA256 con clave derivada (SHA-256 del seed). La cookie no contiene la contraseña. */
function consoleSecret(): string {
  const seed = process.env.UIEP_CONSOLE_PASSWORD || '';
  return createHash('sha256').update(`uiep-console-v1:${seed}`).digest('hex');
}

function sign(exp: number, secret: string): string {
  return createHmac('sha256', secret).update(String(exp)).digest('hex');
}

function issueToken(): { token: string; expiresAt: string } {
  const exp = Date.now() + SESSION_TTL_MS;
  return { token: `${exp}.${sign(exp, consoleSecret())}`, expiresAt: new Date(exp).toISOString() };
}

function verifyToken(token: string | null): { ok: true; expiresAt: string } | { ok: false } {
  if (!token) {
    return { ok: false };
  }
  const dot = token.indexOf('.');
  if (dot <= 0) {
    return { ok: false };
  }
  const exp = Number(token.slice(0, dot));
  const sig = token.slice(dot + 1);
  if (!Number.isFinite(exp) || exp < Date.now()) {
    return { ok: false };
  }
  const expected = sign(exp, consoleSecret());
  if (sig.length !== expected.length) {
    return { ok: false };
  }
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    return { ok: false };
  }
  return { ok: true, expiresAt: new Date(exp).toISOString() };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type ConsoleState = 'ok' | 'disabled' | 'unauthorized' | 'csrf';

function consoleAuth(req: Request): ConsoleState {
  if (!consolePassword()) {
    return 'disabled';
  }
  if (!verifyToken(readCookie(req, COOKIE_NAME)).ok) {
    return 'unauthorized';
  }
  if (req.method !== 'GET' && req.headers[CSRF_HEADER] !== '1') {
    return 'csrf';
  }
  return 'ok';
}

function guard(res: Response, state: ConsoleState): boolean {
  if (state === 'disabled') {
    res.status(503).json({ error: 'console_disabled', message: 'UIEP_CONSOLE_PASSWORD no configurado en el despliegue' });
    return false;
  }
  if (state === 'csrf') {
    res.status(403).json({ error: 'csrf_header_missing' });
    return false;
  }
  if (state === 'unauthorized') {
    res.status(401).json({ error: 'unauthorized' });
    return false;
  }
  return true;
}

function setSessionCookie(res: Response, req: Request, token: string): void {
  // HttpOnly + SameSite=Lax; Secure cuando el traecto llega por HTTPS
  // (producción: Traefik → proxy → backend con X-Forwarded-Proto).
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: req.secure === true,
    maxAge: SESSION_TTL_MS,
  });
}

/** Resumen compacto de run para listados de la interfaz (payload pequeño). */
type RunLike = {
  executionId: string;
  sessionId: string;
  agentSpecId: string;
  status: string;
  startedAt: string;
  finishedAt?: string;
  result: {
    iterations?: number;
    durationMs?: number;
    toolExecutions?: Array<{ ok?: boolean }>;
    retrievals?: Array<{ sourceId: string; title: string; ref: string; chunkIdx: number; score: number }>;
    citations?: Array<{ ref: number; verified: boolean; sourceId: string | null; chunkIdx: number | null; score: number | null }>;
    text?: string;
  };
};

function summarizeRun(run: RunLike) {
  const tools = run.result.toolExecutions ?? [];
  return {
    executionId: run.executionId,
    sessionId: run.sessionId,
    agentSpecId: run.agentSpecId,
    status: run.status,
    startedAt: run.startedAt,
    finishedAt: run.finishedAt,
    durationMs: run.result.durationMs,
    iterations: run.result.iterations ?? 0,
    toolCount: tools.length,
    toolFailures: tools.filter((t) => t.ok === false).length,
    retrievalCount: run.result.retrievals?.length ?? 0,
    citations: run.result.citations?.map((c) => ({ ref: c.ref, verified: c.verified })),
    textPreview: (run.result.text ?? '').slice(0, 140),
  };
}

export function registerConsoleRoute(app: Express): void {
  /* ── Autenticación de consola ───────────────────────────────────────────── */

  app.post('/api/console/auth/login', loginLimiter, (req, res) => {
    const configured = consolePassword();
    if (!configured) {
      return void res.status(503).json({ error: 'console_disabled' });
    }
    const password = (req.body as { password?: unknown } | undefined)?.password;
    if (typeof password !== 'string' || password.length === 0) {
      return void res.status(400).json({ error: { password: ['falta la contraseña'] } });
    }
    const expectedBuf = Buffer.from(configured);
    const providedBuf = Buffer.from(password);
    if (providedBuf.length !== expectedBuf.length || !timingSafeEqual(providedBuf, expectedBuf)) {
      audit({ actor: { kind: 'console' }, action: 'login.failed' });
      // Espera fija al fallo: no deja medir el timing de la comparación.
      void sleep(700).then(() => {
        if (!res.writableEnded) {
          res.status(401).json({ error: 'unauthorized' });
        }
      });
      return;
    }
    audit({ actor: { kind: 'console' }, action: 'login.ok' });
    const issued = issueToken();
    setSessionCookie(res, req, issued.token);
    res.json({ authenticated: true, expiresAt: issued.expiresAt });
  });

  app.get('/api/console/auth/session', (req, res) => {
    if (!consolePassword()) {
      return void res.status(503).json({ error: 'console_disabled' });
    }
    const verdict = verifyToken(readCookie(req, COOKIE_NAME));
    if (!verdict.ok) {
      return void res.status(401).json({ authenticated: false });
    }
    res.json({ authenticated: true, expiresAt: verdict.expiresAt });
  });

  app.post('/api/console/auth/logout', (req, res) => {
    // Logout sin credencial: borra la cookie del navegador. El TTL de 12 h
    // acota el riesgo; reconfigurar la contraseña invalida todas las sesiones
    // (la MAC cambia con el secreto derivado).
    res.clearCookie(COOKIE_NAME, { path: '/' });
    res.json({ authenticated: false });
  });

  /* ── Dashboard ──────────────────────────────────────────────────────────── */

  app.get('/api/console/overview', (req, res) => {
    if (!guard(res, consoleAuth(req))) {
      return;
    }
    (async () => {
      const [agents, profiles, tools, sessionCount, runCount, runs] = await Promise.all([
        listSpecs({ kind: 'Agent' }),
        listSpecs({ kind: 'ModelProfile' }),
        listToolSpecs(),
        countSessions(),
        countRuns(),
        listRuns(8),
      ]);
      // Disponibilidad REAL del proveedor (primer perfil registrado) con
      // timeout corto — no bloquea el dashboard si el proveedor está caído.
      let ollama: { ok: boolean; model?: string; modelId?: string; capabilities?: string[] | null };
      try {
        const resolved = profiles.length > 0 ? await resolveModelRef(profiles[0].id) : null;
        const caps = resolved?.ok ? await modelCapabilities(resolved.profile) : null;
        ollama = resolved?.ok
          ? { ok: true, model: resolved.profile.spec.model, modelId: resolved.profile.metadata.id, capabilities: caps }
          : { ok: false };
      } catch {
        ollama = { ok: false };
      }
      res.json({
        generatedAt: new Date().toISOString(),
        services: {
          backend: {
            ok: true,
            node: process.version,
            uptimeSec: Math.round(process.uptime()),
            runtimeTokenConfigured: Boolean(process.env.UIEP_RUNTIME_TOKEN && process.env.UIEP_RUNTIME_TOKEN.length >= 8),
            consoleConfigured: Boolean(consolePassword()),
          },
          ollama,
        },
        counts: { agents: agents.length, profiles: profiles.length, tools: tools.length, sessions: sessionCount, runs: runCount },
        agents: agents.slice(0, 8).map((a) => ({ id: a.id, name: a.name, version: a.version, description: a.description ?? null })),
        profiles: profiles.map((p) => ({ id: p.id, name: p.name, version: p.version })),
        recentRuns: runs.map(summarizeRun),
      });
    })().catch((err) => {
      console.error('[UIEP] console_overview_failed', err);
      res.status(500).json({ error: 'overview_failed' });
    });
  });

  /* ── Herramientas (para gestión de autorizaciones en los agentes) ──────── */

  app.get('/api/console/tools', (req, res) => {
    if (!guard(res, consoleAuth(req))) {
      return;
    }
    listToolSpecs()
      .then((tools) => res.json(tools))
      .catch((err) => {
        console.error('[UIEP] console_tools_failed', err);
        res.status(500).json({ error: 'tools_failed' });
      });
  });

  /* ── Sesiones y ejecuciones ─────────────────────────────────────────────── */

  app.get('/api/console/sessions', (req, res) => {
    if (!guard(res, consoleAuth(req))) {
      return;
    }
    listSessions(25)
      .then((sessions) =>
        res.json(
          sessions.map((s) => ({
            sessionId: s.sessionId,
            agentSpecId: s.agentSpecId,
            profileId: s.profileId,
            createdAt: s.createdAt,
            messageCount: s.messages.length,
            runCount: s.runExecutionIds.length,
          })),
        ),
      )
      .catch((err) => {
        console.error('[UIEP] console_sessions_failed', err);
        res.status(500).json({ error: 'sessions_failed' });
      });
  });

  app.get('/api/console/sessions/:id', (req, res) => {
    if (!guard(res, consoleAuth(req))) {
      return;
    }
    const id = String(req.params.id);
    if (!ID_RE.test(id)) {
      return void res.status(400).json({ error: { id: ['formato de sessionId inválido'] } });
    }
    loadSession(id)
      .then(async (session) => {
        if (!session) {
          return void res.status(404).json({ error: 'session_not_found' });
        }
        // Resúmenes COMPLETOS (durationMs/iteraciones/tools): la proyección
        // mínima de Fase 3 no basta para el inspector — cargamos el registro.
        const detailed = await Promise.all(
          session.runExecutionIds.map((rid) => loadRun(rid).then((r) => (r ? summarizeRun(r) : null))),
        );
        res.json({
          ...session,
          runs: detailed.filter((r) => r !== null),
          messageCount: session.messages.length,
          runCount: session.runExecutionIds.length,
        });
      })
      .catch((err) => {
        console.error('[UIEP] console_session_get_failed', err);
        res.status(500).json({ error: 'session_get_failed' });
      });
  });

  app.get('/api/console/runs', (req, res) => {
    if (!guard(res, consoleAuth(req))) {
      return;
    }
    listRuns(25)
      .then((runs) => res.json(runs.map(summarizeRun)))
      .catch((err) => {
        console.error('[UIEP] console_runs_failed', err);
        res.status(500).json({ error: 'runs_failed' });
      });
  });

  app.get('/api/console/runs/:id', (req, res) => {
    if (!guard(res, consoleAuth(req))) {
      return;
    }
    const id = String(req.params.id);
    if (!RUN_ID_RE.test(id)) {
      return void res.status(400).json({ error: { id: ['formato de executionId inválido'] } });
    }
    loadRun(id)
      .then((run) => {
        if (!run) {
          return void res.status(404).json({ error: 'run_not_found' });
        }
        res.json(run);
      })
      .catch((err) => {
        console.error('[UIEP] console_run_get_failed', err);
        res.status(500).json({ error: 'run_get_failed' });
      });
  });

  /* ── Operación del runtime (delegación directa al servicio) ─────────────── */

  app.post('/api/console/runtime/sessions', (req, res) => {
    if (!guard(res, consoleAuth(req))) {
      return;
    }
    const body = (req.body ?? {}) as { agentSpecId?: string };
    if (typeof body.agentSpecId !== 'string' || !EntityIdSchema.safeParse(body.agentSpecId).success) {
      return void res.status(400).json({ error: { agentSpecId: ['falta agentSpecId válido'] } });
    }
    createSession(body.agentSpecId)
      .then((result) => {
        if (!result.ok) {
          return void res
            .status(result.reason === 'profile_not_resolvable' ? 422 : 404)
            .json({ error: result.reason, message: (result as { message?: string }).message });
        }
        res.status(201).json(result.session);
      })
      .catch((err) => {
        console.error('[UIEP] console_session_create_failed', err);
        res.status(500).json({ error: 'session_failed' });
      });
  });

  app.post('/api/console/runtime/sessions/:id/run', (req, res) => {
    if (!guard(res, consoleAuth(req))) {
      return;
    }
    const sessionId = String(req.params.id);
    if (!ID_RE.test(sessionId)) {
      return void res.status(400).json({ error: { id: ['formato de sessionId inválido'] } });
    }
    const body = (req.body ?? {}) as { input?: unknown };
    if (typeof body.input !== 'string' || body.input.trim().length === 0) {
      return void res.status(400).json({ error: { input: ['falta el mensaje del usuario'] } });
    }
    // Turno ASÍNCRONO: 202 + polling — ejecuciones largas CPU (30-60 s en
    // frío) sin mantener la conexión HTTP abierta y sin perder la sesión.
    startAgentRun(sessionId, body.input)
      .then((result) => {
        if (!result.ok) {
          return void res
            .status(result.reason === 'session_not_found' ? 404 : result.reason === 'concurrency_limit' ? 429 : 413)
            .json({ error: result.reason });
        }
        res.status(202).json({ executionId: result.executionId, status: result.status });
      })
      .catch((err) => {
        console.error('[UIEP] console_run_failed', err);
        res.status(500).json({ error: 'run_failed' });
      });
  });

  /* ── Knowledge (Fase 5): delegación directa, mismos patrones ─────────────── */

  const KN_ID_RE2 = /^kn-[a-z0-9-]{3,80}$/;

  app.get('/api/console/knowledge/sources', (req, res) => {
    if (!guard(res, consoleAuth(req))) {
      return;
    }
    listSources()
      .then((sources) => res.json(sources))
      .catch((err) => {
        console.error('[UIEP] console_knowledge_sources_failed', err);
        res.status(500).json({ error: 'knowledge_sources_failed' });
      });
  });

  app.post('/api/console/knowledge/sources', (req, res) => {
    if (!guard(res, consoleAuth(req))) {
      return;
    }
    const body = (req.body ?? {}) as { type?: unknown; ref?: unknown; title?: unknown; text?: unknown };
    createSource({
      type: body.type === 'url' ? 'url' : 'text',
      ref: typeof body.ref === 'string' ? body.ref : undefined,
      title: typeof body.title === 'string' ? body.title : undefined,
      text: typeof body.text === 'string' ? body.text : undefined,
    })
      .then((result) => {
        if (!result.ok) {
          return void res
            .status(result.reason === 'max_sources_reached' ? 429 : 400)
            .json({ error: result.reason, message: result.message });
        }
        res.status(201).json(result.source);
      })
      .catch((err) => {
        console.error('[UIEP] console_knowledge_create_failed', err);
        res.status(500).json({ error: 'knowledge_source_failed' });
      });
  });

  app.post('/api/console/knowledge/sources/:id/ingest', (req, res) => {
    if (!guard(res, consoleAuth(req))) {
      return;
    }
    const id = String(req.params.id);
    if (!KN_ID_RE2.test(id)) {
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
        console.error('[UIEP] console_knowledge_ingest_failed', err);
        res.status(500).json({ error: 'knowledge_ingest_failed' });
      });
  });

  app.delete('/api/console/knowledge/sources/:id', (req, res) => {
    if (!guard(res, consoleAuth(req))) {
      return;
    }
    const id = String(req.params.id);
    if (!KN_ID_RE2.test(id)) {
      return void res.status(400).json({ error: { id: ['formato de sourceId inválido'] } });
    }
    deleteSource(id)
      .then((deleted) => {
        if (!deleted) {
          return void res.status(404).json({ error: 'source_not_found' });
        }
        audit({ actor: { kind: 'console' }, action: 'knowledge.source.delete', correlation: { targetId: id } });
        res.json({ deleted: true });
      })
      .catch((err) => {
        console.error('[UIEP] console_knowledge_delete_failed', err);
        res.status(500).json({ error: 'knowledge_delete_failed' });
      });
  });

  app.get('/api/console/knowledge/sources/:id', (req, res) => {
    if (!guard(res, consoleAuth(req))) {
      return;
    }
    const id = String(req.params.id);
    if (!KN_ID_RE2.test(id)) {
      return void res.status(400).json({ error: { id: ['formato de sourceId inválido'] } });
    }
    Promise.all([getSource(id), loadChunks(id)])
      .then(([source, chunks]) => {
        if (!source) {
          return void res.status(404).json({ error: 'source_not_found' });
        }
        res.json({
          ...source,
          chunks: chunks.slice(0, 20).map((c) => ({ idx: c.idx, hash: c.hash, preview: c.text.slice(0, 200), dims: c.vector.length })),
        });
      })
      .catch((err) => {
        console.error('[UIEP] console_knowledge_source_get_failed', err);
        res.status(500).json({ error: 'knowledge_source_get_failed' });
      });
  });

  app.post('/api/console/knowledge/query', (req, res) => {
    if (!guard(res, consoleAuth(req))) {
      return;
    }
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
        console.error('[UIEP] console_knowledge_query_failed', err);
        res.status(500).json({ error: 'knowledge_query_failed' });
      });
  });

  app.get('/api/console/knowledge/bindings', (req, res) => {
    if (!guard(res, consoleAuth(req))) {
      return;
    }
    getBindings()
      .then((b) => res.json(b))
      .catch((err) => {
        console.error('[UIEP] console_knowledge_bindings_failed', err);
        res.status(500).json({ error: 'knowledge_bindings_failed' });
      });
  });

  app.put('/api/console/knowledge/bindings/:agentSpecId', (req, res) => {
    if (!guard(res, consoleAuth(req))) {
      return;
    }
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
        console.error('[UIEP] console_knowledge_bindings_set_failed', err);
        res.status(500).json({ error: 'knowledge_bindings_set_failed' });
      });
  });

  /* ── Memory (Fase 5.1): gestión desde la consola ─────────────────────────── */

  app.get('/api/console/memory', (req, res) => {
    if (!guard(res, consoleAuth(req))) {
      return;
    }
    listAllMemories()
      .then((list) =>
        res.json(
          list.map((m) => ({
            memoryId: m.memoryId,
            agentSpecId: m.agentSpecId,
            sessionId: m.sessionId,
            kind: m.kind,
            content: m.content,
            origin: m.origin,
            createdAt: m.createdAt,
            expiresAt: m.expiresAt,
            status: m.status,
            expired: isExpired(m),
          })),
        ),
      )
      .catch((err) => {
        console.error('[UIEP] console_memory_list_failed', err);
        res.status(500).json({ error: 'memory_list_failed' });
      });
  });

  app.delete('/api/console/memory/:id', (req, res) => {
    if (!guard(res, consoleAuth(req))) {
      return;
    }
    const id = String(req.params.id);
    if (!/^mem-[a-z0-9-]{3,80}$/.test(id)) {
      return void res.status(400).json({ error: { id: ['formato de memoryId inválido'] } });
    }
    deleteMemory(id)
      .then((deleted) => {
        if (!deleted) {
          return void res.status(404).json({ error: 'memory_not_found' });
        }
        audit({ actor: { kind: 'console' }, action: 'memory.delete', correlation: { targetId: id } });
        res.json({ deleted: true });
      })
      .catch((err) => {
        console.error('[UIEP] console_memory_delete_failed', err);
        res.status(500).json({ error: 'memory_delete_failed' });
      });
  });

  /* ── Workflows (Fase 6): delegación directa ─────────────────────────────── */

  app.post('/api/console/workflows', (req, res) => {
    if (!guard(res, consoleAuth(req))) {
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
        console.error('[UIEP] console_workflow_save_failed', err);
        res.status(500).json({ error: 'workflow_save_failed' });
      });
  });

  app.get('/api/console/workflows', (req, res) => {
    if (!guard(res, consoleAuth(req))) {
      return;
    }
    listSpecs({ kind: 'Workflow' })
      .then((w) => res.json(w))
      .catch((err) => {
        console.error('[UIEP] console_workflow_list_failed', err);
        res.status(500).json({ error: 'workflow_list_failed' });
      });
  });

  app.get('/api/console/workflows/:id', (req, res) => {
    if (!guard(res, consoleAuth(req))) {
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
        console.error('[UIEP] console_workflow_get_failed', err);
        res.status(500).json({ error: 'workflow_get_failed' });
      });
  });

  app.post('/api/console/workflows/:id/run', (req, res) => {
    if (!guard(res, consoleAuth(req))) {
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
          return void res
            .status(result.reason === 'concurrency_limit' ? 429 : result.reason === 'input_too_large' ? 413 : 404)
            .json({ error: result.reason, errors: result.errors });
        }
        res.status(202).json({ workflowRunId: result.workflowRunId });
      })
      .catch((err) => {
        console.error('[UIEP] console_workflow_run_failed', err);
        res.status(500).json({ error: 'workflow_run_failed' });
      });
  });

  app.get('/api/console/workflow-runs', (req, res) => {
    if (!guard(res, consoleAuth(req))) {
      return;
    }
    listWorkflowRuns(25)
      .then((runs) =>
        res.json(
          runs.map((r) => ({
            workflowRunId: r.workflowRunId,
            workflowId: r.workflowId,
            workflowVersion: r.workflowVersion,
            status: r.status,
            input: r.input.slice(0, 120),
            output: r.output?.slice(0, 160),
            nodesDone: Object.values(r.steps).filter((s) => s.status === 'completed').length,
            nodesTotal: r.order.length,
            errors: r.errors.slice(0, 2),
            startedAt: r.startedAt,
            finishedAt: r.finishedAt,
          })),
        ),
      )
      .catch((err) => {
        console.error('[UIEP] console_workflow_runs_failed', err);
        res.status(500).json({ error: 'workflow_runs_failed' });
      });
  });

  app.get('/api/console/workflow-runs/:id', (req, res) => {
    if (!guard(res, consoleAuth(req))) {
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
        console.error('[UIEP] console_workflow_run_get_failed', err);
        res.status(500).json({ error: 'workflow_run_get_failed' });
      });
  });

  const consoleCancel = (req: { params: { id: string } }, res: Parameters<typeof guard>[0]): void => {
    if (!guard(res, consoleAuth(req as never))) {
      return;
    }
    const id = String(req.params.id);
    if (!/^wfr-[a-z0-9-]{3,80}$/.test(id)) {
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
        console.error('[UIEP] console_workflow_cancel_failed', err);
        res.status(500).json({ error: 'workflow_cancel_failed' });
      });
  };
  const consoleResume = (req: { params: { id: string } }, res: Parameters<typeof guard>[0]): void => {
    if (!guard(res, consoleAuth(req as never))) {
      return;
    }
    const id = String(req.params.id);
    if (!/^wfr-[a-z0-9-]{3,80}$/.test(id)) {
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
        console.error('[UIEP] console_workflow_resume_failed', err);
        res.status(500).json({ error: 'workflow_resume_failed' });
      });
  };
  app.post('/api/console/workflow-runs/:id/cancel', consoleCancel);
  app.post('/api/console/workflow-runs/:id/resume', consoleResume);

  /* ── Integraciones (Fase 7): catálogo, health, descubrimiento MCP ───────── */

  app.post('/api/console/integrations', (req, res) => {
    if (!guard(res, consoleAuth(req))) {
      return;
    }
    const result = validateSpec(req.body);
    if (!result.ok) {
      return void res.status(400).json({ error: result.errors });
    }
    if (result.kind !== 'Integration') {
      return void res.status(400).json({ error: { kind: ['este endpoint registra solo IntegrationSpecs'] } });
    }
    saveSpec(result.spec)
      .then(() => res.status(201).json({ stored: true, id: result.spec.metadata.id, version: result.spec.metadata.version }))
      .catch((err) => {
        console.error('[UIEP] console_integration_save_failed', err);
        res.status(500).json({ error: 'integration_save_failed' });
      });
  });

  app.get('/api/console/integrations', (req, res) => {
    if (!guard(res, consoleAuth(req))) {
      return;
    }
    listIntegrations()
      .then((list) =>
        // El spec solo contiene la REFERENCIA del secreto (secretEnv) — jamás
        // el valor; el resolutor vive en el proceso del servidor.
        res.json(
          list.map((i) => ({
            id: i.metadata.id,
            name: i.metadata.name,
            version: i.metadata.version,
            type: i.spec.type,
            baseUrl: i.spec.baseUrl,
            auth: { type: i.spec.auth.type, secretEnv: i.spec.auth.secretEnv ?? null },
            healthPath: i.spec.healthPath,
            timeoutMs: i.spec.timeoutMs,
          })),
        ),
      )
      .catch((err) => {
        console.error('[UIEP] console_integration_list_failed', err);
        res.status(500).json({ error: 'integration_list_failed' });
      });
  });

  app.get('/api/console/integrations/:id/health', (req, res) => {
    if (!guard(res, consoleAuth(req))) {
      return;
    }
    const id = String(req.params.id);
    if (!ID_RE.test(id)) {
      return void res.status(400).json({ error: { id: ['formato de id inválido'] } });
    }
    getIntegration(id)
      .then((spec) => {
        if (!spec) {
          return void res.status(404).json({ error: 'integration_not_found' });
        }
        integrationHealth(spec)
          .then((h) => res.json({ id, ...h }))
          .catch((err) => {
            console.error('[UIEP] console_integration_health_failed', err);
            res.status(500).json({ error: 'integration_health_failed' });
          });
      })
      .catch((err) => {
        console.error('[UIEP] console_integration_get_failed', err);
        res.status(500).json({ error: 'integration_get_failed' });
      });
  });

  app.get('/api/console/integrations/:id/mcp-tools', (req, res) => {
    if (!guard(res, consoleAuth(req))) {
      return;
    }
    const id = String(req.params.id);
    if (!ID_RE.test(id)) {
      return void res.status(400).json({ error: { id: ['formato de id inválido'] } });
    }
    getIntegration(id)
      .then((spec) => {
        if (!spec || spec.spec.type !== 'mcp-server') {
          return void res.status(404).json({ error: 'integration_not_mcp' });
        }
        mcpListTools(spec)
          .then((r) => (r.ok ? res.json({ id, tools: r.tools }) : res.status(502).json({ error: r.error })))
          .catch((err) => {
            console.error('[UIEP] console_integration_mcp_list_failed', err);
            res.status(500).json({ error: 'mcp_list_failed' });
          });
      })
      .catch((err) => {
        console.error('[UIEP] console_integration_get_failed', err);
        res.status(500).json({ error: 'integration_get_failed' });
      });
  });

  /* ── Proyecto & Templates (Fase 9): reproducibilidad entre instalaciones ── */

  app.get('/api/console/project', (req, res) => {
    if (!guard(res, consoleAuth(req))) {
      return;
    }
    exportProject()
      .then((bundle) => res.json(bundle))
      .catch((err) => {
        console.error('[UIEP] console_project_export_failed', err);
        res.status(500).json({ error: 'project_export_failed' });
      });
  });

  app.post('/api/console/project/import', (req, res) => {
    if (!guard(res, consoleAuth(req))) {
      return;
    }
    const body = (req.body ?? {}) as { bundle?: unknown };
    const bundle = (body.bundle ?? body) as ProjectBundle | undefined;
    if (!bundle || typeof bundle !== 'object' || !Array.isArray((bundle as ProjectBundle).specs)) {
      return void res.status(400).json({ error: 'bundle_invalid' });
    }
    importProject(bundle)
      .then((r) => {
        audit({ actor: { kind: 'console' }, action: 'project.import', detail: { specs: r.specsImported, knowledge: r.knowledgeImported, errors: r.errors.length } });
        res.json(r);
      })
      .catch((err) => {
        console.error('[UIEP] console_project_import_failed', err);
        res.status(500).json({ error: 'project_import_failed' });
      });
  });

  app.get('/api/console/templates', (req, res) => {
    if (!guard(res, consoleAuth(req))) {
      return;
    }
    listTemplates()
      .then((t) => res.json(t))
      .catch(() => res.json([]));
  });

  app.post('/api/console/templates/:id/install', (req, res) => {
    if (!guard(res, consoleAuth(req))) {
      return;
    }
    const id = String(req.params.id);
    if (!/^[a-z0-9-]{3,80}$/.test(id)) {
      return void res.status(400).json({ error: { id: ['formato de id inválido'] } });
    }
    installTemplate(id)
      .then((r) => (r.ok ? res.json(r) : res.status(r.reason === 'template_not_found' ? 404 : 422).json(r)))
      .catch((err) => {
        console.error('[UIEP] console_template_install_failed', err);
        res.status(500).json({ error: 'template_install_failed' });
      });
  });

  /* ── Lifecycle de agentes (Fase 9): versiones y clonado ─────────────────── */

  app.get('/api/console/agents/:id/versions', (req, res) => {
    if (!guard(res, consoleAuth(req))) {
      return;
    }
    const id = String(req.params.id);
    if (!ID_RE.test(id)) {
      return void res.status(400).json({ error: { id: ['formato de id inválido'] } });
    }
    listSpecVersions(id)
      .then((docs) => res.json(docs.map((d) => ({ id: d.metadata.id, version: d.metadata.version, createdAt: d.metadata.createdAt ?? null, description: d.metadata.description ?? null }))))
      .catch((err) => {
        console.error('[UIEP] console_agent_versions_failed', err);
        res.status(500).json({ error: 'agent_versions_failed' });
      });
  });

  app.post('/api/console/agents/:id/clone', (req, res) => {
    if (!guard(res, consoleAuth(req))) {
      return;
    }
    const id = String(req.params.id);
    const body = (req.body ?? {}) as { newId?: unknown };
    if (!ID_RE.test(id) || typeof body.newId !== 'string') {
      return void res.status(400).json({ error: { newId: ['falta newId válido (slug)'] } });
    }
    cloneAgentSpec(id, body.newId)
      .then((r) => (r.ok ? res.status(201).json({ cloned: true, newId: body.newId, version: r.version }) : res.status(r.reason === 'agent_not_found' ? 404 : 400).json({ error: r.reason })))
      .catch((err) => {
        console.error('[UIEP] console_agent_clone_failed', err);
        res.status(500).json({ error: 'agent_clone_failed' });
      });
  });
}

export { consoleAuth, guard };
