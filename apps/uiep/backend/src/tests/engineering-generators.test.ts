import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import './helpers/test-env';
import { API_VERSION } from '@uiep/agent-spec';
import { seedDefaultModelProfile } from '../services/model-gateway.service';
import { seedDefaultToolSpecs } from '../services/tool-registry.service';
import { startRuntimeMock } from './helpers/runtime-mock';
import type { Server } from 'node:http';
import {
  GENERATOR_ENGINE_VERSION,
  listGenerators,
  describeGenerator,
  validateGeneration,
  runGeneration,
  listGenerationRecords,
  getGenerationRecord,
  latestGenerationFor,
  type GenerationResponse,
  type GenerationOutcome,
} from '../services/engineering-generator.service';
import { getBindings } from '../services/knowledge-store.service';
import { listArtifactVersions, getLatestArtifact, getArtifactLifecycle } from '../services/engineering-registry.service';
import { getLatestSpec } from '../services/spec-registry.service';

/**
 * Misión 12 — generadores service-level (sin HTTP):
 * los 12 tipos, validación dry-run, referencias reales, idempotencia por
 * huella, conflictos de versión fail-closed, procedencia y registros.
 */

type OkGen = Extract<GenerationResponse, { ok: true }>;
const okOf = (r: GenerationResponse): OkGen => {
  assert.equal(r.ok, true, JSON.stringify(r).slice(0, 300));
  return r;
};
const asOk = (r: unknown): OkGen => r as OkGen;
type EngineOutcome = Extract<GenerationOutcome, { store: 'engineering' }>;
const eng = (o: GenerationOutcome): EngineOutcome => o as EngineOutcome;

const AGENT_INPUT_SALUDADOR = {
  name: 'M12 Agente Saludador',
  role: 'saluda al usuario',
  objective: 'responder amable',
  system: 'Eres un agente de prueba generado en M12.',
  memory: { enabled: false, strategy: 'none' as const },
};

import type { Server as HttpServer } from 'node:http';
let MOCK: { server: HttpServer; url: string } | null = null;

before(async () => {
  assert.equal(await seedDefaultModelProfile(), 'seeded');
  assert.equal(await seedDefaultToolSpecs(), 'seeded');
  const mock = await startRuntimeMock();
  MOCK = mock;
  process.env.OLLAMA_BASE_URL = mock.url; // embeddings deterministas para la ingesta real
});

after(() => {
  // El handle del servidor mantiene vivo el loop de eventos: cerrarlo SIEMPRE
  // — si no, node --test se queda colgado hasta el timeout.
  MOCK?.server.close();
});

test('catálogo de generadores: 16 tipos con capacidades honestas del registro', () => {
  const gens = listGenerators();
  assert.equal(gens.length, 16, '12 de M12 + 4 de M13 (api-platform/application/agentic-app/saas)');
  const types = gens.map((g) => g.type);
  for (const t of ['agent', 'workflow', 'multi-agent-system', 'prompt-system', 'tool-collection', 'knowledge-base', 'rag-system', 'mcp-server', 'skill-pack', 'evaluation', 'harness', 'framework', 'api-platform', 'application', 'agentic-app', 'saas']) {
    assert.ok(types.includes(t), `falta el generador ${t}`);
  }
  const saas = gens.find((g) => g.type === 'saas')!;
  assert.equal(saas.capabilities?.execution, false, 'honestidad: tenancy declarativa (real → M14+)');
  const evaluation = gens.find((g) => g.type === 'evaluation')!;
  assert.equal(evaluation.capabilities?.execution, false, 'humildad: la ejecución de datasets → M14');
  const harness = gens.find((g) => g.type === 'harness')!;
  assert.equal(harness.capabilities?.execution, false);
  assert.equal(describeGenerator('no-existe'), null);
  assert.equal(GENERATOR_ENGINE_VERSION, '1.1.0');
});

