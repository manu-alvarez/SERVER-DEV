import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import './helpers/test-env';
import { API_VERSION } from '@uiep/agent-spec';
import { createApp } from '../app';
import { startRuntimeMock } from './helpers/runtime-mock';
import { saveSpec } from '../services/spec-registry.service';

/**
 * Fase 3 — Agent Runtime sobre la app HTTP: autorización del runtime, ciclo
 * sesión → ejecución (con herramienta autorizada) → recuperación, rechazos
 * explícitos y límites de ejecución, contra un proveedor mock determinista.
 */

const PROFILE = {
  apiVersion: API_VERSION,
  kind: 'ModelProfile',
  metadata: { id: 'mock-profile', name: 'Perfil mock', version: '1.0.0' },
  spec: { provider: 'ollama', model: 'mock-model', endpointEnv: 'OLLAMA_BASE_URL', capabilities: ['chat', 'tools'] },
};

function agentSpec(id: string, opts: { tools?: Array<{ id: string; permissions?: string[] }>; approval?: string[] }) {
  return {
    apiVersion: API_VERSION,
    kind: 'Agent',
    metadata: { id, name: id, version: '1.0.0' },
    spec: {
      identity: { role: 'asistente', objective: 'Usar herramientas autorizadas' },
      model: { profile: 'mock-profile' },
      instructions: { system: 'Usa las herramientas autorizadas para responder.' },
      tools: (opts.tools ?? []).map((t) => ({ id: t.id, permissions: t.permissions ?? [] })),
      security: { approvalRequired: opts.approval ?? [] },
      orchestration: { mode: 'single-agent', maxIterations: 8 },
    },
  };
}

const RUNTIME_PASSPHRASE = 'test-token-0000000001';

const server = createApp({ trustProxy: 'loopback' }).listen(0);
const base = 'http://127.0.0.1:' + (server.address() as AddressInfo).port;

const authHeaders = { 'content-type': 'application/json', authorization: 'Bearer ' + RUNTIME_PASSPHRASE };

let mock: { server: Server; url: string };

const CLOCK_TOOL_SEED = {
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

before(async () => {
  mock = await startRuntimeMock();
  process.env.OLLAMA_BASE_URL = mock.url;
  process.env.UIEP_RUNTIME_TOKEN = RUNTIME_PASSPHRASE;
  await saveSpec(PROFILE);
  await saveSpec(CLOCK_TOOL_SEED);
  await saveSpec(agentSpec('e2e-agent', { tools: [{ id: 'clock', permissions: ['clock:read'] }] }));
  await saveSpec(agentSpec('plain-agent', {}));
  await saveSpec(agentSpec('permless-agent', { tools: [{ id: 'clock', permissions: [] }] }));
  await saveSpec(agentSpec('approval-agent', { tools: [{ id: 'clock', permissions: ['clock:read'] }], approval: ['clock'] }));
});

after(() => {
  if (mock) {
    mock.server.close();
  }
  server.close();
});

/* ── Protección de acceso (auditoría requerida) ───────────────────────────── */

test('runtime: sin Bearer → 401 (no público por defecto)', async () => {
  const r = await fetch(base + '/api/runtime/sessions', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ agentSpecId: 'e2e-agent' }) });
  assert.equal(r.status, 401);
  const b: any = await r.json();
  assert.equal(b.error, 'unauthorized');
});

test('runtime: Bearer erróneo → 401', async () => {
  const r = await fetch(base + '/api/runtime/sessions', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer wrong-token-0000000000000000' }, body: JSON.stringify({ agentSpecId: 'e2e-agent' }) });
  assert.equal(r.status, 401);
});

test('runtime: sin token configurado → 503 runtime_disabled (seguridad por defecto)', async () => {
  delete process.env.UIEP_RUNTIME_TOKEN;
  try {
    const r = await fetch(base + '/api/runtime/sessions', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ agentSpecId: 'e2e-agent' }) });
    assert.equal(r.status, 503);
    const b: any = await r.json();
    assert.equal(b.error, 'runtime_disabled');
  } finally {
    process.env.UIEP_RUNTIME_TOKEN = RUNTIME_PASSPHRASE;
  }
});

