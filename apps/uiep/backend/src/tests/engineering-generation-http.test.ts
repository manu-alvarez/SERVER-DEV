import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import fs from 'node:fs';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import './helpers/test-env';
import { createApp } from '../app';
import { seedDefaultModelProfile } from '../services/model-gateway.service';
import { seedDefaultToolSpecs } from '../services/tool-registry.service';
import { startRuntimeMock } from './helpers/runtime-mock';

/**
 * Misión 12 — HTTP del Generator Engine vía BFF de consola (cookie+CSRF):
 * generadores, validación, generación, registros, artefactos, composición y
 * exportación estructurada. Límite de generaciones activo (genLimiter).
 */

const CONSOLE_PASSWORD = ['console', 'password-de-test-0002'].join('-');

const server = createApp({ trustProxy: 'loopback' }).listen(0);
const base = 'http://127.0.0.1:' + (server.address() as AddressInfo).port;
let mock: { server: Server; url: string };
let COOKIE: string | null = null;

function consoleFetch(p: string, init: { method?: string; body?: unknown; csrf?: boolean } = {}): Promise<Response> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (init.csrf !== false && init.method !== undefined && init.method !== 'GET') {
    headers['x-uiep-console'] = '1';
  }
  if (COOKIE) {
    headers.cookie = COOKIE;
  }
  return fetch(base + p, { method: init.method ?? 'GET', headers, body: init.body === undefined ? undefined : JSON.stringify(init.body) });
}

before(async () => {
  assert.equal(await seedDefaultModelProfile(), 'seeded');
  assert.equal(await seedDefaultToolSpecs(), 'seeded');
  mock = await startRuntimeMock();
  process.env.OLLAMA_BASE_URL = mock.url;
  // Igual que en M11: contraseña de consola pública en el entorno de test.
  process.env.UIEP_CONSOLE_PASSWORD = CONSOLE_PASSWORD;
});

