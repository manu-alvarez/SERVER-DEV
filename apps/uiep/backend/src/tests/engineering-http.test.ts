import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import './helpers/test-env';
import { API_VERSION, UES_API_VERSION } from '@uiep/agent-spec';
import { createApp } from '../app';
import { saveSpec, getLatestSpec, listSpecs } from '../services/spec-registry.service';
import { listSources } from '../services/knowledge-store.service';
import { startRuntimeMock } from './helpers/runtime-mock';

/**
 * Misión 11 — HTTP del Engineering Core (BFF de consola, cookie+CSRF):
 * catálogo, registro/consulta de proyectos UES, grafo, procedencia, ciclo de
 * vida, instalación de los DOS blueprints migrados (comportamiento idéntico),
 * idempotencia, recuperación ante fallos y compatibilidad con los specs v1.
 */

const CONSOLE_PASSWORD = ['console', 'password-de-test-0002'].join('-');
const PROFILE = {
  apiVersion: API_VERSION,
  kind: 'ModelProfile',
  metadata: { id: 'default', name: 'Perfil default', version: '1.0.0' },
  spec: { provider: 'ollama', model: 'mock-model', endpointEnv: 'OLLAMA_BASE_URL', capabilities: ['chat'] },
};

const server = createApp({ trustProxy: 'loopback' }).listen(0);
const base = 'http://127.0.0.1:' + (server.address() as AddressInfo).port;
let mock: { server: Server; url: string };
let COOKIE: string | null = null;

function consoleFetch(p: string, init: { method?: string; body?: unknown; raw?: boolean } = {}): Promise<Response> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (init.method !== undefined && init.method !== 'GET') {
    headers['x-uiep-console'] = '1';
  }
  if (COOKIE) {
    headers.cookie = COOKIE;
  }
  return fetch(base + p, { method: init.method ?? 'GET', headers, body: init.body === undefined ? undefined : JSON.stringify(init.body) });
}

async function loginCookie(): Promise<string> {
  const r = await fetch(base + '/api/console/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ password: CONSOLE_PASSWORD }),
  });
  assert.equal(r.status, 200);
  return (r.headers.get('set-cookie') ?? '').split(';')[0];
}

/** Fixture de blueprint en el TEMPLATES_DIR real (se crea y se borra en after). */
const FIXTURE_ID = 'bp-m11-fixture';
const TEMPLATES_DIR = path.resolve(__dirname, '../../templates');
const FIXTURE_FILE = path.join(TEMPLATES_DIR, `${FIXTURE_ID}.json`);
function fixtureBlueprint(specKind: 'Agent' | 'Workflow', withBadSpec = false) {
  const goodSpec = {
    apiVersion: API_VERSION,
    kind: 'Agent',
    metadata: { id: 'bp-m11-agente', name: 'Agente fixture', version: '1.0.0' },
    spec: {
      identity: { role: 'asistente', objective: 'fixture' },
      model: { profile: 'default' },
      instructions: { system: 'fixture' },
      tools: [],
      memory: { enabled: false, strategy: 'none' },
      orchestration: { mode: 'single-agent', maxIterations: 2 },
      security: { approvalRequired: [] },
      evaluation: {},
    },
  };
  const badSpec = { apiVersion: API_VERSION, kind: 'Agent', metadata: { id: 'bp-m11-roto', name: 'roto', version: '1.0.0' }, spec: { identity: 'no-objeto' } };
  return {
    apiVersion: UES_API_VERSION,
    kind: 'Blueprint',
    metadata: { id: FIXTURE_ID, name: 'Blueprint fixture M11', version: '1.0.0' },
    title: 'Blueprint fixture M11',
    artifacts: [
      { id: 'bp-m11-agente', type: 'agent', spec: goodSpec, dependencies: [] },
      ...(specKind === 'Workflow' ? [{ id: 'bp-m11-roto', type: 'workflow', spec: badSpec, dependencies: [{ ref: 'bp-m11-agente', required: true }] }] : []),
      ...(withBadSpec ? [{ id: 'bp-m11-roto', type: 'workflow', spec: badSpec, dependencies: [] }] : []),
    ],
    knowledge: [{ title: 'Fixture M11 — fuente de prueba', text: 'contenido del fixture m11 con CODIGO-FIXTURE-11', bindTo: ['bp-m11-agente'] }],
  };
}

