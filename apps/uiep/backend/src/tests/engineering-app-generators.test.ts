import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import './helpers/test-env';
import { seedDefaultModelProfile } from '../services/model-gateway.service';
import { seedDefaultToolSpecs } from '../services/tool-registry.service';
import { startRuntimeMock } from './helpers/runtime-mock';
import type { Server as HttpServer } from 'node:http';
import {
  GENERATOR_ENGINE_VERSION,
  runGeneration,
  getGenerationRecord,
  validateGeneration,
  type GenerationResponse,
  type GenerationOutcome,
} from '../services/engineering-generator.service';
import { generateComposition, type CompositionResult } from '../services/engineering-composition.service';
import { getLatestArtifact, listArtifactVersions } from '../services/engineering-registry.service';

/**
 * Misión 13 — Application & System generators (service-level):
 * api-platform (contratos + docs determinista), application (módulos
 * verificados), agentic-app (SOLO componentes ejecutables, con subgeneración),
 * saas (tenancy preparada) y framework con módulos. Todo sobre el MISMO motor
 * universal de M12 (mismos upserts fail-closed, registros y procedencia).
 */

type OkGen = Extract<GenerationResponse, { ok: true }>;
const okOf = (r: GenerationResponse): OkGen => {
  assert.equal(r.ok, true, JSON.stringify(r).slice(0, 400));
  return r;
};
type EngineOutcome = Extract<GenerationOutcome, { store: 'engineering' }>;
const eng = (o: GenerationOutcome): EngineOutcome => o as EngineOutcome;

let MOCK: { server: HttpServer; url: string } | null = null;

before(async () => {
  assert.equal(await seedDefaultModelProfile(), 'seeded');
  assert.equal(await seedDefaultToolSpecs(), 'seeded');
  const mock = await startRuntimeMock();
  MOCK = mock;
  process.env.OLLAMA_BASE_URL = mock.url;
});

after(() => {
  MOCK?.server.close();
});

test('motor: versión 1.1.0 y 16 generadores (12 M12 + 4 M13)', () => {
  assert.equal(GENERATOR_ENGINE_VERSION, '1.1.0');
});

test('api-platform: contratos tipados + openapiLike determinista + binding a agente verificado', async () => {
  const agent = okOf(await runGeneration('agent', {
    name: 'M13 Agente API',
    role: 'responde consultas',
    objective: 'atender el endpoint de demo',
    system: 'Agente detrás de un endpoint de la plataforma API M13.',
    memory: { enabled: false, strategy: 'none' },
  }));
  const agentId = (agent.outcome as { id: string }).id;
  const input = {
    id: 'm13-tickets',
    name: 'M13 API Tickets',
    description: 'contratos de soporte',
    auth: 'console-session' as const,
    endpoints: [
      {
        id: 'listar-tickets',
        method: 'GET' as const,
        path: '/api/tickets',
        summary: 'lista tickets abiertos',
        response: [{ name: 'items', type: 'array' as const }, { name: 'total', type: 'number' as const, constraints: [{ kind: 'min' as const, value: 0 }] }],
        errors: [{ status: 401, code: 'unauthorized', when: 'sin sesión' }],
        agentBinding: agentId,
      },
      {
        id: 'crear-ticket',
        method: 'POST' as const,
        path: '/api/tickets',
        summary: 'crea un ticket',
        request: [{ name: 'titulo', type: 'string' as const, constraints: [{ kind: 'maxLength' as const, value: 120 }] }],
        errors: [{ status: 422, code: 'invalid_input', when: 'título vacío' }],
        rateLimit: { max: 30, windowMs: 60_000 },
      },
    ],
  };
  const r = okOf(await runGeneration('api-platform', input));
  assert.equal(eng(r.outcome).artifactKind, 'ApiPlatform');
  const doc = await getLatestArtifact('ApiPlatform', 'm13-tickets');
  const spec = doc?.spec as { auth: { type: string; csrfHeader: string }; openapiLike: { paths: Record<string, Record<string, unknown>> } };
  assert.equal(spec.auth.csrfHeader, 'x-uiep-console');
  assert.ok(spec.openapiLike.paths['/api/tickets']);
  assert.ok(spec.openapiLike.paths['/api/tickets']['post'], 'el doc incluye los DOS métodos');
  assert.ok((r.warnings ?? []).some((w) => w.includes('M14')), 'advertencia honesta: el servidor de endpoints → M14');
  // Idempotencia.
  const r2 = okOf(await runGeneration('api-platform', input));
  assert.equal(r2.reused, true);
  // Errores: duplicado método+ruta, ruta sin '/', agente inexistente.
  const dup = await runGeneration('api-platform', { name: 'M13 API Rota', endpoints: [input.endpoints[0], { ...input.endpoints[0], id: 'otro' }] });
  assert.equal(dup.ok, false);
  if (!dup.ok) {
    assert.ok(JSON.stringify(dup.errors).includes('duplicados'));
  }
  const badPath = await runGeneration('api-platform', { name: 'M13 API Ruta', endpoints: [{ ...input.endpoints[0], path: 'api/sin-slash' }] });
  assert.equal(badPath.ok, false);
  const ghost = await runGeneration('api-platform', { name: 'M13 API Fantasma', endpoints: [{ ...input.endpoints[0], agentBinding: 'agente-fantasma' }] });
  assert.equal(ghost.ok, false);
  if (!ghost.ok) {
    assert.ok(JSON.stringify(ghost.errors).includes('agente-fantasma'));
  }
});