after(async () => {
  mock?.server.close();
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

test('sin sesión: los endpoints M12 responden 401', async () => {
  const r = await fetch(base + '/api/console/engineering/generators');
  assert.equal(r.status, 401);
});

test('catálogo de generadores vía HTTP y detalle por tipo', async () => {
  COOKIE = await (async () => {
    const r = await fetch(base + '/api/console/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password: CONSOLE_PASSWORD }),
    });
    assert.equal(r.status, 200);
    return (r.headers.get('set-cookie') ?? '').split(';')[0];
  })();
  const r = await consoleFetch('/api/console/engineering/generators');
  assert.equal(r.status, 200);
  const body = (await r.json()) as { engineVersion: string; generators: Array<{ type: string; inputShape: string }> };
  assert.equal(body.generators.length, 12);
  assert.equal(body.engineVersion, '1.0.0');
  const detail = (await (await consoleFetch('/api/console/engineering/generators/multi-agent-system')).json()) as { type: string; capabilities: { generator: boolean } };
  assert.equal(detail.type, 'multi-agent-system');
  assert.equal(detail.capabilities.generator, true);
  const miss = await consoleFetch('/api/console/engineering/generators/no-existe');
  assert.equal(miss.status, 404);
});

test('generate: CSRF ausente → 403; flujo feliz → 201 con procedencia y registro', async () => {
  const noCsrf = await consoleFetch('/api/console/engineering/generate', { method: 'POST', body: { type: 'agent', input: {} }, csrf: false });
  assert.equal(noCsrf.status, 403);
  const r = await consoleFetch('/api/console/engineering/generate', {
    method: 'POST',
    body: {
      type: 'agent',
      input: {
        name: 'HTTP Agente M12',
        role: 'responsable HTTP',
        objective: 'probar el BFF',
        system: 'Agente generado por HTTP en M12.',
        memory: { enabled: false, strategy: 'none' },
      },
    },
  });
  const ok = (await r.json()) as { ok: true; generationId: string; outcome: { store: string; id: string; version: string }; provenance: { inputHash: string; outputHash: string } };
  assert.equal(r.status, 201, JSON.stringify(ok).slice(0, 200));
  assert.equal(ok.outcome.store, 'specs');
  assert.match(ok.provenance.inputHash, /^[a-f0-9]{64}$/);
  // Registro accesible vía GET.
  const rec = (await (await consoleFetch(`/api/console/engineering/generations/${ok.generationId}`)).json()) as { id: string; status: string };
  assert.equal(rec.status, 'succeeded');
  const list = (await (await consoleFetch('/api/console/engineering/generations?limit=10')).json()) as { count: number; records: unknown[] };
  assert.ok(list.count >= 1);
  const badId = await consoleFetch('/api/console/engineering/generations/FORMATO-RARO');
  assert.equal(badId.status, 400);
});

test('generate: tipo desconocido → 400; input inválido → 400 con errores', async () => {
  const unknown = await consoleFetch('/api/console/engineering/generate', { method: 'POST', body: { type: 'zzz-desconocido', input: {} } });
  assert.equal(unknown.status, 400);
  const body = (await unknown.json()) as { error: string };
  assert.equal(body.error, 'unknown_type');
  const invalid = await consoleFetch('/api/console/engineering/generate', { method: 'POST', body: { type: 'agent', input: { name: 'x' } } });
  assert.equal(invalid.status, 400);
});

test('validate (dry-run) vía HTTP no escribe y lista checks', async () => {
  const r = await consoleFetch('/api/console/engineering/generators/agent/validate', {
    method: 'POST',
    body: { name: 'Validación HTTP', role: 'r', objective: 'o', system: 's', memory: { enabled: false, strategy: 'none' } },
  });
  assert.equal(r.status, 200);
  const body = (await r.json()) as { ok: boolean; type: string; checks: Array<{ name: string; passed: boolean }> };
  assert.equal(body.ok, true);
  assert.equal(body.type, 'agent');
  assert.ok(body.checks.every((c) => c.passed));
});

test('multi-agent-system vía HTTP crea artefacto + workflow; artefactos listables', async () => {
  const agent = (await (await consoleFetch('/api/console/engineering/generate', {
    method: 'POST',
    body: { type: 'agent', input: { name: 'HTTP Agente Miembro', role: 'r', objective: 'o', system: 's', memory: { enabled: false, strategy: 'none' } } },
  })).json()) as { outcome: { id: string } };
  const r = await consoleFetch('/api/console/engineering/generate', {
    method: 'POST',
    body: {
      type: 'multi-agent-system',
      input: {
        name: 'HTTP Sistema M12',
        members: [
          { agent: agent.outcome.id, role: 'redactor' },
          { agent: agent.outcome.id, role: 'revisor' },
        ],
      },
    },
  });
  assert.equal(r.status, 201);
  const list = (await (await consoleFetch('/api/console/engineering/artifacts')).json()) as { count: number; artifacts: Array<{ kind: string; id: string; lifecycle: string }> };
  assert.ok(list.artifacts.some((a) => a.kind === 'MultiAgentSystem' && a.id === 'http-sistema-m12'));
  const one = (await (await consoleFetch('/api/console/engineering/artifacts/MultiAgentSystem/http-sistema-m12')).json()) as { version: string; lifecycle: string; document: unknown };
  assert.equal(one.lifecycle, 'generated');
  assert.ok(one.document);
  const missing = await consoleFetch('/api/console/engineering/artifacts/MultiAgentSystem/no-existe-nunca');
  assert.equal(missing.status, 404);
});

test('composición vía HTTP: 201 → proyecto, export del proyecto y del artefacto', async () => {
  const r = await consoleFetch('/api/console/engineering/compositions', {
    method: 'POST',
    body: {
      apiVersion: 'uiep.io/ues/v1',
      kind: 'Project',
      metadata: { id: 'laboratorio-http', name: 'Laboratorio HTTP M12', version: '1.0.0' },
      artifacts: [
        {
          ref: 'agente-http',
          type: 'agent',
          generate: { name: 'HTTP Lab Agente', role: 'r', objective: 'o', system: 's', memory: { enabled: false, strategy: 'none' } },
        },
        {
          ref: 'colección',
          type: 'tool-collection',
          generate: { name: 'HTTP Lab Toolbox', tools: [{ toolId: 'clock' }] },
        },
      ],
    },
  });
  assert.equal(r.status, 201);
  const composed = (await r.json()) as { ok: true; projectId: string; artifacts: Array<{ ref: string; action: string }> };
  assert.equal(composed.projectId, 'laboratorio-http');
  assert.equal(composed.artifacts.length, 2);
  // Export del proyecto (bundle + fichero en data/engineering/exports).
  const exp = await consoleFetch('/api/console/engineering/projects/laboratorio-http/export', { method: 'POST' });
  assert.equal(exp.status, 200);
  const bundle = (await exp.json()) as { exported: boolean; filename: string; documents: string[]; sha256: string };
  assert.equal(bundle.exported, true);
  assert.ok(bundle.documents.some((d) => d.startsWith('projects/')));
  assert.ok(bundle.documents.some((d) => d.startsWith('specs/')), 'los specs del proyecto viajan en el bundle');
  // Export de un artefacto concreto.
  const expArt = await consoleFetch('/api/console/engineering/artifacts/ToolCollection/http-lab-toolbox/export', { method: 'POST' });
  assert.equal(expArt.status, 200);
  const bucket = (await (await consoleFetch('/api/console/engineering/exports')).json()) as { count: number; files: Array<{ filename: string; sizeBytes: number }> };
  assert.ok(bucket.files.some((f) => f.filename === bundle.filename));
  // Ficheros reales en disco (server crea data/engineering/exports en DATA_DIR del test).
  const files = fs.readdirSync(process.env.DATA_DIR as string + '/engineering/exports');
  assert.ok(files.length >= 2);
});

test('composición inválida → 422 phase generation; artifacts enrichment en el error', async () => {
  const r = await consoleFetch('/api/console/engineering/compositions', {
    method: 'POST',
    body: {
      apiVersion: 'uiep.io/ues/v1',
      kind: 'Project',
      metadata: { id: 'laboratorio-http-roto', name: 'x', version: '1.0.0' },
      artifacts: [
        { ref: 'a', type: 'agent', generate: { name: 'HTTP Roto', role: 'r', objective: 'o', system: 's', profile: 'perfil-inexistente', memory: { enabled: false, strategy: 'none' } } },
      ],
    },
  });
  assert.equal(r.status, 422);
  const body = (await r.json()) as { error: string; generationId: string | null };
  assert.equal(body.error, 'generation');
});

test('transición de ciclo de vida de artefacto vía HTTP: generated→tested→ready', async () => {
  // El engine deja el artefacto en 'generated'; las transiciones válidas son
  // generated→tested→ready (LIFECYCLE_TRANSITIONS compartida con proyectos).
  const r1 = await consoleFetch('/api/console/engineering/artifacts/ToolCollection/http-lab-toolbox/lifecycle', {
    method: 'POST',
    body: { to: 'tested', note: 'probado en la batería M12' },
  });
  assert.equal(r1.status, 200, JSON.stringify(await r1.json()).slice(0, 200));
  const r = await consoleFetch('/api/console/engineering/artifacts/ToolCollection/http-lab-toolbox/lifecycle', {
    method: 'POST',
    body: { to: 'ready', note: 'marcado listo tras pruebas M12' },
  });
  assert.equal(r.status, 200);
  const body = (await r.json()) as { ok: boolean; state: string };
  assert.equal(body.state, 'ready');
  const bad = await consoleFetch('/api/console/engineering/artifacts/ToolCollection/http-lab-toolbox/lifecycle', { method: 'POST', body: { to: 'invalido' } });
  assert.equal(bad.status, 400);
});
