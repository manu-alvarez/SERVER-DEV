import { AgentSpecV1Schema, type AgentSpecV1 } from './agent.schema';
import { API_VERSION } from './common.schema';

/** Versiones de esquema que este paquete sabe interpretar. Un documento con otra
 *  apiVersion se rechaza con error explícito (migraciones llegarán cuando exista
 *  una v2 real — no se construyen migraciones especulativas). */
export const SUPPORTED_SPEC_VERSIONS = [API_VERSION] as const;

export type SpecValidationResult =
  | { ok: true; spec: AgentSpecV1 }
  | { ok: false; errors: Record<string, string[]> };

/** Valida un documento AgentSpec y devuelve un resultado estructurado (sin lanzar). */
export function validateAgentSpec(input: unknown): SpecValidationResult {
  const parsed = AgentSpecV1Schema.safeParse(input);
  if (parsed.success) {
    return { ok: true, spec: parsed.data };
  }
  const errors: Record<string, string[]> = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path.length > 0 ? issue.path.join('.') : '(raíz)';
    (errors[key] ??= []).push(issue.message);
  }
  return { ok: false, errors };
}

/** Valida y devuelve el spec tipado; lanza un Error agregado si es inválido. */
export function parseAgentSpec(input: unknown): AgentSpecV1 {
  const result = validateAgentSpec(input);
  if (result.ok) {
    return result.spec;
  }
  const summary = Object.entries(result.errors)
    .map(([field, msgs]) => `${field}: ${msgs.join('; ')}`)
    .join(' | ');
  throw new Error(`AgentSpec inválido — ${summary}`);
}