/* ── Ciclo de vida de sesión y ejecución ───────────────────────────────────── */

async function createSession(agentSpecId: string): Promise<string> {
  const r = await fetch(base + '/api/runtime/sessions', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ agentSpecId }),
  });
  assert.equal(r.status, 201, 'sesión creada para ' + agentSpecId);
  const b: any = await r.json();
  return b.sessionId;
}

async function runTurn(sessionId: string, input: string, maxInputChars?: string): Promise<any> {
  const prev = process.env.RUNTIME_MAX_INPUT_CHARS;
  if (maxInputChars !== undefined) {
    process.env.RUNTIME_MAX_INPUT_CHARS = maxInputChars;
  }
  try {
    const r = await fetch(base + '/api/runtime/sessions/' + sessionId + '/run', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ input }),
    });
    return { status: r.status, body: await r.json() };
  } finally {
    if (maxInputChars !== undefined) {
      if (prev === undefined) {
        delete process.env.RUNTIME_MAX_INPUT_CHARS;
      } else {
        process.env.RUNTIME_MAX_INPUT_CHARS = prev;
      }
    }
  }
}

test('runtime: sesión creada y recuperable (spec + perfil resueltos)', async () => {
  const sessionId = await createSession('e2e-agent');
  const r = await fetch(base + '/api/runtime/sessions/' + sessionId, { headers: { authorization: 'Bearer ' + RUNTIME_PASSPHRASE } });
  assert.equal(r.status, 200);
  const b: any = await r.json();
  assert.equal(b.agentSpecId, 'e2e-agent');
  assert.equal(b.profileId, 'mock-profile');
  assert.ok(b.createdAt);
  assert.equal(b.runs.length, 0);

  const missing = await fetch(base + '/api/runtime/sessions/ses-noexiste-abc', { headers: { authorization: 'Bearer ' + RUNTIME_PASSPHRASE } });
  assert.equal(missing.status, 404);
});

test('runtime: ejecución con herramienta autorizada → resultado final y registro completo', async () => {
  const sessionId = await createSession('e2e-agent');
  const run = await runTurn(sessionId, '¿Qué hora es? Usa la herramienta.');
  assert.equal(run.status, 200);
  assert.equal(run.body.status, 'completed');
  assert.equal(run.body.result.text, 'MADE');
  assert.equal(run.body.result.iterations, 2);
  assert.equal(run.body.result.toolExecutions.length, 1);
  assert.equal(run.body.result.toolExecutions[0].name, 'clock');
  assert.equal(run.body.result.toolExecutions[0].ok, true);
  assert.ok(run.body.result.toolExecutions[0].result.iso, 'resultado real del adaptador clock');
  assert.equal(run.body.profileUsed.model, 'mock-model');
  assert.equal(run.body.profileUsed.endpoint, 'env:OLLAMA_BASE_URL');
  assert.ok(run.body.executionId && run.body.startedAt && run.body.finishedAt);

  // Registro de ejecución consultable
  const runGet = await fetch(base + '/api/runtime/runs/' + run.body.executionId, { headers: { authorization: 'Bearer ' + RUNTIME_PASSPHRASE } });
  assert.equal(runGet.status, 200);
  const runBody: any = await runGet.json();
  assert.equal(runBody.agentSpecId, 'e2e-agent');
  assert.equal(runBody.input, '¿Qué hora es? Usa la herramienta.');

  // Historial de sesión con mensajes y ejecuciones
  const sessionGet = await fetch(base + '/api/runtime/sessions/' + sessionId, { headers: { authorization: 'Bearer ' + RUNTIME_PASSPHRASE } });
  const sessionBody: any = await sessionGet.json();
  assert.ok(sessionBody.messages.some((m: any) => m.role === 'tool' && m.toolName === 'clock'));
  assert.ok(sessionBody.messages.some((m: any) => m.role === 'assistant' && m.content === 'MADE'));
  assert.equal(sessionBody.runs.length, 1);
  assert.equal(sessionBody.runs[0].executionId, run.body.executionId);
});