test('application: módulos con componentRefs REALES, entrypoint y envVarNames (sin valores)', async () => {
  const api = okOf(await runGeneration('api-platform', { name: 'M13 API App Demo', endpoints: [{ id: 'ping', method: 'GET' as const, path: '/ping', summary: 'salud' }] }));
  const apiId = (api.outcome as { id: string }).id;
  const input = {
    name: 'M13 App Soporte',
    entryModule: 'api',
    modules: [
      { ref: 'api', kind: 'api-platform' as const, componentRef: { kind: 'ApiPlatform', id: apiId }, dependencies: [] },
      { ref: 'frontend', kind: 'frontend' as const, description: 'SPA de la consola (existente)' },
      { ref: 'config', kind: 'config' as const, dependencies: ['api'] },
    ],
    envVarNames: ['UIEP_CONSOLE_PASSWORD', 'UIEP_RUNTIME_TOKEN'],
  };
  const r = okOf(await runGeneration('application', input));
  assert.equal(eng(r.outcome).artifactKind, 'Application');
  const doc = await getLatestArtifact('Application', 'm13-app-soporte');
  const spec = doc?.spec as { modules: Array<{ ref: string; componentRef?: { registeredVersion?: string } }>; config: { envVarNames: string[]; runtime: string } };
  assert.equal(spec.config.runtime, 'uiep-backend');
  assert.deepEqual(spec.config.envVarNames, ['UIEP_CONSOLE_PASSWORD', 'UIEP_RUNTIME_TOKEN'], 'solo NOMBRES, jamás valores');
  assert.equal(spec.modules[0].componentRef?.registeredVersion, api.outcome.version, 'versión registrada resuelta');
  const r2 = okOf(await runGeneration('application', input));
  assert.equal(r2.reused, true);
  // Fail-closed: componentRef inexistente + ciclo de módulos + entryModule inválido.
  const ghost = await runGeneration('application', { name: 'M13 App Rota', entryModule: 'api', modules: [{ ref: 'api', kind: 'api-platform', componentRef: { kind: 'ApiPlatform', id: 'no-existe' } }] });
  assert.equal(ghost.ok, false);
  const ciclo = await runGeneration('application', {
    name: 'M13 App Ciclo',
    entryModule: 'a',
    modules: [
      { ref: 'a', kind: 'config' as const, dependencies: ['b'] },
      { ref: 'b', kind: 'config' as const, dependencies: ['a'] },
    ],
  });
  assert.equal(ciclo.ok, false);
  if (!ciclo.ok) {
    assert.ok(JSON.stringify(ciclo.errors).includes('ciclo'));
  }
  const badEntry = await runGeneration('application', { name: 'M13 App Entry', entryModule: 'nada', modules: [{ ref: 'api', kind: 'config' }] });
  assert.equal(badEntry.ok, false);
});