test('validación dry-run NO escribe (agent con referencias rotas y válidas)', async () => {
  const bad = await validateGeneration('agent', { ...AGENT_INPUT_SALUDADOR, profile: 'no-existe' });
  assert.equal(bad.ok, false);
  if (!bad.ok) {
    assert.equal(bad.status, 400);
    assert.ok(bad.errors.profile?.length);
  }
  const ok = await validateGeneration('agent', AGENT_INPUT_SALUDADOR);
  assert.equal(ok.ok, true);
  // El perfil 'default' existe desde el before: el dry-run no crea spec.
  assert.equal(await getLatestSpec('m12-agente-saludador'), null);
  const unknownType = await validateGeneration('zzz-unknown', {});
  assert.equal(unknownType.ok, false);
});

test('agent: genera spec EJECUTABLE y re-ejecución idéntica reutiliza', async () => {
  const r1 = okOf(await runGeneration('agent', AGENT_INPUT_SALUDADOR));
  assert.equal(r1.outcome.store, 'specs');
  const agentOutcome = asOk(r1).outcome as Extract<GenerationOutcome, { store: 'specs' }>;
  assert.equal(agentOutcome.specKind, 'Agent');
  const saved = await getLatestSpec(agentOutcome.id);
  assert.equal((saved?.spec as { identity: { role: string } }).identity.role, 'saluda al usuario');
  const r2 = okOf(await runGeneration('agent', AGENT_INPUT_SALUDADOR));
  assert.equal(r2.reused, true);
  assert.equal(r2.outcome.version, r1.outcome.version);
  // registro con procedencia
  const rec = await getGenerationRecord(r1.generationId);
  assert.equal(rec?.status, 'succeeded');
  assert.match(rec?.outputHash ?? '', /^[a-f0-9]{32}$/);
  assert.ok(rec?.provenance?.generator.id.includes('agent'));
});

test('agent: herramienta inexistente → 400 antes de escribir', async () => {
  const r = await runGeneration('agent', { ...AGENT_INPUT_SALUDADOR, tools: [{ id: 'tool-inexistente', permissions: [] }] });
  assert.equal(r.ok, false);
  if (!r.ok) {
    assert.equal(r.status, 400);
    assert.ok(r.errors?.tools?.join(' ').includes('tool-inexistente'));
  }
});

test('conflictos de versión fail-closed: 409 sin bump, bump sube patch y re-ejecución reutiliza', async () => {
  const base = { name: 'M12 Agente Conflicto', role: 'r', objective: 'o', system: 's', version: '3.0.0' };
  okOf(await runGeneration('agent', base));
  const changed = { ...base, system: 'system DISTINTO — conflicto de contenido' } as Record<string, unknown>;
  const conflict = await runGeneration('agent', changed);
  assert.equal(conflict.ok, false);
  if (!conflict.ok) {
    assert.equal(conflict.status, 409);
    assert.equal(conflict.code, 'version_conflict');
  }
  const bumped = okOf(await runGeneration('agent', { ...changed, onConflict: 'bump' as const }));
  assert.equal(bumped.outcome.version, '3.0.1');
  // Idempotencia del bump: mismo contenido tras el successful bump → reused.
  const again = okOf(await runGeneration('agent', { ...changed, onConflict: 'bump' as const }));
  assert.equal(again.reused, true);
  assert.equal(again.outcome.version, '3.0.1');
});

test('workflow: DAG validado con agentes existentes y ramas', async () => {
  const agent = okOf(await runGeneration('agent', { ...AGENT_INPUT_SALUDADOR, name: 'M12 Agente Conector' }));
  const agentId = (asOk(agent).outcome as { id: string }).id;
  const r = okOf(await runGeneration('workflow', {
    name: 'M12 Flujo Conector',
    steps: [{ agent: agentId }, { agent: agentId, input: 'segunda pasada de {{prev}}' }],
    branches: [{ after: 'paso-1', op: 'not_empty', then: 'paso-2', else: 'paso-2' }],
  }));
  const wfOutcome = (asOk(r).outcome as { store: string; id: string });
  assert.equal(wfOutcome.store, 'specs');
  const wf = await getLatestSpec(wfOutcome.id);
  assert.equal(((wf?.spec as { nodes: Array<{ type: string }> }).nodes ?? []).some((n) => n.type === 'condition'), true);
  assert.ok((r.warnings ?? []).length >= 1);
  const bad = await runGeneration('workflow', { name: 'M12 Flujo Roto', steps: [{ agent: 'agente-fantasma' }] });
  assert.equal(bad.ok, false);
  if (!bad.ok) {
    assert.equal(bad.status, 400);
  }
});

