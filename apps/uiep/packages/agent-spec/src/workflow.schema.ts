import { z } from 'zod';
import { EntityIdSchema, MetadataSchema, SlugSchema } from './common.schema';

/**
 * WorkflowSpec v1 (Fase 6) — composición declarativa de agentes.
 *
 * Motor PROPIO y agnóstico: sin n8n/LangGraph/CrewAI, sin ejecución de código
 * arbitrario. Tres tipos de nodo:
 *   · agent     — ejecuta un turno del AgentSpec registrado (hereda gateway,
 *                 tools cerradas, knowledge bindings y memory del PROPIO agente).
 *   · condition — decisión determinista sobre la salida de otro nodo
 *                 (contains/equals/not_empty/starts_with) → rama then/else.
 *   · parallel  — ejecuta en paralelo nodos agent (tope de concurrencia del
 *                 runtime) y une sus salidas con etiquetas.
 *
 * Conexiones: secuencia implícita (orden de `nodes`) + ramas explícitas
 * (condition.then/else, parallel.branches). Entradas por PLANTILLAS:
 *   {{input}}  — entrada del workflow
 *   {{prev}}   — salida del nodo ejecutado inmediatamente anterior
 *   {{nodeId}} — salida del nodo indicado (debe estar ejecutado; si no, '')
 * Sustitución determinista; el motor nunca evalúa código.
 */

export const WorkflowNodeTypeIdSchema = SlugSchema; // id de nodo = slug

export const WorkflowCheckOpSchema = z.enum(['contains', 'equals', 'not_empty', 'starts_with']);

export const WorkflowAgentNodeSchema = z.object({
  id: WorkflowNodeTypeIdSchema,
  type: z.literal('agent'),
  /** AgentSpec REGISTRADO (se valida existencia al EJECUTAR, no al guardar). */
  agentSpecId: EntityIdSchema,
  /** Entrada del turno: plantilla determinista. */
  input: z.string().min(1).max(4000),
  retries: z.number().int().min(0).max(3).default(0),
  timeoutMs: z.number().int().min(5000).max(300000).optional(),
});

export const WorkflowConditionNodeSchema = z.object({
  id: WorkflowNodeTypeIdSchema,
  type: z.literal('condition'),
  /** Texto a evaluar (plantilla) — normalmente la salida de un nodo previo. */
  input: z.string().min(1).max(4000),
  check: z.object({
    op: WorkflowCheckOpSchema,
    value: z.string().max(2000).default(''),
    caseSensitive: z.boolean().default(false),
  }),
  then: WorkflowNodeTypeIdSchema,
  else: WorkflowNodeTypeIdSchema,
});

export const WorkflowParallelNodeSchema = z.object({
  id: WorkflowNodeTypeIdSchema,
  type: z.literal('parallel'),
  /** Nodos agent que corren EN PARALELO (tope de concurrencia del runtime). */
  branches: z.array(WorkflowNodeTypeIdSchema).min(1).max(8),
  /** Cómo se une la salida: 'concat' (secciones etiquetadas). */
  join: z.literal('concat').default('concat'),
});

export const WorkflowNodeSchema = z.discriminatedUnion('type', [
  WorkflowAgentNodeSchema,
  WorkflowConditionNodeSchema,
  WorkflowParallelNodeSchema,
]);

export const WorkflowSpecV1Schema = z.object({
  apiVersion: z.literal('uiep.io/v1'),
  kind: z.literal('Workflow'),
  metadata: MetadataSchema,
  spec: z.object({
    start: WorkflowNodeTypeIdSchema,
    nodes: z.array(WorkflowNodeSchema).min(1).max(32),
  }),
});

export type WorkflowNodeAgent = z.infer<typeof WorkflowAgentNodeSchema>;
export type WorkflowNodeCondition = z.infer<typeof WorkflowConditionNodeSchema>;
export type WorkflowNodeParallel = z.infer<typeof WorkflowParallelNodeSchema>;
export type WorkflowNode = z.infer<typeof WorkflowNodeSchema>;
export type WorkflowSpecV1 = z.infer<typeof WorkflowSpecV1Schema>;
export type WorkflowCheckOp = z.infer<typeof WorkflowCheckOpSchema>;

/** Tipos de ENTRADA (pre-defaults) para construir specs en clientes/tests. */
export type WorkflowNodeInput = z.input<typeof WorkflowNodeSchema>;
export type WorkflowSpecInput = { start: string; nodes: WorkflowNodeInput[] };

export type WorkflowStructureResult = { ok: true } | { ok: false; errors: string[] };

/**
 * Validación ESTRUCTURAL (más allá del esquema): ids únicos, start existe,
 * referencias (then/else/branches) existentes y sin CICLOS (DAG), ramas de
 * parallel apuntando a nodos agent. Pure function — acepta la forma de
 * ENTRADA (pre-defaults) y la PARSEADA (los campos que lee existen en ambas).
 */
export function validateWorkflowStructure(spec: { spec: WorkflowSpecInput }): WorkflowStructureResult {
  const errors: string[] = [];
  const byId = new Map<string, WorkflowNodeInput>();
  for (const node of spec.spec.nodes) {
    if (byId.has(node.id)) {
      errors.push(`nodo duplicado: ${node.id}`);
    }
    byId.set(node.id, node);
  }
  if (!byId.has(spec.spec.start)) {
    errors.push(`start apunta a un nodo inexistente: ${spec.spec.start}`);
  }
  for (const node of spec.spec.nodes) {
    if (node.type === 'condition') {
      for (const ref of [node.then, node.else]) {
        if (!byId.has(ref)) {
          errors.push(`condition '${node.id}' apunta a nodo inexistente: ${ref}`);
        }
      }
      if (node.then === node.id || node.else === node.id) {
        errors.push(`condition '${node.id}' apunta a sí mismo`);
      }
    }
    if (node.type === 'parallel') {
      for (const ref of node.branches) {
        const target = byId.get(ref);
        if (!target) {
          errors.push(`parallel '${node.id}' apunta a nodo inexistente: ${ref}`);
        } else if (target.type !== 'agent') {
          errors.push(`parallel '${node.id}': la rama '${ref}' debe ser un nodo agent`);
        }
      }
    }
  }
  // Ciclos: DFS desde start siguiendo secuencia + ramas (then/else) — los
  // nodos PARALLEL no continúan la secuencia implícita (son join final).
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const walk = (id: string | undefined): void => {
    if (!id || visited.has(id)) {
      return;
    }
    if (visiting.has(id)) {
      errors.push(`ciclo detectado alcanzando el nodo: ${id}`);
      return;
    }
    visiting.add(id);
    const node = byId.get(id);
    if (node?.type === 'condition') {
      walk(node.then);
      walk(node.else);
    } else {
      const idx = spec.spec.nodes.findIndex((n) => n.id === id);
      const next = spec.spec.nodes[idx + 1];
      if (next) {
        walk(next.id);
      }
    }
    visiting.delete(id);
    visited.add(id);
  };
  if (byId.has(spec.spec.start)) {
    walk(spec.spec.start);
  }
  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}
