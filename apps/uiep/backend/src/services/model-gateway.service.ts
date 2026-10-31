import { API_VERSION, type ModelProfileV1 } from '@uiep/agent-spec';
import { getLatestSpec, saveSpec } from './spec-registry.service';

/**
 * model-gateway — Fase 2 (P0).
 *
 * Resuelve las referencias de modelo de AgentSpec (spec.model.profile) a
 * ModelProfiles registrados en spec-registry, comprueba la disponibilidad REAL
 * del proveedor y ejecuta completaciones de prueba acotadas.
 *
 * Principio: el spec describe QUÉ modelo usar (por referencia); el gateway decide
 * CÓMO contactar al proveedor concreto (adaptadores). Fase 2 implementa el
 * adaptador de Ollama con fetch nativo (cero dependencias nuevas). Los secretos
 * y las URLs reales nunca viven en los perfiles: los perfiles referencian la
 * variable de entorno que los despliegues concretan.
 */

/** Proveedores con adaptador implementado en esta fase. */
export const SUPPORTED_PROFILE_PROVIDERS = ['ollama'] as const;

/** Perfil inicial del gateway, verificado contra el Ollama real del VPS vía
 *  /api/tags (qwen3.5:4b, ctx 262144). El endpoint vive en OLLAMA_BASE_URL del
 *  despliegue: nada del proveedor va incrustado en el perfil. */
export const DEFAULT_MODEL_PROFILE_SEED: ModelProfileV1 = {
  apiVersion: API_VERSION,
  kind: 'ModelProfile',
  metadata: {
    id: 'default',
    name: 'Chat por defecto (Ollama VPS)',
    version: '1.0.0',
    description: 'Perfil inicial del Model Gateway: Ollama autogestionado en el VPS, modelo qwen3.5:4b. El endpoint se resuelve desde OLLAMA_BASE_URL.',
    tags: ['ollama', 'chat', 'default'],
    createdAt: '2026-10-31T00:00:00.000Z',
  },
  spec: {
    provider: 'ollama',
    model: 'qwen3.5:4b',
    endpointEnv: 'OLLAMA_BASE_URL',
    capabilities: ['chat', 'completion'],
    contextWindow: 262144,
    costTier: 'free',
  },
};

/** Siembra idempotente al arranque: registra el perfil 'default' si ese id no existe. */
export async function seedDefaultModelProfile(): Promise<'seeded' | 'already_present' | 'failed'> {
  try {
    const existing = await getLatestSpec('default');
    if (existing) {
      return 'already_present';
    }
    await saveSpec(DEFAULT_MODEL_PROFILE_SEED);
    console.log('[UIEP] Model Gateway: perfil \'default\' sembrado (ollama qwen3.5:4b)');
    return 'seeded';
  } catch (err) {
    console.error('[UIEP] seed_default_profile_failed', err);
    return 'failed';
  }
}

/* ────────────────────────────────────────────────────────────────────────────
 * Fase 3 — primitivas de runtime: capacidades del modelo y chat con tools.
 * El runtime NO habla directamente con el proveedor: usa estas abstracciones
 * agnósticas del proveedor (el adaptador concreto sigue en este módulo).
 * ──────────────────────────────────────────────────────────────────────────── */

export interface RuntimeChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  /** Solo role 'tool': herramienta que produjo el resultado. */
  toolName?: string;
  /** Solo 'assistant' (historial): llamadas de herramienta ya ejecutadas. */
  toolCalls?: Array<{ name: string; arguments: unknown }>;
}

export interface RuntimeChatTool {
  type: 'function';
  function: {
    name: string;
    description: string;
    /** Subconjunto JSON Schema del contrato ToolSpec. */
    parameters: Record<string, unknown>;
  };
}

export type ProviderChatResult =
  | { ok: true; content: string; toolCalls: Array<{ name: string; arguments: unknown }> }
  | { ok: false; error: string };

function normalizeToolArgs(args: unknown): unknown {
  if (typeof args === 'string') {
    try {
      return JSON.parse(args);
    } catch {
      return {};
    }
  }
  return args ?? {};
}

/** Chat agnóstico (Ollama hoy): mensajes, tools opcionales (llamada de
 *  herramientas estándar), think:false para modelos reasoning, límites
 *  temporales. Devuelve contenido Y/ declaraciones de llamada a herramientas. */
