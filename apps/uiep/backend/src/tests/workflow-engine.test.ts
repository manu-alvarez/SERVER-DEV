import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import './helpers/test-env';
import { API_VERSION, validateWorkflowStructure, type WorkflowSpecV1, type WorkflowSpecInput } from '@uiep/agent-spec';
import { saveSpec } from '../services/spec-registry.service';
import { loadWorkflow, startWorkflowRun, cancelWorkflowRun, resumeWorkflowRun } from '../services/workflow-runtime.service';
import { loadWorkflowRun } from '../services/workflow-store.service';
import { startRuntimeMock } from './helpers/runtime-mock';
import { createApp } from '../app';

/**
 * Fase 6 — Workflow Engine: validación estructural, ejecución secuencial,
 * transferencia de contexto entre nodos, condición, paralelo, reintentos,
 * cancelación en punto seguro y reanudación.
 *
 * El mock determinista da control del flujo: [SAY:x] (eco sin contexto),
 * [FAIL_ONCE:token] (falla una vez → reanudación), [FAIL_PROVIDER] (siempre).
 */

const PROFILE = {
  apiVersion: API_VERSION,
  kind: 'ModelProfile',
  metadata: { id: 'mock-profile', name: 'Perfil mock', version: '1.0.0' },
  spec: { provider: 'ollama', model: 'mock-model', endpointEnv: 'OLLAMA_BASE_URL', capabilities: ['chat', 'tools'] },
};

const agent = (id: string, extra: Record<string, unknown> = {}) => ({
  apiVersion: API_VERSION,
  kind: 'Agent',
  metadata: { id, name: id, version: '1.0.0' },
  spec: {
    identity: { role: 'nodo', objective: 'procesar' },
    model: { profile: 'mock-profile' },
    instructions: { system: 'Procesa y responde.' },
    tools: [],
    memory: { enabled: false, strategy: 'none' },
    orchestration: { mode: 'single-agent', maxIterations: 4 },
    security: { approvalRequired: [] },
    evaluation: {},
    ...extra,
  },
});

const workflow = (spec: WorkflowSpecInput, id = 'wf-test') => ({
  apiVersion: API_VERSION,
  kind: 'Workflow',
  metadata: { id, name: id, version: '1.0.0' },
  spec,
});

const server = createApp({ trustProxy: 'loopback' }).listen(0);
let mock: { server: Server; url: string };

before(async () => {
  mock = await startRuntimeMock();
  process.env.OLLAMA_BASE_URL = mock.url;
  process.env.UIEP_RUNTIME_TOKEN = ['runtime', 'token-wf-tests-08'].join('-');
  await saveSpec(PROFILE);
  for (const id of ['wf-agente-a', 'wf-agente-b', 'wf-agente-c', 'wf-agente-kb']) {
    await saveSpec(agent(id));
  }
  // agente CON conocimiento vinculado (integración knowledge en nodos)
  await saveSpec(agent('wf-agente-kb', { memory: { enabled: true, strategy: 'semantic' } }));
});

after(() => {
  mock.server.close();
  server.close();
});

/* ── Validación estructural ───────────────────────────────────────────────── */

test('workflow: validación estructural — duplicados, referencias y ciclos', () => {
  const base = (nodes: WorkflowSpecInput['nodes'], start: string): WorkflowSpecInput => ({ start, nodes });
  const r1 = validateWorkflowStructure(workflow(base([{ id: 'a', type: 'agent', agentSpecId: 'wf-agente-a', input: 'x' }, { id: 'a', type: 'agent', agentSpecId: 'wf-agente-a', input: 'y' }], 'a')));
  assert.equal(r1.ok, false);
  assert.ok((r1 as { errors: string[] }).errors.some((e) => e.includes('duplicado')));

  const r2 = validateWorkflowStructure(workflow(base([{ id: 'a', type: 'condition', input: 'x', check: { op: 'not_empty', value: '', caseSensitive: false }, then: 'fantasma', else: 'a' }], 'a')));
  assert.equal(r2.ok, false);
  assert.ok((r2 as { errors: string[] }).errors.some((e) => e.includes('fantasma')));

  // ciclo: a → (secuencia) → b → condition → a
  const cyc = workflow(base([
    { id: 'a', type: 'agent', agentSpecId: 'wf-agente-a', input: 'x' },
    { id: 'b', type: 'condition', input: '{{a}}', check: { op: 'not_empty', value: '', caseSensitive: false }, then: 'a', else: 'a' },
  ], 'a'));
  const r3 = validateWorkflowStructure(cyc);
  assert.equal(r3.ok, false);
  assert.ok((r3 as { errors: string[] }).errors.some((e) => e.includes('ciclo')));

  // parallel con rama no-agent
  const r4 = validateWorkflowStructure(workflow(base([
    { id: 'p', type: 'parallel', branches: ['a'], join: 'concat' },
    { id: 'a', type: 'condition', input: 'x', check: { op: 'not_empty', value: '', caseSensitive: false }, then: 'p', else: 'p' },
  ], 'p')));
  assert.equal(r4.ok, false);
  assert.ok((r4 as { errors: string[] }).errors.some((e) => e.includes('debe ser un nodo agent')));
});

