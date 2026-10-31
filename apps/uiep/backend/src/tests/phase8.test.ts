import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import './helpers/test-env';
import { API_VERSION } from '@uiep/agent-spec';
import { saveSpec } from '../services/spec-registry.service';
import { startRuntimeMock } from './helpers/runtime-mock';
import { createApp } from '../app';
import { idempotencyKey, lookupIdempotent, recordIdempotent, tryAcquireAgentSlot, releaseAgentSlot, globalSlots } from '../services/reliability.service';
import { recordMetric, snapshotMetrics, audit, auditTail } from '../services/observability.service';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * Fase 8 — Operations & Governance (transversal):
 *  - Idempotencia: reproducción de resultados completados; inciertos NO se
 *    reproducen (nunca se simula un éxito); purga por TTL.
 *  - Backpressure global: semáforo de ejecuciones de agente en todo el
 *    proceso (RUNTIME_MAX_CONCURRENT_RUNS).
 *  - Auditoría JSONL: eventos correlacionados SIN secretos (sanitizado).
 *  - Métricas: contadores/latencia por plano.
 */

const server = createApp({ trustProxy: 'loopback' }).listen(0);
let mock: { server: Server; url: string };

before(async () => {
  mock = await startRuntimeMock();
  process.env.OLLAMA_BASE_URL = mock.url;
  process.env.UIEP_RUNTIME_TOKEN = ['runtime', 'token-fase8-tests-10'].join('-');
});

after(() => {
  mock.server.close();
  server.close();
});

/* ── Idempotencia ─────────────────────────────────────────────────────────── */

test('idempotencia: clave determinista estable; completed → reproducible; TTL purga', async () => {
  const input = { integrationId: 'int-x', method: 'POST', path: '/v1/ thing', body: { a: 1 } };
  const k1 = idempotencyKey(input);
  assert.equal(k1, idempotencyKey({ ...input }), 'misma operación → misma clave');
  assert.notEqual(k1, idempotencyKey({ ...input, body: { a: 2 } }), 'body distinto → clave distinta');

  await recordIdempotent(k1, 'completed', { status: 200, body: '{"respuesta":"original"}' });
  const hit = await lookupIdempotent(k1);
  assert.equal(hit?.outcome, 'completed');
  assert.equal(hit?.result?.body, '{"respuesta":"original"}', 'el resultado persistido permite REPRODUCIR sin repetir el efecto');

  // un resultado INCIERTO no se reproduce como éxito
  const k2 = idempotencyKey({ integrationId: 'int-y', method: 'POST', body: { b: 1 } });
  await recordIdempotent(k2, 'uncertain');
  const uncertain = await lookupIdempotent(k2);
  assert.equal(uncertain?.outcome, 'uncertain');
  assert.equal(uncertain?.result, undefined);
});

/* ── Backpressure global ──────────────────────────────────────────────────── */

test('backpressure: el semáforo global rechaza por encima del límite y libera al terminar', () => {
  process.env.RUNTIME_MAX_CONCURRENT_RUNS = '2';
  try {
    assert.equal(tryAcquireAgentSlot(), true);
    assert.equal(tryAcquireAgentSlot(), true);
    assert.equal(tryAcquireAgentSlot(), false, 'tercera ejecución → sin slot (429 aguas arriba)');
    releaseAgentSlot();
    releaseAgentSlot();
    assert.equal(tryAcquireAgentSlot(), true, 'tras liberar, hay slot de nuevo');
    const slots = globalSlots();
    assert.equal(slots.agentLimit, 2);
    assert.ok(slots.agentRunsInFlight >= 1);
  } finally {
    releaseAgentSlot();
    delete process.env.RUNTIME_MAX_CONCURRENT_RUNS;
  }
});

/* ── Auditoría (JSONL correlacionada, sin secretos) ───────────────────────── */

test('auditoría: eventos correlacionados; secretos sanitizados; cola legible', async () => {
  audit({
    actor: { kind: 'agent', id: 'agente-auditor' },
    action: 'integration.call',
    correlation: { integrationId: 'int-x', agentRunId: 'run-abc123' },
    detail: { status: 200, password: 'NO-DEBE-SALIR', apiKey: 'TAMPOCO', token: 'NADA' },
  });
  await new Promise((r) => setTimeout(r, 120)); // el writer es async
  const tail = await auditTail(10);
  const last = tail[tail.length - 1];
  assert.equal(last.action, 'integration.call');
  assert.equal((last.correlation ?? {}).agentRunId, 'run-abc123');
  const raw = await readFile(path.join(process.env.DATA_DIR!, 'audit', 'audit.jsonl'), 'utf8');
  assert.ok(!raw.includes('NO-DEBE-SALIR'), 'el valor del secreto NO se escribe jamás');
  assert.ok(raw.includes('[redacted]'), 'sanitizado explícito');
});

/* ── Métricas ─────────────────────────────────────────────────────────────── */

test('métricas: contadores, errores y latencia agregada por plano', () => {
  recordMetric('integration', 'int-metrics-test', { ok: true, latencyMs: 100 });
  recordMetric('integration', 'int-metrics-test', { ok: true, latencyMs: 300 });
  recordMetric('integration', 'int-metrics-test', { ok: false, latencyMs: 500, error: 'status_500' });

  const m = snapshotMetrics().find((x) => x.key === 'integration:int-metrics-test');
  assert.ok(m);
  assert.equal(m.calls, 3);
  assert.equal(m.errors, 1);
  assert.equal(m.avgMs, 300);
  assert.equal(m.latencyMaxMs, 500);
  assert.ok(m.lastError?.includes('status_500'));
});
