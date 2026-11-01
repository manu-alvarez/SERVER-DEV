import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import './helpers/test-env';
import { API_VERSION } from '@uiep/agent-spec';
import { saveSpec } from '../services/spec-registry.service';
import {
  ARTIFACT_CATALOG,
  checkVersionCompat,
  detectCycles,
  getCatalog,
  getLifecycle,
  getLatestProject,
  listProjectVersions,
  listProjects,
  registerProject,
  resolveProjectGraph,
  topologicalOrder,
  transitionLifecycle,
} from '../services/engineering-registry.service';

/**
 * Misión 11 — Universal Artifact Registry: catálogo con capacidades REALES,
 * store atómico id@version, grafo de dependencias (ciclos/orden/compat),
 * procedencia y ciclo de vida auditado.
 */

const PROFILE = {
  apiVersion: API_VERSION,
  kind: 'ModelProfile',
  metadata: { id: 'mock-profile-reg', name: 'Perfil mock', version: '1.0.0' },
  spec: { provider: 'ollama', model: 'mock-model', endpointEnv: 'OLLAMA_BASE_URL', capabilities: ['chat'] },
};

function proyecto(id: string, artifacts: unknown[], extra: Record<string, unknown> = {}) {
  return {
    apiVersion: 'uiep.io/ues/v1',
    kind: 'Project',
    metadata: { id, name: id, version: '1.0.0' },
    artifacts,
    ...extra,
  };
}

before(async () => {
  await saveSpec(PROFILE);
});

test('catálogo: 19 tipos; agent/workflow/knowledge-base generables; saas/framework solo esquema', () => {
  assert.equal(getCatalog().length, 19);
  assert.deepEqual(ARTIFACT_CATALOG.length, 19);
  const agent = getCatalog().find((e) => e.type === 'agent')!;
  assert.equal(agent.capabilities.generator, true);
  assert.equal(agent.capabilities.execution, true);
  assert.equal(agent.capabilities.validation, true);
  const saas = getCatalog().find((e) => e.type === 'saas')!;
  assert.equal(saas.capabilities.generator, false, 'saas NO se declara generable (no hay generador)');
  assert.equal(saas.capabilities.execution, false);
  const mcp = getCatalog().find((e) => e.type === 'mcp-server')!;
  assert.equal(mcp.capabilities.generator, false, 'mcp-server NO generable todavía');
  const kb = getCatalog().find((e) => e.type === 'knowledge-base')!;
  assert.equal(kb.capabilities.generator, true);
  assert.equal(kb.capabilities.validation, true, 'el gate RAG valida knowledge/RAG');
});

test('registry: guardar y recuperar proyecto (última versión)', async () => {
  const r = await registerProject(
    proyecto('reg-demo-1', [{ ref: 'a', type: 'agent', specRef: { id: 'mock-profile-reg', kind: 'ModelProfile' } }]),
  );
  assert.equal(r.ok, true);
  const latest = await getLatestProject('reg-demo-1');
  assert.ok(latest);
  assert.equal(latest!.metadata.id, 'reg-demo-1');
  const lista = await listProjects();
  assert.ok(lista.some((p) => p.id === 'reg-demo-1' && p.artifacts === 1));
});

test('registry: versionado — la última versión se elige por SemVer y el histórico se conserva', async () => {
  const r1 = await registerProject(proyecto('reg-demo-2', [{ ref: 'a', type: 'agent' }]));
  assert.equal(r1.ok, true);
  const r2 = await registerProject(
    proyecto('reg-demo-2', [{ ref: 'a', type: 'agent' }, { ref: 'b', type: 'workflow' }], {
      metadata: { id: 'reg-demo-2', name: 'reg-demo-2', version: '1.1.0' },
    }),
  );
  assert.equal(r2.ok, true);
  const latest = await getLatestProject('reg-demo-2');
  assert.equal(latest!.metadata.version, '1.1.0');
  const versions = await listProjectVersions('reg-demo-2');
  assert.equal(versions.length, 2);
  assert.equal(versions[0].metadata.version, '1.1.0');
});

