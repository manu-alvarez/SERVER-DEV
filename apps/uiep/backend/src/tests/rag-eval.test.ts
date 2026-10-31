import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import './helpers/test-env';
import { API_VERSION } from '@uiep/agent-spec';
import { saveSpec } from '../services/spec-registry.service';
import { writeMemory, listActive, deleteMemory, retrieveMemories } from '../services/memory-store.service';
import { setBindingsForAgent, listSources, deleteSource, getBindings } from '../services/knowledge-store.service';
import { retrieveForAgent } from '../services/retrieval.service';
import { evaluateRag, formatReport, loadCorpusFromDisk } from '../services/rag-eval.service';
import { startRuntimeMock } from './helpers/runtime-mock';
import { createApp } from '../app';

/**
 * Fase 5.2 — RAG Evaluation & Quality Gate.
 *
 * GATE de calidad: cada ejecución de la suite evalúa el corpus VERSIONADO
 * contra el índice REAL (recuperación determinista, independiente del LLM)
 * y falla si las métricas caen bajo los umbrales (env-configurables) —
 * regresiones de fragmentación/índice/ranking/umbral se detectan ANTES de
 * desplegar. Modo real (RAG_EVAL_PROVIDER=real, VPS) evalúa con los
 * embeddings reales del proveedor: informe, mismo corpus.
 *
 * Además: pruebas de PRIVACIDAD de memoria (aislamiento entre agentes,
 * exclusión de borrados, TTL efectivo, alcance de sesión) y de aislamiento
 * de conocimiento (agente sin bindings).
 */

const MODE = process.env.RAG_EVAL_PROVIDER === 'real' ? 'real' : 'mock';
const CORPUS = loadCorpusFromDisk();

const server = createApp({ trustProxy: 'loopback' }).listen(0);
const base = 'http://127.0.0.1:' + (server.address() as AddressInfo).port;
let mock: { server: Server; url: string } | null = null;

const PROFILE = {
  apiVersion: API_VERSION,
  kind: 'ModelProfile',
  metadata: { id: 'mock-profile', name: 'Perfil mock', version: '1.0.0' },
  spec: { provider: 'ollama', model: 'mock-model', endpointEnv: 'OLLAMA_BASE_URL', capabilities: ['chat', 'tools'] },
};

const evalAgent = (id: string, memory: { enabled: boolean; strategy: 'semantic' | 'none' }, tools: string[] = []) => ({
  apiVersion: API_VERSION,
  kind: 'Agent',
  metadata: { id, name: id, version: '1.0.0' },
  spec: {
    identity: { role: 'agente de evaluación', objective: 'responder con conocimiento autorizado' },
    model: { profile: 'mock-profile' },
    instructions: { system: 'Responde con el contexto inyectado cuando exista.' },
    tools: tools.map((t) => ({ id: t, permissions: ['memory:write'] })),
    memory,
    orchestration: { mode: 'single-agent', maxIterations: 6 },
    security: { approvalRequired: [] },
    evaluation: {},
  },
});

before(async () => {
  if (MODE === 'mock') {
    mock = await startRuntimeMock();
    process.env.OLLAMA_BASE_URL = mock.url;
    process.env.UIEP_RUNTIME_TOKEN = ['runtime', 'token-rag-eval-07'].join('-');
    process.env.UIEP_CONSOLE_PASSWORD = String('console-password-rag-eval-07');
  }
  await saveSpec(PROFILE);
  // El agente de eval lleva memory.semantic ACTIVO: es el gate del que cuelga
  // la inyección de KNOWLEDGE en el diseño de Fase 5 (misma bandera).
  await saveSpec(evalAgent(CORPUS.agentId, { enabled: true, strategy: 'semantic' }));
  await saveSpec(evalAgent('rag-isolated-agent', { enabled: true, strategy: 'semantic' }));
  await saveSpec(evalAgent('mem-agent-a', { enabled: true, strategy: 'semantic' }, ['memory-write']));
  await saveSpec(evalAgent('mem-agent-b', { enabled: true, strategy: 'semantic' }, ['memory-write']));
  if (MODE === 'real') {
    // En modo real (VPS) el modelo también es real — solo se evalúa recuperación.
    const { seedDefaultToolSpecs } = await import('../services/tool-registry.service');
    await seedDefaultToolSpecs();
  }
});

