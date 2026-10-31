import {
  validateSpec,
  type WorkflowSpecV1,
  type WorkflowNode,
} from '@uiep/agent-spec';
import { getLatestSpec } from './spec-registry.service';
import { createSession, runAgent } from './agent-runtime.service';
import {
  loadWorkflowRun,
  newWorkflowRunId,
  saveWorkflowRun,
  type WorkflowNodeStep,
  type WorkflowRunRecord,
} from './workflow-store.service';

/**
 * workflow-runtime (Fase 6) — motor de orquestación PROPIO y determinista.
 *
 * Sin n8n/LangGraph/CrewAI, sin ejecución de código arbitrario: los nodos
 * agent ejecutan el pipeline existente del Agent Runtime (gateway, tools
 * cerradas, knowledge bindings, memory — todo heredado del PROPIO agente en
 * SU sesión aislada); las decisiones son predicados deterministas; el
 * paralelo tiene tope de concurrencia; los límites por env.
 *
 * Superficie:
 *  · startWorkflowRun(id, input)  → 202-style: persiste 'running' y ejecuta
 *    en background (polling desde la consola).
 *  · cancelWorkflowRun(runId)     → bandera persistida; el motor para en el
 *    siguiente punto seguro (entre nodos) → 'cancelled'.
 *  · resumeWorkflowRun(runId)     → re-ejecuta desde el primer nodo no
 *    completado (reutiliza salidas persistidas de los completados).
 *  · El sweep de arranque (store) marca huérfanas → failed.
 *
 * Límites (env con defaults): WORKFLOW_MAX_RUNTIME_MS (600000),
 * WORKFLOW_NODE_TIMEOUT_MS (180000), WORKFLOW_MAX_CONCURRENCY (4),
 * WORKFLOW_MAX_INPUT_CHARS (4000), WORKFLOW_MAX_CONCURRENT_RUNS (4).
 */