test('grafo: detección de ciclos (a→b→a)', () => {
  const arts = [
    { ref: 'a', dependencies: [{ ref: 'b', required: true }] },
    { ref: 'b', dependencies: [{ ref: 'a', required: true }] },
  ];
  const cycles = detectCycles(arts);
  assert.equal(cycles.length >= 1, true);
  const topo = topologicalOrder(arts);
  assert.equal(topo.ok, false);
});

test('grafo: sin ciclos el orden topológico pone dependencias primero', () => {
  const arts = [
    { ref: 'c', dependencies: [{ ref: 'b', required: true }] },
    { ref: 'a', dependencies: [] },
    { ref: 'b', dependencies: [{ ref: 'a', required: true }] },
  ];
  const topo = topologicalOrder(arts);
  assert.equal(topo.ok, true);
  if (topo.ok) {
    assert.ok(topo.order.indexOf('a') < topo.order.indexOf('b'), 'a antes de b');
    assert.ok(topo.order.indexOf('b') < topo.order.indexOf('c'), 'b antes de c');
  }
});

test('grafo: compatibilidad de versiones — rangos ^/~ y fail-closed', () => {
  // ^1.0.0 acepta 1.5.0 (minor dentro del major) y NO acepta 2.0.0
  const caretOk = [
    { ref: 'a', version: '1.0.0', dependencies: [{ ref: 'b', required: true, versionRange: '^1.0.0' }] },
    { ref: 'b', version: '1.5.0', dependencies: [] },
  ];
  assert.equal(checkVersionCompat(caretOk).length, 0);
  const caretRoto = [
    { ref: 'a', version: '1.0.0', dependencies: [{ ref: 'b', required: true, versionRange: '^1.0.0' }] },
    { ref: 'b', version: '2.0.0', dependencies: [] },
  ];
  assert.equal(checkVersionCompat(caretRoto).length, 1);
  const okArts = [
    { ref: 'a', version: '1.0.0', dependencies: [{ ref: 'b', required: true, versionRange: '~1.5.0' }] },
    { ref: 'b', version: '1.5.9', dependencies: [] },
  ];
  assert.equal(checkVersionCompat(okArts).length, 0);
  const invalido = [
    { ref: 'a', version: '1.0.0', dependencies: [{ ref: 'b', required: true, versionRange: 'zzz' }] },
    { ref: 'b', version: '1.0.0', dependencies: [] },
  ];
  assert.equal(checkVersionCompat(invalido).length, 1, 'rango inválido → incompatibilidad (fail-closed)');
});

test('registro: proyecto con ciclo de dependencias → 400 (no se guarda)', async () => {
  const r = await registerProject(
    proyecto('reg-ciclo', [
      { ref: 'a', type: 'agent', dependencies: [{ ref: 'b', required: true }] },
      { ref: 'b', type: 'agent', dependencies: [{ ref: 'a', required: true }] },
    ]),
  );
  assert.equal(r.ok, false);
  if (!r.ok) {
    assert.equal(r.status, 400);
    assert.ok(JSON.stringify(r.errors).includes('ciclo'));
  }
  assert.equal(await getLatestProject('reg-ciclo'), null);
});

test('grafo: specRef resuelve contra el registry de specs (kind y versión)', async () => {
  await saveSpec(PROFILE);
  const r = await registerProject(
    proyecto('reg-specref', [{ ref: 'perfil', type: 'agent', specRef: { id: 'mock-profile-reg', kind: 'ModelProfile' } }]),
  );
  assert.equal(r.ok, true);
  const doc = await getLatestProject('reg-specref');
  const g = await resolveProjectGraph(doc!);
  assert.equal(g.ok, true);
  assert.equal(g.specRefs[0].found, true);
  assert.equal(g.specRefs[0].kindMatch, true);
});

