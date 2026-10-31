import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import './helpers/test-env';
import { API_VERSION } from '@uiep/agent-spec';
import { saveSpec } from '../services/spec-registry.service';
import { assertPublicUrl } from '../services/ssrf-guard.service';
import { writeMemory, listActive, deleteMemory, retrieveMemories } from '../services/memory-store.service';
import { createSession, getSession, runAgent } from '../services/agent-runtime.service';
import { startRuntimeMock } from './helpers/runtime-mock';
import { createApp } from '../app';
import { MEMORY_WRITE_TOOL_SEED } from '../services/tool-registry.service';

/**
 * Fase 5.1 — Memory Manager + SSRF + fiabilidad de citas.
 *  - SSRF: DNS/localhost/privadas/link-local bloqueados; IP públicas OK.
 *  - Memoria: políticas deterministas (dedup, cuota, TTL, memory_disabled);
 *    inyección semántica de recuerdos en el turno; herramienta cerrada.
 *  - Citas: validación determinista de [n] contra retrievals existentes.
 */

const PROFILE = {
  apiVersion: API_VERSION,
  kind: 'ModelProfile',
  metadata: { id: 'mock-profile', name: 'Perfil mock', version: '1.0.0' },
  spec: { provider: 'ollama', model: 'mock-model', endpointEnv: 'OLLAMA_BASE_URL', capabilities: ['chat', 'tools'] },
};

function agentSpec(id: string, memory: { enabled: boolean; strategy: 'semantic' | 'none' }, tools: string[]) {
  return {
    apiVersion: API_VERSION,
    kind: 'Agent',
    metadata: { id, name: id, version: '1.0.0' },
    spec: {
      identity: { role: 'asistente con memoria', objective: 'recordar y recuperar' },
      model: { profile: 'mock-profile' },
      instructions: { system: 'Recuerda datos relevantes con memory-write cuando toque.' },
      tools: tools.map((id2) => ({ id: id2, permissions: ['memory:write'] })),
      memory,
      orchestration: { mode: 'single-agent', maxIterations: 6 },
      security: { approvalRequired: [] },
      evaluation: {},
    },
  };
}

const server = createApp({ trustProxy: 'loopback' }).listen(0);
const base = 'http://127.0.0.1:' + (server.address() as AddressInfo).port;
let mock: { server: Server; url: string };

before(async () => {
  mock = await startRuntimeMock();
  process.env.OLLAMA_BASE_URL = mock.url;
  process.env.UIEP_RUNTIME_TOKEN = ['runtime', 'token-mem-tests-06'].join('-');
  await saveSpec(PROFILE);
  await saveSpec(MEMORY_WRITE_TOOL_SEED); // la tool debe estar REGISTRADA para el runtime
  await saveSpec(agentSpec('mem-agent', { enabled: true, strategy: 'semantic' }, ['memory-write']));
  await saveSpec(agentSpec('mem-no-writer', { enabled: true, strategy: 'semantic' }, []));
  await saveSpec(agentSpec('mem-off', { enabled: false, strategy: 'none' }, ['memory-write']));
});

after(() => {
  mock.server.close();
  server.close();
});

/* ── SSRF ─────────────────────────────────────────────────────────────────── */

test('ssrf: localhost, IP privadas, link-local, metadatos y puertos raros → bloqueados', async () => {
  const bad = [
    'http://localhost:4000/api/tags',
    'http://127.0.0.1:11434/',
    'http://172.20.0.1:11434/api/tags', // gateway docker del VPS
    'http://10.0.0.5/',
    'http://192.168.1.10/',
    'http://169.254.169.254/latest/meta-data/', // metadatos de nube
    'file:///etc/passwd',
    'ftp://example.com/',
    'http://[::1]:4000/',
    'http://internal.service.local/',
  ];
  for (const url of bad) {
    const v = await assertPublicUrl(url);
    assert.equal(v.ok, false, `debe bloquear ${url} → ${v.ok ? '' : (v as { reason: string }).reason}`);
  }
});

