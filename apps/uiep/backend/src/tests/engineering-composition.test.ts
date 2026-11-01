import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import './helpers/test-env';
import { seedDefaultModelProfile } from '../services/model-gateway.service';
import { startRuntimeMock } from './helpers/runtime-mock';
import type { Server as HttpServer } from 'node:http';
import { generateComposition, type CompositionResult } from '../services/engineering-composition.service';
import { getLatestProject, listProjectVersions, getLifecycle } from '../services/engineering-registry.service';
import { getGenerationRecord } from '../services/engineering-generator.service';
import { getLatestSpec } from '../services/spec-registry.service';

/**
 * Misión 12 §4 — composición de proyectos UES (service-level):
 * orden topológico, tokens $ref, mezcla generate + specRef, rollback lógico
 * (registro del grupo + proyecto NO registrado) e idempotencia completa.
 */

let MOCK: { server: HttpServer; url: string } | null = null;

before(async () => {
  assert.equal(await seedDefaultModelProfile(), 'seeded');
  MOCK = await startRuntimeMock();
  process.env.OLLAMA_BASE_URL = MOCK.url;
});

after(() => {
  MOCK?.server.close();
});

const okOf = (r: CompositionResult): Extract<CompositionResult, { ok: true }> => {
  assert.equal(r.ok, true, JSON.stringify(r).slice(0, 400));
  return r;
};

const LABORATORIO = {
  apiVersion: 'uiep.io/ues/v1' as const,
  kind: 'Project' as const,
  metadata: { id: 'laboratorio-composicion', name: 'Laboratorio M12', version: '1.0.0' },
  description: 'proyecto compuesto de referencia de la Misión 12',
  artifacts: [
    {
      ref: 'agente-a',
      type: 'agent' as const,
      generate: {
        name: 'Lab Agente A',
        role: 'primer eslabón',
        objective: 'atender la entrada',
        system: 'Primer agente del laboratorio.',
        memory: { enabled: false, strategy: 'none' as const },
      },
    },
    {
      ref: 'agente-b',
      type: 'agent' as const,
      generate: {
        name: 'Lab Agente B',
        role: 'segundo eslabón',
        objective: 'revisar la salida',
        system: 'Segundo agente del laboratorio.',
        memory: { enabled: false, strategy: 'none' as const },
      },
    },
    {
      ref: 'flujo',
      type: 'workflow' as const,
      dependencies: [{ ref: 'agente-a' }, { ref: 'agente-b' }],
      generate: {
        name: 'Laboratorio Flujo',
        steps: [
          { agent: '$ref:agente-a', input: '{{input}}' },
          { agent: '$ref:agente-b', input: 'revisa: {{prev}}' },
        ],
      },
    },
  ],
};

test('composición completa: 3 artefactos en orden topológico, proyecto registrado y ciclo generated', async () => {
  const r = okOf(await generateComposition(LABORATORIO));
  assert.equal(r.projectId, 'laboratorio-composicion');
  assert.equal(r.artifacts.length, 3);
  const flujo = r.artifacts.find((a) => a.ref === 'flujo')!;
  assert.equal(flujo.action, 'created');
  // El flujo se generó DESPUÉS de los agentes (dependencias primero).
  const agents = r.artifacts.filter((a) => a.type === 'agent');
  assert.ok(agents.every((a) => (a.generationId ? a.generationId : '') < (flujo.generationId ?? '')));
  const project = await getLatestProject('laboratorio-composicion');
  assert.ok(project, 'proyecto registrado');
  assert.equal(project?.artifacts.length, 3);
  const lc = await getLifecycle('laboratorio-composicion');
  assert.equal(lc?.state, 'generated');
  // El workflow generado es REAL y ejecutable (está en data/specs).
  const wfId = flujo.specRef.id;
  const wf = await getLatestSpec(wfId);
  assert.equal((wf as { kind?: string }).kind, 'Workflow');
  // Registro del grupo de composición.
  const group = await getGenerationRecord(r.generationId);
  assert.equal(group?.type, 'composition');
  assert.equal(group?.status, 'succeeded');
  assert.equal((group?.children ?? []).length, 3);
});

test('idempotencia: la MISMA composición re-ejecutada reutiliza TODO y no duplica', async () => {
  const r = okOf(await generateComposition(LABORATORIO));
  assert.equal(r.projectId, 'laboratorio-composicion');
  assert.ok(r.artifacts.every((a) => a.action === 'reused-generated'), JSON.stringify(r.artifacts).slice(0, 200));
  assert.equal(await listProjectVersions('laboratorio-composicion').then((v) => v.length), 1, 'no hay segunda versión del proyecto (idempotente)');
});

