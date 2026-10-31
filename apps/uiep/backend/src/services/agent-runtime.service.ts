import { AgentSpecV1Schema, type AgentSpecV1, type ToolSpecV1, type ModelProfileV1 } from '@uiep/agent-spec';
import {
  describeProfile,
  modelCapabilities,
  providerChat,
  resolveModelRef,
  type RuntimeChatMessage,
  type RuntimeChatTool,
} from './model-gateway.service';
import { getToolSpec, validateToolArguments } from './tool-registry.service';
import { getLatestSpec, saveSpec } from './spec-registry.service';
import { retrieveForAgent, type RetrievalHit } from './retrieval.service';
import {
  listSessionRuns,
  loadRun,
  loadSession,
  newExecutionId,
  newSessionId,
  saveRun,
  saveSession,
  type AgentRunRecord,
  type AgentSessionRecord,
  type RunStatus,
  type SessionMessage,
} from './agent-runtime-store.service';

/**
 * agent-runtime — Fase 3 (P0), Fase 4 (ejecución asíncrona para la UI).
 *
 * Runtime de ejecución de AgentSpecs: agnóstico de proveedor y de framework.
 * Bucle secuencial de agentes individuales: contexto (spec) + mensajes + tools
 * declaradas/autorizadas → proveedor (vía model-gateway) → respuesta o
 * llamada de herramienta → resultado persistido en el volumen existente.
 *
 * Límites aplicados (env, con defaults): RUNTIME_MAX_ITERATIONS (16),
 * RUNTIME_TIMEOUT_MS (180000), RUNTIME_MAX_INPUT_CHARS (4000),
 * RUNTIME_MAX_CONTEXT_CHARS (24000).
 *
 * Doble superficie con EL MISMO motor (semántica idéntica):
 *  - runAgent()      → ejecuta de forma síncrona y devuelve el registro final
 *                      (API protegida clásica, Fase 3: contrato intacto).
 *  - startAgentRun() → prepara y PERSISTE el registro 'running', despacha el
 *                      bucle en background y devuelve executionId al momento;
 *                      el cliente hace polling hasta estado terminal
 *                      (Control Center: ejecuciones largas + polling; el
 *                      turno sobrevive a recargas del navegador).
 */