test('multi-agent-system: subgenera agente, crea workflow real y artefacto; rerun reutiliza', async () => {
  const existing = okOf(await runGeneration('agent', { ...AGENT_INPUT_SALUDADOR, name: 'M12 Agente Miembro Uno' }));
  const input = {
    name: 'M12 Sistema Dupla',
    members: [
      { agent: (asOk(existing).outcome as { id: string }).id, role: 'redactor' },
      { agent: { generate: { ...AGENT_INPUT_SALUDADOR, name: 'M12 Agente Miembro Dos' } }, role: 'revisor' },
    ],
    style: 'pipeline' as const,
  };
  const r = okOf(await runGeneration('multi-agent-system', input));
  assert.equal(r.outcome.store, 'engineering');
  assert.equal(eng(r.outcome).artifactKind, 'MultiAgentSystem');
  assert.equal(r.extraOutcomes?.length, 1);
  assert.equal(r.extraOutcomes?.[0]?.store, 'specs');
  assert.ok(((r as unknown as { children?: string[] }).children ?? []).length >= 1, 'registrar la subgeneración del miembro Dos');
  const systemDoc = await getLatestArtifact('MultiAgentSystem', 'm12-sistema-dupla');
  assert.ok(systemDoc);
  const wfId = (systemDoc?.spec as { coordinationWorkflowId?: string }).coordinationWorkflowId;
  assert.ok(wfId && (await getLatestSpec(wfId)));
  const r2 = okOf(await runGeneration('multi-agent-system', input));
  assert.equal(r2.reused, true);
  const bad = await runGeneration('multi-agent-system', { name: 'Sistema Roto', members: [{ agent: 'agente-fantasma', role: 'x' }] });
  assert.equal(bad.ok, false);
});

test('prompt-system: prompts + composición; composición rota → 400', async () => {
  const input = {
    name: 'M12 Prompts Comercio',
    prompts: [
      { name: 'Saludo Cortés', template: 'Hola {{cliente}}, ¿cómo va el {{tema}}?', variables: [{ name: 'cliente', type: 'string' }, { name: 'tema', type: 'string' }] },
      { name: 'Resumen', template: 'Resume: {{prev}}', variables: [{ name: 'prev', type: 'string' }] },
    ],
    compositions: [{ steps: [{ prompt: 'Saludo Cortés', inputs: { cliente: 'Manu', tema: 'compra' } }, { prompt: 'Resumen', inputs: { prev: '{{prev}}' } }] }],
  };
  const r = okOf(await runGeneration('prompt-system', input));
  assert.equal(eng(r.outcome).artifactKind, 'PromptSystem');
  const doc = await getLatestArtifact('PromptSystem', r.outcome.id);
  assert.equal((doc?.spec as { prompts: Array<{ id: string }> }).prompts[0].id, 'saludo-cortes');
  const broken = await runGeneration('prompt-system', { name: 'M12 Prompts Rotos', prompts: [{ name: 'A', template: 'x', variables: [] }], compositions: [{ steps: [{ prompt: 'NoExiste', inputs: {} }] }] });
  assert.equal(broken.ok, false);
  const r2 = okOf(await runGeneration('prompt-system', input));
  assert.equal(r2.reused, true);
});

