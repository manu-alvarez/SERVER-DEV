import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
// PRIMERO: levanta backend + sandbox hijo (real, proceso aparte).
import { waitForSandbox, stopAll, sandboxBase, backendBase } from './helpers/sandbox-env';
import { seedDefaultModelProfile } from '../services/model-gateway.service';
import { seedDefaultToolSpecs } from '../services/tool-registry.service';
import { startRuntimeMock } from './helpers/runtime-mock';
import type { Server as HttpServer } from 'node:http';
import { runGeneration, type GenerationResponse } from '../services/engineering-generator.service';
import { executeArtifact, getExecution, listExecutions, cancelExecution } from '../services/execution-orchestrator.service';
import { runQualityChecks } from '../services/quality-engine.service';
import { sandboxExecute } from '../services/sandbox-client.service';

/**
 * Misión 14 — Execution Sandbox & Quality Engine (integración REAL):
 * el sandbox corre como PROCESO HIJO aislado (server.mjs sin dependencias),
 * con token dedicado; las ejecuciones agénticas orquestan contra los
 * runtimes existentes vía /api/runner/* (token). Verifica: ejecución
 * correcta y reproducible, límites y timeouts, cancelación y limpieza,
 * fallos de dependencias, evaluación con datasets/harness y calidad.
 */

let MOCK: { server: HttpServer; url: string } | null = null;

before(async () => {
  assert.equal(await seedDefaultModelProfile(), 'seeded');
  assert.equal(await seedDefaultToolSpecs(), 'seeded');
  MOCK = await startRuntimeMock();
  process.env.OLLAMA_BASE_URL = MOCK.url;
  assert.equal(await waitForSandbox(), true, 'el sandbox hijo arrancó y responde health');
});

after(async () => {
  await stopAll();
  MOCK?.server.close();
});

const okOf = (r: GenerationResponse): Extract<GenerationResponse, { ok: true }> => {
  assert.equal(r.ok, true, JSON.stringify(r).slice(0, 300));
  return r;
};

/* ── Sanidad del sandbox ─────────────────────────────────────────────────── */