after(async () => {
  // Limpieza de las fuentes del corpus (los DATA_DIR de tests son desechables;
  // en modo real se limpian para no dejar datos de eval en producción).
  if (process.env.RAG_EVAL_KEEP_SOURCES !== '1') {
    const prefix = MODE === 'real' ? 'rag-eval-real-' : 'rag-eval-';
    for (const s of await listSources()) {
      if (s.title.startsWith(prefix)) {
        await deleteSource(s.sourceId);
      }
    }
  }
  mock?.server.close();
  server.close();
});

/* ── GATE de calidad RAG ──────────────────────────────────────────────────── */

test('GATE RAG: corpus completo con métricas sobre el índice real y umbrales configurables', async () => {
  const report = await evaluateRag(CORPUS, { withRuns: MODE === 'mock' });
  // El informe SIEMPRE se imprime (visible en CI/VPS):
  console.log('\n' + formatReport(report) + '\n');
  assert.equal(report.gate.passed, true, `quality gate falló: ${report.gate.failures.join(' · ')}`);
  assert.equal(report.questions.length, CORPUS.questions.length);
  // En modo mock el gate debe ser PERFECTO (proveedor determinista):
  if (MODE === 'mock') {
    assert.equal(report.recallAtK, 1, 'mock determinista → recall 1.0');
    assert.equal(report.mrr, 1, 'mock determinista → mrr 1.0');
    assert.ok(report.citations.emitted >= CORPUS.questions.length, 'cada run emite su cita [1]');
    assert.equal(report.citations.unsupported, 0, 'ninguna cita sin respaldo');
  }
});

/* ── Aislamiento de conocimiento ──────────────────────────────────────────── */

test('aislamiento: agente SIN bindings → sin recuperación (no_authorized_sources)', async () => {
  const r = await retrieveForAgent('rag-isolated-agent', '¿cuál es la clave del equipo rojo?');
  assert.equal(r.ok, false);
  assert.equal((r as { reason: string }).reason, 'no_authorized_sources');
});

test('aislamiento: fuente desvinculada del agente deja de ser recuperable', async () => {
  const source = (await listSources()).find((s) => s.title.includes('doc-rojo'));
  assert.ok(source, 'la fuente del corpus existe');
  const before = await retrieveForAgent(CORPUS.agentId, 'clave del equipo rojo');
  assert.ok(before.ok && before.hits.length >= 1);

  await setBindingsForAgent(CORPUS.agentId, []); // quitar TODAS las bindings
  const none = await retrieveForAgent(CORPUS.agentId, 'clave del equipo rojo');
  assert.equal(none.ok, false);
  assert.equal((none as { reason: string }).reason, 'no_authorized_sources');

  // restaurar bindings (para otros tests / limpieza coherente)
  const all = (await listSources()).filter((s) => s.title.startsWith('rag-eval-'));
  await setBindingsForAgent(CORPUS.agentId, all.map((s) => s.sourceId));
  const restored = await retrieveForAgent(CORPUS.agentId, 'clave del equipo rojo');
  assert.ok(restored.ok && restored.hits.length >= 1);
});

/* ── Privacidad de la memoria ─────────────────────────────────────────────── */

