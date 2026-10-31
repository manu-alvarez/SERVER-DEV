import assert from 'node:assert/strict';
import { test } from 'node:test';
import { API_VERSION, parseAgentSpec, validateAgentSpec } from '@uiep/agent-spec';

/** Contrato AgentSpec v1 (Fase 1): validación, versionado y valores por defecto. */

const VALID = {
  apiVersion: API_VERSION,
  kind: 'Agent',
  metadata: {
    id: 'research-agent-01',
    name: 'Research Agent',
    version: '1.0.0',
    description: 'Agente de investigación y síntesis',
    tags: ['research'],
    createdAt: '2026-10-31T00:00:00.000Z',
  },
  spec: {
    identity: { role: 'research_specialist', objective: 'Research and synthesize information' },
    model: { profile: 'research-balanced' },
    instructions: { system: 'You research and synthesize.' },
    capabilities: ['research', 'synthesis'],
    tools: [{ id: 'web-search', permissions: ['search'] }],
    memory: { enabled: true, strategy: 'hybrid' },
    orchestration: { mode: 'single-agent', maxIterations: 8 },
    security: { approvalRequired: ['external_write'] },
    evaluation: { testSuite: 'research-agent-tests' },
  },
};

test('contrato: documento v1 completo es válido y tipado', () => {
  const result = validateAgentSpec(VALID);
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.spec.apiVersion, 'uiep.io/v1');
    assert.equal(result.spec.kind, 'Agent');
    assert.equal(result.spec.spec.memory.strategy, 'hybrid');
  }
});

test('contrato: secciones omitidas reciben defaults seguros', () => {
  const spec = parseAgentSpec({
    apiVersion: API_VERSION,
    kind: 'Agent',
    metadata: { id: 'minimal-agent-1', name: 'M', version: '0.1.0' },
    spec: {
      identity: { role: 'x', objective: 'y' },
      model: { profile: 'default' },
      instructions: { system: 's' },
    },
  });
  assert.equal(spec.spec.capabilities.length, 0);
  assert.equal(spec.spec.tools.length, 0);
  assert.equal(spec.spec.memory.enabled, false);
  assert.equal(spec.spec.orchestration.maxIterations, 8);
  assert.equal(spec.spec.security.approvalRequired.length, 0);
});

test('contrato: versiones de esquema desconocidas se rechazan explícitamente', () => {
  const result = validateAgentSpec({ ...VALID, apiVersion: 'uiep.io/v99' });
  assert.equal(result.ok, false);
  assert.ok(result.ok === false && 'apiVersion' in result.errors);
});

test('contrato: errores estructurados por campo (id, versión, perfil vacío)', () => {
  const result = validateAgentSpec({
    ...VALID,
    metadata: { ...VALID.metadata, id: 'ID_MALO', version: 'uno' },
    spec: { ...VALID.spec, model: { profile: '' } },
  });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.ok(result.errors['metadata.id'] && result.errors['metadata.version']);
    assert.ok(result.errors['spec.model.profile']);
  }
});

test('contrato: parseAgentSpec agrega un mensaje con las rutas fallidas', () => {
  assert.throws(
    () => parseAgentSpec({ ...VALID, kind: 'Team' }),
    (err: Error) => err.message.includes('kind'),
  );
});
