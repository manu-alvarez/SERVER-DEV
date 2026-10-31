import type { Express, Request, Response } from 'express';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { EntityIdSchema } from '@uiep/agent-spec';
import { listToolSpecs } from '../services/tool-registry.service';
import { listSpecs } from '../services/spec-registry.service';
import { resolveModelRef, modelCapabilities } from '../services/model-gateway.service';
import {
  countRuns,
  countSessions,
  listRuns,
  listSessions,
  loadRun,
  loadSession,
} from '../services/agent-runtime-store.service';
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
  result: { iterations?: number; durationMs?: number; toolExecutions?: Array<{ ok?: boolean }>; text?: string };
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
    textPreview: (run.result.text ?? '').slice(0, 140),
  };
}

export function registerConsoleRoute(app: Express): void {
  /* ── Autenticación de consola ───────────────────────────────────────────── */

  app.post('/api/console/auth/login', (req, res) => {
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
      // Espera fija al fallo: no deja medir el timing de la comparación.
      void sleep(700).then(() => {
        if (!res.writableEnded) {
          res.status(401).json({ error: 'unauthorized' });
        }
      });
      return;
    }
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
          return void res.status(result.reason === 'session_not_found' ? 404 : 413).json({ error: result.reason });
        }
        res.status(202).json({ executionId: result.executionId, status: result.status });
      })
      .catch((err) => {
        console.error('[UIEP] console_run_failed', err);
        res.status(500).json({ error: 'run_failed' });
      });
  });
}
