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

/** Siembra idempotente al arranque: registra las herramientas base si no existen. */
export async function seedDefaultToolSpecs(): Promise<'seeded' | 'failed'> {
  try {
    for (const tool of [CLOCK_TOOL_SEED, RUNTIME_INFO_TOOL_SEED]) {
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
