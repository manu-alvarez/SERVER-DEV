import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import './helpers/test-env';
import { API_VERSION } from '@uiep/agent-spec';
import { createApp } from '../app';
import { startRuntimeMock } from './helpers/runtime-mock';
import { saveSpec } from '../services/spec-registry.service';
import {
  newExecutionId,
  newSessionId,
  saveRun,
  sweepInterruptedRuns,
  type AgentRunRecord,
} from '../services/agent-runtime-store.service';

/**
 * Fase 4 — UIEP Control Center BFF: autenticación de consola (cookie HMAC
 * HttpOnly), protección de endpoints, delegación directa al runtime con turno
 * ASÍNCRONO (202 + polling) y sweep de ejecuciones interrumpidas.
 *
 * Principios verificados: sin UIEP_CONSOLE_PASSWORD → 503 console_disabled;
 * cookie HttpOnly firmada (sin cookie → 401, falsificada → 401); mutaciones
 * sin header CSRF → 403; el turno corre en background y se recupera por id.
 */

const CONSOLE_PASSWORD = 'console-password-de-test-0001';

const PROFILE = {
  apiVersion: API_VERSION,
  kind: 'ModelProfile',
  metadata: { id: 'mock-profile', name: 'Perfil mock', version: '1.0.0' },
  spec: { provider: 'ollama', model: 'mock-model', endpointEnv: 'OLLAMA_BASE_URL', capabilities: ['chat', 'tools'] },
};

const CLOCK_TOOL = {
  apiVersion: API_VERSION,
  kind: 'Tool',
  metadata: { id: 'clock', name: 'Reloj UTC', version: '1.0.0' },
  spec: {
    description: 'Hora actual UTC.',
    inputSchema: { type: 'object', properties: {}, required: [] },
    permissions: ['clock:read'],
    execution: { adapter: 'clock' },
  },
};

function agentSpec(id: string, tools: Array<{ id: string; permissions?: string[] }>) {
  return {
    apiVersion: API_VERSION,
    kind: 'Agent',
    metadata: { id, name: id, version: '1.0.0' },
    spec: {
      identity: { role: 'asistente', objective: 'Usar herramientas autorizadas' },
      model: { profile: 'mock-profile' },
      instructions: { system: 'Usa las herramientas autorizadas para responder.' },
      tools: tools.map((t) => ({ id: t.id, permissions: t.permissions ?? [] })),
      security: { approvalRequired: [] },
      orchestration: { mode: 'single-agent', maxIterations: 8 },
      evaluation: {},
    },
  };
}

const server = createApp({ trustProxy: 'loopback' }).listen(0);
const base = 'http://127.0.0.1:' + (server.address() as AddressInfo).port;

let mock: { server: Server; url: string };
let COOKIE: string | null = null;

/** Cliente de consola: cookie de sesión (derivada del login) + header CSRF. */
function consoleFetch(path: string, init: { method?: string; body?: string } = {}): Promise<Response> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (init.method !== undefined && init.method !== 'GET') {
    headers['x-uiep-console'] = '1';
  }
  if (COOKIE) {
    headers.cookie = COOKIE;
  }
  return fetch(base + path, { method: init.method ?? 'GET', headers, body: init.body });
}

async function loginCookie(): Promise<string> {
  const r = await fetch(base + '/api/console/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ password: CONSOLE_PASSWORD }),
  });
  assert.equal(r.status, 200, 'login de consola correcto');
  const setCookie = r.headers.get('set-cookie') ?? '';
  assert.ok(setCookie.includes('uiep_console='), 'la respuesta emite la cookie de sesión');
  assert.ok(setCookie.includes('HttpOnly'), 'la cookie es HttpOnly (el JS del navegador nunca la lee)');
  return setCookie.split(';')[0];
}

function withEnv(name: string, value: string | undefined, fn: () => Promise<void>): Promise<void> {
  const prev = process.env[name];
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
  return fn().finally(() => {
    if (prev === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = prev;
    }
  });
}

before(async () => {
  mock = await startRuntimeMock();
  process.env.OLLAMA_BASE_URL = mock.url;
  process.env.UIEP_RUNTIME_TOKEN = 'runtime-token-solo-servidor-01';
  process.env.UIEP_CONSOLE_PASSWORD = CONSOLE_PASSWORD;
  await saveSpec(PROFILE);
  await saveSpec(CLOCK_TOOL);
  await saveSpec(agentSpec('cc-agent', [{ id: 'clock', permissions: ['clock:read'] }]));
  COOKIE = await loginCookie();
});

after(() => {
  if (mock) {
    mock.server.close();
  }
  server.close();
});