test('tool-collection: solo tools registradas; ID desconocido → 400', async () => {
  const r = okOf(await runGeneration('tool-collection', { name: 'M12 Toolbox Básica', tools: [{ toolId: 'clock', permissions: ['read'] }] }));
  assert.equal(eng(r.outcome).artifactKind, 'ToolCollection');
  const bad = await runGeneration('tool-collection', { name: 'M12 Toolbox Rota', tools: [{ toolId: 'no-existe' }] });
  assert.equal(bad.ok, false);
});

test('knowledge-base: crea + ingesta fuentes REALES y escribe bindings', async () => {
  const agent = okOf(await runGeneration('agent', { ...AGENT_INPUT_SALUDADOR, name: 'M12 Agente Lectura' }));
  const agentId = (asOk(agent).outcome as { id: string }).id;
  const kbInput = {
    name: 'M12 Base Comercio',
    sources: [{ title: 'FAQ M12 (test)', text: 'La tienda abre en horario de mañana; la caja es gris y el envío azul.' }],
    bindings: [{ agent: agentId, sourceTitles: ['FAQ M12 (test)'] }],
  };
  const r = okOf(await runGeneration('knowledge-base', kbInput));
  assert.equal(eng(r.outcome).artifactKind, 'KnowledgeBase');
  const doc = await getLatestArtifact('KnowledgeBase', r.outcome.id);
  const sources = (doc?.spec as { sources: Array<{ sourceId: string }> }).sources;
  assert.equal(sources.length, 1);
  const bindings = await getBindings();
  assert.ok((bindings[agentId] ?? []).includes(sources[0].sourceId));
  // Reutilización idempotente: la fuente EXISTENTE no se re-crea.
  const r2 = okOf(await runGeneration('knowledge-base', kbInput));
  assert.equal(r2.outcome.id, r.outcome.id, 'misma entrada → mismo artefacto (reutilización)');
  assert.equal(r2.reused, true);
});

test('rag-system: bindings verificados, umbral con aviso si < 0.70', async () => {
  const agent = okOf(await runGeneration('agent', { ...AGENT_INPUT_SALUDADOR, name: 'M12 Agente RAG' }));
  const agentId = (asOk(agent).outcome as { id: string }).id;
  const kb = okOf(await runGeneration('knowledge-base', { name: 'M12 Base RAG', sources: [{ title: 'Doc RAG M12 (test)', text: 'contenido rojo de prueba para los embeddings del mock' }] }));
  const kbDoc = await getLatestArtifact('KnowledgeBase', kb.outcome.id);
  const sourceId = (kbDoc?.spec as { sources: Array<{ sourceId: string }> }).sources[0].sourceId;
  const r = okOf(await runGeneration('rag-system', { name: 'M12 RAG Lectura', agents: [agentId], bindings: [{ agent: agentId, sourceIds: [sourceId] }], minScore: 0.4 }));
  assert.equal(eng(r.outcome).artifactKind, 'RagSystem');
  assert.ok((r.warnings ?? []).some((w) => w.includes('0.70')), 'aviso de honestidad: el GATE runtime manda');
  const bad = await runGeneration('rag-system', { name: 'M12 RAG Roto', agents: ['agente-fantasma'] });
  assert.equal(bad.ok, false);
});

test('mcp-server: manifiesto SOLO con tools reales (no desplegado)', async () => {
  const r = okOf(await runGeneration('mcp-server', { serverId: 'm12-servidor-mcp', name: 'M12 Servidor MCP', tools: ['clock', 'memory-write'] }));
  assert.equal(eng(r.outcome).artifactKind, 'McpServerManifest');
  const doc = await getLatestArtifact('McpServerManifest', 'm12-servidor-mcp');
  assert.equal((doc?.spec as { transport: string }).transport, 'http-json-rpc');
  const bad = await runGeneration('mcp-server', { serverId: 'm12-servidor-roto', name: 'x', tools: ['no-existe'] });
  assert.equal(bad.ok, false);
});

