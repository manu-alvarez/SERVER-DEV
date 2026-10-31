import { z } from 'zod';
import { ApiVersionSchema, MetadataSchema } from './common.schema';

/**
 * Subconjunto restringido de JSON Schema para las entradas de herramientas:
 * object plano con propiedades string/number/boolean y lista de obligatorias.
 * La validación runtime vive en validateToolInput (este mismo paquete) — sin
 * dependencias externas de JSON Schema y sin permitir estructuras arbitrarias.
 */
export const ToolParamSchema = z.object({
  type: z.enum(['string', 'number', 'boolean']),
  description: z.string().max(500).optional(),
  /** string: longitud máxima aceptada. */
  maxLength: z.number().int().min(1).max(100000).optional(),
  /** number: rango [min, max]. */
  min: z.number().optional(),
  max: z.number().optional(),
  /** string: valores permitidos. */
  enum: z.array(z.string().min(1).max(200)).min(1).max(32).optional(),
});

export type ToolParam = z.infer<typeof ToolParamSchema>;

export const ToolInputSchemaSchema = z
  .object({
    type: z.literal('object'),
    properties: z.record(ToolParamSchema),
    required: z.array(z.string()).max(32).default([]),
  })
  .default({ type: 'object', properties: {}, required: [] });

export type ToolInputSchema = z.infer<typeof ToolInputSchemaSchema>;

/** Adaptadores de ejecución permitidos. Enumeración cerrada: si el runtime
 *  recibe un adapter desconocido lo rechaza explícito (nunca ejecuta código
 *  arbitrario). El adapter 'clock' y 'runtime-info' son puros y sin efectos
 *  sobre el filesystem. 'memory-write' (Fase 5.1) escribe memoria PERSISTENTE
 *  solo a través de políticas deterministas del memory-store (dedup/TTL/
 *  cuota) y exige permiso 'memory:write' + spec.memory.enabled. */
export const ToolAdapterSchema = z.enum(['clock', 'runtime-info', 'memory-write', 'http-call', 'mcp-call']);

/**
 * ToolSpec v1 — herramienta declarativa: identificador (metadata.id),
 * descripción, esquema de entrada validado ANTES de ejecutar, permisos
 * requeridos y adaptador de ejecución cerrado. Sin código, sin shell, sin
 * acceso libre al filesystem por diseño.
 */
export const ToolSpecV1Schema = z.object({
  apiVersion: ApiVersionSchema,
  kind: z.literal('Tool'),
  metadata: MetadataSchema,
  spec: z.object({
    description: z.string().min(1).max(2000),
    inputSchema: ToolInputSchemaSchema,
    /** Permisos requeridos para ejecutarla, p.ej. 'clock:read'. El AgentSpec
     *  debe otorgarlos en tools[].permissions (o en '*'). */
    permissions: z.array(z.string().min(1).max(200)).max(16).default([]),
    execution: z.object({
      adapter: ToolAdapterSchema,
      /** Config declarativa segura (pares string→string). */
      config: z.record(z.string(), z.string()).optional(),
    }),
  }),
});

export type ToolSpecV1 = z.infer<typeof ToolSpecV1Schema>;

/** Validador de entrada contra el subconjunto de esquema — puro y agnóstico del
 *  runtime. Errores estructurados por propiedad. Devuelve el valor normalizado. */
export function validateToolInput(
  schema: ToolInputSchema,
  input: unknown,
): { ok: true; value: Record<string, unknown> } | { ok: false; errors: Record<string, string[]> } {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return { ok: false, errors: { input: ['la entrada debe ser un objeto'] } };
  }
  const value = input as Record<string, unknown>;
  const errors: Record<string, string[]> = {};
  for (const key of schema.required) {
    if (!(key in value) || value[key] === undefined) {
      errors[key] = ['falta el parámetro requerido'];
    }
  }
  for (const [key, param] of Object.entries(schema.properties)) {
    if (!(key in value) || value[key] === undefined) {
      continue;
    }
    const v = value[key];
    if (param.type === 'string') {
      if (typeof v !== 'string') {
        errors[key] ??= ['debe ser string'];
      } else if (param.maxLength !== undefined && v.length > param.maxLength) {
        errors[key] ??= [`excede maxLength ${param.maxLength}`];
      } else if (param.enum && !param.enum.includes(v)) {
        errors[key] ??= [`fuera de enum (${param.enum.join('|')})`];
      }
    } else if (param.type === 'number') {
      if (typeof v !== 'number' || Number.isNaN(v)) {
        errors[key] ??= ['debe ser number'];
      } else {
        if (param.min !== undefined && v < param.min) errors[key] ??= [`menor que el mínimo ${param.min}`];
        if (param.max !== undefined && v > param.max) errors[key] ??= [`mayor que el máximo ${param.max}`];
      }
    } else if (param.type === 'boolean' && typeof v !== 'boolean') {
      errors[key] ??= ['debe ser boolean'];
    }
  }
  return Object.keys(errors).length === 0 ? { ok: true, value } : { ok: false, errors };
}