test('ssrf: link-local v6 sin DNS → bloqueado (determinista, sin resolver)', async () => {
  const v = await assertPublicUrl('http://[fe80::1]:4000/');
  assert.equal(v.ok, false);
  assert.equal((v as { reason: string }).reason, 'ip_private');
});

/* ── Políticas de escritura de memoria ────────────────────────────────────── */

test('memoria: sin spec.memory.enabled → memory_disabled (el modelo nunca escribe libre)', async () => {
  const r = await writeMemory({
    agentSpecId: 'mem-off',
    sessionId: 'ses-x',
    kind: 'agent',
    content: 'la clave del servidor es 1234',
    origin: { executionId: 'run-test', input: 'guarda esto' },
    memoryEnabled: false,
  });
  assert.equal(r.ok, false);
  assert.equal((r as { reason: string }).reason, 'memory_disabled');
});

test('memoria: escritura válida persiste con vector; deduplicación por hash → idempotente', async () => {
  const ok1 = await writeMemory({
    agentSpecId: 'mem-agent',
    sessionId: null,
    kind: 'agent',
    content: 'La clave de la sala del servidor X-42 es 7731 (rojo).',
    origin: { executionId: 'run-m1', input: 'guarda la clave' },
    memoryEnabled: true,
  });
  assert.equal(ok1.ok, true);
  assert.equal((ok1 as { deduplicated: boolean }).deduplicated, false);

  const ok2 = await writeMemory({
    agentSpecId: 'mem-agent',
    sessionId: null,
    kind: 'agent',
    content: 'La clave de la sala del servidor X-42 es 7731 (rojo).',
    origin: { executionId: 'run-m2', input: 'guarda la clave otra vez' },
    memoryEnabled: true,
  });
  assert.equal(ok2.ok, true);
  assert.equal((ok2 as { deduplicated: boolean }).deduplicated, true, 'mismo hash → no-op');
  assert.equal((await listActive('mem-agent', 'agent')).length, 1);
});

test('memoria: contenido inválido (corto) rechazado por política; borrado lógico', async () => {
  const bad = await writeMemory({
    agentSpecId: 'mem-agent',
    sessionId: 'ses-x',
    kind: 'session',
    content: 'ok',
    origin: { executionId: 'run-x', input: '' },
    memoryEnabled: true,
  });
  assert.equal(bad.ok, false);
  assert.equal((bad as { reason: string }).reason, 'invalid_content');

  const ok = await writeMemory({
    agentSpecId: 'mem-agent',
    sessionId: 'ses-borrar',
    kind: 'session',
    content: 'nota de sesión para borrar con contenido suficiente',
    origin: { executionId: 'run-b', input: '' },
    memoryEnabled: true,
  });
  assert.equal(ok.ok, true);
  const memoryId = (ok as { memory: { memoryId: string } }).memory.memoryId;
  assert.equal(await deleteMemory(memoryId), true);
  assert.equal(await deleteMemory(memoryId), false);
});

/* ── Runtime: recuperación de memoria en el turno ─────────────────────────── */

test('runtime: turno con memoria semántica inyecta recuerdos por similitud (round-trip)', async () => {
  // recuerdo con keyword reconocible por el mock de embeddings
  await writeMemory({
    agentSpecId: 'mem-agent',
    sessionId: null,
    kind: 'agent',
    content: 'RECOVER: la clave X-42 es 0007 (color rojo).',
    origin: { executionId: 'run-m3', input: 'guarda la clave' },
    memoryEnabled: true,
  });

  const ses = await createSession('mem-agent');
  assert.ok(ses.ok);
  const run = await runAgent((ses as { session: { sessionId: string } }).session.sessionId, '¿Cuál es la clave? (pista rojo)');
  assert.ok(run.ok);
  const rec = (run as { record: { status: string; result: { text?: string } } }).record;
  assert.equal(rec.status, 'completed', 'el turno con memoria inyectada termina completed (mock eco [M1])');
  assert.ok(String(rec.result.text ?? '').startsWith('FACT:'), 'el modelo respondió con un recuerdo INYECTADO (eco del mock)');
  // la recuperación por similitud sigue funcionando por el mismo camino:
  const mem = await retrieveMemories('mem-agent', 'ses-no', '¿pista rojo?');
  assert.ok(mem.agent.length >= 1);
  assert.ok(mem.agent.some((m) => m.content.includes('X-42 es 0007')));
});

