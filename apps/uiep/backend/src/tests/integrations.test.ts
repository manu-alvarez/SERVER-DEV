import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import './helpers/test-env';
import { API_VERSION } from '@uiep/agent-spec';
import { saveSpec } from '../services/spec-registry.service';
import { getIntegration, callIntegration, integrationHealth } from '../services/integration.service';
import { mcpListTools, mcpCallTool } from '../services/mcp-client.service';
import { createSession, runAgent } from '../services/agent-runtime.service';
import { startRuntimeMock } from './helpers/runtime-mock';
import { createApp } from '../app';

/**
 * Fase 7 — Integration & Extension Ecosystem:
 *  - Registro de IntegrationSpecs (auth POR REFERENCIA — nunca el valor).
 *  - Conector http-call: auth inyectada desde env, circuit breaker.
 *  - MCP server (JSON-RPC, allowlist) + MCP client → round-trip completo.
 *  - Agente consumiendo una integración vía tool cerrada (ecosistema).
 */

const CONSOLE_PASSWORD = String('console-password-int-tests-09');
const SECRET = ['secreto', 'integracion-test-09'].join('-');

const PROFILE = {
  apiVersion: API_VERSION,
  kind: 'ModelProfile',
  metadata: { id: 'mock-profile', name: 'Perfil mock', version: '1.0.0' },
  spec: { provider: 'ollama', model: 'mock-model', endpointEnv: 'OLLAMA_BASE_URL', capabilities: ['chat', 'tools'] },
};

const server = createApp({ trustProxy: 'loopback' }).listen(0);
const SELF = 'http://127.0.0.1:' + (server.address() as AddressInfo).port;
let mock: { server: Server; url: string };
let TOKEN = '';

const bearer = (path: string, init: { method?: string; body?: unknown } = {}) =>
  fetch(SELF + path, {
    method: init.method ?? 'GET',
    headers: { 'content-type': 'application/json', ...(TOKEN ? { authorization: `Bearer ${TOKEN}` } : {}) },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });

before(async () => {
  mock = await startRuntimeMock();
  process.env.OLLAMA_BASE_URL = mock.url;
  TOKEN = ['runtime', 'token-int-tests-09'].join('-');
  process.env.UIEP_RUNTIME_TOKEN = TOKEN;
  process.env.UIEP_CONSOLE_PASSWORD = CONSOLE_PASSWORD;
  process.env.INTEGRATION_SECRET_TEST = SECRET; // la env REFERENCIADA por la integración
  await saveSpec(PROFILE);
  // semillas de tools (el allowlist del MCP server las expone)
  const { CLOCK_TOOL_SEED, RUNTIME_INFO_TOOL_SEED } = await import('../services/tool-registry.service');
  await saveSpec(CLOCK_TOOL_SEED);
  await saveSpec(RUNTIME_INFO_TOOL_SEED);
});

after(() => {
  mock.server.close();
  server.close();
});

/* ── Registro de integraciones (auth por referencia) ─────────────────────── */

test('integraciones: alta con auth por referencia; el VALOR del secreto nunca aparece', async () => {
  const spec = {
    apiVersion: API_VERSION,
    kind: 'Integration',
    metadata: { id: 'int-echo', name: 'Echo API de prueba', version: '1.0.0' },
    spec: { type: 'http-api', baseUrl: mock.url, auth: { type: 'bearer', secretEnv: 'INTEGRATION_SECRET_TEST' }, healthPath: '/api/tags', headers: {} },
  };
  const r = await bearer('/api/workflows-integrations-placeholder', { method: 'POST' }).catch(() => null); // noop de forma
  void r;
  // alta vía specs (polimórfico) — como el resto de contratos
  const saved = await fetch(SELF + '/api/specs', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(spec) });
  assert.equal(saved.status, 201);
  const raw = await fetch(SELF + '/api/specs/int-echo').then((x) => x.text());
  assert.ok(!raw.includes(SECRET), 'el valor del secreto jamás se persiste ni se sirve');
  assert.ok(raw.includes('INTEGRATION_SECRET_TEST'), 'la REFERENCIA (nombre de env) sí viaja en el spec');
});

