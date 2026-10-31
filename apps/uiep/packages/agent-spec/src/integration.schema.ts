import { z } from 'zod';
import { MetadataSchema } from './common.schema';

/**
 * IntegrationSpec v1 (Fase 7) — integraciones externas como contratos
 * declarativos versionados. El ecosistema de extensiones NO hace de MCP el
 * núcleo: el contrato interno de herramientas sigue siendo independiente y
 * MCP/API son adaptadores.
 *
 * SEGURIDAD: la autenticación viaja POR REFERENCIA (secretEnv = NOMBRE de la
 * variable de entorno del despliegue); el valor del secreto nunca está en el
 * spec ni sale del proceso. Las URLs de integración son configuración del
 * OPERADOR (superficie autenticada) — distinta del ingestion (URLs no
 * confiables): apuntar a servicios internos es legítimo aquí, y el dato del
 * AGENTE nunca controla host/path, solo argumentos del body.
 */

export const IntegrationTypeSchema = z.enum(['http-api', 'mcp-server']);

export const IntegrationAuthSchema = z.object({
  type: z.enum(['none', 'bearer', 'header']).default('none'),
  /** NOMBRE de la env var que contiene el secreto (nunca el valor). */
  secretEnv: z.string().min(1).max(200).optional(),
  /** Nombre de la cabecera para type 'header' (default Authorization). */
  headerName: z.string().min(1).max(100).optional(),
});

export const IntegrationSpecV1Schema = z.object({
  apiVersion: z.literal('uiep.io/v1'),
  kind: z.literal('Integration'),
  metadata: MetadataSchema,
  spec: z.object({
    type: IntegrationTypeSchema,
    /** URL base (http/https). Para mcp-server: el endpoint JSON-RPC. */
    baseUrl: z.string().url().max(500),
    auth: IntegrationAuthSchema.default({ type: 'none' }),
    /** Path de health check (default /health para http-api). */
    healthPath: z.string().max(200).default('/health'),
    timeoutMs: z.number().int().min(1000).max(60000).default(15000),
    /** Cabeceras estáticas NO secretas. */
    headers: z.record(z.string(), z.string()).default({}),
  }),
});

export type IntegrationSpecV1 = z.infer<typeof IntegrationSpecV1Schema>;
export type IntegrationType = z.infer<typeof IntegrationTypeSchema>;
