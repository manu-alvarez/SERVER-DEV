import assert from 'node:assert/strict';
import { test } from 'node:test';
import { API_VERSION, ToolSpecV1Schema, validateAgentSpec, validateSpec, validateToolInput } from '@uiep/agent-spec';

/** Fase 3 — contrato ToolSpec v1: declaración, adaptadores cerrados y validación de entrada. */

export const CLOCK_TOOL = {
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

test('tool: ToolSpec v1 completo valida y despacha por kind', () => {
  const result = validateSpec(CLOCK_TOOL);
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.kind, 'Tool');
    assert.equal(result.spec.spec.execution.adapter, 'clock');
  }
  assert.equal(ToolSpecV1Schema.safeParse(CLOCK_TOOL).success, true);
});

test('tool: adaptadores fuera del enum cerrado se rechazan (nunca código arbitrario)', () => {
  const result = validateSpec({ ...CLOCK_TOOL, spec: { ...CLOCK_TOOL.spec, execution: { adapter: 'shell' as never } } });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.ok(result.errors['spec.execution.adapter']);
  }
});

test('tool: apiVersion desconocida se rechaza', () => {
  const result = validateSpec({ ...CLOCK_TOOL, apiVersion: 'uiep.io/v99' });
  assert.equal(result.ok, false);
});

test('tool: dispatch polimórfico respeta la separación de kinds', () => {
  const asAgent = { ...CLOCK_TOOL, kind: 'Agent' };
  assert.equal(validateSpec(asAgent).ok, false);
  assert.equal(validateAgentSpec({ ...CLOCK_TOOL, kind: 'Tool' }).ok, false, 'AgentSpec sigue siendo Agent-only');
});

test('tool-input: validación contra el subconjunto de esquema (ok)', () => {
  const schema = {
    type: 'object' as const,
    properties: {
      city: { type: 'string' as const, maxLength: 20 },
      limit: { type: 'number' as const, min: 1, max: 50 },
      dry: { type: 'boolean' as const },
    },
    required: ['city'],
  };
  const ok = validateToolInput(schema, { city: 'Madrid', limit: 5, dry: true, extra: 'stripped-not-valida' });
  assert.equal(ok.ok, true);
  if (ok.ok) {
    assert.equal(ok.value.city, 'Madrid');
  }
});

test('tool-input: fallo estructurado por campo (required, maxLength, tipo, rango)', () => {
  const schema = {
    type: 'object' as const,
    properties: {
      city: { type: 'string' as const, maxLength: 3 },
      limit: { type: 'number' as const, max: 5 },
      dry: { type: 'boolean' as const },
    },
    required: ['city'],
  };
  const failed = validateToolInput(schema, { city: 'Valencia', limit: 99, dry: 'sí' });
  assert.equal(failed.ok, false);
  if (!failed.ok) {
    assert.ok(failed.errors['city'] && failed.errors['limit'] && failed.errors['dry']);
  }
  const missing = validateToolInput(schema, {});
  assert.equal(missing.ok, false);
});