test('integraciones: health check real contra el proveedor', async () => {
  const spec = (await getIntegration('int-echo'))!;
  const h = await integrationHealth(spec);
  assert.equal(h.ok, true, `health ok (${h.detail})`);
});

/* ── Conector http-call ──────────────────────────────────────────────────── */

test('conector: llamada con auth inyectada desde la env (bearer + header)', async () => {
  const headerSpec = {
    apiVersion: API_VERSION,
    kind: 'Integration',
    metadata: { id: 'int-header', name: 'Header API', version: '1.0.0' },
    spec: { type: 'http-api', baseUrl: mock.url, auth: { type: 'header', secretEnv: 'INTEGRATION_SECRET_TEST', headerName: 'x-api-key' }, healthPath: '/api/tags', headers: {} },
  };
  await saveSpec(headerSpec);

  const bearerSpec = (await getIntegration('int-echo'))!;
  const r1 = await callIntegration(bearerSpec, { method: 'POST', path: '/secure-echo', body: { dato: 'x' } });
  assert.equal(r1.ok, true);
  const parsed1 = JSON.parse(r1.body ?? '{}') as { auth: string | null };
  assert.equal(parsed1.auth, `Bearer ${SECRET}`, 'Bearer inyectado desde la env referenciada');

  const headerSpecResolved = (await getIntegration('int-header'))!;
  const r2 = await callIntegration(headerSpecResolved, { method: 'POST', path: '/secure-echo', body: {} });
  const parsed2 = JSON.parse(r2.body ?? '{}') as { apiKey: string | null };
  assert.equal(parsed2.apiKey, SECRET, 'cabecera custom inyectada desde la env');
});

test('conector: circuit breaker — fallos consecutivos abren el circuito (fallo explícito rápido)', async () => {
  const failSpec = {
    apiVersion: API_VERSION,
    kind: 'Integration',
    metadata: { id: 'int-fail', name: 'Failing API', version: '1.0.0' },
    spec: { type: 'http-api', baseUrl: mock.url, healthPath: '/api/tags', headers: {} },
  };
  await saveSpec(failSpec);
  const spec = (await getIntegration('int-fail'))!;
  const errors: string[] = [];
  for (let i = 0; i < 6; i += 1) {
    const r = await callIntegration(spec, { method: 'GET', path: '/fail-always' });
    errors.push(r.error ?? 'ok');
  }
  assert.ok(errors.slice(0, 5).every((e) => e.startsWith('connector_status_500')), 'los primeros fallos son 500 reales');
  assert.match(errors[5], /circuit_open/, 'el 6º fallo YA no llega al proveedor: circuito abierto');
});

/* ── MCP: servidor (allowlist) + cliente (round-trip completo) ───────────── */

test('mcp server: sin token → rechaza; tools/list expone SOLO el allowlist; tools/call ejecuta la tool real', async () => {
  const anon = await fetch(SELF + '/api/mcp-server', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} }) });
  assert.equal(anon.status, 200);
  const anonBody = (await anon.json()) as { error?: { code?: number } };
  assert.equal(anonBody.error?.code, -32001);

  const r = await bearer('/api/mcp-server', { method: 'POST', body: { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} } });
  const listBody = (await r.json()) as { result?: { tools?: Array<{ name: string }> } };
  const names = (listBody.result?.tools ?? []).map((t) => t.name).sort();
  assert.deepEqual(names, ['clock', 'runtime-info'], 'allowlist por defecto');

  const call = await bearer('/api/mcp-server', {
    method: 'POST',
    body: { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'clock', arguments: {} } },
  });
  const callBody = (await call.json()) as { result?: { content?: Array<{ text?: string }>; isError?: boolean } };
  const payload = JSON.parse(callBody.result?.content?.[0]?.text ?? '{}') as { ok: boolean; result?: { iso?: string } };
  assert.equal(payload.ok, true);
  assert.ok(payload.result?.iso, 'clock ejecutada de verdad vía MCP');

  const denied = await bearer('/api/mcp-server', {
    method: 'POST',
    body: { jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'memory-write', arguments: { content: 'x' } } },
  });
  const deniedBody = (await denied.json()) as { error?: { code?: number } };
  assert.equal(deniedBody.error?.code, -32602, 'las tools de efectos NO están expuestas por defecto');
});

