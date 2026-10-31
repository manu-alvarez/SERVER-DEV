import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  API_VERSION,
  ModelProfileV1Schema,
  validateAgentSpec,
  validateSpec,
} from '@uiep/agent-spec';

/** Fase 2 — contrato ModelProfile v1: validación y despacho por kind. */

export const PROFILE_VALID = {
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

test('perfil: ModelProfile v1 completo valida y despacha por kind', () => {
  const result = validateSpec(PROFILE_VALID);
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.kind, 'ModelProfile');
    assert.equal(result.spec.spec.model, 'qwen3.5:4b');
    assert.equal(result.spec.spec.provider, 'ollama');
  }
  const direct = ModelProfileV1Schema.safeParse(PROFILE_VALID);
  assert.equal(direct.success, true);
});

test('perfil: endpointEnv exige el formato de nombre de variable (no un valor de URL)', () => {
  const result = validateSpec({ ...PROFILE_VALID, spec: { ...PROFILE_VALID.spec, endpointEnv: 'http://ollama:11434' } });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.ok(result.errors['spec.endpointEnv'], 'la URL incrustada se rechaza en endpointEnv');
  }
});

test('perfil: apiVersion desconocida se rechaza', () => {
  const result = validateSpec({ ...PROFILE_VALID, apiVersion: 'uiep.io/v99' });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.ok(result.errors['apiVersion']);
  }
});

test('perfil: sin secretos por diseño — credenciales pasadas se eliminan (strip), nunca se almacenan', () => {
  const parsed = ModelProfileV1Schema.parse({
    ...PROFILE_VALID,
    spec: { ...PROFILE_VALID.spec, apiKey: 'sk-XXXXcompletamente-secreto-0000000000' },
  });
  assert.equal(JSON.stringify(parsed).includes('sk-XXXX'), false, 'zod descarta campos no declarados');
});

test('despacho: los cuerpos de cada kind no se cruzan entre esquemas', () => {
  // cuerpo de perfil con kind 'Agent' → inválido
  const asAgent = { ...PROFILE_VALID, kind: 'Agent' };
  assert.equal(validateSpec(asAgent).ok, false);
  // kind 'ModelProfile' con cuerpo completo de agente → validateAgentSpec lo rechaza
  const agentDoc = {
    apiVersion: API_VERSION,
    kind: 'ModelProfile',
    metadata: { id: 'agent-x-001', name: 'X', version: '1.0.0' },
    spec: {
      identity: { role: 'r', objective: 'o' },
      model: { profile: 'default' },
      instructions: { system: 's' },
    },
  };
  assert.equal(validateAgentSpec(agentDoc).ok, false, 'AgentSpec sigue siendo solo Agent');
});
