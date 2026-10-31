import { z } from 'zod';

/** Envelope del contrato — versionado. Solo v1 está soportada hoy; el rechazo
 *  explícito de versiones desconocidas es parte del contrato (ver validate.ts). */
export const API_VERSION = 'uiep.io/v1' as const;
export const ApiVersionSchema = z.literal(API_VERSION);

/** Tipos de entidad del sistema de especificaciones. Fase 1 entrega 'Agent';
 *  la enumeración creará de forma aditiva: Team, Workflow, Tool, ModelProfile,
 *  KnowledgeBase, Deployment, Evaluation (sin romper documentos existentes). */
export const SpecKindSchema = z.enum(['Agent']);

export const SemVerSchema = z
  .string()
  .regex(/^\d+\.\d+\.\d+$/, 'versión semántica MAJOR.MINOR.PATCH');

export const EntityIdSchema = z
  .string()
  .regex(/^[a-z0-9][a-z0-9-]{2,63}$/, 'id: minúsculas, dígitos y guiones (3-64 caracteres)');

export const SlugSchema = z.string().regex(/^[a-z0-9-]{1,64}$/);

/** Base de metadatos compartida por todos los futuros tipos de especificación. */
export const MetadataSchema = z.object({
  id: EntityIdSchema,
  name: z.string().min(1).max(120),
  version: SemVerSchema,
  description: z.string().max(2000).optional(),
  tags: z.array(SlugSchema).max(16).optional(),
  createdAt: z.string().datetime().optional(),
});

/** Referencia tipada a una herramienta (ToolSpec llegará en fases posteriores). */
export const ToolRefSchema = z.object({
  id: EntityIdSchema,
  permissions: z.array(z.string().min(1)).optional(),
});