test('memoria: aislamiento entre agentes (la memoria de A no aparece en B)', async () => {
  const w = await writeMemory({
    agentSpecId: 'mem-agent-a',
    sessionId: null,
    kind: 'agent',
    content: 'secreto exclusivo del agente rojo: PIN 1234 (rojo)',
    origin: { executionId: 'run-priv', input: 'guarda' },
    memoryEnabled: true,
  });
  assert.equal(w.ok, true);

  const forA = await retrieveMemories('mem-agent-a', 'ses-zz', '¿cuál es el pin? (pista rojo)');
  assert.ok(forA.agent.some((m) => m.content.includes('PIN 1234')), 'el agente A recupera SU memoria');

  const forB = await retrieveMemories('mem-agent-b', 'ses-zz', '¿cuál es el pin? (pista rojo)');
  assert.equal(forB.agent.length, 0, 'el agente B NO ve la memoria de A (cero fugas)');
});

test('memoria: un recuerdo ELIMINADO desaparece de las consultas posteriores', async () => {
  const w = await writeMemory({
    agentSpecId: 'mem-agent-b',
    sessionId: null,
    kind: 'agent',
    content: 'recuerdo efímero a borrar: token SECRETO-XYZ (rojo)',
    origin: { executionId: 'run-del', input: 'guarda' },
    memoryEnabled: true,
  });
  assert.equal(w.ok, true);
  const memoryId = (w as { memory: { memoryId: string } }).memory.memoryId;

  const before = await retrieveMemories('mem-agent-b', 'ses-zz', 'recuerdo (rojo)');
  assert.ok(before.agent.some((m) => m.memoryId === memoryId));

  await deleteMemory(memoryId);
  const after = await retrieveMemories('mem-agent-b', 'ses-zz', 'recuerdo (rojo)');
  assert.equal(after.agent.some((m) => m.memoryId === memoryId), false, 'el borrado es efectivo en la recuperación');
});

test('memoria: TTL caducado → excluido de la recuperación (privacidad temporal)', async () => {
  // TTL minúsculo (0.00001 días ≈ 0.86 s) para probar la caducidad de verdad.
  process.env.MEMORY_AGENT_TTL_DAYS = '0.00001';
  const w = await writeMemory({
    agentSpecId: 'mem-agent-a',
    sessionId: null,
    kind: 'agent',
    content: 'recuerdo con TTL ultracorto: caducoya (rojo)',
    origin: { executionId: 'run-ttl', input: 'guarda' },
    memoryEnabled: true,
  });
  delete process.env.MEMORY_AGENT_TTL_DAYS;
  assert.equal(w.ok, true);
  const memoryId = (w as { memory: { memoryId: string } }).memory.memoryId;

  await new Promise((r) => setTimeout(r, 1200)); // > 0.86 s → caducado

  const active = await listActive('mem-agent-a', 'agent');
  assert.equal(active.some((m) => m.memoryId === memoryId), false, 'listActive excluye caducados');
  const hits = await retrieveMemories('mem-agent-a', 'ses-zz', 'caducoya (rojo)');
  assert.equal(hits.agent.some((m) => m.memoryId === memoryId), false, 'la recuperación excluye caducados');
});

test('memoria: las notas de SESIÓN no cruzan a otra sesión', async () => {
  const w = await writeMemory({
    agentSpecId: 'mem-agent-a',
    sessionId: 'ses-solo-1',
    kind: 'session',
    content: 'nota privada de la sesión uno con contenido suficiente (rojo)',
    origin: { executionId: 'run-s1', input: '' },
    memoryEnabled: true,
  });
  assert.equal(w.ok, true);

  const s1 = await retrieveMemories('mem-agent-a', 'ses-solo-1', '(rojo)');
  assert.ok(s1.session.some((m) => m.memoryId === (w as { memory: { memoryId: string } }).memory.memoryId));

  const s2 = await retrieveMemories('mem-agent-a', 'ses-otra-2', '(rojo)');
  assert.equal(s2.session.length, 0, 'la sesión 2 no ve las notas de la sesión 1');
});

/* helpers usados indirectamente por el flujo del eval (sanity de imports) */
void getBindings;
void base;