before(async () => {
  mock = await startRuntimeMock();
  process.env.OLLAMA_BASE_URL = mock.url;
  process.env.UIEP_RUNTIME_TOKEN = ['runtime', 'token-m11-http-01'].join('-');
  process.env.UIEP_CONSOLE_PASSWORD = CONSOLE_PASSWORD;
  await saveSpec(PROFILE); // perfil 'default' para los blueprints
  COOKIE = await loginCookie();
});

after(async () => {
  try {
    fs.unlinkSync(FIXTURE_FILE);
  } catch {
    /* nada que limpiar */
  }
  mock?.server.close();
  server.close();
});

/* ── Protección ──────────────────────────────────────────────────────────── */

test('engineering: sin cookie → 401 en TODAS las rutas nuevas', async () => {
  for (const p of ['/api/console/engineering/catalog', '/api/console/engineering/projects']) {
    const r = await fetch(base + p);
    assert.equal(r.status, 401, p);
  }
  const post = await fetch(base + '/api/console/engineering/projects', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{}',
  });
  assert.equal(post.status, 401);
});

test('engineering: mutación sin header CSRF → 403', async () => {
  const r = await fetch(base + '/api/console/engineering/projects', {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie: COOKIE ?? '' },
    body: JSON.stringify({ apiVersion: UES_API_VERSION, kind: 'Project', metadata: { id: 'x', name: 'x', version: '1.0.0' }, artifacts: [{ ref: 'a', type: 'agent' }] }),
  });
  assert.equal(r.status, 403);
});

/* ── Catálogo y proyectos ────────────────────────────────────────────────── */

test('catálogo HTTP: 19 tipos con capacidades honestas', async () => {
  const r = await consoleFetch('/api/console/engineering/catalog');
  assert.equal(r.status, 200);
  const catalog = (await r.json()) as any[];
  assert.equal(catalog.length, 19);
  const saas = catalog.find((e) => e.type === 'saas');
  assert.equal(saas.capabilities.generator, false);
});

test('proyectos: registro válido → 201; inválido → 400 con errores estructurados', async () => {
  const ok = await consoleFetch('/api/console/engineering/projects', {
    method: 'POST',
    body: {
      apiVersion: UES_API_VERSION,
      kind: 'Project',
      metadata: { id: 'http-demo', name: 'Proyecto HTTP', version: '1.0.0' },
      artifacts: [{ ref: 'agente', type: 'agent', specRef: { id: 'default', kind: 'ModelProfile' } }],
    },
  });
  assert.equal(ok.status, 201);
  const okBody: any = await ok.json();
  assert.equal(okBody.lifecycle, 'draft');

  const bad = await consoleFetch('/api/console/engineering/projects', {
    method: 'POST',
    body: { apiVersion: UES_API_VERSION, kind: 'Project', metadata: { id: 'http-bad', name: 'x', version: '1.0.0' }, artifacts: [] },
  });
  assert.equal(bad.status, 400);
  const badBody: any = await bad.json();
  assert.ok(badBody.error.artifacts);
});

test('proyectos: consulta, detalle y versiones', async () => {
  const list = await consoleFetch('/api/console/engineering/projects');
  assert.equal(list.status, 200);
  const lista = (await list.json()) as any[];
  assert.ok(lista.some((p) => p.id === 'http-demo'));

  const detail = await consoleFetch('/api/console/engineering/projects/http-demo');
  assert.equal(detail.status, 200);
  const detailBody: any = await detail.json();
  assert.equal(detailBody.metadata.id, 'http-demo');

  await consoleFetch('/api/console/engineering/projects', {
    method: 'POST',
    body: {
      apiVersion: UES_API_VERSION, kind: 'Project',
      metadata: { id: 'http-demo', name: 'Proyecto HTTP', version: '1.1.0' },
      artifacts: [{ ref: 'agente', type: 'agent', specRef: { id: 'default', kind: 'ModelProfile' } }],
    },
  });
  const versions = await consoleFetch('/api/console/engineering/projects/http-demo/versions');
  const vs = (await versions.json()) as any[];
  assert.equal(vs.length, 2);
  assert.equal(vs[0].version, '1.1.0');

  const missing = await consoleFetch('/api/console/engineering/projects/no-existe-nadie');
  assert.equal(missing.status, 404);
  const badId = await consoleFetch('/api/console/engineering/projects/ID_MALFORMADO!');
  assert.equal(badId.status, 400);
});

