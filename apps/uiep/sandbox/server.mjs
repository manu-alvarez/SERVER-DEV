#!/usr/bin/env node
/**
 * UIEP Execution Sandbox (Misión 14) — intérprete de artefactos declarativos.
 *
 * NO ejecuta código generado: los artefactos UIEP son DOCUMENTOS (sin código
 * ejecutable por diseño del schema). Este proceso:
 *   · valida y hace cumplir los contratos (campos, constraints, rate limits),
 *   · orquesta las ejecuciones agénticas LLAMANDO a los runtimes existentes
 *     del backend (/api/runner/*, token dedicado),
 *   · aplica LÍMITES duros (tiempo, pasos, concurrencia, tamaño) y
 *     cancelación real (AbortController + terminación del job),
 *   · nunca escribe en disco (FS solo tmpfs efímero), nunca abre puertos
 *     hacia fuera de la red interna, nunca toca el socket de Docker.
 *
 * El CONTENEDOR aporta el aislamiento duro (read_only rootfs, cap_drop ALL,
 * no-new-privileges, pids/mem limits, red `internal` sin salida a internet).
 * Este proceso aporta el aislamiento LÓGICO por job (abortos, cuotas, redacción).
 *
 * Sin dependencias npm: solo node:http / node:crypto.
 */

import { createServer } from 'node:http';
import { timingSafeEqual, randomBytes } from 'node:crypto';

const PORT = Number(process.env.PORT || 4100);
const TOKEN = process.env.SANDBOX_EXEC_TOKEN || '';
const BACKEND = (process.env.UIEP_BACKEND_URL || 'http://uiep-backend:4000').replace(/\/+$/, '');
const RUNNER_TOKEN = process.env.UIEP_RUNNER_TOKEN || '';

/** Límites duros del sandbox (no negociables por job). */
const LIMITS = {
  maxBodyBytes: 512 * 1024, // 512 KB por envelope
  maxJobMs: 300_000, // 5 min — turnos de LLM reales (thinking ~80s/turno)
  defaultJobMs: 30_000,
  maxSteps: 50,
  maxConcurrent: 2,
  maxAgentsPerApp: 12,
  maxCasesPerDataset: 100,
  maxFixturesPerHarness: 50,
  maxFields: 16,
  pollIntervalMs: 700,
};

/** Jobs activos: runId → { controller, timer, kind, startedAt } */
const jobs = new Map();

/** Buckets de rate limit por contrato de API (endpointId + cliente). */
const rateBuckets = new Map(); // key → { windowStart, count }

function timingSafeEq(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

function authOk(req) {
  if (!TOKEN) {
    return false; // fail-closed: sin token configurado el sandbox no ejecuta
  }
  const h = req.headers.authorization || '';
  return h.startsWith('Bearer ') && timingSafeEq(h.slice(7), TOKEN);
}

function readBody(req, maxBytes) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > maxBytes) {
        reject(Object.assign(new Error('body_too_large'), { code: 'body_too_large' }));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function send(res, status, body) {
  const json = JSON.stringify(body);
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(json);
}

/* ── Runner: callbacks al backend (runtimes existentes) ──────────────────── */

function runnerHeaders() {
  if (!RUNNER_TOKEN) {
    return null; // fail-closed
  }
  return { 'content-type': 'application/json', authorization: `Bearer ${RUNNER_TOKEN}` };
}

async function runnerJson(method, path, body, signal) {
  const headers = runnerHeaders();
  if (!headers) {
    throw Object.assign(new Error('runner_disabled'), { code: 'runner_disabled' });
  }
  const res = await fetch(BACKEND + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  });
  const json = (await res.json().catch(() => ({})));
  return { status: res.status, json };
}