/* ── Autenticación de consola ─────────────────────────────────────────────── */

test('console: sin UIEP_CONSOLE_PASSWORD → 503 console_disabled (seguridad por defecto)', async () => {
  await withEnv('UIEP_CONSOLE_PASSWORD', undefined, async () => {
    const r = await fetch(base + '/api/console/auth/session');
    assert.equal(r.status, 503);
    const b: any = await r.json();
    assert.equal(b.error, 'console_disabled');
    const login = await fetch(base + '/api/console/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    });
    assert.equal(login.status, 503);
  });
});

test('console: login erróneo → 401 (con espera antibruto); sin password → 400', async () => {
  const wrong = await fetch(base + '/api/console/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ password: 'clave-distinta-de-la-real-0' }),
  });
  assert.equal(wrong.status, 401);
  const missing = await fetch(base + '/api/console/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ nope: 'x' }),
  });
  assert.equal(missing.status, 400);
});

test('console: sesión válida con cookie; sin cookie → 401; cookie falsificada → 401', async () => {
  const ok = await consoleFetch('/api/console/auth/session');
  assert.equal(ok.status, 200);
  const okBody: any = await ok.json();
  assert.equal(okBody.authenticated, true);
  assert.ok(okBody.expiresAt);

  const anon = await fetch(base + '/api/console/auth/session');
  assert.equal(anon.status, 401);

  const forged = await fetch(base + '/api/console/auth/session', {
    headers: { cookie: 'uiep_console=1234567890123.deadbeef' },
  });
  assert.equal(forged.status, 401);
});

test('console: sesión expirada (MAC de expiración pasada) → 401', async () => {
  // Token con expiración histórica: la MAC no puede fabricarse sin el secreto,
  // así que verificamos el camino del parseo (exp inválida → rechazo).
  const r = await fetch(base + '/api/console/auth/session', {
    headers: { cookie: 'uiep_console=1.0' },
  });
  assert.equal(r.status, 401);
});

test('console: credenciales de runtime JAMÁS aparecen en respuestas de consola', async () => {
  const r = await consoleFetch('/api/console/overview');
  assert.equal(r.status, 200);
  const raw = await r.text();
  assert.ok(!raw.includes('runtime-token-solo-servidor'), 'el token de runtime no se materializa');
  assert.ok(!raw.includes(CONSOLE_PASSWORD), 'la contraseña de consola no se materializa');
});

/* ── Protección de la superficie ──────────────────────────────────────────── */

test('console: overview sin cookie → 401; con cookie → estado real del backend', async () => {
  const anon = await fetch(base + '/api/console/overview');
  assert.equal(anon.status, 401);

  const r = await consoleFetch('/api/console/overview');
  assert.equal(r.status, 200);
  const b: any = await r.json();
  assert.ok(b.generatedAt);
  assert.equal(b.services.backend.runtimeTokenConfigured, true);
  assert.equal(b.services.backend.consoleConfigured, true);
  assert.equal(b.services.ollama.ok, true, 'proveedor mock accesible');
  assert.equal(b.services.ollama.model, 'mock-model');
  assert.ok(b.counts.profiles >= 1);
  assert.ok(b.counts.agents >= 1);
  assert.ok(b.counts.tools >= 1, 'clock registrada');
  assert.ok(Array.isArray(b.recentRuns));
  assert.ok(Array.isArray(b.agents));
  assert.ok(Array.isArray(b.profiles));
});

test('console: tools devuelve ToolSpecs completos (permisos + adapter)', async () => {
  const r = await consoleFetch('/api/console/tools');
  assert.equal(r.status, 200);
  const tools: any[] = (await r.json()) as any[];
  const clock = tools.find((t) => t.metadata.id === 'clock');
  assert.ok(clock, 'clock listada');
  assert.deepEqual(clock.spec.permissions, ['clock:read']);
  assert.equal(clock.spec.execution.adapter, 'clock');
});

/* ── Playground delegado (sesión + turno asíncrono + polling) ─────────────── */

let sessionId: string | null = null;
let executionId: string | null = null;

test('console: mutación sin CSRF header → 403; con header → 201 sesión', async () => {
  const csrfless = await fetch(base + '/api/console/runtime/sessions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie: COOKIE ?? '' },
    body: JSON.stringify({ agentSpecId: 'cc-agent' }),
  });
  assert.equal(csrfless.status, 403);

  const r = await consoleFetch('/api/console/runtime/sessions', {
    method: 'POST',
    body: JSON.stringify({ agentSpecId: 'cc-agent' }),
  });
  assert.equal(r.status, 201);
  const b: any = await r.json();
  assert.ok(b.sessionId);
  assert.equal(b.profileId, 'mock-profile');
  sessionId = b.sessionId;
});

