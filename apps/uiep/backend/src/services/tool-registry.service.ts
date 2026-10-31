import { API_VERSION, type ToolSpecV1 } from '@uiep/agent-spec';
import { getLatestSpec, listSpecs, saveSpec, type SpecSummary } from './spec-registry.service';
import { validateToolInput } from '@uiep/agent-spec';

/**
 * Tool Registry — registro de herramientas (Fase 3).
 *
 * Las herramientas son documentos ToolSpec v1 en el MISMO almacén que los specs
 * (persistencia reutilizada). La ejecución pasa SIEMPRE por adaptadores
 * declarativos y cerrados de este módulo: sin código arbitrario, sin shell,
 * sin acceso libre al filesystem. Entradas validadas contra el subconjunto de
 * JSON Schema del contrato antes de invocar el adaptador.
 */

export type ToolExecutionResult =
  | { ok: true; result: Record<string, unknown> }
  | { ok: false; error: string; detail?: string };

export async function listTools(): Promise<SpecSummary[]> {
  return listSpecs({ kind: 'Tool' });
}

/** ToolSpecs COMPLETOS (Fase 4 — Control Center): la gestión de autorizaciones
 *  necesita permisos, adapter y esquema, no el resumen. Documentos ya validados
 *  al registrarse; aquí se filtra por kind con defensa adicional. */
export async function listToolSpecs(): Promise<ToolSpecV1[]> {
  const summaries = await listSpecs({ kind: 'Tool' });
  const tools: ToolSpecV1[] = [];
  for (const summary of summaries) {
    const envelope = await getLatestSpec(summary.id);
    if (envelope && (envelope as { kind?: string }).kind === 'Tool') {
      tools.push(envelope as unknown as ToolSpecV1);
    }
  }
  return tools;
}

export async function getToolSpec(id: string): Promise<ToolSpecV1 | null> {
  const envelope = await getLatestSpec(id);
  if (!envelope || (envelope as { kind?: string }).kind !== 'Tool') {
    return null;
  }
  return envelope as unknown as ToolSpecV1;
}

/** Adaptadores cerrados: funciones puras, sin efectos de sistema ni FS. */
const ADAPTERS: Record<string, (input: Record<string, unknown>) => ToolExecutionResult> = {
  clock: () => {
    const now = new Date();
    return { ok: true, result: { iso: now.toISOString(), epochMs: now.getTime(), timezone: 'UTC' } };
  },
  'runtime-info': () => ({
    ok: true,
    result: {
      node: process.version,
      uptimeSeconds: Math.round(process.uptime()),
      rssMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
    },
  }),
};

/**
 * Adaptadores con CONTEXTO y efectos controlados (Fase 5.1): la escritura en
 * memoria persistente es una herramienta CERRADA con políticas deterministas
 * (memory-store.writeMemory) — el modelo nunca escribe libremente.
 */
export interface ToolContext {
  agentSpecId: string
  sessionId: string
  executionId: string
  input: string
  memoryEnabled: boolean
}