/* ── Grafo y procedencia ─────────────────────────────────────────────────── */

test('grafo HTTP: orden topológico + resolución de specRefs', async () => {
  const r = await consoleFetch('/api/console/engineering/projects/http-demo/graph');
  assert.equal(r.status, 200);
  const g: any = await r.json();
  assert.equal(g.ok, true);
  assert.deepEqual(g.internal.order, ['agente']);
  assert.equal(g.specRefs[0].found, true);
});

test('grafo HTTP: integridad global de todos los proyectos', async () => {
  const r = await consoleFetch('/api/console/engineering/graph');
  assert.equal(r.status, 200);
  const body: any = await r.json();
  assert.ok(body.projects >= 1);
  assert.equal(typeof body.ok, 'boolean');
});

test('procedencia HTTP: project sin generación → null; con generación → datos', async () => {
  const none = await consoleFetch('/api/console/engineering/projects/http-demo/provenance');
  const noneBody: any = await none.json();
  assert.equal(noneBody.generation, null);

  await consoleFetch('/api/console/engineering/projects', {
    method: 'POST',
    body: {
      apiVersion: UES_API_VERSION, kind: 'Project',
      metadata: { id: 'http-prov', name: 'Con procedencia', version: '1.0.0' },
      artifacts: [{ ref: 'a', type: 'agent', provenance: { generator: { id: 'design-engine' }, generatedAt: new Date().toISOString() } }],
      generation: { generator: { id: 'design-engine', version: '0.5.0' }, outputHash: 'deadbeef' },
    },
  });
  const prov = await consoleFetch('/api/console/engineering/projects/http-prov/provenance');
  const provBody: any = await prov.json();
  assert.equal(provBody.generation.generator.id, 'design-engine');
  assert.equal(provBody.artifacts[0].provenance.generator.id, 'design-engine');
});

/* ── Ciclo de vida vía HTTP ──────────────────────────────────────────────── */

test('ciclo de vida HTTP: legal → 200 con histórico; ilegal → 400; id inválido → 400', async () => {
  const t = await consoleFetch('/api/console/engineering/projects/http-demo/lifecycle', { method: 'POST', body: { to: 'validated', note: 'validado en test' } });
  assert.equal(t.status, 200);
  const tBody: any = await t.json();
  assert.equal(tBody.state, 'validated');
  assert.ok(tBody.history.length >= 1);

  const illegal = await consoleFetch('/api/console/engineering/projects/http-demo/lifecycle', { method: 'POST', body: { to: 'deployed' } });
  assert.equal(illegal.status, 400);

  const badId = await consoleFetch('/api/console/engineering/projects/ID_MALO!/lifecycle', { method: 'POST', body: { to: 'validated' } });
  assert.equal(badId.status, 400);

  const badState = await consoleFetch('/api/console/engineering/projects/http-demo/lifecycle', { method: 'POST', body: { to: 'estado-inventado' } });
  assert.equal(badState.status, 400);
});

/* ── Blueprints migrados (comportamiento idéntico al legacy) ─────────────── */

test('blueprints: catálogo muestra los 2 migrados con apiVersion ues/v1', async () => {
  const r = await consoleFetch('/api/console/templates');
  assert.equal(r.status, 200);
  const templates = (await r.json()) as any[];
  const ids = templates.map((t) => t.id);
  assert.ok(ids.includes('agente-documentado'));
  assert.ok(ids.includes('workflow-investigacion'));
  for (const t of templates) {
    assert.equal(t.apiVersion, UES_API_VERSION, `${t.id} migrado a UES`);
    assert.ok(t.artifacts >= 1);
  }
});