test('sandbox: health abierto, ejecución NUNCA sin token (401) y sin configuración → 503 fail-closed', async () => {
  const health = await fetch(`${sandboxBase}/v1/health`);
  assert.equal(health.status, 200);
  const noToken = await fetch(`${sandboxBase}/v1/execute`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
  assert.equal(noToken.status, 401, 'sin Bearer → 401');
  const badToken = await fetch(`${sandboxBase}/v1/execute`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer NO-ES-EL-TOKEN' }, body: '{}' });
  assert.equal(badToken.status, 401, 'token incorrecto → 401');
  // Instancia sin token configurado → 503 sandbox_disabled (fail-closed).
  const { spawn } = await import('node:child_process');
  const { pathToFileURL } = await import('node:url');
  const path = await import('node:path');
  const naked = spawn(process.execPath, [path.resolve(__dirname, '../../../sandbox/server.mjs')], { env: { ...process.env, PORT: '4179', SANDBOX_EXEC_TOKEN: '' }, stdio: ['ignore', 'pipe', 'pipe'] });
  naked.stderr?.on('data', (d) => console.log('[naked-err]', d.toString().trim().slice(0, 160)));
  naked.on('exit', (c, sig) => console.log('[naked-exit]', c, sig));
  let nakedReady = false;
  for (let i = 0; i < 20 && !nakedReady; i++) {
    await new Promise((r) => setTimeout(r, 250));
    nakedReady = await fetch(`http://127.0.0.1:4179/v1/health`, { signal: AbortSignal.timeout(400) }).then((r) => r.status === 200).catch((e) => {
      if (i % 5 === 0) {
        console.log('[naked-probe]', i, String((e as { cause?: { code?: string } }).cause?.code ?? (e as Error).message));
      }
      return false;
    });
  }
  console.log('[naked-final]', nakedReady);
  try {
    const res = await fetch('http://127.0.0.1:4179/v1/execute', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer lo-que-sea' }, body: '{}' });
    assert.equal(res.status, 503, 'sin SANDBOX_EXEC_TOKEN → 503 (no 401: el sandbox está DESHABILITADO)');
    const body = (await res.json()) as { error: string };
    assert.equal(body.error, 'sandbox_disabled');
  } finally {
    naked.kill('SIGTERM');
  }
});

/* ── Agentes para las ejecuciones ────────────────────────────────────────── */

async function seedAgent(name: string, extra: Record<string, unknown> = {}): Promise<string> {
  const r = okOf(await runGeneration('agent', { name, role: 'demo', objective: 'verificar el sandbox M14', system: `Agente ${name}.`, memory: { enabled: false, strategy: 'none' }, ...extra }));
  return (r.outcome as { id: string }).id;
}

/* ── API Runtime ─────────────────────────────────────────────────────────── */

test('API Runtime: contrato validado en el sandbox (422/404/405/rate-limit) + endpoint con agente REAL', async () => {
  const agentId = await seedAgent('M14 Agente API');
  const api = okOf(await runGeneration('api-platform', {
    name: 'M14 API Demo',
    endpoints: [
      { id: 'consultar', method: 'GET' as const, path: '/api/demo', summary: 'demo con agente', agentBinding: agentId },
      { id: 'enviar', method: 'POST' as const, path: '/api/envio', summary: 'demo con validación', request: [{ name: 'titulo', type: 'string', constraints: [{ kind: 'maxLength', value: 10 }] }], response: [{ name: 'salida', type: 'string' }], rateLimit: { max: 2, windowMs: 60_000 } },
    ],
  }));
  const apiId = (api.outcome as { id: string }).id;
  // 1) Endpoint vinculado a agente: el sandbox llama al runner → respuesta del agente real.
  const r1 = await executeArtifact('api-platform', apiId, undefined, { endpointId: 'consultar', method: 'GET', body: {} });
  assert.equal(r1.ok, true, JSON.stringify(r1).slice(0, 300));
  if (r1.ok) {
    const result = (r1.record.result ?? {}) as { body?: { servedBy?: string; output?: string } };
    assert.equal(result.body?.servedBy, 'agent');
    assert.ok((result.body?.output ?? '').length >= 0);
    assert.equal(r1.record.status, 'succeeded');
  }
  // 2) Validación de contrato EN EL SANDBOX: campo que excede maxLength → 422.
  const r2 = await executeArtifact('api-platform', apiId, undefined, { endpointId: 'enviar', method: 'POST', body: { titulo: 'x'.repeat(11) } });
  assert.equal(r2.ok, true);
  if (r2.ok) {
    const result = (r2.record.result ?? {}) as { status?: number; body?: { error?: string; details?: Array<{ msg: string }> } };
    assert.equal(result.status, 422);
    assert.equal(result.body?.error, 'invalid_input');
    assert.ok((result.body?.details ?? []).some((d) => d.msg.includes('longitud')));
  }
  // 3) Endpoint desconocido → 404; método incorrecto → 405.
  const r3 = await executeArtifact('api-platform', apiId, undefined, { endpointId: 'no-existe', method: 'GET', body: {} });
  if (r3.ok) {
    assert.equal(((r3.record.result ?? {}) as { status?: number }).status, 404);
  } else {
    assert.fail();
  }
  const r4 = await executeArtifact('api-platform', apiId, undefined, { endpointId: 'enviar', method: 'GET', body: {} });
  if (r4.ok) {
    assert.equal(((r4.record.result ?? {}) as { status?: number }).status, 405);
  } else {
    assert.fail();
  }
  // 4) Rate limit del contrato aplicado EN el sandbox: 2 permitidos + 429.
  await executeArtifact('api-platform', apiId, undefined, { endpointId: 'enviar', method: 'POST', body: { titulo: 'ok-1' } });
  await executeArtifact('api-platform', apiId, undefined, { endpointId: 'enviar', method: 'POST', body: { titulo: 'ok-2' } });
  const r5 = await executeArtifact('api-platform', apiId, undefined, { endpointId: 'enviar', method: 'POST', body: { titulo: 'excede' } });
  assert.equal(r5.ok, true);
  if (r5.ok) {
    assert.equal(((r5.record.result ?? {}) as { status?: number }).status, 429);
  }
  // 5) Registro con invocación REDACTADA (chars, nunca contenido).
  const rec = await getExecution((r1 as { ok: true; record: { runId: string } }).record.runId);
  assert.ok(rec);
  const summary = (rec?.invocationSummary ?? {}) as Record<string, { chars?: number }>;
  assert.ok(typeof summary.body === 'object');
  assert.ok(!JSON.stringify(rec?.invocationSummary).includes('titulo'), 'el resumen NO contiene claves de entrada');
});

/* ── Agentic App Runtime ─────────────────────────────────────────────────── */

test('Agentic App Runtime: ejecuta agentes reales en el sandbox y registra hijos/métricas', async () => {
  const a1 = await seedAgent('M14 Agente App Uno');
  const a2 = await seedAgent('M14 Agente App Dos');
  const wf = okOf(await runGeneration('workflow', { name: 'M14 Flujo App', steps: [{ agent: a1, input: '{{input}}' }] }));
  const wfId = (wf.outcome as { id: string }).id;
  const app = okOf(await runGeneration('agentic-app', {
    name: 'M14 App Agentica',
    agents: [
      { agent: a1, role: 'núcleo' },
      { agent: a2, role: 'revisor' },
    ],
    workflows: [wfId],
    surfaces: [{ type: 'workflow-engine' }],
  }));
  const appId = (app.outcome as { id: string }).id;
  const r = await executeArtifact('agentic-app', appId, undefined, { input: 'turno de prueba del sandbox' });
  assert.equal(r.ok, true, JSON.stringify(r).slice(0, 300));
  if (r.ok) {
    assert.equal(r.record.status, 'succeeded');
    const result = ((r.record.result ?? {}) as { body?: { agents?: Array<{ agentSpecId: string; status: string }>; workflow?: { status: string } | null } }).body ?? {};
    assert.equal(result.agents?.length, 2);
    assert.ok(result.agents?.every((a) => ['completed', 'completed_without_tools'].includes(a.status)), JSON.stringify(result.agents));
    assert.equal(result.workflow?.status, 'completed');
    assert.equal(r.record.artifact.kind, 'AgenticApp');
  }
  // Reproducible: la segunda ejecución del MISMO artefacto da el MISMO status.
  const r2 = await executeArtifact('agentic-app', appId, undefined, { input: 'turno de prueba del sandbox' });
  assert.equal(r2.ok, true);
  if (r2.ok) {
    assert.equal(r2.record.status, 'succeeded');
  }
});

/* ── Dataset & Harness Runtime ───────────────────────────────────────────── */

test('Dataset Runtime: casos puntuados con métricas y veredicto; fail-closed sin target', async () => {
  const agentId = await seedAgent('M14 Agente Dataset');
  const ds = okOf(await runGeneration('evaluation', {
    name: 'M14 Dataset Demo',
    cases: [
      { query: 'saluda', expected: 'PLAIN', refs: [] },
      { query: 'repite', expected: 'PLAIN', refs: [] },
    ],
    thresholds: { recall: 0.5 },
  }));
  const dsId = (ds.outcome as { id: string }).id;
  const r = await executeArtifact('evaluation', dsId, undefined, { agentSpecId: agentId });
  assert.equal(r.ok, true, JSON.stringify(r).slice(0, 300));
  if (r.ok) {
    const result = ((r.record.result ?? {}) as { body?: { metrics?: { cases: number; passed: number }; verdict?: string } }).body ?? {};
    assert.equal(result.metrics?.cases, 2);
    assert.equal(result.metrics?.passed, 2, JSON.stringify(result));
    assert.equal(result.verdict, 'pass');
  }
  const bad = await executeArtifact('evaluation', dsId, undefined, {});
  assert.equal(bad.ok, false);
  if (!bad.ok) {
    assert.equal(bad.code, 'invalid_invocation');
  }
});

test('Harness Runtime: fixtures contra un agente; fallo de dependencias documentado', async () => {
  const agentId = await seedAgent('M14 Agente Harness');
  const h = okOf(await runGeneration('harness', {
    name: 'M14 Harness Demo',
    targets: [agentId],
    fixtures: [
      { name: 'saludo', input: 'hola', expected: 'PLAIN' },
      { name: 'respuesta', input: 'dime algo', expected: 'PLAIN' },
    ],
  }));
  const hId = (h.outcome as { id: string }).id;
  const r = await executeArtifact('harness', hId, undefined, { agentSpecId: agentId });
  assert.equal(r.ok, true, JSON.stringify(r).slice(0, 300));
  if (r.ok) {
    const result = ((r.record.result ?? {}) as { body?: { fixtures?: Array<{ passed: boolean }>; passed: number; total: number } }).body ?? { passed: 0, total: 0 };
    assert.equal(result.total, 2);
    assert.equal(result.passed, 2);
  }
  // Fallo de dependencias: agente inexistente → la ejecución falla EN el sandbox.
  const bad = await executeArtifact('harness', hId, undefined, { agentSpecId: 'agente-fantasma-m14' });
  assert.equal(bad.ok, false);
  if (!bad.ok) {
    assert.equal(bad.status, 503, 'el sandbox comunica el fallo; el orquestador lo registra fail-closed');
  }
});

/* ── Límites: timeout y cancelación ──────────────────────────────────────── */

test('timeout: un job que excede su límite termina en timeout (aborto real del sandbox)', async () => {
  const agentId = await seedAgent('M14 Agente Lento');
  const app = okOf(await runGeneration('agentic-app', {
    name: 'M14 App Lenta',
    agents: [{ agent: agentId, role: 'lenta' }],
    surfaces: [{ type: 'console' }],
  }));
  const appId = (app.outcome as { id: string }).id;
  // timeoutMs mínimo (2000ms) + polling de 700ms: el agente tarda ~1.4s en
  // completarse... con 3 turnos secuenciales no cabe → timeout garantizado.
  const ds = okOf(await runGeneration('evaluation', { name: 'M14 Dataset Lento', cases: [{ query: 'a', expected: 'PLAIN' }, { query: 'b', expected: 'PLAIN' }, { query: 'c', expected: 'PLAIN' }] }));
  const r = await executeArtifact('evaluation', (ds.outcome as { id: string }).id, undefined, { agentSpecId: agentId, timeoutMs: 2000 });
  assert.equal(r.ok, true, 'el sandbox responde el job con estado timeout');
  if (r.ok) {
    assert.equal(r.record.status, 'timeout');
    assert.ok((r.record.logs ?? []).some((l) => l.includes('timeout')), 'el log deja constancia del aborto');
  }
});

test('cancelación: un job en curso se aborta y queda limpio (sin leaks de jobs)', async () => {
  const agentId = await seedAgent('M14 Agente Cancelable');
  const ds = okOf(await runGeneration('evaluation', { name: 'M14 Dataset Largo', cases: Array.from({ length: 6 }, (_, i) => ({ query: `caso ${i}`, expected: 'PLAIN' })) }));
  const dsId = (ds.outcome as { id: string }).id;
  // Envelope directo al sandbox para controlar el runId y cancelar a mitad.
  const runId = `run-cancel-test-${Math.random().toString(36).slice(2, 8)}`;
  const doc = await (async () => {
    const { getLatestArtifact } = await import('../services/engineering-registry.service');
    return getLatestArtifact('EvaluationDataset', dsId);
  })();
  assert.ok(doc);
  const jobPromise = sandboxExecute({ runId, kind: 'dataset', artifact: doc, invocation: { agentSpecId: agentId }, limits: { timeoutMs: 60_000 } }, { timeoutMs: 90_000 });
  await new Promise((r) => setTimeout(r, 1200));
  const cancelRes = await fetch(`${sandboxBase}/v1/cancel/${runId}`, { method: 'POST', headers: { authorization: `Bearer ${process.env.SANDBOX_EXEC_TOKEN}` } });
  assert.equal(cancelRes.status, 200);
  const job = await jobPromise;
  assert.equal(job.ok, true);
  if (job.ok) {
    assert.equal(job.status, 'cancelled', `estado del job: ${job.status} (reason: ${job.reason})`);
  }
  // El registro de ejecución del ORQUESTADOR registra la cancelación.
  const cancel2 = await cancelExecution(runId);
  assert.equal(cancel2.ok, false, 'el run ya no está en curso en el orquestador (solo existía en el sandbox directo)');
  const after = await fetch(`${sandboxBase}/v1/health`);
  const healthBody = (await after.json()) as { running: number };
  assert.equal(healthBody.running, 0, 'sin jobs huérfanos tras la cancelación');
});

/* ── Quality Engine ──────────────────────────────────────────────────────── */

test('Quality Engine: schema+refs+security+behavior; veredicto honesto fail si el agente falla', async () => {
  const goodAgent = await seedAgent('M14 Agente Calidad');
  const ds = okOf(await runGeneration('evaluation', { name: 'M14 Dataset Calidad', cases: [{ query: 'x', expected: 'PLAIN' }], thresholds: { recall: 0.5 } }));
  const dsId = (ds.outcome as { id: string }).id;
  const report = await runQualityChecks('EvaluationDataset', dsId, undefined, { agentSpecId: goodAgent, timeoutMs: 30_000 });
  if (!('verdict' in report)) {
    assert.fail(JSON.stringify(report).slice(0, 200));
  }
  assert.equal(report.verdict, 'pass', JSON.stringify(report).slice(0, 300));
  if (report.verdict === 'pass') {
    assert.equal(report.checks.length, 4);
    assert.ok(report.checks.every((c) => c.passed));
    assert.ok(report.behaviorRunId);
  }
  // Agente que FALLA (el case del dataset lleva [FAIL_PROVIDER] → el mock
  // responde 500 → el turno del agente termina 'failed') → behavior fail.
  const failAgent = await seedAgent('M14 Agente Roto');
  const dsFail = okOf(await runGeneration('evaluation', { name: 'M14 Dataset Fallo', cases: [{ query: '[FAIL_PROVIDER] rompe', expected: 'PLAIN' }] }));
  const badRun = await executeArtifact('evaluation', (dsFail.outcome as { id: string }).id, undefined, { agentSpecId: failAgent });
  // La ejecución termina SUCCEEDED como JOB (el sandbox orquestó bien) pero el
  // veredicto de las métricas es FAIL — el quality engine no maquilla fallos.
  assert.ok(badRun.ok, JSON.stringify(badRun).slice(0, 200));
  if (badRun.ok) {
    const result = ((badRun.record.result ?? {}) as { body?: { verdict?: string } }).body ?? {};
    assert.equal(result.verdict, 'fail');
  }
  // Quality con el dataset FALLIDO + agente que falla → veredicto fail (behavior).
  const dsFailId = (dsFail.outcome as { id: string }).id;
  const report2 = await runQualityChecks('EvaluationDataset', dsFailId, undefined, { agentSpecId: failAgent, timeoutMs: 30_000 });
  if ('verdict' in report2) {
    const behavior = report2.checks.find((c) => c.dimension === 'behavior');
    assert.equal(behavior?.passed, false, `el quality engine no maquilla los fallos: ${JSON.stringify(behavior?.detail).slice(0, 300)}`);
    assert.equal(report2.verdict, 'fail');
  } else {
    assert.fail('el informe de calidad debería existir');
  }
});

/* ── Execution Registry ──────────────────────────────────────────────────── */

test('Execution Registry: listado, detalle y trazabilidad completa', async () => {
  const all = await listExecutions(50);
  assert.ok(all.length >= 6, `hay ${all.length} ejecuciones registradas`);
  const byId = await getExecution(all[0].runId);
  assert.ok(byId);
  assert.ok(byId?.sandbox.image.includes('uiep-sandbox'));
  assert.equal(byId?.sandbox.mode, 'container-internal-net');
  assert.ok(byId?.artifact.kind);
  assert.ok(byId?.startedAt);
  // fail-closed: kind no ejecutable y artefacto inexistente.
  const badKind = await executeArtifact('saas', 'cualquiera', undefined, {});
  assert.equal(badKind.ok, false);
  if (!badKind.ok) {
    assert.equal(badKind.code, 'kind_not_executable');
  }
  const badId = await executeArtifact('agentic-app', 'no-existe-m14', undefined, { input: 'x' });
  assert.equal(badId.ok, false);
  if (!badId.ok) {
    assert.equal(badId.code, 'artifact_not_found');
  }
});
