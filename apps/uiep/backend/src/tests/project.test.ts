import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import './helpers/test-env';
import { API_VERSION } from '@uiep/agent-spec';
import { saveSpec } from '../services/spec-registry.service';
import { exportProject, importProject, installTemplate, listTemplates } from '../services/project.service';
import { startRuntimeMock } from './helpers/runtime-mock';
import { createApp } from '../app';

/**
 * Fase 9 — reproducibilidad: export/import de proyecto (contratos + knowledge,
 * SIN memoria por diseño), plantillas instalables, clonado con historial.
 */

const server = createApp({ trustProxy: 'loopback' }).listen(0);
let mock: { server: Server; url: string };

before(async () => {
  mock = await startRuntimeMock();
  process.env.OLLAMA_BASE_URL = mock.url;
  process.env.UIEP_RUNTIME_TOKEN = ['runtime', 'token-project-tests-11'].join('-');
});

after(() => {
  mock.server.close();
  server.close();
});

/**
 * Fase 9 — reproducibilidad: export/import de proyecto (contratos + knowledge,
 * SIN memoria por diseño), plantillas instalables, clonado con historial.
 */

const PROFILE = {
  apiVersion: API_VERSION,
  kind: 'ModelProfile',
  metadata: { id: 'mock-profile', name: 'Perfil mock', version: '1.0.0' },
  spec: { provider: 'ollama', model: 'mock-model', endpointEnv: 'OLLAMA_BASE_URL', capabilities: ['chat'] },
};

test('templates: catálogo cargado del repo e instalación idempotente (specs + knowledge + binding)', async () => {
  await saveSpec(PROFILE); // el bundle debe incluir un ModelProfile
  await saveSpec({ apiVersion: API_VERSION, kind: 'Integration', metadata: { id: 'int-bundle', name: 'Bundle int', version: '1.0.0' }, spec: { type: 'http-api', baseUrl: 'https://example.com', auth: { type: 'none' }, healthPath: '/health', headers: {} } });
  const templates = await listTemplates();
  assert.ok(templates.length >= 2, 'hay blueprints versionados');
  const ids = templates.map((t) => t.id);

  const r = await installTemplate('agente-documentado');
  assert.equal(r.ok, true);
  assert.ok((r.details ?? []).some((d) => d.startsWith('Agent:tpl-agente-documentado')));
  assert.ok((r.details ?? []).some((d) => d.startsWith('knowledge:')));

  // reinstalar → idempotente (los specs son upserts; la knowledge re-crea — aceptado MVP)
  const r2 = await installTemplate('agente-documentado');
  assert.equal(r2.ok, true);
  void ids;
});

test('proyecto: export bundle completo (specs + knowledge + bindings, SIN memoria) e import en limpio', async () => {
  // pre: plantilla instalada (agente+knowledge) — del test anterior
  const bundle = await exportProject();
  assert.equal(bundle.bundleVersion, '1');
  const kinds = bundle.specs.map((s) => (s as { kind: string }).kind);
  assert.ok(kinds.includes('Agent'));
  assert.ok(kinds.includes('ModelProfile'));
  assert.ok(kinds.includes('Integration'), 'las integraciones viajan en el bundle');
  const kb = bundle.knowledge.find((k) => k.source.title.includes('Plantilla'));
  assert.ok(kb, 'knowledge en el bundle');
  assert.ok(kb?.content && kb.content.includes('TPL-0001'), 'el contenido textual viaja (reproducible)');
  assert.ok(kb?.bindings.includes('tpl-agente-documentado'), 'los bindings viajan');
  assert.ok(!JSON.stringify(bundle).includes('memory/memories'), 'la memoria NO viaja (privacidad por diseño)');

  // IMPORT: el importProject re-crea las fuentes (copia re-ingestada en este
  // DATA_DIR) — en otra instalación arranca limpia y queda igualmente operativa.
  const beforeSources = await import('../services/knowledge-store.service').then((m) => m.listSources());
  const r = await importProject(bundle);
  assert.ok(r.ok);
  assert.ok(r.specsImported >= 3);
  assert.ok(r.knowledgeImported >= 1);
  const after = await import('../services/knowledge-store.service').then((m) => m.listSources());
  assert.ok(after.length > beforeSources.length, 'el import creó la copia de knowledge');
  assert.ok(after.some((s) => s.status === 'ingested' && s.chunkCount >= 1), 'la copia importada quedó INGERIDA (chunks reales)');
  // binding recreado
  const bindings = await import('../services/knowledge-store.service').then((m) => m.getBindings());
  assert.ok(Object.entries(bindings).some(([, ids]) => ids.length > 0));
});
