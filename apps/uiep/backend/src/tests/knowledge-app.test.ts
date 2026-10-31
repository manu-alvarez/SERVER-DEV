import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import './helpers/test-env';
import { API_VERSION } from '@uiep/agent-spec';
import { createApp } from '../app';
import { startRuntimeMock } from './helpers/runtime-mock';
import { saveSpec } from '../services/spec-registry.service';
import { setBindingsForAgent, getBindings } from '../services/knowledge-store.service';

/**
 * Fase 5 — Knowledge & Memory (MVP vertical):
 *  - Knowledge API protegida (Bearer) alta/ingesta/consulta con referencias.
 *  - Ingesta idempotente (hash) y fragmentación con límites.
 *  - Aislamiento por agente: bindings deny-by-default.
 *  - Runtime: inyección semántica en el system + trazabilidad en result.retrievals.
 * Embeddings: mock determinista de 4 dims (rojo/azul/verde/otros).
 */

const PROFILE = {
  apiVersion: API_VERSION,
  kind: 'ModelProfile',
  metadata: { id: 'mock-profile', name: 'Perfil mock', version: '1.0.0' },
  spec: { provider: 'ollama', model: 'mock-model', endpointEnv: 'OLLAMA_BASE_URL', capabilities: ['chat'] },
};

const SOURCE_DOC = [
  'Manual operativo del dispositivo X-42 (documento de prueba).',
  'RECOVER: la clave X-42 es 0007, puerta norte; el dispositivo se identifica con el color rojo.',
  'Bloque secundario del manual: mantenimiento y registro de incidencias varias.',
].join('\n\n');

function agentSpec(id: string, memory: { enabled: boolean; strategy: 'none' | 'semantic' }) {
  return {
    apiVersion: API_VERSION,
    kind: 'Agent',
    metadata: { id, name: id, version: '1.0.0' },
    spec: {
      identity: { role: 'operador', objective: 'responder con conocimiento recuperado' },
      model: { profile: 'mock-profile' },
      instructions: { system: 'Responde usando el contexto recuperado cuando exista.' },
      tools: [],
      memory,
      orchestration: { mode: 'single-agent', maxIterations: 4 },
      security: { approvalRequired: [] },
      evaluation: {},
    },
  };
}

const server = createApp({ trustProxy: 'loopback' }).listen(0);
const base = 'http://127.0.0.1:' + (server.address() as AddressInfo).port;

let mock: { server: Server; url: string };
let TOKEN = '';
let COOKIE = '';

const bearer = (path: string, init: { method?: string; body?: unknown } = {}) =>
  fetch(base + path, {
    method: init.method ?? 'GET',
    headers: { 'content-type': 'application/json', ...(TOKEN ? { authorization: `Bearer ${TOKEN}` } : {}) },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });

const consoleFetch = (path: string, init: { method?: string; body?: unknown } = {}) =>
  fetch(base + path, {
    method: init.method ?? 'GET',
    headers: {
      'content-type': 'application/json',
      ...(COOKIE ? { cookie: COOKIE } : {}),
      ...(init.method !== undefined && init.method !== 'GET' ? { 'x-uiep-console': '1' } : {}),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });

before(async () => {
  mock = await startRuntimeMock();
  process.env.OLLAMA_BASE_URL = mock.url;
  TOKEN = ['runtime', 'token-solo-servidor-05'].join('-');
  process.env.UIEP_RUNTIME_TOKEN = TOKEN;
  process.env.UIEP_CONSOLE_PASSWORD = String('console-password-kb-tests-05');
  process.env.DATA_DIR_KB_SANITY = '1';
  await saveSpec(PROFILE);
  await saveSpec(agentSpec('kb-agent', { enabled: true, strategy: 'semantic' }));
  await saveSpec(agentSpec('kb-naked', { enabled: false, strategy: 'none' }));

  const login = await fetch(base + '/api/console/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ password: 'console-password-kb-tests-05' }),
  });
  COOKIE = (login.headers.get('set-cookie') ?? '').split(';')[0];
  assert.equal(login.status, 200);
});

