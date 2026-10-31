import type { ZodError } from 'zod';
import { AgentSpecV1Schema, type AgentSpecV1 } from './agent.schema';
import { ModelProfileV1Schema, type ModelProfileV1 } from './model-profile.schema';
import { ToolSpecV1Schema, type ToolSpecV1 } from './tool.schema';
import { API_VERSION } from './common.schema';

/** Versiones de esquema que este paquete sabe interpretar. Un documento con otra
 *  apiVersion se rechaza con error explícito (migraciones llegarán cuando exista
 *  una v2 real — no se construyen migraciones especulativas). */
export const SUPPORTED_SPEC_VERSIONS = [API_VERSION] as const;

export type SpecValidationResult =
  | { ok: true; spec: AgentSpecV1 }
  | { ok: false; errors: Record<string, string[]> };

export type AnySpec = AgentSpecV1 | ModelProfileV1 | ToolSpecV1;

export type AnySpecValidationResult =
  | { ok: true; kind: 'Agent'; spec: AgentSpecV1 }
  | { ok: true; kind: 'ModelProfile'; spec: ModelProfileV1 }
  | { ok: true; kind: 'Tool'; spec: ToolSpecV1 }
  | { ok: false; errors: Record<string, string[]> };

function issuesToErrors(error: ZodError): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.join('.') : '(raíz)';
    (errors[key] ??= []).push(issue.message);
  }
  return errors;
}

function resultToMessage(errors: Record<string, string[]>): string {
  return Object.entries(errors)
    .map(([field, msgs]) => `${field}: ${msgs.join('; ')}`)
    .join(' | ');
}

/** Valida un documento AgentSpec y devuelve un resultado estructurado (sin lanzar). */
export function validateAgentSpec(input: unknown): SpecValidationResult {
  const parsed = AgentSpecV1Schema.safeParse(input);
  if (parsed.success) {
    return { ok: true, spec: parsed.data };
  }
  return { ok: false, errors: issuesToErrors(parsed.error) };
}

/** Valida y devuelve el spec tipado; lanza un Error agregado si es inválido. */
export function parseAgentSpec(input: unknown): AgentSpecV1 {
  const result = validateAgentSpec(input);
  if (result.ok) {
    return result.spec;
  }
  throw new Error(`AgentSpec inválido — ${resultToMessage(result.errors)}`);
}

/** Valida un documento según su `kind` (Agent | ModelProfile) — despacho polimórfico
 *  para el registro de entidades. Los cuerpos de cada kind no se cruzan: cada
 *  esquema exige su propia estructura completa. */
export function validateSpec(input: unknown): AnySpecValidationResult {
  const kind = (input as { kind?: unknown } | null | undefined)?.kind;
  if (kind === 'Agent') {
    const parsed = AgentSpecV1Schema.safeParse(input);
    return parsed.success
      ? { ok: true, kind: 'Agent', spec: parsed.data }
      : { ok: false, errors: issuesToErrors(parsed.error) };
  }
  if (kind === 'ModelProfile') {
    const parsed = ModelProfileV1Schema.safeParse(input);
    return parsed.success
      ? { ok: true, kind: 'ModelProfile', spec: parsed.data }
      : { ok: false, errors: issuesToErrors(parsed.error) };
  }
  if (kind === 'Tool') {
    const parsed = ToolSpecV1Schema.safeParse(input);
    return parsed.success
      ? { ok: true, kind: 'Tool', spec: parsed.data }
      : { ok: false, errors: issuesToErrors(parsed.error) };
  }
  return {
    ok: false,
    errors: { kind: [`kind desconocido: ${String(kind)} (esperados: Agent, ModelProfile, Tool)`] },
  };
}

/** Valida y devuelve cualquier spec tipado según su kind; lanza un Error agregado si es inválido. */
export function parseSpec(input: unknown): AnySpec {
  const result = validateSpec(input);
  if (result.ok) {
    return result.spec;
  }
  throw new Error(`Spec inválido — ${resultToMessage(result.errors)}`);
}