function envLimit(name: string, fallback: number): number {
  const v = Number(process.env[name]);
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

export type LoadWorkflowResult =
  | { ok: false; reason: 'workflow_not_registered' | 'workflow_invalid'; errors?: string[] }
  | { ok: true; spec: WorkflowSpecV1 };

export async function loadWorkflow(workflowId: string): Promise<LoadWorkflowResult> {
  const envelope = await getLatestSpec(workflowId);
  if (!envelope || (envelope as { kind?: string }).kind !== 'Workflow') {
    return { ok: false, reason: 'workflow_not_registered' };
  }
  const parsed = validateSpec(envelope);
  if (!parsed.ok) {
    return { ok: false, reason: 'workflow_invalid', errors: Object.keys(parsed.errors).flatMap((k) => parsed.errors[k]) };
  }
  return { ok: true, spec: parsed.spec as WorkflowSpecV1 };
}

/** Sustitución determinista de plantillas: {{input}}, {{prev}}, {{nodeId}}. */
function renderTemplate(template: string, input: string, prev: string | undefined, outputs: Map<string, string>): string {
  return template
    .replace(/\{\{input\}\}/g, input)
    .replace(/\{\{prev\}\}/g, prev ?? '')
    .replace(/\{\{([a-z0-9-]{1,64})\}\}/g, (m, nodeId: string) => outputs.get(nodeId) ?? '');
}

export type StartWorkflowResult =
  | { ok: false; reason: 'workflow_not_registered' | 'workflow_invalid' | 'input_too_large' | 'concurrency_limit'; errors?: string[] }
  | { ok: true; workflowRunId: string };

let inFlight = 0;

export async function startWorkflowRun(workflowId: string, rawInput: string): Promise<StartWorkflowResult> {
  if (rawInput.length > envLimit('WORKFLOW_MAX_INPUT_CHARS', 4000)) {
    return { ok: false, reason: 'input_too_large' };
  }
  const maxConcurrent = envLimit('WORKFLOW_MAX_CONCURRENT_RUNS', 4);
  if (inFlight >= maxConcurrent) {
    return { ok: false, reason: 'concurrency_limit' };
  }
  const loaded = await loadWorkflow(workflowId);
  if (!loaded.ok) {
    return { ok: false, reason: loaded.reason, errors: loaded.errors };
  }
  const run: WorkflowRunRecord = {
    workflowRunId: newWorkflowRunId(),
    workflowId,
    workflowVersion: loaded.spec.metadata.version,
    input: rawInput,
    status: 'running',
    steps: Object.fromEntries(loaded.spec.spec.nodes.map((n) => [n.id, { nodeId: n.id, type: n.type, status: 'pending', attempts: 0 }] as [string, WorkflowNodeStep])),
    order: loaded.spec.spec.nodes.map((n) => n.id),
    errors: [],
    startedAt: new Date().toISOString(),
  };
  await saveWorkflowRun(run);
  inFlight += 1;
  void executeWorkflow(run, loaded.spec).catch((err) => {
    console.error('[UIEP] workflow_run_failed', err);
  }).finally(() => {
    inFlight -= 1;
  });
  return { ok: true, workflowRunId: run.workflowRunId };
}

export async function cancelWorkflowRun(runId: string): Promise<{ ok: boolean; reason?: string }> {
  const run = await loadWorkflowRun(runId);
  if (!run) {
    return { ok: false, reason: 'run_not_found' };
  }
  if (run.status === 'completed' || run.status === 'failed' || run.status === 'cancelled') {
    return { ok: false, reason: 'run_already_finished' };
  }
  run.status = 'cancelling'; // el motor para en el siguiente punto seguro
  await saveWorkflowRun(run);
  return { ok: true };
}

export async function resumeWorkflowRun(runId: string): Promise<{ ok: boolean; reason?: string }> {
  const run = await loadWorkflowRun(runId);
  if (!run) {
    return { ok: false, reason: 'run_not_found' };
  }
  if (run.status !== 'failed' && run.status !== 'cancelled') {
    return { ok: false, reason: 'run_not_resumable' };
  }
  const loaded = await loadWorkflow(run.workflowId);
  if (!loaded.ok) {
    return { ok: false, reason: 'workflow_not_registered' };
  }
  run.status = 'running';
  run.errors.push(`resumed: reanudado desde el primer nodo no completado`);
  await saveWorkflowRun(run);
  inFlight += 1;
  void executeWorkflow(run, loaded.spec).catch((err) => {
    console.error('[UIEP] workflow_resume_failed', err);
  }).finally(() => {
    inFlight -= 1;
  });
  return { ok: true };
}

/* ── Motor ────────────────────────────────────────────────────────────────── */

interface EngineCtx {
  input: string
  outputs: Map<string, string> // nodeId → salida (solo nodos ejecutados)
  prev: string | undefined
  deadline: number
}

async function executeWorkflow(run: WorkflowRunRecord, spec: WorkflowSpecV1): Promise<void> {
  const ctx: EngineCtx = { input: run.input, outputs: new Map(), prev: undefined, deadline: Date.now() + envLimit('WORKFLOW_MAX_RUNTIME_MS', 600000) };
  const byId = new Map<string, WorkflowNode>(spec.spec.nodes.map((n) => [n.id, n]));
  const executedParallelBranches = new Set<string>();

  let currentId: string | undefined = spec.spec.start;
  let lastAgentOutput: string | undefined;

  const finalize = async (status: WorkflowRunRecord['status']) => {
    run.status = status;
    run.finishedAt = new Date().toISOString();
    if (lastAgentOutput !== undefined) {
      run.output = lastAgentOutput;
    }
    await saveWorkflowRun(run);
  };

  try {
    while (currentId) {
      // Puntos seguros: ENTRE nodos se comprueba cancelación y deadlines.
      const fresh = await loadWorkflowRun(run.workflowRunId);
      if (fresh && fresh.status === 'cancelling') {
        run.status = 'cancelling';
        for (const step of Object.values(run.steps)) {
          if (step.status === 'pending' || step.status === 'running') {
            step.status = 'cancelled';
          }
        }
        await finalize('cancelled');
        return;
      }
      if (Date.now() > ctx.deadline) {
        run.errors.push('workflow_timeout: se superó WORKFLOW_MAX_RUNTIME_MS');
        await finalize('failed');
        return;
      }

      const node = byId.get(currentId);
      if (!node) {
        run.errors.push(`nodo inexistente en el flujo: ${currentId}`);
        await finalize('failed');
        return;
      }
      const step = run.steps[node.id];

      // Nodo ya completado (reanudación o rama de parallel alcanzada en
      // secuencia): saltar SIN re-ejecutar. La condición reanudada salta a su
      // rama tomada (persistida); el resto sigue la secuencia.
      if (step.status === 'completed') {
        ctx.prev = step.output;
        currentId = step.type === 'condition' && step.branchTaken ? step.branchTaken : nextSequentialId(spec, node.id);
        continue;
      }
      // Nodo marcado skipped (rama no tomada alcanzada por la secuencia): fin.
      if (step.status === 'skipped' || step.status === 'cancelled') {
        await finalize('completed');
        return;
      }

      step.status = 'running';
      step.startedAt = new Date().toISOString();
      await saveWorkflowRun(run);

      if (node.type === 'agent') {
        const done = await runAgentNode(run, step, node, ctx);
        if (!done.ok) {
          step.status = 'failed';
          step.error = done.error;
          step.finishedAt = new Date().toISOString();
          run.errors.push(`nodo '${node.id}' falló: ${done.error}`);
          await finalize('failed');
          return;
        }
        step.status = 'completed';
        step.output = done.output;
        step.finishedAt = new Date().toISOString();
        step.durationMs = Date.now() - Date.parse(step.startedAt);
        lastAgentOutput = done.output;
        ctx.outputs.set(node.id, done.output);
        ctx.prev = done.output;
        currentId = nextSequentialId(spec, node.id);
      } else if (node.type === 'condition') {
        const rendered = renderTemplate(node.input, ctx.input, ctx.prev, ctx.outputs);
        step.renderedInput = rendered;
        const verdict = evaluateCheck(node.check.op, node.check.value, rendered, node.check.caseSensitive);
        step.status = 'completed';
        step.output = `${verdict ? 'TRUE' : 'FALSE'} (${node.check.op}${node.check.value ? ` '${node.check.value}'` : ''})`;
        step.finishedAt = new Date().toISOString();
        step.durationMs = Date.now() - Date.parse(step.startedAt);
        const taken = verdict ? node.then : node.else;
        const untaken = verdict ? node.else : node.then;
        step.branchTaken = taken;
        // Visibilidad: la rama NO tomada queda skipped (su subárbol, si lo
        // hubiera, se documenta como extensión futura del WorkflowSpec).
        const untakenStep = run.steps[untaken];
        if (untakenStep && (untakenStep.status === 'pending' || untakenStep.status === 'running')) {
          untakenStep.status = 'skipped';
          untakenStep.finishedAt = new Date().toISOString();
        }
        // El flujo continúa DESDE la rama tomada (salto, no secuencia).
        currentId = byId.has(taken) ? taken : undefined;
        if (!byId.has(taken)) {
          run.errors.push(`condition '${node.id}': rama '${taken}' inexistente → fin del flujo`);
        }
      } else {
        // parallel: ejecuta las ramas (agent) con tope de concurrencia y une.
        const branches = node.branches;
        const results = await runParallel(run, step, branches, byId, ctx);
        step.branchOutputs = results.map((r) => ({ nodeId: r.nodeId, ok: r.ok, output: r.output?.slice(0, 2000), error: r.error }));
        const failedBranch = results.find((r) => !r.ok);
        if (failedBranch) {
          step.status = 'failed';
          step.error = `rama '${failedBranch.nodeId}' falló: ${failedBranch.error}`;
          step.finishedAt = new Date().toISOString();
          run.errors.push(`parallel '${node.id}' falló: ${step.error}`);
          await finalize('failed');
          return;
        }
        const joined = results.map((r) => `=== ${r.nodeId} ===\n${r.output ?? ''}`).join('\n\n');
        step.status = 'completed';
        step.output = joined;
        step.finishedAt = new Date().toISOString();
        step.durationMs = Date.now() - Date.parse(step.startedAt);
        for (const r of results) {
          executedParallelBranches.add(r.nodeId);
          ctx.outputs.set(r.nodeId, r.output ?? '');
        }
        ctx.prev = joined;
        currentId = nextSequentialId(spec, node.id);
      }

      await saveWorkflowRun(run);
    }
    await finalize('completed');
  } catch (err) {
    run.errors.push(`workflow_error: ${(err as Error).message}`);
    await finalize('failed');
  }
}

function nextSequentialId(spec: WorkflowSpecV1, nodeId: string): string | undefined {
  const idx = spec.spec.nodes.findIndex((n) => n.id === nodeId);
  return spec.spec.nodes[idx + 1]?.id;
}

function evaluateCheck(op: 'contains' | 'equals' | 'not_empty' | 'starts_with', value: string, text: string, caseSensitive: boolean): boolean {
  const a = caseSensitive ? text : text.toLowerCase();
  const b = caseSensitive ? value : value.toLowerCase();
  switch (op) {
    case 'contains':
      return b.length > 0 ? a.includes(b) : a.trim().length > 0;
    case 'equals':
      return a.trim() === b.trim();
    case 'not_empty':
      return a.trim().length > 0;
    case 'starts_with':
      return b.length > 0 ? a.trimStart().startsWith(b) : a.trim().length > 0;
  }
}

async function runAgentNode(
  run: WorkflowRunRecord,
  step: WorkflowNodeStep,
  node: Extract<WorkflowNode, { type: 'agent' }>,
  ctx: EngineCtx,
): Promise<{ ok: true; output: string } | { ok: false; error: string }> {
  const rendered = renderTemplate(node.input, ctx.input, ctx.prev, ctx.outputs);
  step.renderedInput = rendered;
  const attempts = node.retries + 1;
  const timeoutMs = node.timeoutMs ?? envLimit('WORKFLOW_NODE_TIMEOUT_MS', 180000);
  let lastError = 'unknown';

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    step.attempts = attempt;
    await saveWorkflowRun(run);
    try {
      const outcome = await withTimeout(attemptAgentTurn(node, rendered, run), timeoutMs);
      if (outcome.ok) {
        step.agentSessionId = outcome.sessionId;
        step.agentExecutionId = outcome.executionId;
        return { ok: true, output: outcome.output };
      }
      lastError = outcome.error;
    } catch (err) {
      lastError = (err as Error).message === 'node_timeout' ? `node_timeout_${timeoutMs}` : `node_error: ${(err as Error).message}`;
    }
  }
  return { ok: false, error: lastError };
}