test('blueprints: instalación de agente-documentado (spec + knowledge + binding)', async () => {
  const r = await consoleFetch('/api/console/templates/agente-documentado/install', { method: 'POST', body: {} });
  assert.equal(r.status, 200);
  const body: any = await r.json();
  assert.equal(body.ok, true);
  assert.ok(body.details.some((d: string) => d === 'Agent:tpl-agente-documentado'));
  assert.ok(body.details.some((d: string) => d.startsWith('knowledge:')));

  const spec = await getLatestSpec('tpl-agente-documentado');
  assert.ok(spec, 'el AgentSpec quedó registrado');
  const bindings: any = await (await consoleFetch('/api/console/knowledge/bindings')).json();
  const bound = Object.entries(bindings).some(([agent, sources]) => agent === 'tpl-agente-documentado' && (sources as string[]).length > 0);
  assert.ok(bound, 'el conocimiento quedó bindeado al agente');
});

test('blueprints: instalación de workflow-investigacion (2 agentes + workflow + knowledge)', async () => {
  const r = await consoleFetch('/api/console/templates/workflow-investigacion/install', { method: 'POST', body: {} });
  assert.equal(r.status, 200);
  const body: any = await r.json();
  assert.equal(body.ok, true);
  for (const expected of ['Agent:tpl-investigador', 'Agent:tpl-redactor', 'Workflow:tpl-wf-investigacion']) {
    assert.ok(body.details.includes(expected), `falta ${expected}`);
  }
  const wf = await getLatestSpec('tpl-wf-investigacion');
  assert.ok(wf, 'el WorkflowSpec quedó registrado');
});

test('blueprints: re-instalación IDEMPOTENTE — knowledge NO se duplica (por título)', async () => {
  const before = (await listSources()).length;
  const r = await consoleFetch('/api/console/templates/agente-documentado/install', { method: 'POST', body: {} });
  assert.equal(r.status, 200);
  const afterCount = (await listSources()).length;
  assert.equal(afterCount, before, 'la fuente se reutiliza por título (no diluye el topK)');
});

/* ── Recuperación ante fallos + compatibilidad ───────────────────────────── */

test('blueprints: spec embebido inválido → 422 y NINGUNA escritura parcial', async () => {
  fs.writeFileSync(FIXTURE_FILE, JSON.stringify(fixtureBlueprint('Workflow', true)), 'utf8');
  const r = await consoleFetch(`/api/console/templates/${FIXTURE_ID}/install`, { method: 'POST', body: {} });
  assert.equal(r.status, 422);
  const body: any = await r.json();
  assert.equal(body.ok, false);
  assert.equal(body.reason, 'template_invalid');
  // validate-all → write-all: el artifact VÁLIDO del blueprint NO se escribió
  assert.equal(await getLatestSpec('bp-m11-agente'), null, 'sin escrituras parciales');
});

test('blueprints: fixture válido instala y respeta installOrder implícito (topológico)', async () => {
  fs.writeFileSync(FIXTURE_FILE, JSON.stringify(fixtureBlueprint('Agent', false)), 'utf8');
  const r = await consoleFetch(`/api/console/templates/${FIXTURE_ID}/install`, { method: 'POST', body: {} });
  assert.equal(r.status, 200);
  const body: any = await r.json();
  assert.equal(body.ok, true);
  const spec = await getLatestSpec('bp-m11-agente');
  assert.ok(spec);
});

test('compatibilidad: AgentSpec/WorkflowSpec v1 siguen registrándose igual que antes', async () => {
  const before = (await listSpecs()).length;
  await saveSpec({
    apiVersion: API_VERSION,
    kind: 'Agent',
    metadata: { id: 'compat-agente-m11', name: 'Compat', version: '1.0.0' },
    spec: {
      identity: { role: 'asistente', objective: 'compat' },
      model: { profile: 'default' },
      instructions: { system: 'compat' },
      tools: [],
      memory: { enabled: false, strategy: 'none' },
      orchestration: { mode: 'single-agent', maxIterations: 2 },
      security: { approvalRequired: [] },
      evaluation: {},
    },
  });
  const afterCount = (await listSpecs()).length;
  assert.equal(afterCount, before + 1);
  // y NO aparece mezclado con los proyectos UES (store separado)
  const projects = (await (await consoleFetch('/api/console/engineering/projects')).json()) as any[];
  assert.ok(!(projects as any[]).some((p) => p.id === 'compat-agente-m11'));
});