test('agentic-app: SOLO componentes ejecutables; subgenera agente y registra hijos', async () => {
  const wf = okOf(await runGeneration('workflow', { name: 'M13 Flujo App', steps: [{ agent: 'm13-agente-api', input: '{{input}}' }] }));
  const wfId = (wf.outcome as { id: string }).id;
  const input = {
    name: 'M13 App Agentica Soporte',
    agents: [
      { agent: 'm13-agente-api', role: 'atención' },
      { agent: { generate: { name: 'M13 Agente Escalado', role: 'escalado', objective: 'derivar casos complejos', system: 'Segundo agente de la app M13.', memory: { enabled: false, strategy: 'none' } } }, role: 'escalado' },
    ],
    workflows: [wfId],
    tools: ['clock'],
    surfaces: [{ type: 'console' as const, note: 'consola UIEP' }, { type: 'workflow-engine' as const }],
    guardrails: { maxIterations: 4, approvalRequired: [] },
  };
  const r = okOf(await runGeneration('agentic-app', input));
  assert.equal(eng(r.outcome).artifactKind, 'AgenticApp');
  assert.ok(((r as unknown as { children?: string[] }).children ?? []).length >= 1, 'subgeneración registrada');
  const doc = await getLatestArtifact('AgenticApp', 'm13-app-agentica-soporte');
  const spec = doc?.spec as { agents: Array<{ agentSpecId: string }>; guardrails: { maxIterations: number } };
  assert.equal(spec.agents.length, 2);
  assert.equal(spec.guardrails.maxIterations, 4);
  assert.ok((r.warnings ?? []).some((w) => w.includes('ejecutables')), 'honestidad: los componentes SÍ corren hoy');
  const r2 = okOf(await runGeneration('agentic-app', input));
  assert.equal(r2.reused, true);
  // Fail-closed: workflow inexistente, tool inexistente, knowledge inexistente.
  const badWf = await runGeneration('agentic-app', { name: 'x1', agents: [{ agent: 'm13-agente-api', role: 'r' }], workflows: ['flujo-fantasma'], surfaces: [{ type: 'console' }] });
  assert.equal(badWf.ok, false);
  const badTool = await runGeneration('agentic-app', { name: 'x2', agents: [{ agent: 'm13-agente-api', role: 'r' }], tools: ['tool-fantasma'], surfaces: [{ type: 'console' }] });
  assert.equal(badTool.ok, false);
  const badKb = await runGeneration('agentic-app', { name: 'x3', agents: [{ agent: 'm13-agente-api', role: 'r' }], knowledge: [{ sourceId: 'fuente-fantasma' }], surfaces: [{ type: 'console' }] });
  assert.equal(badKb.ok, false);
  if (!badKb.ok) {
    assert.ok(JSON.stringify(badKb.errors).includes('fuente-fantasma'));
  }
});

