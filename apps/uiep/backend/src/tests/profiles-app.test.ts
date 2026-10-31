import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import './helpers/test-env';
import { API_VERSION } from '@uiep/agent-spec';
import { createApp } from '../app';
import { startOllamaMock } from './helpers/ollama-mock';
import { saveSpec } from '../services/spec-registry.service';

/** Fase 2 — Model Gateway sobre la app HTTP: registro de perfiles, resolución
 *  de referencias desde AgentSpec, disponibilidad y completación de prueba. */

const PROFILE = {
  apiVersion: API_VERSION,
  kind: 'ModelProfile',
  metadata: { id: 'default', name: 'Chat por defecto', version: '1.0.0' },
  spec: {
    provider: 'ollama',
    model: 'qwen3.5:4b',
    endpointEnv: 'OLLAMA_BASE_URL',
    capabilities: ['chat', 'completion'],
    contextWindow: 262144,
    costTier: 'free',
  },
};

const AGENT = {
  apiVersion: API_VERSION,
  kind: 'Agent',
  metadata: { id: 'agent-resolve-1', name: 'Resolve', version: '1.0.0' },
  spec: {
    identity: { role: 'assistant', objective: 'Ayudar' },
    model: { profile: 'default' },
    instructions: { system: 'Sé útil.' },
  },
};

const server = createApp({ trustProxy: 'loopback' }).listen(0);
const base = 'http://127.0.0.1:' + (server.address() as AddressInfo).port;

let mock: { server: Server; url: string };

before(async () => {
  mock = await startOllamaMock();
  process.env.OLLAMA_BASE_URL = mock.url;
  await saveSpec(PROFILE);
});

after(() => {
  if (mock) {
    mock.server.close();
  }
  server.close();
});

test('POST /api/profiles: perfil válido → 201 y listado con kind filtrado', async () => {
  const created = await fetch(base + '/api/profiles', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(PROFILE),
  });
  assert.equal(created.status, 201);
  const createdBody: any = await created.json();
  assert.equal(createdBody.stored, true);

  const list: any[] = (await (await fetch(base + '/api/profiles')).json()) as any[];
  assert.ok(list.some((p) => p.id === 'default' && p.kind === 'ModelProfile'), 'listado contiene el perfil');
});

test('POST /api/profiles: inválido → 400 estructurado por campo', async () => {
  const r = await fetch(base + '/api/profiles', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...PROFILE, spec: { ...PROFILE.spec, endpointEnv: 'url-incrustada' } }),
  });
  assert.equal(r.status, 400);
  const body: any = await r.json();
  assert.ok(body.error && 'spec.endpointEnv' in body.error);
});

test('POST /api/profiles: kind Agent rechazado en la ruta de perfiles', async () => {
  const r = await fetch(base + '/api/profiles', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(AGENT),
  });
  assert.equal(r.status, 400);
  const body: any = await r.json();
  assert.ok('kind' in body.error);
});

test('GET /api/profiles/:id: detalle 200, inexistente 404, path traversal 400', async () => {
  const detail = await fetch(base + '/api/profiles/default');
  assert.equal(detail.status, 200);
  const detailBody: any = await detail.json();
  assert.equal(detailBody.kind, 'ModelProfile');

  const missing = await fetch(base + '/api/profiles/unknown-xyz');
  assert.equal(missing.status, 404);

  const traversal = await fetch(base + '/api/profiles/' + encodeURIComponent('../../etc/passwd'));
  assert.equal(traversal.status, 400);
});

test('POST /api/profiles/resolve: por profileId → invocación sin exponer la URL real', async () => {
  const r = await fetch(base + '/api/profiles/resolve', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ profileId: 'default' }),
  });
  assert.equal(r.status, 200);
  const body: any = await r.json();
  assert.equal(body.resolved, true);
  assert.equal(body.invocation.provider, 'ollama');
  assert.equal(body.invocation.model, 'qwen3.5:4b');
  assert.equal(body.invocation.endpoint, 'env:OLLAMA_BASE_URL');
  assert.equal(JSON.stringify(body).includes('http://'), false, 'la URL resuelta nunca sale de la infraestructura');
});

test('POST /api/profiles/resolve: desde un AgentSpec completo → misma resolución', async () => {
  const r = await fetch(base + '/api/profiles/resolve', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ agentSpec: AGENT }),
  });
  assert.equal(r.status, 200);
  const body: any = await r.json();
  assert.equal(body.resolved, true);
  assert.equal(body.profileId, 'default');
});

test('POST /api/profiles/resolve: perfil no registrado → 404 con motivo', async () => {
  const r = await fetch(base + '/api/profiles/resolve', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ profileId: 'desconocido-abc' }),
  });
  assert.equal(r.status, 404);
  const body: any = await r.json();
  assert.equal(body.error, 'not_registered');
});

test('GET /api/profiles/:id/health: disponibilidad real contra el proveedor', async () => {
  const r = await fetch(base + '/api/profiles/default/health');
  assert.equal(r.status, 200);
  const body: any = await r.json();
  assert.equal(body.ok, true);
  assert.match(body.detail, /disponible/);
});

test('POST /api/profiles/:id/test: completación real acotada (evidencia end-to-end)', async () => {
  const r = await fetch(base + '/api/profiles/default/test', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ prompt: 'Responde exclusivamente con la palabra: OK' }),
  });
  assert.equal(r.status, 200);
  const body: any = await r.json();
  assert.equal(body.ok, true);
  assert.equal(body.text, 'OK');
  assert.equal(body.endpoint, 'env:OLLAMA_BASE_URL');
});

test('POST /api/profiles/:id/test: perfil inexistente → 404', async () => {
  const r = await fetch(base + '/api/profiles/unknown-xyz/test', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({}),
  });
  assert.equal(r.status, 404);
});