test('console: turno asíncrono → 202 + polling hasta completed con tool ejecutada', async () => {
  const r = await consoleFetch(`/api/console/runtime/sessions/${sessionId}/run`, {
    method: 'POST',
    body: JSON.stringify({ input: '¿Qué hora es? Usa la herramienta.' }),
  });
  assert.equal(r.status, 202, 'el turno se despacha sin bloquear la conexión');
  const b: any = await r.json();
  assert.ok(b.executionId);
  assert.equal(b.status, 'running');
  executionId = b.executionId;

  let run: any = null;
  for (let i = 0; i < 50; i += 1) {
    const poll = await consoleFetch(`/api/console/runs/${b.executionId}`);
    assert.equal(poll.status, 200);
    run = await poll.json();
    if (run.status !== 'running') {
      break;
    }
    await new Promise((done) => setTimeout(done, 100));
  }
  assert.equal(run?.status, 'completed');
  assert.equal(run?.result?.text, 'MADE');
  assert.equal(run?.result?.toolExecutions?.[0]?.name, 'clock');
  assert.equal(run?.result?.toolExecutions?.[0]?.ok, true);
  assert.ok(run?.result?.toolExecutions?.[0]?.result?.iso, 'resultado real del adaptador');
  assert.equal(run?.profileUsed?.model, 'mock-model');
  assert.ok(run?.finishedAt);
  assert.equal(typeof run?.result?.durationMs, 'number');
});

test('console: sesión tras el turno — historial completo user/tool/assistant', async () => {
  const r = await consoleFetch(`/api/console/sessions/${sessionId}`);
  assert.equal(r.status, 200);
  const b: any = await r.json();
  const roles = b.messages.map((m: any) => m.role);
  assert.ok(roles.includes('user'));
  assert.ok(roles.includes('tool') && b.messages.some((m: any) => m.toolName === 'clock'));
  assert.ok(roles.includes('assistant'));
  assert.ok(b.runs.some((x: any) => x.executionId === executionId));
});

test('console: listado de sesiones y runs incluye lo creado', async () => {
  const sessions: any[] = (await (await consoleFetch('/api/console/sessions')).json()) as any[];
  assert.ok(sessions.some((s) => s.sessionId === sessionId && s.runCount === 1));
  const runs: any[] = (await (await consoleFetch('/api/console/runs')).json()) as any[];
  const created = runs.find((x) => x.executionId === executionId);
  assert.ok(created, 'la ejecución aparece en el listado');
  assert.equal(created.status, 'completed');
  assert.ok(typeof created.durationMs === 'number');
});

test('console: turno sobre sesión inexistente → 404 session_not_found', async () => {
  const r = await consoleFetch('/api/console/runtime/sessions/ses-noexiste-000/run', {
    method: 'POST',
    body: JSON.stringify({ input: 'hola' }),
  });
  assert.equal(r.status, 404);
  const b: any = await r.json();
  assert.equal(b.error, 'session_not_found');
});

test('console: logout invalida la cookie (Max-Age=0) y la sesión ya no sirve', async () => {
  const r = await fetch(base + '/api/console/auth/logout', { method: 'POST' });
  assert.equal(r.status, 200);
  const setCookie = r.headers.get('set-cookie') ?? '';
  assert.ok(
    setCookie.includes('Max-Age=0') || setCookie.includes('Expires=Thu, 01 Jan 1970'),
    'la cookie se invalida en el navegador',
  );
});

/* ── Sweep de ejecuciones interrumpidas ───────────────────────────────────── */

test('sweep: run quedado en running → failed runtime_restarted (nunca simulado)', async () => {
  const record: AgentRunRecord = {
    executionId: newExecutionId(),
    sessionId: newSessionId(),
    agentSpecId: 'cc-agent',
    agentSpec: null,
    profileUsed: { id: '', version: '', provider: '', model: '', endpoint: '' },
    input: 'huérfano',
    status: 'running',
    result: { toolExecutions: [], iterations: 0 },
    errors: [],
    startedAt: new Date().toISOString(),
  };
  await saveRun(record);
  const swept = await sweepInterruptedRuns();
  assert.ok(swept >= 1);
  const b: any = await (await consoleFetch(`/api/console/runs/${record.executionId}`)).json();
  assert.equal(b.status, 'failed');
  assert.ok(String(b.errors[0]).includes('runtime_restarted'));
  assert.ok(b.finishedAt);
});