test('specRef: reutilización verificada de specs ya existentes mezclada con generación nueva', async () => {
  const r = okOf(await generateComposition({
    apiVersion: 'uiep.io/ues/v1',
    kind: 'Project',
    metadata: { id: 'laboratorio-reuso', name: 'Laboratorio Reuso M12', version: '1.0.0' },
    artifacts: [
      {
        ref: 'agente-existente',
        type: 'agent',
        specRef: { id: 'lab-agente-a', kind: 'Agent', version: '1.0.0' },
      },
      {
        ref: 'flujo-reuso',
        type: 'workflow',
        dependencies: [{ ref: 'agente-existente' }],
        generate: { name: 'Laboratorio Flujo Reuso', steps: [{ agent: '$ref:agente-existente', input: '{{input}}' }] },
      },
    ],
  }));
  const reused = r.artifacts.find((a) => a.ref === 'agente-existente')!;
  assert.equal(reused.action, 'reused-existing');
  assert.equal(reused.specRef.kind, 'Agent');
  const fresh = r.artifacts.find((a) => a.ref === 'flujo-reuso')!;
  assert.equal(fresh.action, 'created');
  // specRef roto → validación se cae ANTES de generar.
  const bad = await generateComposition({
    apiVersion: 'uiep.io/ues/v1',
    kind: 'Project',
    metadata: { id: 'laboratorio-reuso-roto', name: 'x', version: '1.0.0' },
    artifacts: [{ ref: 'a', type: 'agent', specRef: { id: 'agente-fantasma', kind: 'Agent' } }],
  });
  assert.equal(bad.ok, false);
  if (!bad.ok) {
    assert.equal(bad.phase, 'validation');
  }
  assert.equal(await getLatestProject('laboratorio-reuso-roto'), null);
});

test('validación temprana: tokens y ciclos fallan ANTES de generar nada', async () => {
  const tokenRoto = {
    ...LABORATORIO,
    metadata: { id: 'laboratorio-token-roto', name: 'x', version: '1.0.0' },
    artifacts: [
      {
        ref: 'flujo',
        type: 'workflow' as const,
        generate: { name: 'x', steps: [{ agent: '$ref:agente-inexistente' }] },
      },
    ],
  };
  const r1 = await generateComposition(tokenRoto);
  assert.equal(r1.ok, false);
  if (!r1.ok) {
    assert.equal(r1.phase, 'validation');
    assert.ok(JSON.stringify(r1.errors).includes('agente-inexistente'));
  }
  const ciclo = {
    apiVersion: 'uiep.io/ues/v1',
    kind: 'Project',
    metadata: { id: 'laboratorio-ciclo', name: 'x', version: '1.0.0' },
    artifacts: [
      { ref: 'a', type: 'workflow' as const, dependencies: [{ ref: 'b' }], generate: { name: 'a', steps: [{ agent: 'dummy-agente-ciclo' }] } },
      { ref: 'b', type: 'workflow' as const, dependencies: [{ ref: 'a' }], generate: { name: 'b', steps: [{ agent: 'dummy-agente-ciclo' }] } },
    ],
  };
  const r2 = await generateComposition(ciclo);
  assert.equal(r2.ok, false);
  if (!r2.ok) {
    assert.equal(r2.phase, 'validation');
    assert.ok(JSON.stringify(r2.errors).includes('ciclo'));
  }
  assert.equal(await getLatestProject('laboratorio-ciclo'), null, 'nada se registró con errores de validación');
});

test('rollback lógico: generación que falla NO registra el proyecto y guarda el grupo fallido', async () => {
  const r = await generateComposition({
    apiVersion: 'uiep.io/ues/v1',
    kind: 'Project',
    metadata: { id: 'laboratorio-rollback', name: 'Rollback M12', version: '1.0.0' },
    artifacts: [
      {
        ref: 'agente-bueno',
        type: 'agent',
        generate: { name: 'Rollback Agente Bueno', role: 'r', objective: 'o', system: 's', memory: { enabled: false, strategy: 'none' } },
      },
      {
        ref: 'agente-fallido',
        type: 'agent',
        dependencies: [{ ref: 'agente-bueno' }],
        generate: { name: 'Rollback Agente Fallido', role: 'r', objective: 'o', system: 's', profile: 'perfil-inexistente', memory: { enabled: false, strategy: 'none' } },
      },
    ],
  });
  assert.equal(r.ok, false);
  if (!r.ok) {
    assert.equal(r.phase, 'generation');
    assert.equal(r.generationId && typeof r.generationId === 'string', true, 'incluye el id del grupo fallido');
    assert.equal(r.artifacts?.length, 1, 'el artefacto que SÍ se generó queda en la respuesta');
  }
  assert.equal(await getLatestProject('laboratorio-rollback'), null, 'proyecto NO registrado');
  const group = r.ok ? null : r.generationId ? await getGenerationRecord(r.generationId) : null;
  assert.equal(group?.type, 'composition');
  assert.equal(group?.status, 'failed');
  assert.ok((group?.children ?? []).length === 1, 'el hijo completado queda registrado');
  // Reparo la entrada y re-compongo → éxito (idempotencia sobre lo ya generado).
  const fixed = await generateComposition({
    apiVersion: 'uiep.io/ues/v1',
    kind: 'Project',
    metadata: { id: 'laboratorio-rollback', name: 'Rollback M12', version: '1.0.0' },
    artifacts: [
      {
        ref: 'agente-bueno',
        type: 'agent',
        generate: { name: 'Rollback Agente Bueno', role: 'r', objective: 'o', system: 's', memory: { enabled: false, strategy: 'none' } },
      },
      {
        ref: 'agente-revisado',
        type: 'agent',
        dependencies: [{ ref: 'agente-bueno' }],
        generate: { name: 'Rollback Agente Revisado', role: 'r', objective: 'o', system: 's', memory: { enabled: false, strategy: 'none' } },
      },
    ],
  });
  assert.equal(fixed.ok, true);
  assert.equal(await getLifecycle('laboratorio-rollback').then((l) => l?.state), 'generated');
});