/** Ejecuta un turno de agente y ESPERA el resultado terminal (polling). */
async function runAgent(agentSpecId, input, signal, deadline, logs) {
  const started = runnerJson('POST', `/api/runner/agents/${encodeURIComponent(agentSpecId)}/runs`, { input }, signal);
  const startRes = await started;
  if (startRes.status !== 201 || !startRes.json?.ok) {
    const reason = startRes.json?.reason ?? `http_${startRes.status}`;
    logs.push(`agent ${agentSpecId}: start falló (${reason})`);
    throw Object.assign(new Error(`agent_start_failed:${reason}`), { code: 'agent_start_failed', reason });
  }
  const executionId = startRes.json.executionId;
  while (Date.now() < deadline) {
    if (signal?.aborted) {
      throw Object.assign(new Error('cancelled'), { code: 'cancelled' });
    }
    await new Promise((r) => setTimeout(r, LIMITS.pollIntervalMs));
    const poll = await runnerJson('GET', `/api/runner/agents/runs/${encodeURIComponent(executionId)}`, undefined, signal);
    const rec = poll.json?.record;
    if (!rec) {
      continue; // reintento hasta deadline
    }
    if (['completed', 'completed_without_tools', 'requires_approval'].includes(rec.status)) {
      return { executionId, status: rec.status, output: String(rec.result?.text ?? '') };
    }
    if (['failed', 'timeout', 'max_iterations_reached'].includes(rec.status)) {
      return { executionId, status: rec.status, output: String(rec.result?.text ?? '') };
    }
  }
  throw Object.assign(new Error('job_timeout'), { code: 'job_timeout' });
}

/** Ejecuta un workflow (existing runtime) y espera el estado terminal. */
async function runWorkflow(workflowId, input, signal, deadline, logs) {
  const startRes = await runnerJson('POST', `/api/runner/workflows/${encodeURIComponent(workflowId)}/runs`, { input }, signal);
  if (startRes.status !== 201 || !startRes.json?.ok) {
    const reason = startRes.json?.reason ?? `http_${startRes.status}`;
    logs.push(`workflow ${workflowId}: start falló (${reason})`);
    throw Object.assign(new Error(`workflow_start_failed:${reason}`), { code: 'workflow_start_failed', reason });
  }
  const workflowRunId = startRes.json.workflowRunId;
  while (Date.now() < deadline) {
    if (signal?.aborted) {
      throw Object.assign(new Error('cancelled'), { code: 'cancelled' });
    }
    await new Promise((r) => setTimeout(r, LIMITS.pollIntervalMs));
    const poll = await runnerJson('GET', `/api/runner/workflows/runs/${encodeURIComponent(workflowRunId)}`, undefined, signal);
    const rec = poll.json?.record;
    if (!rec) {
      continue;
    }
    if (rec.status === 'completed') {
      return { workflowRunId, status: 'completed', output: String(rec.output ?? '') };
    }
    if (['failed', 'timeout', 'cancelled'].includes(rec.status)) {
      return { workflowRunId, status: rec.status, output: String(rec.output ?? '') };
    }
  }
  throw Object.assign(new Error('job_timeout'), { code: 'job_timeout' });
}

/* ── Validación de campos (contratos api-platform) ───────────────────────── */

function validateField(field, value, errors, path) {
  if (value === undefined || value === null || value === '') {
    if (field.required !== false) {
      errors.push({ path, msg: `campo requerido ausente: ${field.name}` });
      return undefined;
    }
    return undefined;
  }
  const t = field.type;
  const ok =
    (t === 'string' && typeof value === 'string') ||
    (t === 'number' && typeof value === 'number' && Number.isFinite(value)) ||
    (t === 'boolean' && typeof value === 'boolean') ||
    (t === 'object' && typeof value === 'object' && !Array.isArray(value)) ||
    (t === 'array' && Array.isArray(value));
  if (!ok) {
    errors.push({ path, msg: `tipo esperado ${t}` });
    return undefined;
  }
  for (const c of field.constraints ?? []) {
    if (c.kind === 'min' && typeof value === 'number' && value < c.value) {
      errors.push({ path, msg: `debe ser ≥ ${c.value}` });
    }
    if (c.kind === 'max' && typeof value === 'number' && value > c.value) {
      errors.push({ path, msg: `debe ser ≤ ${c.value}` });
    }
    if (c.kind === 'maxLength' && typeof value === 'string' && value.length > c.value) {
      errors.push({ path, msg: `longitud > ${c.value}` });
    }
    if (c.kind === 'pattern' && typeof value === 'string') {
      try {
        if (!new RegExp(c.value).test(value)) {
          errors.push({ path, msg: `no cumple el patrón` });
        }
      } catch {
        errors.push({ path, msg: 'patrón inválido en el contrato' });
      }
    }
    if (c.kind === 'enum' && typeof value === 'string') {
      const opts = String(c.value).split('|');
      if (!opts.includes(value)) {
        errors.push({ path, msg: `debe ser uno de: ${opts.join('|')}` });
      }
    }
  }
  return value;
}

