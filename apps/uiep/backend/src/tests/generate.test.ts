import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import type { AddressInfo } from 'node:net';
import { createApp } from '../app';

/** Bootstrap real de la app (sin framework de pruebas nuevo): escucha en un puerto efímero. */
const server = createApp().listen(0);
const port = (server.address() as AddressInfo).port;
const base = 'http://127.0.0.1:' + port;

async function postGenerate(body: unknown): Promise<{ status: number; json: any }> {
  const res = await fetch(base + '/api/generate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: res.status, json: await res.json() };
}

after(() => server.close());

test('GET /api/health — contrato del demo intacto', async () => {
  const res = await fetch(base + '/api/health');
  const json: any = await res.json();
  assert.equal(res.status, 200);
  assert.equal(json.status, 'ok');
  assert.equal(json.service, 'uiep-backend');
  assert.ok(typeof json.timestamp === 'string');
});

test('POST /api/generate — contrató legacy completa + engine aditivo (type=mcp)', async () => {
  const { status, json } = await postGenerate({ goal: 'MCP server for CRM integrations', type: 'mcp' });
  const legacyFields = ['id', 'goal', 'type', 'framework', 'code', 'structure', 'mcpConfig', 'adversarialTests', 'createdAt'];
  assert.equal(status, 200);
  for (const field of legacyFields) assert.ok(field in json, 'campo legacy ausente: ' + field);
  // engine (aditivo) — el pipeline real del monorepo ejecutó sus 5 etapas:
  assert.equal(json.engine.intent.entityType, 'mcp-server');
  assert.ok(json.engine.generation.artifacts.length >= 3);
  // code derivado de los artifacts del motor (no del string de la demo):
  const codeArtifact = json.engine.generation.artifacts.find((a: { type: string; content: string }) => a.type === 'code');
  assert.equal(json.code, codeArtifact.content);
  // estructura derivada del motor:
  assert.equal(json.structure.root, 'uiep-' + json.id);
  assert.ok(json.structure.files.includes('agent.ts'), 'files incluye artifact del motor');
  assert.ok(json.structure.files.length >= 6, 'files con artifacts + base project files');
  assert.ok(json.createdAt);
});

test('POST /api/generate — mcpConfig legacy (serverName/command/args/env)', async () => {
  const { status, json } = await postGenerate({ goal: 'MCP server for CRM integrations', type: 'mcp' });
  assert.equal(status, 200);
  assert.ok(json.mcpConfig);
  assert.ok(json.mcpConfig.serverName.startsWith('uiep-mcp-'));
  assert.equal(json.mcpConfig.command, 'node');
  assert.deepStrictEqual(json.mcpConfig.args, ['uiep-' + json.id + '/mcp-server.js']);
  assert.deepStrictEqual(json.mcpConfig.env, {});
});

test('POST /api/generate — type omitido delega en la heurística del motor (multi-agent)', async () => {
  const { status, json } = await postGenerate({ goal: 'Build a multi-agent system for research with web search' });
  assert.equal(status, 200);
  assert.equal(json.type, 'agent', 'default legacy type=agent');
  assert.equal(json.engine.intent.entityType, 'multi-agent-system', 'heurística de inferencia del motor aplicada');
  assert.ok(json.engine.factory.roles.length >= 2);
  assert.ok(json.mcpConfig === null, 'mcpConfig null fuera de type=mcp');
  assert.deepStrictEqual(json.adversarialTests, []);
});

test('POST /api/generate — entrada incompleta → 400 con fieldErrors (contrato del demo)', async () => {
  const { status, json } = await postGenerate({});
  assert.equal(status, 400);
  assert.ok(json.error && JSON.stringify(json.error).includes('goal'), 'error de tipo zod fieldErrors');
});

test('POST /api/generate — framework no soportado → rechazo explícito 400', async () => {
  const { status, json } = await postGenerate({ goal: 'x', framework: 'langchainX' });
  assert.equal(status, 400);
  assert.ok(json.error && 'framework' in json.error);
});

test('POST /api/generate — advertencia adversarial: legacy + verificación del motor', async () => {
  const { status, json } = await postGenerate({ goal: 'Adversarial red-team harness for prompt injection', type: 'adversarial' });
  assert.equal(status, 200);
  assert.equal(json.adversarialTests.length, 3, '3 tests de adversarial como en el demo');
  assert.ok(json.adversarialTests[0].includes('inyección de prompt'), 'primera prueba alude a prompt injection');
  assert.equal(json.engine.intent.entityType, 'evaluation', 'entidad evaluation en el motor');
});

test('GET /api/templates — catálogo del demo intacto', async () => {
  const res = await fetch(base + '/api/templates');
  const templates = await res.json();
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(templates) && templates.length === 3, '3 templates');
  assert.ok(templates[0].id && templates[0].name && 'variables' in templates[0], 'campos del contrato');
});