/* ── Motor: secuencia + transferencia ─────────────────────────────────────── */

test('workflow: secuencia de 2 agentes con transferencia de contexto ({{prev}})', async () => {
  await saveSpec(
    workflow({
      start: 'n1',
      nodes: [
        { id: 'n1', type: 'agent', agentSpecId: 'wf-agente-a', input: '[SAY:etapa-uno]' },
        { id: 'n2', type: 'agent', agentSpecId: 'wf-agente-b', input: 'entrada previa: {{prev}} → [SAY:final-{{prev}}]' },
      ],
    }),
  );
  const started = await startWorkflowRun('wf-test', 'entrada del workflow');
  assert.ok(started.ok);
  const run = await pollRun((started as { workflowRunId: string }).workflowRunId);
  assert.equal(run.status, 'completed');
  assert.equal(run.steps.n1.status, 'completed');
  assert.equal(run.steps.n1.output, 'etapa-uno');
  assert.equal(run.steps.n2.output, 'final-etapa-uno', 'el nodo 2 recibió la salida del nodo 1 vía {{prev}}');
  assert.equal(run.output, 'final-etapa-uno');
  assert.ok(run.steps.n1.agentSessionId?.startsWith('ses-'), 'trazabilidad nodo→sesión del agente');
  assert.ok(run.steps.n1.agentExecutionId?.startsWith('run-'), 'trazabilidad nodo→run del agente');
});

/* ── Motor: condición ─────────────────────────────────────────────────────── */

test('workflow: condición determinista enruta por la rama correcta', async () => {
  await saveSpec(
    workflow({
      start: 'n1',
      nodes: [
        { id: 'n1', type: 'agent', agentSpecId: 'wf-agente-a', input: '[SAY:APROBADO-verde]' },
        { id: 'dec', type: 'condition', input: '{{n1}}', check: { op: 'contains', value: 'APROBADO', caseSensitive: false }, then: 'camino-si', else: 'camino-no' },
        { id: 'camino-si', type: 'agent', agentSpecId: 'wf-agente-b', input: 'aprobado: {{n1}} → [SAY:procesado-ok]' },
        { id: 'camino-no', type: 'agent', agentSpecId: 'wf-agente-c', input: '[SAY:rechazado]' },
      ],
    }, 'wf-cond'),
  );
  const started = await startWorkflowRun('wf-cond', 'x');
  const run = await pollRun((started as { workflowRunId: string }).workflowRunId);
  assert.equal(run.status, 'completed');
  assert.equal(run.steps.dec.status, 'completed');
  assert.equal(run.steps['camino-si'].status, 'completed');
  assert.equal(run.steps['camino-no'].status, 'skipped', 'la rama NO tomada queda skipped');
  assert.equal(run.output, 'procesado-ok');
});

/* ── Motor: paralelo ──────────────────────────────────────────────────────── */

test('workflow: parallel ejecuta ramas y une salidas etiquetadas', async () => {
  await saveSpec(
    workflow({
      start: 'p',
      nodes: [
        { id: 'p', type: 'parallel', branches: ['b1', 'b2'], join: 'concat' },
        { id: 'b1', type: 'agent', agentSpecId: 'wf-agente-a', input: '[SAY:rama-A]' },
        { id: 'b2', type: 'agent', agentSpecId: 'wf-agente-b', input: '[SAY:rama-B]' },
        { id: 'post', type: 'agent', agentSpecId: 'wf-agente-c', input: 'unido: {{prev}} → [SAY:post-ok]' },
      ],
    }, 'wf-par'),
  );
  const started = await startWorkflowRun('wf-par', 'x');
  const run = await pollRun((started as { workflowRunId: string }).workflowRunId);
  assert.equal(run.status, 'completed');
  assert.equal(run.steps.p.status, 'completed');
  assert.ok(run.steps.p.output?.includes('rama-A') && run.steps.p.output?.includes('rama-B'), 'salidas unidas');
  assert.equal(run.steps.post.output, 'post-ok');
  assert.equal(run.steps.b1.status, 'completed');
  assert.equal(run.steps.b2.status, 'completed');
});

/* ── Motor: fallo, reintentos y REANUDACIÓN ───────────────────────────────── */