function validateFields(fields, body) {
  const errors = [];
  const cleaned = {};
  const list = (fields ?? []).slice(0, LIMITS.maxFields);
  for (const f of list) {
    const v = validateField(f, body?.[f.name], errors, f.name);
    if (v !== undefined) {
      cleaned[f.name] = v;
    }
  }
  return { errors, cleaned };
}

function rateAllow(key, limit, windowMs) {
  const now = Date.now();
  const b = rateBuckets.get(key);
  if (!b || now - b.windowStart > windowMs) {
    rateBuckets.set(key, { windowStart: now, count: 1 });
    return true;
  }
  if (b.count >= limit) {
    return false;
  }
  b.count += 1;
  return true;
}

/* ── Interpretadores por kind ────────────────────────────────────────────── */

async function execApiRequest(job, signal) {
  const { artifact, invocation } = job;
  const endpoints = artifact?.spec?.endpoints ?? [];
  const ep = endpoints.find((e) => e.id === invocation.endpointId);
  if (!ep) {
    return { status: 404, body: { error: 'unknown_endpoint' } };
  }
  if (ep.method !== invocation.method) {
    return { status: 405, body: { error: 'method_not_allowed', expected: ep.method } };
  }
  // Rate limit del CONTRATO: por artefacto+endpoint (no por job — es límite
  // declarado del endpoint, compartido entre ejecuciones del mismo doc).
  if (ep.rateLimit && !rateAllow(`api:${artifact?.metadata?.id ?? '?'}:${ep.id}`, ep.rateLimit.max, ep.rateLimit.windowMs)) {
    return { status: 429, body: { error: 'rate_limited', limit: ep.rateLimit } };
  }
  const req = validateFields(ep.request, invocation.body ?? {});
  if (req.errors.length > 0) {
    return { status: 422, body: { error: 'invalid_input', details: req.errors } };
  }
  if (ep.agentBinding) {
    const input = `${ep.summary}: ${JSON.stringify(req.cleaned)}`;
    const run = await runAgent(ep.agentBinding, input.slice(0, 4000), signal, job.deadline, job.logs);
    const resp = validateFields(ep.response, { salida: run.output });
    return {
      status: 200,
      body: {
        endpoint: ep.id,
        servedBy: 'agent',
        agentSpecId: ep.agentBinding,
        agentStatus: run.status,
        output: run.output,
        executionId: run.executionId,
      },
    };
  }
  // Sin agente: respuesta determinista de contrato (validación + eco limpio).
  return {
    status: 200,
    body: {
      endpoint: ep.id,
      servedBy: 'contract',
      validated: req.cleaned,
      echo: invocation.query ?? {},
    },
  };
}

async function execAgenticApp(job, signal) {
  const { artifact, invocation } = job;
  const app = artifact?.spec ?? {};
  const agents = (app.agents ?? []).slice(0, LIMITS.maxAgentsPerApp);
  if (agents.length === 0) {
    return { status: 422, body: { error: 'app_without_agents' } };
  }
  const input = String(invocation?.input ?? '').slice(0, 4000);
  const runs = [];
  for (const a of agents) {
    if (signal?.aborted) {
      throw Object.assign(new Error('cancelled'), { code: 'cancelled' });
    }
    if (runs.length >= LIMITS.maxSteps) {
      job.logs.push('límite de pasos alcanzado');
      break;
    }
    const r = await runAgent(a.agentSpecId, input, signal, job.deadline, job.logs);
    runs.push({ agentSpecId: a.agentSpecId, role: a.role, executionId: r.executionId, status: r.status, output: r.output.slice(0, 4000) });
  }
  // Workflow de coordinación si la app lo declara: se ejecuta con la entrada.
  let workflow = null;
  const wfIds = app.workflows ?? [];
  if (wfIds.length > 0) {
    workflow = await runWorkflow(wfIds[0], input, signal, job.deadline, job.logs);
    workflow.output = String(workflow.output ?? '').slice(0, 4000);
  }
  return { status: 200, body: { agents: runs, workflow, surfaces: app.surfaces ?? [] } };
}