test('runtime: petición GET sin sanear → 400 (path traversal)', async () => {
  const r = await fetch(base + '/api/runtime/sessions/' + encodeURIComponent('../../etc/passwd'), { headers: { authorization: 'Bearer ' + RUNTIME_PASSPHRASE } });
  assert.equal(r.status, 400);
});

/* ── Rechazos explícitos de herramientas ───────────────────────────────────── */

test('runtime: herramienta NO declarada por el AgentSpec → rechazo explícito', async () => {
  const sessionId = await createSession('plain-agent');
  const run = await runTurn(sessionId, '[TOOL_CALL:clock] intenta el modelo');
  assert.equal(run.status, 200);
  assert.equal(run.body.status, 'completed');
  assert.equal(run.body.result.toolExecutions.length, 1);
  assert.equal(run.body.result.toolExecutions[0].ok, false);
  assert.equal(run.body.result.toolExecutions[0].error, 'tool_not_authorized');
  assert.equal(run.body.result.text, 'MADE');
});

test('runtime: permisos insuficientes → rechazo explícito', async () => {
  const sessionId = await createSession('permless-agent');
  const run = await runTurn(sessionId, 'hora');
  assert.equal(run.status, 200);
  assert.equal(run.body.result.toolExecutions[0].ok, false);
  assert.equal(run.body.result.toolExecutions[0].error, 'insufficient_permissions');
});

test('runtime: security.approvalRequired → requiere aprobación, no ejecuta', async () => {
  const sessionId = await createSession('approval-agent');
  const run = await runTurn(sessionId, 'hora');
  assert.equal(run.status, 200);
  assert.equal(run.body.status, 'requires_approval');
  assert.equal(run.body.result.toolExecutions[0].error, 'requires_approval');
  assert.equal(run.body.result.text, undefined);
});

/* ── Errores de modelo y límites ───────────────────────────────────────────── */

async function withEnv(name: string, value: string | undefined, fn: () => Promise<void>): Promise<void> {
  const prev = process.env[name];
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
  try {
    await fn();
  } finally {
    if (prev === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = prev;
    }
  }
}

test('runtime: error del proveedor → run failed persistido con error explícito', async () => {
  const sessionId = await createSession('plain-agent');
  const run = await runTurn(sessionId, '[FAIL_PROVIDER] hola');
  assert.equal(run.status, 200);
  assert.equal(run.body.status, 'failed');
  assert.match(run.body.errors[0], /provider_status_500/);
  assert.ok(run.body.finishedAt);
});

test('runtime: límite de iteraciones → max_iterations_reached', async () => {
  await withEnv('RUNTIME_MAX_ITERATIONS', '2', async () => {
    const sessionId = await createSession('e2e-agent');
    const run = await runTurn(sessionId, '[LOOP_CALL:clock] bucle');
    assert.equal(run.status, 200);
    assert.equal(run.body.status, 'max_iterations_reached');
    assert.equal(run.body.result.iterations, 2);
    assert.equal(run.body.result.toolExecutions.length, 2, 'la herramienta autorizada se ejecuta en cada iteración hasta el límite');
    assert.equal(run.body.result.text, undefined);
  });
});

test('runtime: límite de tiempo → timeout', async () => {
  await withEnv('RUNTIME_TIMEOUT_MS', '1', async () => {
    const sessionId = await createSession('plain-agent');
    const run = await runTurn(sessionId, 'hola');
    assert.equal(run.status, 200);
    assert.equal(run.body.status, 'timeout');
    assert.match(run.body.errors[0], /timeout/);
  });
});

test('runtime: entrada demasiado grande → 413 input_too_large', async () => {
  const sessionId = await createSession('plain-agent');
  const run = await runTurn(sessionId, 'x'.repeat(200), '10');
  assert.equal(run.status, 413);
  const b: any = run.body;
  assert.equal(b.error, 'input_too_large');
});
