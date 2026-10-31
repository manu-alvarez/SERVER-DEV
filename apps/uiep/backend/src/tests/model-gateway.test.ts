import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import type { Server } from 'node:http';
import './helpers/test-env';
import { API_VERSION } from '@uiep/agent-spec';
import { startOllamaMock } from './helpers/ollama-mock';
import { saveSpec } from '../services/spec-registry.service';
import {
  checkProfileHealth,
  profileTestCompletion,
  resolveModelRef,
} from '../services/model-gateway.service';

/** Fase 2 — gateway de modelos: resolución de referencias, disponibilidad real
 *  y completación acotada contra un proveedor mock (conectividad HTTP real). */

const PROFILE = {
  apiVersion: API_VERSION,
  kind: 'ModelProfile' as const,
  metadata: { id: 'default', name: 'Chat por defecto', version: '1.0.0' },
  spec: {
    provider: 'ollama',
    model: 'qwen3.5:4b',
    endpointEnv: 'OLLAMA_BASE_URL',
    capabilities: ['chat', 'completion'],
    contextWindow: 262144,
    costTier: 'free' as const,
  },
};

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
});

test('resolve: referencia registrada → perfil ollama tipado', async () => {
  const result = await resolveModelRef('default');
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.profile.spec.provider, 'ollama');
    assert.equal(result.profile.spec.model, 'qwen3.5:4b');
  }
});

test('resolve: id inexistente → not_registered (nunca silencio)', async () => {
  const result = await resolveModelRef('no-existe-xyz');
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.reason, 'not_registered');
  }
});

test('resolve: proveedor sin adaptador todavía → unsupported_provider', async () => {
  await saveSpec({
    ...PROFILE,
    metadata: { ...PROFILE.metadata, id: 'future-provider', name: 'Future' },
    spec: { ...PROFILE.spec, provider: 'anthropic' as never },
  });
  const result = await resolveModelRef('future-provider');
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.reason, 'unsupported_provider');
    assert.match(result.message, /anthropic/);
  }
});

test('health: modelo presente → ok con detalle positivo', async () => {
  const resolved = await resolveModelRef('default');
  assert.equal(resolved.ok, true);
  if (!resolved.ok) return;
  const health = await checkProfileHealth(resolved.profile);
  assert.equal(health.ok, true);
  assert.match(health.detail, /disponible/);
  assert.equal(health.provider, 'ollama');
  assert.equal(health.endpoint, 'env:OLLAMA_BASE_URL');
});

test('health: modelo ausente → proveedor activo pero ok=false', async () => {
  await saveSpec({
    ...PROFILE,
    metadata: { ...PROFILE.metadata, id: 'absent-model', name: 'Absent' },
    spec: { ...PROFILE.spec, model: 'no-instalado:99b' },
  });
  const resolved = await resolveModelRef('absent-model');
  assert.equal(resolved.ok, true);
  if (!resolved.ok) return;
  const health = await checkProfileHealth(resolved.profile);
  assert.equal(health.ok, false);
  assert.match(health.detail, /no está instalado/);
});

test('health: variable de endpoint ausente en el despliegue → error explícito', async () => {
  await saveSpec({
    ...PROFILE,
    metadata: { ...PROFILE.metadata, id: 'missing-env', name: 'Missing' },
    spec: { ...PROFILE.spec, model: 'qwen3.5:4b', endpointEnv: 'UIEP_MISSING_ENV' },
  });
  const resolved = await resolveModelRef('missing-env');
  assert.equal(resolved.ok, true);
  if (!resolved.ok) return;
  const health = await checkProfileHealth(resolved.profile);
  assert.equal(health.ok, false);
  assert.match(health.detail, /endpoint_env_missing:UIEP_MISSING_ENV/);
});

test('test-completion: texto real del adaptador con latencia y endpoint por referencia', async () => {
  const resolved = await resolveModelRef('default');
  assert.equal(resolved.ok, true);
  if (!resolved.ok) return;
  const result = await profileTestCompletion(resolved.profile);
  assert.equal(result.ok, true);
  assert.equal(result.text, 'OK');
  assert.equal(typeof result.latencyMs, 'number');
  assert.equal(result.endpoint, 'env:OLLAMA_BASE_URL');
});