function scoreCase(expected, output) {
  const e = String(expected).toLowerCase().split(/\W+/).filter((w) => w.length > 2);
  const o = new Set(String(output).toLowerCase().split(/\W+/));
  if (e.length === 0) {
    return { f1: output ? 1 : 0, hit: Boolean(output) };
  }
  let tp = 0;
  for (const w of new Set(e)) {
    if (o.has(w)) {
      tp += 1;
    }
  }
  const precision = tp / Math.max(1, o.size);
  const recall = tp / e.length;
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  return { f1, hit: recall >= 0.5 };
}

async function execDataset(job, signal) {
  const { artifact, invocation } = job;
  const cases = (artifact?.spec?.cases ?? []).slice(0, LIMITS.maxCasesPerDataset);
  const target = invocation?.agentSpecId;
  if (!target) {
    return { status: 422, body: { error: 'target_required' } };
  }
  const thresholds = artifact?.spec?.thresholds ?? {};
  const results = [];
  for (const c of cases) {
    if (signal?.aborted) {
      throw Object.assign(new Error('cancelled'), { code: 'cancelled' });
    }
    const run = await runAgent(target, c.query, signal, job.deadline, job.logs);
    const s = scoreCase(c.expected, run.output);
    const agentOk = ['completed', 'completed_without_tools'].includes(run.status);
    results.push({ caseId: c.id, agentStatus: run.status, f1: Number(s.f1.toFixed(3)), passed: s.hit && agentOk });
  }
  const passed = results.filter((r) => r.passed).length;
  const f1Mean = results.length > 0 ? results.reduce((a, r) => a + r.f1, 0) / results.length : 0;
  const verdict = { cases: results.length, passed, ratio: results.length > 0 ? Number((passed / results.length).toFixed(3)) : 0, f1Mean: Number(f1Mean.toFixed(3)) };
  // Sin thresholds explícitos → exigencia TOTAL (todos los casos deben pasar).
  const requiredRatio = thresholds.recall ?? 1.0;
  const gateOk =
    verdict.ratio >= requiredRatio &&
    (thresholds.precision === undefined || verdict.f1Mean >= thresholds.precision);
  return { status: 200, body: { metrics: verdict, thresholds, verdict: gateOk ? 'pass' : 'fail' } };
}

async function execHarness(job, signal) {
  const { artifact, invocation } = job;
  const fixtures = (artifact?.spec?.fixtures ?? []).slice(0, LIMITS.maxFixturesPerHarness);
  const target = invocation?.agentSpecId;
  if (!target) {
    return { status: 422, body: { error: 'target_required' } };
  }
  const results = [];
  for (const fx of fixtures) {
    if (signal?.aborted) {
      throw Object.assign(new Error('cancelled'), { code: 'cancelled' });
    }
    const run = await runAgent(target, fx.input, signal, job.deadline, job.logs);
    const expected = fx.expected ?? '';
    const agentOk = ['completed', 'completed_without_tools'].includes(run.status);
    const s = expected ? scoreCase(expected, run.output) : { f1: 1, hit: agentOk };
    results.push({ fixture: fx.name, agentStatus: run.status, passed: s.hit && agentOk });
  }
  return { status: 200, body: { fixtures: results, passed: results.filter((r) => r.passed).length, total: results.length } };
}

const HANDLERS = {
  'api-request': execApiRequest,
  'agentic-app': execAgenticApp,
  dataset: execDataset,
  harness: execHarness,
};

/* ── Servidor ────────────────────────────────────────────────────────────── */