async function attemptAgentTurn(
  node: Extract<WorkflowNode, { type: 'agent' }>,
  input: string,
  run: WorkflowRunRecord,
): Promise<{ ok: true; output: string; sessionId: string; executionId: string } | { ok: false; error: string }> {
  // La sesión del agente es NUEVA por intento (aislada y trazable) — el
  // agente hereda gateway/tools/knowledge/memory de su PROPIO spec.
  const ses = await createSession(node.agentSpecId);
  if (!ses.ok) {
    return { ok: false, error: `agent_session_failed: ${ses.reason}` };
  }
  const result = await runAgent(ses.session.sessionId, input);
  if (!result.ok) {
    return { ok: false, error: `agent_run_failed: ${result.reason}` };
  }
  const rec = result.record;
  if (rec.status !== 'completed' && rec.status !== 'completed_without_tools') {
    return { ok: false, error: `agent_status_${rec.status}: ${rec.errors.join(' | ') || 'sin detalle'}` };
  }
  return { ok: true, output: rec.result.text ?? '', sessionId: ses.session.sessionId, executionId: rec.executionId };
}

async function runParallel(
  run: WorkflowRunRecord,
  step: WorkflowNodeStep,
  branches: string[],
  byId: Map<string, WorkflowNode>,
  ctx: EngineCtx,
): Promise<Array<{ nodeId: string; ok: boolean; output?: string; error?: string }>> {
  const concurrency = Math.min(envLimit('WORKFLOW_MAX_CONCURRENCY', 4), branches.length || 1);
  const results: Array<{ nodeId: string; ok: boolean; output?: string; error?: string }> = [];
  const queue = [...branches];
  const worker = async () => {
    while (queue.length > 0) {
      const branchId = queue.shift()!;
      const branchNode = byId.get(branchId);
      if (!branchNode || branchNode.type !== 'agent') {
        results.push({ nodeId: branchId, ok: false, error: 'branch_not_agent' });
        continue;
      }
      const branchStep: WorkflowNodeStep = run.steps[branchId] ?? (run.steps[branchId] = { nodeId: branchId, type: 'agent', status: 'pending', attempts: 0 });
      branchStep.status = 'running';
      branchStep.startedAt = new Date().toISOString();
      await saveWorkflowRun(run);
      const done = await runAgentNode(run, branchStep, branchNode, { ...ctx, prev: ctx.prev });
      if (done.ok) {
        branchStep.status = 'completed';
        branchStep.output = done.output;
        branchStep.finishedAt = new Date().toISOString();
        branchStep.durationMs = Date.now() - Date.parse(branchStep.startedAt);
        results.push({ nodeId: branchId, ok: true, output: done.output });
      } else {
        branchStep.status = 'failed';
        branchStep.error = done.error;
        branchStep.finishedAt = new Date().toISOString();
        results.push({ nodeId: branchId, ok: false, error: done.error });
      }
      await saveWorkflowRun(run);
    }
  };
  await Promise.all(Array.from({ length: concurrency }, worker));
  return results.sort((a, b) => branches.indexOf(a.nodeId) - branches.indexOf(b.nodeId));
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('node_timeout')), ms);
    p.then((v) => {
      clearTimeout(t);
      resolve(v);
    }).catch((e) => {
      clearTimeout(t);
      reject(e);
    });
  });
}