after(() => {
  mock.server.close();
  server.close();
});

/* ── Knowledge API protegida ──────────────────────────────────────────────── */

test('knowledge: sin Bearer → 401; con Bearer → alta de fuente (201 pending)', async () => {
  const anon = await fetch(base + '/api/knowledge/sources', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ type: 'text', text: SOURCE_DOC }),
  });
  assert.equal(anon.status, 401);

  const r = await bearer('/api/knowledge/sources', { method: 'POST', body: { type: 'text', text: SOURCE_DOC, title: 'Manual X-42' } });
  assert.equal(r.status, 201);
  const b: any = await r.json();
  assert.ok(b.sourceId.startsWith('kn-'));
  assert.equal(b.status, 'pending');
  assert.equal(b.title, 'Manual X-42');
});

test('knowledge: ingesta real (mock 4 dims) → ingested con chunks; reingesta IDEMPOTENTE', async () => {
  const list: any[] = (await (await bearer('/api/knowledge/sources')).json()) as any[];
  const source = list.find((s) => s.title === 'Manual X-42');
  assert.ok(source);

  const r = await bearer(`/api/knowledge/sources/${source.sourceId}/ingest`, { method: 'POST' });
  assert.equal(r.status, 200);
  const b: any = await r.json();
  assert.equal(b.skipped, false);
  assert.equal(b.source.status, 'ingested');
  assert.ok(b.source.chunkCount >= 1);
  assert.ok(b.source.dims > 0, 'dims reales del mock');

  const again = await bearer(`/api/knowledge/sources/${source.sourceId}/ingest`, { method: 'POST' });
  assert.equal(again.status, 200);
  const againBody: any = await again.json();
  assert.equal(againBody.skipped, true, 'mismo hash → no re-fragmenta ni re-embedde');
});

test('knowledge: consulta semántica devuelve el fragmento con referencia trazable', async () => {
  const r = await bearer('/api/knowledge/query', { method: 'POST', body: { query: '¿Qué color describe el manual rojo y su clave?' } });
  assert.equal(r.status, 200);
  const b: any = await r.json();
  assert.ok(b.hits.length >= 1);
  assert.ok(b.dims > 0);
  assert.equal(b.hits[0].sourceId.startsWith('kn-'), true);
  assert.ok(b.hits[0].text.includes('RECOVER'), 'el fragmento original viaja en el hit');
  assert.ok(b.hits[0].score > 0.3);
  assert.ok(typeof b.hits[0].chunkIdx === 'number');
});

test('knowledge: fuente azul (ortogonal en el mock) NO supera el umbral de la consulta roja', async () => {
  // alta + ingesta de una segunda fuente con vector ortogonal
  await bearer('/api/knowledge/sources', { method: 'POST', body: { type: 'text', text: 'Documento azul sin relación: solo menciona azul y nada más.', title: 'Doc Azul' } });
  const list: any[] = (await (await bearer('/api/knowledge/sources')).json()) as any[];
  const azul = list.find((s) => s.title === 'Doc Azul');
  await bearer(`/api/knowledge/sources/${azul.sourceId}/ingest`, { method: 'POST' });

  const r = await bearer('/api/knowledge/query', { method: 'POST', body: { query: 'información roja del manual' } });
  const b: any = await r.json();
  assert.ok(b.hits.length >= 1);
  assert.ok(b.hits.every((h: any) => h.sourceId !== azul.sourceId), 'la fuente ortogonal queda fuera (coseno 0 < umbral)');
});

/* ── Bindings (deny-by-default) ───────────────────────────────────────────── */

test('knowledge: bindings vacíos → deny-by-default; set + lectura', async () => {
  const list: any[] = (await (await bearer('/api/knowledge/sources')).json()) as any[];
  const manual = list.find((s) => s.title === 'Manual X-42')!;

  const bindings0 = (await (await bearer('/api/knowledge/bindings')).json()) as Record<string, string[]>;
  assert.ok(!bindings0['kb-agent'], 'sin bindings previos → sin acceso');

  const put = await bearer('/api/knowledge/bindings/kb-agent', { method: 'PUT', body: { sourceIds: [manual.sourceId] } });
  assert.equal(put.status, 200);
  const bindings = (await (await bearer('/api/knowledge/bindings')).json()) as Record<string, string[]>;
  assert.deepEqual(bindings['kb-agent'], [manual.sourceId]);
});