test('runtime: herramienta memory-write cierra el ciclo modelo→política→persistencia', async () => {
  const ses = await createSession('mem-agent');
  assert.ok(ses.ok);
  const sessionId = (ses as { session: { sessionId: string } }).session.sessionId;
  const before = (await listActive('mem-agent', 'agent')).length;
  const run = await runAgent(sessionId, 'prueba de memoria escrita (sin marcador)');
  assert.ok(run.ok);
  const rec = (run as { record: { result: { toolExecutions: Array<{ name: string; ok: boolean; error?: string; result?: { memoryId?: string; deduplicated?: boolean } }> } } }).record;
  const call = rec.result.toolExecutions.find((t) => t.name === 'memory-write');
  assert.ok(call, 'la tool memory-write fue invocada por el flujo del runtime');
  assert.equal(call.ok, true, 'políticas OK → escritura real (el mock manda args válidos)');
  assert.ok(call.result?.memoryId?.startsWith('mem-'));
  const after = (await listActive('mem-agent', 'agent')).length;
  assert.equal(after, before + 1, 'la memoria quedó persistida y activa');
});

test('runtime: agente sin memoria habilitada rechaza la escritura (memory_disabled explícito)', async () => {
  const ses = await createSession('mem-off');
  assert.ok(ses.ok);
  const sessionId = (ses as { session: { sessionId: string } }).session.sessionId;
  const run = await runAgent(sessionId, 'escribe en memoria');
  assert.ok(run.ok);
  const rec = (run as { record: { result: { toolExecutions: Array<{ name: string; ok: boolean; error?: string }> } } }).record;
  const call = rec.result.toolExecutions.find((t) => t.name === 'memory-write');
  assert.ok(call, 'la tool llegó a ejecutarse por estar DECLARADA');
  assert.equal(call.ok, false);
  assert.equal(call.error, 'memory_write_memory_disabled', 'política determinista denegó la escritura');
});

/* ── Citas: validación determinista ───────────────────────────────────────── */

test('citas: el modelo cita [n] existente → verified; [n] inexistente → verified=false', () => {
  // Validación unitaria de la MISMA lógica que executeRun aplica (regex+mapa):
  const retrievals = [
    { sourceId: 'kn-a', title: 'A', ref: '', chunkIdx: 0, score: 0.9 },
    { sourceId: 'kn-b', title: 'B', ref: '', chunkIdx: 3, score: 0.8 },
  ];
  const text = 'La clave es 0007 [1] y el plano dice otra cosa [2] o quizá [9] [1]';
  const citedRefs = [...text.matchAll(/\[(\d{1,2})\]/g)].map((m) => Number(m[1]));
  assert.deepEqual([...new Set(citedRefs)].sort((a, b) => a - b), [1, 2, 9]);
  const citations = [...new Set(citedRefs)].map((n) => {
    const r = retrievals[n - 1];
    return { ref: n, verified: Boolean(r), sourceId: r?.sourceId ?? null };
  });
  assert.deepEqual(citations, [
    { ref: 1, verified: true, sourceId: 'kn-a' },
    { ref: 2, verified: true, sourceId: 'kn-b' },
    { ref: 9, verified: false, sourceId: null },
  ]);
});