const server = createServer(async (req, res) => {
  const url = req.url || '/';
  try {
    if (req.method === 'GET' && url === '/v1/health') {
      return send(res, 200, { ok: true, sandbox: 'uiep-execution', running: jobs.size, limits: { maxConcurrent: LIMITS.maxConcurrent, maxJobMs: LIMITS.maxJobMs } });
    }
    if (!authOk(req)) {
      return send(res, TOKEN ? 401 : 503, { error: TOKEN ? 'unauthorized' : 'sandbox_disabled' });
    }
    if (req.method === 'POST' && url.startsWith('/v1/cancel/')) {
      const runId = url.slice('/v1/cancel/'.length);
      const job = jobs.get(runId);
      if (!job) {
        return send(res, 404, { error: 'run_not_found' });
      }
      job.controller.abort(Object.assign(new Error('cancel_requested'), { code: 'cancelled' }));
      return send(res, 200, { cancelled: true, runId });
    }
    if (req.method === 'POST' && url === '/v1/execute') {
      if (jobs.size >= LIMITS.maxConcurrent) {
        return send(res, 429, { error: 'sandbox_busy', running: jobs.size });
      }
      let envelope;
      try {
        envelope = JSON.parse((await readBody(req, LIMITS.maxBodyBytes)) || '{}');
      } catch (err) {
        return send(res, 413, { error: err.code ?? 'invalid_json' });
      }
      const runId = String(envelope.runId ?? `run-${randomBytes(6).toString('hex')}`);
      const kind = String(envelope.kind ?? '');
      const handler = HANDLERS[kind];
      if (!handler) {
        return send(res, 400, { error: 'unknown_kind', supported: Object.keys(HANDLERS) });
      }
      const timeoutMs = Math.min(Number(envelope.limits?.timeoutMs) || LIMITS.defaultJobMs, LIMITS.maxJobMs);
      const controller = new AbortController();
      const job = { runId, kind, controller, deadline: Date.now() + timeoutMs, logs: [], artifact: envelope.artifact, invocation: envelope.invocation };
      jobs.set(runId, job);
      const timer = setTimeout(() => {
        job.logs.push(`timeout duro del sandbox (${timeoutMs}ms)`);
        controller.abort(Object.assign(new Error('job_timeout'), { code: 'job_timeout' }));
      }, timeoutMs);
      const t0 = Date.now();
      try {
        const out = await handler(job, controller.signal);
        clearTimeout(timer);
        jobs.delete(runId);
        return send(res, 200, { runId, status: 'succeeded', durationMs: Date.now() - t0, result: out, logs: job.logs.slice(0, 20) });
      } catch (err) {
        clearTimeout(timer);
        jobs.delete(runId);
        // El motivo del abort SIEMPRE viaja con code: cancel → 'cancelled',
        // timer → 'job_timeout'; cualquier otra cosa es 'execution_failed'.
        const code = err?.code ?? 'execution_failed';
        const status = code === 'cancelled' ? 200 : code === 'job_timeout' ? 200 : 500;
        return send(res, status, {
          runId,
          status: code === 'cancelled' ? 'cancelled' : code === 'job_timeout' ? 'timeout' : 'failed',
          error: code,
          reason: code === 'cancelled' ? (err?.message ?? 'cancelled') : undefined,
          durationMs: Date.now() - t0,
          logs: job.logs.slice(0, 20),
        });
      }
    }
    return send(res, 404, { error: 'not_found' });
  } catch (err) {
    return send(res, 500, { error: 'sandbox_error', detail: String(err?.message ?? err).slice(0, 200) });
  }
});

server.listen(PORT, () => {
  console.log(`[UIEP Sandbox] puerto ${PORT} — sin red externa, sin disco, límites: ${JSON.stringify(LIMITS)}`);
});

for (const sig of ['SIGTERM', 'SIGINT']) {
  process.on(sig, () => {
    for (const [, job] of jobs) {
      job.controller.abort(Object.assign(new Error('sandbox_shutdown'), { code: 'cancelled' }));
    }
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 1500).unref();
  });
}