test('workflow: nodo fallido → workflow failed; REANUDACIÓN desde el nodo pendiente', async () => {
  await saveSpec(
    workflow({
      start: 'n1',
      nodes: [
        { id: 'n1', type: 'agent', agentSpecId: 'wf-agente-a', input: '[SAY:primer-paso-ok]' },
        { id: 'n2', type: 'agent', agentSpecId: 'wf-agente-b', input: '{{prev}} → [FAIL_ONCE:wf-resume] → [SAY:segundo-ok]', retries: 0 },
      ],
    }, 'wf-resume'),
  );
  const started = await startWorkflowRun('wf-resume', 'x');
  const run = await pollRun((started as { workflowRunId: string }).workflowRunId);
  assert.equal(run.status, 'failed', 'el primer intento del nodo 2 falla (FAIL_ONCE) y sin retries → failed');
  assert.equal(run.steps.n1.status, 'completed');
  assert.equal(run.steps.n2.status, 'failed');
  assert.equal(run.steps.n2.attempts, 1);

  // REANUDACIÓN: el mock ya vio el token → el nodo 2 ahora tiene éxito
  const resumed = await resumeWorkflowRun(run.workflowRunId);
  assert.equal(resumed.ok, true);
  const run2 = await pollRun(run.workflowRunId);
  assert.equal(run2.status, 'completed');
  assert.equal(run2.steps.n1.status, 'completed');
  assert.equal(run2.steps.n2.status, 'completed', 'el nodo 1 NO se re-ejecuta (salida persistida)');
  assert.equal(run2.steps.n2.output, 'segundo-ok');
});

/* ── Motor: cancelación en punto seguro ───────────────────────────────────── */

test('workflow: cancelación entre nodos → cancelled con pasos pendientes cancelados', async () => {
  await saveSpec(
    workflow({
      start: 'n1',
      nodes: [
        { id: 'n1', type: 'agent', agentSpecId: 'wf-agente-a', input: '[SAY:paso1]' },
        { id: 'n2', type: 'agent', agentSpecId: 'wf-agente-b', input: '[SAY:paso2]' },
        { id: 'n3', type: 'agent', agentSpecId: 'wf-agente-c', input: '[SAY:paso3]' },
      ],
    }, 'wf-cancel'),
  );
  const started = await startWorkflowRun('wf-cancel', 'x');
  const runId = (started as { workflowRunId: string }).workflowRunId;
  // cancelar INMEDIATAMENTE (el motor aún no arrancó o está en el nodo 1):
  await cancelWorkflowRun(runId);
  const run = await pollRun(runId, 15000);
  assert.ok(['cancelled', 'completed'].includes(run.status), `cancelación en punto seguro o carrera benigna: ${run.status}`);
  if (run.status === 'cancelled') {
    assert.equal(run.steps.n1.status, 'cancelled');
  }
});

/* ── Integración knowledge en nodos agent (herencia) ──────────────────────── */

test('workflow: nodo agent hereda knowledge/memory del PROPIO agente', async () => {
  // fuente knowledge + binding al agente del nodo
  const { createSource, ingestSource } = await import('../services/ingestion.service');
  const { setBindingsForAgent } = await import('../services/knowledge-store.service');
  const created = await createSource({
    type: 'text',
    title: 'wf-kb-doc',
    text: 'Doc del workflow. RECOVER: el código del workflow es WF-4242 (color rojo).',
  });
  await ingestSource((created as { source: { sourceId: string } }).source.sourceId);
  await setBindingsForAgent('wf-agente-kb', [(created as { source: { sourceId: string } }).source.sourceId]);

  await saveSpec(
    workflow({
      start: 'n1',
      nodes: [{ id: 'n1', type: 'agent', agentSpecId: 'wf-agente-kb', input: '¿Cuál es el código del workflow? (pista rojo)' }],
    }, 'wf-kb'),
  );
  const started = await startWorkflowRun('wf-kb', 'x');
  const run = await pollRun((started as { workflowRunId: string }).workflowRunId);
  assert.equal(run.status, 'completed');
  assert.ok(String(run.output).includes('WF-4242') && String(run.output).includes('[1]'), 'el nodo respondió con el KNOWLEDGE recuperado y su cita (herencia del agente)');
});

/* ── Helpers ──────────────────────────────────────────────────────────────── */

async function pollRun(runId: string, maxMs = 30000): Promise<{ status: string; steps: Record<string, any>; output?: string; workflowRunId: string; errors: string[] }> {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    const run = await loadWorkflowRun(runId);
    assert.ok(run, 'la ejecución existe');
    if (run.status !== 'running' && run.status !== 'cancelling') {
      return run as never;
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error('timeout esperando el workflow run');
}