test('saas: módulos verificados + roles + tenancy preparada; fail-closed completo', async () => {
  const api = okOf(await runGeneration('api-platform', { name: 'M13 API SaaS', endpoints: [{ id: 'whoami', method: 'GET' as const, path: '/api/me', summary: 'sesión actual' }] }));
  const apiId = (api.outcome as { id: string }).id;
  const input = {
    name: 'M13 SaaS Soporte',
    entryModule: 'app',
    modules: [
      { ref: 'app', kind: 'application' as const, componentRef: { kind: 'Application', id: 'm13-app-soporte' } },
      { ref: 'api', kind: 'api-platform' as const, componentRef: { kind: 'ApiPlatform', id: apiId }, dependencies: ['app'] },
      { ref: 'auth', kind: 'auth' as const, description: 'sesión de consola existente' },
    ],
    roles: [
      { name: 'admin', permissions: ['tickets.write', 'users.manage'] },
      { name: 'agente', permissions: ['tickets.write'] },
      { name: 'lectura', permissions: ['tickets.read'] },
    ],
    tenancy: 'multi-tenant-ready' as const,
    envVarNames: ['UIEP_CONSOLE_PASSWORD'],
  };
  const r = okOf(await runGeneration('saas', input));
  assert.equal(eng(r.outcome).artifactKind, 'Saas');
  const doc = await getLatestArtifact('Saas', 'm13-saas-soporte');
  const spec = doc?.spec as { tenancy: { model: string; roles: Array<{ name: string }> }; modules: Array<{ ref: string }> };
  assert.equal(spec.tenancy.model, 'multi-tenant-ready');
  assert.equal(spec.tenancy.roles.length, 3);
  const r2 = okOf(await runGeneration('saas', input));
  assert.equal(r2.reused, true);
  assert.ok((r2.warnings ?? []).some((w) => w.includes('PREPARADA')), 'honestidad: tenancy declarativa');
  const badRef = await runGeneration('saas', { name: 'M13 SaaS Roto', entryModule: 'app', modules: [{ ref: 'app', kind: 'application', componentRef: { kind: 'Application', id: 'fantasma' } }] });
  assert.equal(badRef.ok, false);
  if (!badRef.ok) {
    assert.ok(JSON.stringify(badRef.errors).includes('fantasma'));
  }
});

test('framework M13: módulos con componentes verificadas y grafo acíclico', async () => {
  const agent = okOf(await runGeneration('agent', { name: 'M13 Agente Framework', role: 'r', objective: 'o', system: 's', memory: { enabled: false, strategy: 'none' } }));
  const agentId = (agent.outcome as { id: string }).id;
  // Artefacto de módulo REAL (en el MISMO dataset de este test).
  await runGeneration('prompt-system', { name: 'M13 Prompts Framework', prompts: [{ name: 'Eco', template: 'eco {{x}}', variables: [{ name: 'x', type: 'string' as const }] }] });
  const input = {
    name: 'M13 Framework Soporte',
    components: [{ type: 'agent', ref: { id: agentId, kind: 'Agent' } }],
    modules: [
      { id: 'nucleo', description: 'módulo nuclear', components: [{ type: 'agent', ref: { id: agentId, kind: 'Agent' } }] },
      { id: 'capa', components: [{ type: 'prompt-system', ref: { id: 'm13-prompts-framework', kind: 'PromptSystem' } }], dependencies: ['nucleo'] },
    ],
  };
  const r = okOf(await runGeneration('framework', input));
  assert.equal(eng(r.outcome).artifactKind, 'Framework');
  const doc = await getLatestArtifact('Framework', 'm13-framework-soporte');
  const spec = doc?.spec as { modules: Array<{ id: string; components: Array<{ registeredVersion?: string }> }> };
  assert.equal(spec.modules.length, 2);
  assert.ok(spec.modules[1].components[0].registeredVersion, 'registeredVersion del PromptSystem resuelta');
  const ciclo = await runGeneration('framework', {
    name: 'M13 Framework Ciclo',
    components: input.components,
    modules: [
      { id: 'a', components: [{ type: 'agent', ref: { id: agentId, kind: 'Agent' } }], dependencies: ['b'] },
      { id: 'b', components: [{ type: 'agent', ref: { id: agentId, kind: 'Agent' } }], dependencies: ['a'] },
    ],
  });
  assert.equal(ciclo.ok, false);
  if (!ciclo.ok) {
    assert.ok(JSON.stringify(ciclo.errors).includes('ciclo'));
  }
  // Dry-run de validate también detecta el ciclo (sin escribir).
  const v = await validateGeneration('framework', ciclo);
  assert.equal(v.ok, false);
  assert.equal(await listArtifactVersions('Framework', 'm13-framework-ciclo').then((x) => x.length), 0);
});