test('grafo: specRef inexistente marca found=false y degrada el estado ok del grafo', async () => {
  const r = await registerProject(
    proyecto('reg-specref-missing', [{ ref: 'perfil', type: 'agent', specRef: { id: 'no-existe-nadie', kind: 'Agent' } }]),
  );
  assert.equal(r.ok, true); // registrar permite refs pendientes (estado draft)
  const doc = await getLatestProject('reg-specref-missing');
  const g = await resolveProjectGraph(doc!);
  assert.equal(g.ok, false);
  assert.equal(g.specRefs[0].found, false);
});

test('grafo: dependencias externas — requerida no resuelta degrada; opcional no', async () => {
  const r = await registerProject(
    proyecto('reg-externa', [{ ref: 'a', type: 'agent' }], { dependencies: [{ ref: 'spec-inexistente', required: true }] }),
  );
  assert.equal(r.ok, true);
  const doc = await getLatestProject('reg-externa');
  const g = await resolveProjectGraph(doc!);
  assert.equal(g.ok, false);
  assert.equal(g.external[0].resolved, false);

  const r2 = await registerProject(
    proyecto('reg-externa-opc', [{ ref: 'a', type: 'agent' }], { dependencies: [{ ref: 'spec-inexistente', required: false }] }),
  );
  assert.equal(r2.ok, true);
  const doc2 = await getLatestProject('reg-externa-opc');
  const g2 = await resolveProjectGraph(doc2!);
  assert.equal(g2.ok, true, 'dependencia externa OPCIONAL no resuelta no rompe el grafo');
});

/* ── Ciclo de vida ───────────────────────────────────────────────────────── */

test('ciclo de vida: transiciones legales draft→validated→generated con histórico', async () => {
  await registerProject(proyecto('reg-lc', [{ ref: 'a', type: 'agent' }]));
  const t1 = await transitionLifecycle('reg-lc', 'validated');
  assert.equal(t1.ok, true);
  const t2 = await transitionLifecycle('reg-lc', 'generated', { note: 'generado por blueprint' });
  assert.equal(t2.ok, true);
  const lc = await getLifecycle('reg-lc');
  assert.equal(lc!.state, 'generated');
  assert.equal(lc!.history.length, 2);
  assert.equal(lc!.history[0].from, 'draft');
  assert.equal(lc!.history[1].note, 'generado por blueprint');
});

test('ciclo de vida: salto ilegal → 400; proyecto inexistente → 404', async () => {
  await registerProject(proyecto('reg-lc-ilegal', [{ ref: 'a', type: 'agent' }]));
  const ilegal = await transitionLifecycle('reg-lc-ilegal', 'deployed'); // draft → deployed NO permitido
  assert.equal(ilegal.ok, false);
  if (!ilegal.ok) {
    assert.equal(ilegal.status, 400);
    assert.ok(ilegal.reason.includes('no permitida'));
  }
  const missing = await transitionLifecycle('no-existe-nadie', 'validated');
  assert.equal(missing.ok, false);
  if (!missing.ok) {
    assert.equal(missing.status, 404);
  }
});

test('ciclo de vida: archived es terminal', async () => {
  await registerProject(proyecto('reg-lc-arch', [{ ref: 'a', type: 'agent' }]));
  await transitionLifecycle('reg-lc-arch', 'archived');
  const t = await transitionLifecycle('reg-lc-arch', 'draft');
  assert.equal(t.ok, false);
});

test('ciclo de vida: los cambios quedan auditados', async () => {
  await registerProject(proyecto('reg-lc-audit', [{ ref: 'a', type: 'agent' }]));
  await transitionLifecycle('reg-lc-audit', 'validated');
  // audit() es fire-and-forget: dar un ciclo de evento al event-loop para el flush.
  await new Promise((r) => setTimeout(r, 150));
  const { auditTail } = await import('../services/observability.service');
  const events = await auditTail(20);
  const evt = events.find((e: { action?: string; correlation?: { targetId?: string } }) => e.action === 'engineering.lifecycle' && e.correlation?.targetId === 'reg-lc-audit');
  assert.ok(evt, 'existe evento engineering.lifecycle para el proyecto');
});
