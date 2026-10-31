import assert from 'node:assert/strict';
import { test } from 'node:test';
import { runPipeline, deriveAgentSpec } from '@uiep/design-engine';
import { validateAgentSpec } from '@uiep/agent-spec';

/** Fase 1 — el motor deriva AgentSpec v1 válidos de sus propios resultados. */

test('deriveAgentSpec: resultado del pipeline → documento v1 válido', () => {
  const pipeline = runPipeline({
    goal: 'Research assistant with web search and episodic memory',
    constraints: ['privacy'],
    entityType: 'agent',
  });
  const spec = deriveAgentSpec(pipeline);
  const result = validateAgentSpec(spec);
  assert.equal(result.ok, true, 'el spec derivado debe validar contra el contrato');
  if (result.ok) {
    assert.equal(result.spec.metadata.id, pipeline.intent.id);
    assert.equal(result.spec.spec.identity.objective, 'Research assistant with web search and episodic memory');
    assert.equal(result.spec.spec.model.profile, 'default', 'perfil de modelo por referencia, nunca modelo incrustado');
    assert.ok(result.spec.spec.instructions.system.length > 0);
    assert.equal(result.spec.spec.memory.enabled, true, 'el pipeline recomendó memoria');
    assert.ok(['episodic', 'hybrid', 'working'].includes(result.spec.spec.memory.strategy));
  }
});

test('deriveAgentSpec: capacidades y herramientas normalizadas a EntityId', () => {
  const pipeline = runPipeline({
    goal: 'Research assistant with tools',
    entityType: 'agent',
  });
  const spec = deriveAgentSpec(pipeline);
  for (const capability of spec.spec.capabilities) {
    assert.match(capability, /^[a-z0-9][a-z0-9-]{2,63}$/);
  }
  for (const tool of spec.spec.tools) {
    assert.match(tool.id, /^[a-z0-9][a-z0-9-]{2,63}$/);
  }
  assert.ok(spec.spec.tools.length > 0, 'herramientas recomendadas presentes');
});

test('deriveAgentSpec: meta agnóstica de framework (decisión arquitectónica)', () => {
  const spec = deriveAgentSpec(
    runPipeline({ goal: 'Any agent', entityType: 'agent', targetFrameworks: ['langgraph'] }),
  );
  const raw = JSON.stringify(spec);
  assert.ok(!raw.includes('langgraph'), 'el spec no menciona frameworks de ejecución');
  assert.ok(!raw.includes('gpt-4o'), 'el spec no incrusta modelos concretos');
});
