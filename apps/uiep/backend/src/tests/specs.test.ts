import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import type { AddressInfo } from 'node:net';
import './helpers/test-env';
import { createApp } from '../app';

/** Fase 1 — registro de specs: API + persistencia (roundtrip real en fichero). */

const server = createApp({ trustProxy: 'loopback' }).listen(0);
const port = (server.address() as AddressInfo).port;
const base = 'http://127.0.0.1:' + port;

after(() => server.close());

test('generación → spec derivado, registrado y recuperable (flujo cerrado)', async () => {
  const gen = await fetch(base + '/api/generate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ goal: 'Sistema de analisis de datos', framework: 'langgraph' }),
  });
  const genBody: any = await gen.json();
  assert.equal(gen.status, 200);
  assert.ok(genBody.agentSpec, 'respuesta incluye el AgentSpec (aditivo)');
  assert.ok(genBody.agentSpec.metadata.id, 'spec con id');

  const id = genBody.agentSpec.metadata.id;
  const get = await fetch(base + '/api/specs/' + id);
  assert.equal(get.status, 200, 'el spec registrado es recuperable');
  const spec: any = await get.json();
  assert.equal(spec.metadata.id, id);
  assert.equal(spec.spec.identity.objective, 'Sistema de analisis de datos');

  const list = (await (await fetch(base + '/api/specs')).json()) as any[];
  assert.ok(list.some((s) => s.id === id), 'listado contiene el spec');
});

test('POST /api/specs manual: válido → 201; inválido → 400 estructurado', async () => {
  const valid = {
    apiVersion: 'uiep.io/v1',
    kind: 'Agent',
    metadata: { id: 'manual-spec-001', name: 'Manual', version: '1.0.0' },
    spec: {
      identity: { role: 'assistant', objective: 'Help' },
      model: { profile: 'default' },
      instructions: { system: 'Be helpful.' },
    },
  };
  const created = await fetch(base + '/api/specs', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(valid),
  });
  assert.equal(created.status, 201);
  const createdBody: any = await created.json();
  assert.equal(createdBody.stored, true);

  const invalid = await fetch(base + '/api/specs', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...valid, apiVersion: 'uiep.io/v99' }),
  });
  assert.equal(invalid.status, 400);
  const invalidBody: any = await invalid.json();
  assert.ok(invalidBody.error && 'apiVersion' in invalidBody.error, 'errores por campo');
});

test('GET inexistente → 404; path traversal → 400 (saneo estricto)', async () => {
  const missing = await fetch(base + '/api/specs/does-not-exist-xyz');
  assert.equal(missing.status, 404);

  const traversal = await fetch(base + '/api/specs/' + encodeURIComponent('../../etc/passwd'));
  assert.equal(traversal.status, 400, 'id fuera de formato se rechaza sin tocar ficheros');
});