export async function providerChat(
  profile: ModelProfileV1,
  opts: {
    messages: RuntimeChatMessage[];
    tools?: RuntimeChatTool[];
    numPredict?: number;
    temperature?: number;
    timeoutMs?: number;
  },
): Promise<ProviderChatResult> {
  try {
    const body: Record<string, unknown> = {
      model: profile.spec.model,
      messages: opts.messages.map((m) => {
        if (m.role === 'tool') {
          return { role: 'tool', content: m.content, name: m.toolName };
        }
        if (m.role === 'assistant' && m.toolCalls) {
          return {
            role: 'assistant',
            content: m.content,
            tool_calls: m.toolCalls.map((c) => ({ function: { name: c.name, arguments: c.arguments } })),
          };
        }
        return { role: m.role, content: m.content };
      }),
      stream: false,
      think: false,
      options: { num_predict: opts.numPredict ?? 256, temperature: opts.temperature ?? 0 },
    };
    if (opts.tools && opts.tools.length > 0) {
      body.tools = opts.tools;
    }
    const res = await fetch(`${getProviderBase(profile)}/api/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(opts.timeoutMs ?? 120000),
    });
    if (!res.ok) {
      return { ok: false, error: `provider_status_${res.status}` };
    }
    const parsed = (await res.json()) as {
      message?: { content?: string; tool_calls?: Array<{ function?: { name?: string; arguments?: unknown } }> };
    };
    const toolCalls = (parsed.message?.tool_calls ?? [])
      .map((c) => ({
        name: String(c.function?.name ?? ''),
        arguments: normalizeToolArgs(c.function?.arguments),
      }))
      .filter((c) => c.name.length > 0);
    return { ok: true, content: (parsed.message?.content ?? '').trim(), toolCalls };
  } catch (err) {
    const code = (err as { cause?: { code?: string } }).cause?.code;
    return { ok: false, error: code || (err as Error).message || 'provider_error' };
  }
}

/** Capacidades del modelo según el proveedor (p.ej. ['completion','tools']);
 *  null cuando el proveedor no las expone o no está accesible. */
export async function modelCapabilities(profile: ModelProfileV1): Promise<string[] | null> {
  try {
    const res = await fetch(`${getProviderBase(profile)}/api/tags`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) {
      return null;
    }
    const tags = (await res.json()) as { models?: Array<{ name?: string; capabilities?: string[] }> };
    const entry = (tags.models ?? []).find((m) => m.name === profile.spec.model);
    return entry?.capabilities ?? null;
  } catch {
    return null;
  }
}

export type ResolveProfileResult =
  | { ok: true; profile: ModelProfileV1 }
  | { ok: false; reason: 'not_registered' | 'unsupported_provider'; message: string };

/** Resuelve una referencia de modelo (AgentSpec.spec.model.profile) al ModelProfile registrado más reciente. */
export async function resolveModelRef(profileRef: string): Promise<ResolveProfileResult> {
  const envelope = await getLatestSpec(profileRef);
  if (!envelope || (envelope as { kind?: string }).kind !== 'ModelProfile') {
    return {
      ok: false,
      reason: 'not_registered',
      message: `no hay un ModelProfile registrado con id '${profileRef}'`,
    };
  }
  const profile = envelope as unknown as ModelProfileV1;
  if (!(SUPPORTED_PROFILE_PROVIDERS as readonly string[]).includes(profile.spec.provider)) {
    return {
      ok: false,
      reason: 'unsupported_provider',
      message: `el perfil '${profileRef}' declara provider '${profile.spec.provider}', sin adaptador todavía (soportados: ${SUPPORTED_PROFILE_PROVIDERS.join(', ')})`,
    };
  }
  return { ok: true, profile };
}

/** URL base del proveedor para este despliegue, resuelta desde la variable de entorno referenciada. */
export function getProviderBase(profile: ModelProfileV1): string {
  const envName = profile.spec.endpointEnv || 'OLLAMA_BASE_URL';
  const value = process.env[envName];
  if (!value) {
    throw new Error(`endpoint_env_missing:${envName}`);
  }
  return value.replace(/\/+$/, '');
}

export interface ProviderCallDescriptor {
  provider: string;
  model: string;
  /** Referencia al endpoint (nombre de la variable), nunca el valor resuelto. */
  endpoint: string;
}

export function describeProfile(profile: ModelProfileV1): ProviderCallDescriptor {
  return {
    provider: profile.spec.provider,
    model: profile.spec.model,
    endpoint: `env:${profile.spec.endpointEnv || 'OLLAMA_BASE_URL'}`,
  };
}

export interface ProfileHealthResult extends ProviderCallDescriptor {
  ok: boolean;
  detail: string;
}

/** Comprobación REAL de disponibilidad: GET /api/tags contra el proveedor y
 *  verificación de que el modelo del perfil está instalado. */
export async function checkProfileHealth(profile: ModelProfileV1): Promise<ProfileHealthResult> {
  const descriptor = { ...describeProfile(profile) };
  try {
    const res = await fetch(`${getProviderBase(profile)}/api/tags`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) {
      return { ...descriptor, ok: false, detail: `el proveedor respondió ${res.status}` };
    }
    const tags = (await res.json()) as { models?: Array<{ name: string }> };
    const models = (tags.models ?? []).map((m) => m.name);
    const present = models.includes(profile.spec.model);
    return {
      ...descriptor,
      ok: present,
      detail: present
        ? `modelo '${profile.spec.model}' disponible (${models.length} instalados)`
        : `proveedor activo pero el modelo '${profile.spec.model}' no está instalado (${models.length} instalados)`,
    };
  } catch (err) {
    const code = (err as { cause?: { code?: string } }).cause?.code;
    return { ...descriptor, ok: false, detail: code || (err as Error).message || 'provider_error' };
  }
}

export interface ProfileTestResult extends ProviderCallDescriptor {
  ok: boolean;
  text?: string;
  latencyMs?: number;
  error?: string;
}

const DEFAULT_TEST_PROMPT = 'Responde exclusivamente con la palabra: OK';

/** Elimina el reasoning en línea de los modelos de pensamiento (solo afecta al
 *  texto extraído; el prompt y los límites no cambian. Sin LLM implicado). */
function stripThinking(text: string): string {
  return text
    .replace(/<think>[\s\S]*?<\/think>/g, '')
    .replace(/<think>[\s\S]*$/g, '')
    .trim();
}

/** Completación real acotada (num_predict fijo) — evidencia end-to-end de que
 *  el perfil resuelve y el proveedor genera. Nunca streaming, nunca secretos.
 *  Estrategia: /api/chat con think=false (models que razonan: qwen3.5, r1);
 *  fallback a /api/generate sin 'think' para compatibilidad con ollama antiguo. */
export async function profileTestCompletion(
  profile: ModelProfileV1,
  prompt: string = DEFAULT_TEST_PROMPT,
): Promise<ProfileTestResult> {
  const descriptor = { ...describeProfile(profile) };
  try {
    const t0 = Date.now();
    const options = { num_predict: 8, temperature: 0 };
    const chat = await fetch(`${getProviderBase(profile)}/api/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        model: profile.spec.model,
        messages: [{ role: 'user', content: prompt }],
        stream: false,
        think: false,
        options,
      }),
      signal: AbortSignal.timeout(30000),
    });
    if (chat.ok) {
      const body = (await chat.json()) as { message?: { content?: string } };
      return {
        ...descriptor,
        ok: true,
        text: stripThinking((body.message?.content ?? '').trim()),
        latencyMs: Date.now() - t0,
      };
    }
    // Fallback compat: versiones de ollama que rechazan 'think' (<0.9.x).
    const legacy = await fetch(`${getProviderBase(profile)}/api/generate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ model: profile.spec.model, prompt, stream: false, options }),
      signal: AbortSignal.timeout(30000),
    });
    if (!legacy.ok) {
      return { ...descriptor, ok: false, error: `provider_status_${legacy.status}`, latencyMs: Date.now() - t0 };
    }
    const legacyBody = (await legacy.json()) as { response?: string };
    return {
      ...descriptor,
      ok: true,
      text: stripThinking((legacyBody.response ?? '').trim()),
      latencyMs: Date.now() - t0,
    };
  } catch (err) {
    const code = (err as { cause?: { code?: string } }).cause?.code;
    return { ...descriptor, ok: false, error: code || (err as Error).message || 'provider_error' };
  }
}