/* ── Runtime: inyección semántica + trazabilidad ──────────────────────────── */

let sessionId: string | null = null;

test('runtime: agente con memory.semantic recupera y responde CON el fragmento inyectado', async () => {
  const ses = await bearer('/api/runtime/sessions', { method: 'POST', body: { agentSpecId: 'kb-agent' } });
  assert.equal(ses.status, 201);
  sessionId = ((await ses.json()) as any).sessionId;

  const run = await bearer(`/api/runtime/sessions/${sessionId}/run`, {
    method: 'POST',
    body: { input: '¿Cuál es la clave del dispositivo? (color rojo)' },
  });
  assert.equal(run.status, 200, 'contrato Fase 3: turno síncrono → 200 con el registro');
  const rec: any = await run.json();
  assert.equal(rec.status, 'completed');
  assert.ok(String(rec.result.text).includes('X-42 es 0007'), 'respuesta real del modelo con el chunk inyectado');
  assert.ok(rec.result.retrievals, 'trazabilidad presente en el run record');
  assert.equal(rec.result.retrievals[0].sourceId.startsWith('kn-'), true);
  assert.equal(typeof rec.result.retrievals[0].chunkIdx, 'number');
  assert.ok(rec.result.retrievals[0].score > 0.3);
});

test('runtime: agente SIN memoria → sin inyección ni retrievals (PLAIN del mock)', async () => {
  const ses = await bearer('/api/runtime/sessions', { method: 'POST', body: { agentSpecId: 'kb-naked' } });
  const run = await bearer(`/api/runtime/sessions/${((await ses.json()) as any).sessionId}/run`, {
    method: 'POST',
    body: { input: '¿Cuál es la clave del dispositivo?' },
  });
  assert.equal(run.status, 200);
  const rec: any = await run.json();
  assert.equal(rec.status, 'completed');
  assert.equal(rec.result.text, 'PLAIN', 'sin contexto inyectado, el mock responde PLAIN');
  assert.equal(rec.result.retrievals, undefined);
});

/* ── Consola: delegación de conocimiento ──────────────────────────────────── */

test('console: fuentes por delegación (cookie) y borrado en cascada limpia bindings', async () => {
  const list: any[] = (await (await consoleFetch('/api/console/knowledge/sources')).json()) as any[];
  assert.ok(list.length >= 2);
  const azul = list.find((s) => s.title === 'Doc Azul')!;

  // binding para kb-naked → luego borrar la fuente → binding desaparece
  await bearer('/api/knowledge/bindings/kb-naked', { method: 'PUT', body: { sourceIds: [azul.sourceId] } });
  const del = await consoleFetch(`/api/console/knowledge/sources/${azul.sourceId}`, { method: 'DELETE' });
  assert.equal(del.status, 200);
  const bindings = (await (await consoleFetch('/api/console/knowledge/bindings')).json()) as Record<string, string[]>;
  assert.ok(!bindings['kb-naked'], 'borrar la fuente limpia su binding');

  // detalle 404 tras borrar
  const detail = await consoleFetch(`/api/console/knowledge/sources/${azul.sourceId}`);
  assert.equal(detail.status, 404);
});

test('console: consulta semántica delegada funciona con la cookie de operador', async () => {
  const r = await consoleFetch('/api/console/knowledge/query', { method: 'POST', body: { query: 'clave rojo del manual' } });
  assert.equal(r.status, 200);
  const b: any = await r.json();
  assert.ok(b.hits.length >= 1);
  assert.ok(b.hits[0].text.includes('RECOVER'));
});

/* sanity: el id helper del store no colisiona con las rutas testadas */
void getBindings;