function envLimit(name: string, fallback: number): number {
  const v = Number(process.env[name]);
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

async function loadAgentSpec(agentSpecId: string): Promise<
  { ok: true; spec: AgentSpecV1 } | { ok: false; reason: 'agent_not_registered' | 'agent_spec_invalid' }
> {
  const envelope = await getLatestSpec(agentSpecId);
  if (!envelope || (envelope as { kind?: string }).kind !== 'Agent') {
    return { ok: false, reason: 'agent_not_registered' };
  }
  const parsed = AgentSpecV1Schema.safeParse(envelope);
  if (!parsed.success) {
    return { ok: false, reason: 'agent_spec_invalid' };
  }
  return { ok: true, spec: parsed.data };
}

/* ── Sesiones ─────────────────────────────────────────────────────────────── */

export type CreateSessionResult =
  | { ok: false; reason: 'agent_not_registered' | 'agent_spec_invalid' }
  | { ok: false; reason: 'profile_not_resolvable'; message: string }
  | { ok: true; session: Pick<AgentSessionRecord, 'sessionId' | 'agentSpecId' | 'profileId' | 'createdAt'> };

export async function createSession(agentSpecId: string): Promise<CreateSessionResult> {
  const loaded = await loadAgentSpec(agentSpecId);
  if (!loaded.ok) {
    return loaded;
  }
  const profile = await resolveModelRef(loaded.spec.spec.model.profile);
  if (!profile.ok) {
    return { ok: false, reason: 'profile_not_resolvable', message: profile.message };
  }
  const session: AgentSessionRecord = {
    sessionId: newSessionId(),
    agentSpecId,
    profileId: profile.profile.metadata.id,
    createdAt: new Date().toISOString(),
    messages: [],
    runExecutionIds: [],
  };
  await saveSession(session);
  return { ok: true, session };
}

export async function getSession(sessionId: string): Promise<AgentSessionRecord | null> {
  return loadSession(sessionId);
}

export { listSessionRuns, loadRun };

/* ── Autorización de herramientas ─────────────────────────────────────────── */

export type ToolAuthzDecision =
  | { authorized: true; tool: ToolSpecV1 }
  | {
      authorized: false;
      reason: 'tool_not_authorized' | 'tool_not_registered' | 'insufficient_permissions' | 'requires_approval';
    };

/**
 * Deny-by-default: la herramienta debe estar REGISTRADA en el Tool Registry y
 * DECLARADA por el AgentSpec (tools[].id). Si el ToolSpec exige permisos, el
 * AgentSpec debe otorgarlos en tools[].permissions ('*' otorga todos).
 * security.approvalRequired detiene la ejecución con estado explícito.
 */
export async function authorizeToolCall(spec: AgentSpecV1, toolName: string): Promise<ToolAuthzDecision> {
  const entry = spec.spec.tools.find((t) => t.id === toolName);
  if (!entry) {
    return { authorized: false, reason: 'tool_not_authorized' };
  }
  if ((spec.spec.security.approvalRequired ?? []).includes(toolName)) {
    return { authorized: false, reason: 'requires_approval' };
  }
  const tool = await getToolSpec(toolName);
  if (!tool) {
    return { authorized: false, reason: 'tool_not_registered' };
  }
  const required = tool.spec.permissions ?? [];
  const granted = entry.permissions ?? [];
  const satisfied = required.every((p) => granted.includes(p) || granted.includes('*'));
  if (!satisfied) {
    return { authorized: false, reason: 'insufficient_permissions' };
  }
  return { authorized: true, tool };
}

/* ── Ejecución ────────────────────────────────────────────────────────────── */

export type RunAgentResult =
  | { ok: false; reason: 'session_not_found' | 'input_too_large' }
  | { ok: true; record: AgentRunRecord };

const MAX_TOOLDEFS = 64;
const MAX_TOOLCALLS_PER_ITER = 8;

/** Contexto precalculado de un turno (todo lo resuelto en la fase de preparación). */
interface RunContext {
  spec: AgentSpecV1;
  profile: ModelProfileV1;
  systemContent: string;
  wantsTools: boolean;
  toolsSupported: boolean;
  toolDefs: RuntimeChatTool[];
  maxIterations: number;
  maxContextChars: number;
  deadline: number;
}

type PreRun =
  | { ok: false; reason: 'session_not_found' | 'input_too_large' }
  // ctx null ⇒ el registro quedó YA FINALIZADO (spec inválido / perfil no resoluble).
  | { ok: true; record: AgentRunRecord; session: AgentSessionRecord; ctx: RunContext | null };

/**
 * Fase de preparación: valida entrada, crea el registro 'running' persistido
 * (con la sesión avanzada), resuelve spec + perfil y anuncia las tools. Si
 * algo falla en esta fase, el registro queda terminado con el motivo y ctx
 * null — el resultado (síncrono o asíncrono) es un run failed real, nunca
 * simulado.
 */
async function prepareRun(sessionId: string, rawInput: string): Promise<PreRun> {
  const session = await loadSession(sessionId);
  if (!session) {
    return { ok: false, reason: 'session_not_found' };
  }
  if (rawInput.length > envLimit('RUNTIME_MAX_INPUT_CHARS', 4000)) {
    return { ok: false, reason: 'input_too_large' };
  }
  const maxContextChars = envLimit('RUNTIME_MAX_CONTEXT_CHARS', 24000);
  const maxIterations = Math.min(envLimit('RUNTIME_MAX_ITERATIONS', 16), 64);
  const deadline = Date.now() + envLimit('RUNTIME_TIMEOUT_MS', 180000);

  const loaded = await loadAgentSpec(session.agentSpecId);
  const specOk = loaded.ok;
  const spec = specOk ? loaded.spec : null;

  const preview: AgentRunRecord = {
    executionId: newExecutionId(),
    sessionId,
    agentSpecId: session.agentSpecId,
    agentSpec: spec ?? { unavailable: loaded.ok ? null : loaded.reason },
    profileUsed: {
      id: session.profileId,
      version: '',
      provider: '',
      model: '',
      endpoint: '',
    },
    input: rawInput,
    status: 'running',
    result: { toolExecutions: [], iterations: 0 },
    errors: [],
    startedAt: new Date().toISOString(),
  };
  await saveRun(preview);
  session.runExecutionIds.push(preview.executionId);
  session.messages.push({ role: 'user', content: rawInput, at: preview.startedAt });
  await saveSession(session);

  if (!specOk || !spec) {
    return { ok: true, record: await finalizeRun(preview, 'failed', ['agent_spec_invalid']), session, ctx: null };
  }

  const profile = await resolveModelRef(spec.spec.model.profile);
  if (!profile.ok) {
    return {
      ok: true,
      record: await finalizeRun(preview, 'failed', [`profile_not_resolvable: ${profile.message}`]),
      session,
      ctx: null,
    };
  }
  const descriptor = describeProfile(profile.profile);
  preview.profileUsed = {
    id: profile.profile.metadata.id,
    version: profile.profile.metadata.version,
    provider: descriptor.provider,
    model: descriptor.model,
    endpoint: descriptor.endpoint,
  };

  /* Tools: se anuncian SOLO las declaradas y registradas. Si el modelo carece
   * de tool-calling, el estado será 'completed_without_tools' (nunca simulado). */
  const wantsTools = spec.spec.tools.length > 0;
  const toolDefs: RuntimeChatTool[] = [];
  let toolsSupported = false;
  if (wantsTools) {
    const caps = (await modelCapabilities(profile.profile)) ?? [];
    toolsSupported = caps.includes('tools') || (profile.profile.spec.capabilities ?? []).includes('tools');
    for (const declared of spec.spec.tools.slice(0, MAX_TOOLDEFS)) {
      const tool = await getToolSpec(declared.id);
      if (tool) {
        toolDefs.push({
          type: 'function',
          function: {
            name: tool.metadata.id,
            description: tool.spec.description,
            parameters: {
              type: 'object',
              properties: Object.fromEntries(
                Object.entries(tool.spec.inputSchema.properties).map(([k, v]) => [
                  k,
                  { type: v.type, description: v.description },
                ]),
              ),
              required: tool.spec.inputSchema.required,
            },
          },
        });
      }
    }
  }
  // Persistir profileUsed pronto: la consola hace polling del run 'running'
  // y así ve modelo/endpoint resueltos sin esperar el resultado final.
  await saveRun(preview);

  const systemContent = [
    `[Rol] ${spec.spec.identity.role}`,
    `[Objetivo] ${spec.spec.identity.objective}`,
    `[Instrucciones]`,
    spec.spec.instructions.system,
  ].join('\n');

  // Fase 5 — memoria semántica: si el spec la activa (memory.enabled +
  // strategy 'semantic') y el agente tiene fuentes autorizadas (bindings),
  // se recupera contexto del KNOWLEDGE BASE para ESTE turno y se inyecta en
  // el system prompt con referencias [n] trazables (result.retrievals).
  // DEGRADACIÓN HONESTA: un fallo del subsistema NO bloquea el turno — se
  // anota en errors y el agente responde sin conocimiento inyectado.
  let retrievals: RetrievalHit[] = [];
  if (spec.spec.memory?.enabled && spec.spec.memory.strategy === 'semantic') {
    try {
      const r = await retrieveForAgent(session.agentSpecId, rawInput);
      if (r.ok) {
        retrievals = r.hits;
      } else if (r.reason === 'embedding_failed') {
        preview.errors.push(`knowledge_retrieval_failed: ${r.message ?? 'fallo del servicio de embeddings'}`);
      } // no_authorized_sources: configuración (sin bindings) — silencioso.
    } catch (err) {
      preview.errors.push(`knowledge_retrieval_failed: ${(err as Error).message}`);
    }
  }
  if (retrievals.length > 0) {
    preview.result.retrievals = retrievals.map((h) => ({
      sourceId: h.sourceId,
      title: h.title,
      ref: h.ref,
      chunkIdx: h.chunkIdx,
      score: h.score,
    }));
    await saveRun(preview); // visible para el polling del Control Center
  }

  const systemContentWithKnowledge =
    retrievals.length > 0
      ? `${systemContent}\n\n[Contexto de conocimiento recuperado — úsalo para responder y cita las referencias [n]]\n${retrievals
          .map((h, i) => `[${i + 1}] (${h.title}${h.ref ? ' · ' + h.ref : ''}) ${h.text}`)
          .join('\n---\n')}`
      : systemContent;

  return {
    ok: true,
    record: preview,
    session,
    ctx: {
      spec,
      profile: profile.profile,
      systemContent: systemContentWithKnowledge,
      wantsTools,
      toolsSupported,
      toolDefs,
      maxIterations,
      maxContextChars,
      deadline,
    },
  };
}

/** Bucle del runtime — motor único, desnudo ante síncrono/asíncrono. */
async function executeRun(
  preview: AgentRunRecord,
  session: AgentSessionRecord,
  ctx: RunContext,
): Promise<{ ok: true; record: AgentRunRecord }> {
  const { spec, profile, maxContextChars, maxIterations, deadline } = ctx;

  let status: RunStatus = 'failed';
  let finalText: string | undefined;
  let iterations = 0;
  let timedOut = false;

  for (let i = 1; i <= maxIterations; i += 1) {
    if (Date.now() > deadline) {
      timedOut = true;
      break;
    }
    const conversation: RuntimeChatMessage[] = [
      { role: 'system', content: ctx.systemContent },
      ...session.messages
        .filter((m) => m.role !== 'system')
        .map((m) =>
          m.role === 'tool'
            ? { role: 'tool' as const, content: m.content, toolName: m.toolName }
            : { role: m.role as 'user' | 'assistant', content: m.content },
        ),
    ];
    // Límite de tamaño de contexto: recorta MENSAJES históricos que no quepan.
    if (conversation.reduce((n, m) => n + m.content.length, 0) > maxContextChars) {
      while (conversation.length > 2 && conversation.reduce((n, m) => n + m.content.length, 0) > maxContextChars) {
        conversation.splice(1, 1);
      }
      if (conversation.reduce((n, m) => n + m.content.length, 0) > maxContextChars) {
        return { ok: true, record: await finalizeRun(preview, 'failed', ['context_too_large']) };
      }
    }
    iterations = i;
    preview.result.iterations = i;

    const remainingMs = deadline - Date.now();
    if (remainingMs <= 2000) {
      timedOut = true;
      break;
    }
    const chat = await providerChat(profile, {
      messages: conversation,
      tools: ctx.wantsTools && ctx.toolsSupported ? ctx.toolDefs : undefined,
      numPredict: 256,
      temperature: 0,
      timeoutMs: Math.min(remainingMs, 120000),
    });
    if (!chat.ok) {
      return { ok: true, record: await finalizeRun(preview, 'failed', [`provider_error: ${chat.error}`]) };
    }
    if (chat.toolCalls.length > 0) {
      const toolMessages: RuntimeChatMessage[] = [];
      let stopForApproval = false;
      for (const call of chat.toolCalls.slice(0, MAX_TOOLCALLS_PER_ITER)) {
        const decision = await authorizeToolCall(spec, call.name);
        if (!decision.authorized) {
          preview.result.toolExecutions.push({ name: call.name, ok: false, error: decision.reason });
          toolMessages.push({
            role: 'tool',
            toolName: call.name,
            content: JSON.stringify({ error: decision.reason }),
          });
          if (decision.reason === 'requires_approval') {
            stopForApproval = true;
          }
          continue;
        }
        const executed = validateToolArguments(decision.tool, call.arguments);
        if (executed.ok) {
          preview.result.toolExecutions.push({ name: call.name, ok: true, result: executed.result });
          toolMessages.push({
            role: 'tool',
            toolName: call.name,
            content: JSON.stringify({ ok: true, result: executed.result }),
          });
        } else {
          preview.result.toolExecutions.push({ name: call.name, ok: false, error: executed.error, result: executed.detail });
          toolMessages.push({
            role: 'tool',
            toolName: call.name,
            content: JSON.stringify({ ok: false, error: executed.error }),
          });
        }
      }
      session.messages.push(
        ...toolMessages.map(
          (m): SessionMessage => ({ role: 'tool', content: m.content, toolName: m.toolName, at: new Date().toISOString() }),
        ),
      );
      await saveSession(session);
      if (stopForApproval) {
        return {
          ok: true,
          record: await finalizeRun(preview, 'requires_approval', [
            'herramienta en security.approvalRequired del spec: se detiene la ejecución',
          ]),
        };
      }
      continue;
    }
    // Respuesta final del modelo (sin llamadas de herramienta).
    finalText = chat.content;
    status = ctx.wantsTools && !ctx.toolsSupported ? 'completed_without_tools' : 'completed';
    break;
  }

  if (timedOut) {
    status = 'timeout';
    preview.errors.push('timeout: se superó RUNTIME_TIMEOUT_MS');
  } else if (finalText === undefined) {
    // El bucle terminó sin respuesta final del modelo ni salida temprana:
    // es el límite de iteraciones (y cualquier caso no capturado queda registrado).
    status = 'max_iterations_reached';
    if (preview.errors.length === 0) {
      preview.errors.push('sin respuesta final del modelo dentro del límite de iteraciones');
    }
  }

  if (finalText !== undefined) {
    session.messages.push({ role: 'assistant', content: finalText, at: new Date().toISOString() });
    preview.result.text = finalText;
  }
  await saveSession(session);
  return { ok: true, record: await finalizeRunRecord(preview, status) };
}

/* ── Superficie síncrona (API protegida Fase 3, contrato intacto) ─────────── */

export async function runAgent(sessionId: string, rawInput: string): Promise<RunAgentResult> {
  const pre = await prepareRun(sessionId, rawInput);
  if (!pre.ok) {
    return pre;
  }
  if (!pre.ctx) {
    return { ok: true, record: pre.record };
  }
  return executeRun(pre.record, pre.session, pre.ctx);
}

/* ── Superficie asíncrona (Control Center: ejecuciones largas + polling) ──── */

export type StartAgentRunResult =
  | { ok: false; reason: 'session_not_found' | 'input_too_large' }
  | { ok: true; executionId: string; status: RunStatus };

/**
 * Despacha el turno en background y devuelve el executionId al momento.
 * El cliente hace polling del registro hasta estado terminal; si el proceso
 * muriera a mitad, el sweep de arranque marca el run como failed
 * (runtime_restarted) — nunca se simula un resultado.
 */
export async function startAgentRun(sessionId: string, rawInput: string): Promise<StartAgentRunResult> {
  const pre = await prepareRun(sessionId, rawInput);
  if (!pre.ok) {
    return pre;
  }
  if (!pre.ctx) {
    return { ok: true, executionId: pre.record.executionId, status: pre.record.status };
  }
  void executeRun(pre.record, pre.session, pre.ctx).catch((err) => {
    console.error('[UIEP] async_run_failed', err);
    // Persiste el fallo impensado (la promesa huérfana no debe perder el run).
    void finalizeRun(pre.record, 'failed', [`run_error: ${(err as Error).message || 'error desconocido'}`]).catch(
      () => undefined,
    );
  });
  return { ok: true, executionId: pre.record.executionId, status: pre.record.status };
}

/* ── Finalización ─────────────────────────────────────────────────────────── */

function finalizeRun(record: AgentRunRecord, status: RunStatus, errors: string[]): Promise<AgentRunRecord> {
  record.status = status;
  record.errors.push(...errors);
  return finalizeRunRecord(record, status);
}

async function finalizeRunRecord(
  record: AgentRunRecord,
  status: RunStatus,
): Promise<AgentRunRecord> {
  record.status = status;
  record.finishedAt = new Date().toISOString();
  record.result.durationMs = Date.now() - Date.parse(record.startedAt);
  await saveRun(record);
  return record;
}