test('mcp client→server: round-trip completo (descubrir + llamar a sí mismo como integración)', async () => {
  const selfMcp = {
    apiVersion: API_VERSION,
    kind: 'Integration',
    metadata: { id: 'int-mcp-self', name: 'MCP de UIEP (self)', version: '1.0.0' },
    spec: { type: 'mcp-server', baseUrl: SELF + '/api/mcp-server', auth: { type: 'bearer', secretEnv: 'UIEP_RUNTIME_TOKEN' }, healthPath: '/api/mcp-server', headers: {} },
  };
  await saveSpec(selfMcp);
  const spec = (await getIntegration('int-mcp-self'))!;

  const discovered = await mcpListTools(spec);
  assert.equal(discovered.ok, true);
  assert.ok((discovered.tools ?? []).some((t) => t.name === 'clock'), 'descubrimiento MCP real');

  const called = await mcpCallTool(spec, 'clock', {});
  assert.equal(called.ok, true);
  const payload = JSON.parse(called.content ?? '{}') as { result?: { iso?: string } };
  assert.ok(payload.result?.iso, 'tool ejecutada vía el round-trip MCP client→server→adaptador');
});

/* ── Ecosistema: un AGENTE consume una integración vía tool cerrada ──────── */

test('ecosistema: agente con tool http-call obtiene datos de la API externa (mock) en su turno', async () => {
  // Tool del ecosistema: config del OPERADOR (integration+path), args del
  // agente al body. El mock auto-llama a la primera tool declarada.
  await saveSpec({
    apiVersion: API_VERSION,
    kind: 'Tool',
    metadata: { id: 'ext-echo', name: 'Echo externo', version: '1.0.0' },
    spec: {
      description: 'Llama a la API externa de prueba y devuelve su eco.',
      inputSchema: { type: 'object', properties: { dato: { type: 'string', description: 'dato a enviar' } }, required: [] },
      permissions: ['ext:call'],
      execution: { adapter: 'http-call', config: { integrationId: 'int-echo', method: 'POST', path: '/echo' } },
    },
  });
  await saveSpec({
    apiVersion: API_VERSION,
    kind: 'Agent',
    metadata: { id: 'ext-agent', name: 'ext-agent', version: '1.0.0' },
    spec: {
      identity: { role: 'integrador', objective: 'usar la API externa' },
      model: { profile: 'mock-profile' },
      instructions: { system: 'Usa la herramienta externa cuando toque.' },
      tools: [{ id: 'ext-echo', permissions: ['ext:call'] }],
      memory: { enabled: false, strategy: 'none' },
      orchestration: { mode: 'single-agent', maxIterations: 4 },
      security: { approvalRequired: [] },
      evaluation: {},
    },
  });

  const ses = await createSession('ext-agent');
  assert.ok(ses.ok);
  const run = await runAgent((ses as { session: { sessionId: string } }).session.sessionId, 'llama a la api externa');
  assert.ok(run.ok);
  const rec = (run as { record: { result: { toolExecutions: Array<{ name: string; ok: boolean; result?: { body?: string } }> } } }).record;
  const call = rec.result.toolExecutions.find((t) => t.name === 'ext-echo');
  assert.ok(call, 'la tool http-call fue invocada');
  assert.equal(call.ok, true);
  const echoed = JSON.parse(call.result?.body ?? '{}') as { echoed?: { input?: string } };
  assert.equal(echoed.echoed?.input, 'llama a la api externa', 'el conector entregó el turno como body (invariante: el agente no toca la URL)');
});
