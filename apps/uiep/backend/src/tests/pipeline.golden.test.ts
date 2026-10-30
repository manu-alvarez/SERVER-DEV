import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  runPipeline,
  type PipelineResult,
} from '@uiep/design-engine';
import { GOLDEN, GOLDEN_INPUT, VARIABLE_FIELDS } from './fixtures/pipeline-agent-golden';

/**
 * Golden + repetibilidad del motor real (Fase 0 ETAPA 5).
 * runPipeline es sincrónico y determinista: la única variable documentada es intent.id (uuid v4).
 */

function normalize(result: PipelineResult): Record<string, unknown> {
  const clone = JSON.parse(JSON.stringify(result)) as {
    intent: { id: string };
    factory: { roles: Array<{ name: string; [k: string]: unknown }>; interactionPatterns: string[] };
    architecture: {
      architecture: { components: Array<{ id: string }> };
      memoryRecommendations: string[];
      toolRecommendations: string[];
      securityConsiderations: string[];
      observabilityPlan: string[];
    };
    generation: { artifactNames?: string[]; artifacts: Array<{ name: string }>; [k: string]: unknown };
    verification: {
      passed: boolean;
      overallScore: number;
      checks: Array<{ name: string; passed: boolean; severity: string }>;
    };
    [k: string]: unknown;
  };
  // Normalización de campos variables (ocurrencia única del intent).
  clone.intent.id = VARIABLE_FIELDS.intentId;
  clone.factory.roles = clone.factory.roles.map((r) => ({ name: r.name }));
  return clone;
}

const firstRun = runPipeline(GOLDEN_INPUT);

test('pipeline: entrada válida completa las 5 etapas con material real', () => {
  assert.ok(firstRun.intent?.refinedGoal, 'intent refinado presente');
  assert.ok(firstRun.architecture?.architecture?.components?.length > 0, 'componentes de arquitectura presentes');
  assert.ok(firstRun.factory?.roles?.length > 0, 'roles presentes');
  assert.ok(firstRun.verification?.checks?.length >= 5, '5 verificaciones presentes');
  assert.ok(firstRun.generation?.artifacts?.length >= 3, 'artifacts generados');
  const codeArtifact = firstRun.generation.artifacts.find((a) => a.type === 'code');
  assert.ok(codeArtifact && codeArtifact.content.length > 100, 'artifact de código con contenido real');
});

test('golden: PipelineResult coincide con la captura de referencia (normalizada)', () => {
  const norm = normalize(firstRun) as Record<string, any>;
  assert.deepStrictEqual(
    {
      intent: { ...norm.intent },
      factory: { roles: norm.factory.roles, interactionPatterns: norm.factory.interactionPatterns },
      architecture: {
        componentIds: norm.architecture.architecture.components.map((c: { id: string }) => c.id),
        memoryRecommendations: norm.architecture.memoryRecommendations,
        toolRecommendations: norm.architecture.toolRecommendations,
        securityConsiderations: norm.architecture.securityConsiderations,
        observabilityPlan: norm.architecture.observabilityPlan,
      },
      generation: { artifactNames: norm.generation.artifacts.map((a: { name: string }) => a.name) },
      verification: norm.verification,
    },
    GOLDEN,
    'golden divergente: cambios no documentados en las 5 etapas del motor'
  );});

test('repetibilidad: dos ejecuciones con la misma entrada son equivalentes salvo id', () => {
  const a = normalize(runPipeline(GOLDEN_INPUT));
  const b = normalize(runPipeline(GOLDEN_INPUT));
  assert.deepStrictEqual(a, b);
});

test('estructuras de artifacts reales (no strings del demo)', () => {
  for (const artifact of firstRun.generation.artifacts) {
    assert.ok(artifact.name && artifact.name.length > 0, 'nombre de artifact presente');
    assert.ok(['code', 'config', 'documentation', 'diagram'].includes(artifact.type), 'tipo conocido: ' + artifact.type);
    assert.ok(artifact.format && artifact.format.length > 0, 'formato presente');
    assert.ok(typeof artifact.content === 'string' && artifact.content.length > 0, 'contenido presente');
  }
  const code = firstRun.generation.artifacts.find((a) => a.type === 'code');
  assert.ok(!code?.content.includes('Generado por UIEP'), 'código no es la demo del backend');
  assert.ok(code?.content.includes('systemPrompt'), 'código del motor: prompt de sistema presente');
});