test('skill-pack + evaluation + harness + framework: generan artefactos con referencias verificadas', async () => {
  const sk = okOf(await runGeneration('skill-pack', {
    name: 'M12 Skills Redacción',
    skills: [{ id: 'resumen-ejecutivo', description: 'resume textos', instructions: 'Resume con 3 puntos.', inputs: [{ name: 'texto', type: 'string' }] }],
  }));
  assert.equal(eng(sk.outcome).artifactKind, 'SkillPack');
  const db = okOf(await runGeneration('evaluation', {
    name: 'M12 Dataset Comercio',
    cases: [{ query: '¿horario?', expected: 'de 9 a 18', refs: ['FAQ M12 (test)'] }],
    thresholds: { recall: 0.8 },
  }));
  assert.equal(eng(db.outcome).artifactKind, 'EvaluationDataset');
  const agent = okOf(await runGeneration('agent', { ...AGENT_INPUT_SALUDADOR, name: 'M12 Agente Ensayo' }));
  const agentId = (asOk(agent).outcome as { id: string }).id;
  const h = okOf(await runGeneration('harness', {
    name: 'M12 Harness Ensayo',
    targets: [agentId],
    allowedTools: ['clock'],
    limits: { maxIterations: 3 },
    testCases: [{ dataset: db.outcome.id, description: 'casos del dataset' }],
  }));
  assert.equal(eng(h.outcome).artifactKind, 'Harness');
  const hDoc = await getLatestArtifact('Harness', h.outcome.id);
  assert.deepEqual((hDoc?.spec as { targetRefs: string[] }).targetRefs, [agentId]);
  const multi = okOf(await runGeneration('multi-agent-system', { name: 'M12 Sistema Marco', members: [{ agent: agentId, role: 'a' }, { agent: agentId, role: 'b' }] }));
  const fw = okOf(await runGeneration('framework', {
    name: 'M12 Framework Comercio',
    components: [
      { type: 'agent', ref: { id: agentId, kind: 'Agent' }, use: 'atención' },
      { type: 'knowledge-base', ref: { id: 'm12-base-comercio', kind: 'KnowledgeBase' } },
      { type: 'multi-agent-system', ref: { id: multi.outcome.id, kind: 'MultiAgentSystem' } },
    ],
    extensionPoints: [{ name: 'plugins', description: 'herramientas adicionales' }],
  }));
  assert.equal(eng(fw.outcome).artifactKind, 'Framework');
  const fwDoc = await getLatestArtifact('Framework', fw.outcome.id);
  assert.equal((fwDoc?.spec as { components: Array<{ registeredVersion?: string }> }).components[0].registeredVersion, agent.outcome.version);
  const brokenFramework = await runGeneration('framework', { name: 'M12 Framework Roto', components: [{ type: 'agent', ref: { id: 'fantasma', kind: 'Agent' } }] });
  assert.equal(brokenFramework.ok, false);
});

test('registros de generación: listado ordenado, ids no válidos → null, latestGenerationFor', async () => {
  const records = await listGenerationRecords(200);
  assert.ok(records.length >= 10, 'todas las generaciones de los tests quedan registradas');
  const sorted = [...records].map((r) => r.startedAt).sort((a, b) => b.localeCompare(a));
  assert.deepEqual(records.map((r) => r.startedAt), sorted);
  assert.equal(await getGenerationRecord('gen-inventado-xxxx98'), null);
  assert.equal(await getGenerationRecord('../traversal'), null);
  const lastAgent = await latestGenerationFor('specs', 'Agent', 'm12-agente-saludador');
  assert.ok(lastAgent?.outcome);
  assert.equal(await latestGenerationFor('specs', 'Agent', 'no-existe-nunca'), null);
});

test('artefactos: versiones múltiples legibles y ciclo de vida generado', async () => {
  const versions = await listArtifactVersions('PromptSystem', 'm12-prompts-comercio');
  assert.ok(versions.length >= 1);
  const lc = await getArtifactLifecycle('PromptSystem', 'm12-prompts-comercio');
  assert.equal(lc?.state, 'generated');
});