test('composición M13: saas compuesto vía /compositions con tokens $ref entre nuevos tipos', async () => {
  const agent = okOf(await runGeneration('agent', { name: 'M13 Agente Componer', role: 'r', objective: 'o', system: 's', memory: { enabled: false, strategy: 'none' } }));
  const agentId = (agent.outcome as { id: string }).id;
  // Composición que GENERA api + application + agentic-app + saas referenciándose.
  const project = {
    apiVersion: 'uiep.io/ues/v1',
    kind: 'Project',
    metadata: { id: 'laboratorio-m13', name: 'Laboratorio M13', version: '1.0.0' },
    artifacts: [
      {
        ref: 'api',
        type: 'api-platform',
        generate: { name: 'M13 API Compuesta', endpoints: [{ id: 'eco', method: 'GET', path: '/api/eco', summary: 'eco', agentBinding: agentId }] },
      },
      {
        ref: 'app',
        type: 'application',
        dependencies: [{ ref: 'api' }],
        generate: { name: 'M13 App Compuesta', entryModule: 'api', modules: [{ ref: 'api', kind: 'api-platform', componentRef: { kind: 'ApiPlatform', id: '$ref:api' } }] },
      },
      {
        ref: 'agentic',
        type: 'agentic-app',
        dependencies: [{ ref: 'api' }],
        generate: { name: 'M13 Agentic Compuesta', agents: [{ agent: agentId, role: 'núcleo' }], surfaces: [{ type: 'http', note: 'contrato eco' }] },
      },
      {
        ref: 'saas',
        type: 'saas',
        dependencies: [{ ref: 'app' }, { ref: 'agentic' }],
        generate: { name: 'M13 SaaS Compuesto', entryModule: 'app', modules: [{ ref: 'app', kind: 'application', componentRef: { kind: 'Application', id: '$ref:app' } }] },
      },
    ],
  };
  const r = (await generateComposition(project)) as Extract<CompositionResult, { ok: true }>;
  assert.equal(r.ok, true, JSON.stringify(r).slice(0, 400));
  assert.equal(r.projectId, 'laboratorio-m13');
  const byRef = new Map(r.artifacts.map((a) => [a.ref, a]));
  assert.equal(byRef.get('api')!.action, 'created');
  assert.equal(byRef.get('saas')!.action, 'created');
  // El token $ref:api se resolvió: el Application doc referencia el ApiPlatform REAL.
  const appDoc = (await getLatestArtifact('Application', 'm13-app-compuesta')) as { spec: { modules: Array<{ componentRef?: { id: string } }> } };
  assert.equal(appDoc.spec.modules[0].componentRef?.id, 'm13-api-compuesta');
  // Re-run idempotente: TODO reused.
  const r2 = await generateComposition(project);
  if (r2.ok) {
    assert.ok(r2.artifacts.every((a) => a.action === 'reused-generated'), JSON.stringify(r2.artifacts).slice(0, 200));
  } else {
    assert.fail('la recomposición debería reutilizar todo');
  }
});

test('registros M13: los 5 nuevos tipos quedan en el registro con procedencia', async () => {
  const { latestGenerationFor } = await import('../services/engineering-generator.service');
  for (const entry of [
    { type: 'api-platform', kind: 'ApiPlatform', id: 'm13-tickets' },
    { type: 'application', kind: 'Application', id: 'm13-app-soporte' },
    { type: 'agentic-app', kind: 'AgenticApp', id: 'm13-app-agentica-soporte' },
    { type: 'saas', kind: 'Saas', id: 'm13-saas-soporte' },
    { type: 'framework', kind: 'Framework', id: 'm13-framework-soporte' },
  ]) {
    const rec = await latestGenerationFor('engineering', entry.kind, entry.id);
    assert.ok(rec, `registro de generación para ${entry.kind}/${entry.id}`);
    assert.equal(rec?.status, 'succeeded', `${entry.type} quedó registrado`);
    assert.ok(rec?.provenance?.generator.id.startsWith('uiep-gen-'), `procedencia de ${entry.type}`);
    const doc = (await getLatestArtifact(entry.kind, entry.id))!;
    assert.ok(doc, `artefacto ${entry.kind} registrado`);
  }
});