const ASYNC_ADAPTERS: Record<string, (input: Record<string, unknown>, ctx: ToolContext, tool: ToolSpecV1) => Promise<ToolExecutionResult>> = {
  'memory-write': (parsed, ctx) =>
    (async () => {
      const { writeMemory } = await import('./memory-store.service');
      const result = await writeMemory({
        agentSpecId: ctx.agentSpecId,
        sessionId: ctx.sessionId,
        kind: parsed.kind === 'session' ? 'session' : 'agent',
        content: String(parsed.content ?? ''),
        origin: { executionId: ctx.executionId, input: ctx.input },
        memoryEnabled: ctx.memoryEnabled,
      });
      if (!result.ok) {
        return { ok: false, error: `memory_write_${result.reason}`, detail: result.message };
      }
      return {
        ok: true,
        result: {
          memoryId: result.memory.memoryId,
          kind: result.memory.kind,
          deduplicated: result.deduplicated,
          expiresAt: result.memory.expiresAt,
        },
      };
    })(),
  // Fase 7 — conector HTTP/API: URL/método/integración vienen de la CONFIG de
  // la ToolSpec (operador); los argumentos del agente van al BODY (el dato
  // del agente nunca construye el destino). Auth por referencia a env.
  'http-call': (parsed, ctx, tool) =>
    (async () => {
      const { getIntegration, callIntegration } = await import('./integration.service');
      const { idempotencyKey, lookupIdempotent, recordIdempotent } = await import('./reliability.service');
      const { audit, recordMetric } = await import('./observability.service');
      const config = tool.spec.execution.config ?? {};
      const integrationId = config.integrationId ?? '';
      const spec = integrationId ? await getIntegration(integrationId) : null;
      if (!spec) {
        return { ok: false, error: 'integration_not_registered', detail: integrationId || 'falta integrationId en la config de la tool' };
      }
      const method = (config.method ?? 'GET').toUpperCase();
      if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        return { ok: false, error: 'invalid_method', detail: method };
      }
      const body = method === 'GET' ? undefined : { input: ctx.input, ...parsed };
      // Fase 8 — IDEMPOTENCIA: clave determinista (integración+método+path+
      // hash del body). Un resultado COMPLETADO se REPRODUCE sin repetir el
      // efecto externo (el escenario de la reanudación de workflows); un
      // resultado INCERTO (fallo de red tras enviar) se re-ejecuta con aviso
      // explícito — nunca se simula un éxito.
      const key = idempotencyKey({ integrationId, method, path: config.path, body });
      const prior = await lookupIdempotent(key);
      if (prior?.outcome === 'completed') {
        audit({ actor: { kind: 'agent', id: ctx.agentSpecId }, action: 'integration.call.replayed', correlation: { integrationId, agentRunId: ctx.executionId, toolName: tool.metadata.id }, detail: { key } });
        return { ok: true, result: { status: prior.result?.status ?? 200, body: (prior.result?.body ?? '').slice(0, 4000), durationMs: 0, idempotentReplay: true } };
      }
      const r = await callIntegration(spec, { method, path: config.path, body });
      recordMetric('tool', tool.metadata.id, { ok: r.ok, latencyMs: r.durationMs, error: r.error });
      audit({ actor: { kind: 'agent', id: ctx.agentSpecId }, action: 'integration.call', correlation: { integrationId, agentRunId: ctx.executionId, toolName: tool.metadata.id }, detail: { method, path: config.path ?? '', status: r.status, ok: r.ok } });
      if (!r.ok) {
        // Fallo de RED (sin status) tras haber enviado → resultado INCIERTO:
        // el efecto pudo llegar; NO se cachea como completado.
        if (r.error?.startsWith('connector_error') && r.status === undefined) {
          await recordIdempotent(key, 'uncertain');
        }
        return { ok: false, error: r.error ?? 'connector_failed', detail: `status=${r.status ?? '-'} ${r.durationMs}ms` };
      }
      await recordIdempotent(key, 'completed', { status: r.status, body: r.body });
      return { ok: true, result: { status: r.status, body: (r.body ?? '').slice(0, 4000), durationMs: r.durationMs } };
    })(),
  // Fase 7 — cliente MCP: descubre/ejecuta herramientas del servidor MCP de
  // la integración (protocolo de interoperabilidad — el núcleo sigue siendo
  // el contrato interno de tools). integrationId + mcpTool: config del
  // operador; los argumentos del agente van a MCP arguments.
  'mcp-call': (parsed, ctx, tool) =>
    (async () => {
      const { getIntegration } = await import('./integration.service');
      const { mcpCallTool } = await import('./mcp-client.service');
      const config = tool.spec.execution.config ?? {};
      const integrationId = config.integrationId ?? '';
      const spec = integrationId ? await getIntegration(integrationId) : null;
      if (!spec || spec.spec.type !== 'mcp-server') {
        return { ok: false, error: 'integration_not_mcp', detail: integrationId || 'falta integrationId en la config' };
      }
      const toolName = config.mcpTool ?? '';
      if (!toolName) {
        return { ok: false, error: 'missing_mcp_tool', detail: 'falta mcpTool en la config de la tool' };
      }
      const r = await mcpCallTool(spec, toolName, Object.keys(parsed).length > 0 ? parsed : { input: ctx.input });
      if (!r.ok) {
        return { ok: false, error: r.error ?? 'mcp_call_failed', detail: r.content?.slice(0, 500) };
      }
      return { ok: true, result: { server: spec.metadata.id, tool: toolName, content: (r.content ?? '').slice(0, 4000) } };
    })(),
};

/** Validación de argumentos + ejecución por adaptador. Nunca lanza. */
export function validateToolArguments(tool: ToolSpecV1, input: unknown): ToolExecutionResult {
  const parsed = validateToolInput(tool.spec.inputSchema, input);
  if (!parsed.ok) {
    return { ok: false, error: 'invalid_input', detail: JSON.stringify(parsed.errors) };
  }
  const adapter = ADAPTERS[tool.spec.execution.adapter];
  if (!adapter) {
    return { ok: false, error: 'unsupported_adapter', detail: tool.spec.execution.adapter };
  }
  try {
    return adapter(parsed.value);
  } catch (err) {
    return { ok: false, error: 'adapter_error', detail: (err as Error).message };
  }
}

