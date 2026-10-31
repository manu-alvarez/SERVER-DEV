import { z } from 'zod';
import { ApiVersionSchema, MetadataSchema } from './common.schema';

/**
 * Proveedores de inferencia reconocidos por la v1. Enumeración abierta por
 * adición: un perfil PUEDE declarar un proveedor cuyo adaptador aún no exista
 * (la resolución del gateway lo rechazará en runtime con error explícito,
 * nunca en silencio). El adaptador por defecto (Fase 2) es el de Ollama.
 */
export const ProviderSchema = z.enum([
  'ollama',
  'openai',
  'anthropic',
  'azure-openai',
  'google-vertex',
  'groq',
  'mistral',
  'generic-openai-compatible',
]);

export const ProfileCapabilitySchema = z.enum(['chat', 'completion', 'tools', 'vision', 'embedding']);

/**
 * ModelProfile v1 — perfil de modelo registrado, validable y resoluble desde
 * AgentSpec. Agnóstico de proveedor: describe QUÉ modelo usar y DÓNDE está
 * configurado el endpoint (por el NOMBRE de su variable de entorno, nunca su
 * valor). Sin secretos: cualquier credencial se referencia con `secretsRef`
 * hacia el almacén de secretos del despliegue; el perfil nunca la contiene.
 */
export const ModelProfileV1Schema = z.object({
  apiVersion: ApiVersionSchema,
  kind: z.literal('ModelProfile'),
  metadata: MetadataSchema,
  spec: z.object({
    provider: ProviderSchema,
    /** Identificador del modelo en el proveedor (p.ej. 'qwen3.5:4b'). */
    model: z.string().min(1).max(120),
    /** Variable de entorno que contiene la URL base del proveedor en cada
     *  despliegue (el valor real es infraestructura, no parte del spec). */
    endpointEnv: z.string().regex(/^[A-Z][A-Z0-9_]{0,63}$/).optional(),
    capabilities: z.array(ProfileCapabilitySchema).max(8).default([]),
    contextWindow: z.number().int().min(512).max(4_000_000).optional(),
    maxOutputTokens: z.number().int().min(16).max(200000).optional(),
    costTier: z.enum(['free', 'low', 'medium', 'high']).optional(),
    /** Referencia a la clave del secreto en el almacén, p.ej. 'vault/model-api-key'. */
    secretsRef: z.string().min(1).max(120).optional(),
  }),
});

export type ModelProfileV1 = z.infer<typeof ModelProfileV1Schema>;
export type ModelProvider = z.infer<typeof ProviderSchema>;