/** Ejecución con contexto (Fase 5.1): async adapters para efectos
 *  controlados (memoria); el resto usa la vía pura sincrónica. */
export async function executeTool(tool: ToolSpecV1, input: unknown, ctx: ToolContext): Promise<ToolExecutionResult> {
  const parsed = validateToolInput(tool.spec.inputSchema, input);
  if (!parsed.ok) {
    return { ok: false, error: 'invalid_input', detail: JSON.stringify(parsed.errors) };
  }
  const asyncAdapter = ASYNC_ADAPTERS[tool.spec.execution.adapter];
  if (asyncAdapter) {
    try {
      return await asyncAdapter(parsed.value, ctx, tool);
    } catch (err) {
      return { ok: false, error: 'adapter_error', detail: (err as Error).message };
    }
  }
  return validateToolArguments(tool, input);
}

/* ── Seeds idempotentes de herramientas base ──────────────────────────────── */

export const CLOCK_TOOL_SEED: ToolSpecV1 = {
  apiVersion: API_VERSION,
  kind: 'Tool',
  metadata: {
    id: 'clock',
    name: 'Reloj UTC',
    version: '1.0.0',
    description: 'Hora y fecha actual en UTC (adaptador puro, sin efectos).',
    tags: ['time', 'util'],
    createdAt: '2026-10-31T00:00:00.000Z',
  },
  spec: {
    description: 'Devuelve la fecha y hora actual en UTC: iso, epochMs y timezone. Sin efectos colaterales.',
    inputSchema: { type: 'object', properties: {}, required: [] },
    permissions: ['clock:read'],
    execution: { adapter: 'clock' },
  },
};

export const RUNTIME_INFO_TOOL_SEED: ToolSpecV1 = {
  apiVersion: API_VERSION,
  kind: 'Tool',
  metadata: {
    id: 'runtime-info',
    name: 'Información del runtime',
    version: '1.0.0',
    description: 'Versión de Node, uptime y memoria del backend (solo lectura).',
    tags: ['system', 'util'],
    createdAt: '2026-10-31T00:00:00.000Z',
  },
  spec: {
    description: 'Devolve versión de Node, uptime en segundos y RSS en MB del proceso del backend. Solo lectura.',
    inputSchema: { type: 'object', properties: {}, required: [] },
    permissions: ['system:read'],
    execution: { adapter: 'runtime-info' },
  },
};

/** Fase 5.1 — memoria persistente como herramienta CERRADA: el modelo puede
 *  PROPONER recuerdos; la escritura real pasa por políticas deterministas
 *  (dedup por hash, TTL, cuota, embedding) y exige permiso 'memory:write' +
 *  spec.memory.enabled. Nunca escritura libre. */
export const MEMORY_WRITE_TOOL_SEED: ToolSpecV1 = {
  apiVersion: API_VERSION,
  kind: 'Tool',
  metadata: {
    id: 'memory-write',
    name: 'Escritura de memoria',
    version: '1.0.0',
    description: 'Guarda un recuerdo (dato relevante a conservar) con políticas deterministas: deduplicación, TTL y cuota. Requiere que el agente tenga memoria habilitada.',
    tags: ['memory', 'util'],
    createdAt: '2026-10-31T00:00:00.000Z',
  },
  spec: {
    description:
      'Almacena un recuerdo para futuros turnos. kind "agent" = persistente para este agente (recuperación semántica); kind "session" = nota ligada a esta conversación. La escritura valida contenido (3-1000), deduplica por hash y aplica TTL/cuota.',
    inputSchema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'El recuerdo, en una frase autocontenida (3-1000 caracteres)' },
        kind: { type: 'string', description: '"agent" (persistente) o "session" (esta conversación)' },
      },
      required: ['content'],
    },
    permissions: ['memory:write'],
    execution: { adapter: 'memory-write' },
  },
};

/** Siembra idempotente al arranque: registra las herramientas base si no existen. */
export async function seedDefaultToolSpecs(): Promise<'seeded' | 'failed'> {
  try {
    for (const tool of [CLOCK_TOOL_SEED, RUNTIME_INFO_TOOL_SEED, MEMORY_WRITE_TOOL_SEED]) {
      const existing = await getLatestSpec(tool.metadata.id);
      if (!existing) {
        await saveSpec(tool);
        console.log(`[UIEP] Tool Registry: herramienta '${tool.metadata.id}' sembrada`);
      }
    }
    return 'seeded';
  } catch (err) {
    console.error('[UIEP] seed_tool_specs_failed', err);
    return 'failed';
  }
}
