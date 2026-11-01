/**
 * Helpers PUROS del Control Center (Misión 15) — sin React, sin red:
 * mapeo de capacidades honestas, orden topológico del borrador de
 * composición (presentación; la validación REAL la hace el backend) y
 * colores de estado. Todo testeado con vitest.
 */

import type { CapabilityMatrix, CatalogEntry, ProjectGraph } from './api'

/** Etiqueta legible de una capacidad. */
export const CAPACITY_LABELS: Array<{ key: keyof CapabilityMatrix; label: string; hint: string }> = [
  { key: 'schema', label: 'Schema', hint: 'el tipo tiene contrato validado (zod)' },
  { key: 'generator', label: 'Generable', hint: 'el Generator Engine lo genera de verdad (documento validado con referencias reales)' },
  { key: 'validation', label: 'Validable', hint: 'dry-run sin escrituras antes de generar' },
  { key: 'execution', label: 'Ejecutable', hint: 'hay runtime que lo ejecuta hoy (agentes/workflows: runtimes M2–M8; el resto → sandbox M14)' },
]

/** Veredicto textual HONESTO de lo que el tipo puede hacer. */
export function capacitySummary(entry: CatalogEntry): string {
  const c = entry.capabilities
  if (!c?.generator) {
    return 'Solo schema — sin generador todavía (documentado en el catálogo)'
  }
  const parts: string[] = []
  parts.push('genera documentos validados con referencias reales')
  if (c.execution) {
    parts.push('se ejecuta con su runtime hoy')
  } else {
    parts.push('la ejecución requiere el sandbox/módulos futuros')
  }
  return parts.join(' · ')
}

/** Color MUI coherente para el ciclo de vida. */
export function lifecycleColor(state: string | undefined): 'default' | 'success' | 'info' | 'warning' | 'error' | 'secondary' {
  switch (state) {
    case 'generated':
    case 'deployed':
      return 'success'
    case 'validated':
    case 'tested':
    case 'ready':
      return 'info'
    case 'draft':
      return 'default'
    case 'failed':
      return 'error'
    case 'archived':
      return 'secondary'
    default:
      return 'warning'
  }
}

/** Color para el estado de una ejecución. */
export function executionStatusColor(status: string | undefined): 'success' | 'error' | 'warning' | 'info' | 'default' {
  switch (status) {
    case 'succeeded':
      return 'success'
    case 'failed':
      return 'error'
    case 'timeout':
      return 'warning'
    case 'running':
      return 'info'
    default:
      return 'default'
  }
}

/* ── Composer: orden topológico del BORRADOR (presentación) ──────────────── */

export interface DraftModule {
  ref: string
  dependencies: Array<{ ref: string }>
}

export type TopoResult = { ok: true; order: string[] } | { ok: false; cycle: string[] }

/** Kahn sobre el borrador del compositor (igual semántica que el backend). */
export function topoSortDraft(modules: DraftModule[]): TopoResult {
  const byRef = new Map(modules.map((m) => [m.ref, m]))
  const indegree = new Map<string, number>()
  const dependents = new Map<string, string[]>()
  for (const m of modules) {
    indegree.set(m.ref, indegree.get(m.ref) ?? 0)
    for (const dep of m.dependencies) {
      if (!byRef.has(dep.ref)) {
        continue
      }
      dependents.set(dep.ref, [...(dependents.get(dep.ref) ?? []), m.ref])
      indegree.set(m.ref, (indegree.get(m.ref) ?? 0) + 1)
    }
  }
  const queue = modules.map((m) => m.ref).filter((r) => (indegree.get(r) ?? 0) === 0).sort()
  const order: string[] = []
  while (queue.length > 0) {
    const ref = queue.shift()!
    order.push(ref)
    for (const next of dependents.get(ref) ?? []) {
      const left = (indegree.get(next) ?? 0) - 1
      indegree.set(next, left)
      if (left === 0) {
        queue.push(next)
      }
    }
  }
  if (order.length !== modules.length) {
    const cycle = modules.map((m) => m.ref).filter((r) => !order.includes(r))
    return { ok: false, cycle }
  }
  return { ok: true, order }
}

/* ── Graph → xyflow (solo PRESENTACIÓN de datos del backend) ─────────────── */

export interface GraphViewNode {
  id: string
  label: string
  type: string
  found: boolean
  version?: string
  x: number
  y: number
}

export interface GraphViewEdge {
  from: string
  to: string
}

/** Convierte el ProjectGraph REAL del backend en nodos/edges posicionados
 *  por orden topológico (dependencias arriba). */
export function graphToView(graph: ProjectGraph): { nodes: GraphViewNode[]; edges: GraphViewEdge[]; orphanRefs: string[] } {
  const nodes: GraphViewNode[] = []
  const edges: GraphViewEdge[] = []
  for (const a of graph.artifacts) {
    const specRef = graph.specRefs.find((s) => s.artifact.ref === a.ref)
    nodes.push({
      id: a.ref,
      label: a.ref,
      type: a.type,
      found: specRef ? specRef.found : true,
      version: specRef?.registeredVersion,
      x: 0,
      y: 0,
    })
    for (const dep of a.dependencies ?? []) {
      edges.push({ from: dep.ref, to: a.ref })
    }
  }
  // Layout por niveles de dependencia (longest-path layering simplificado).
  const level = new Map<string, number>()
  const byId = new Map(nodes.map((n) => [n.id, n]))
  const incoming = (id: string): number => edges.filter((e) => e.to === id).length
  let changed = true
  while (changed) {
    changed = false
    for (const n of nodes) {
      const next = incoming(n.id) === 0 ? 0 : Math.max(...edges.filter((e) => e.to === n.id).map((e) => (level.get(e.from) ?? -1) + 1))
      const prev = level.get(n.id)
      if (prev === undefined || next > prev) {
        level.set(n.id, next)
        changed = true
      }
    }
  }
  const columns = new Map<number, number>()
  for (const n of nodes) {
    const l = level.get(n.id) ?? 0
    const col = columns.get(l) ?? 0
    columns.set(l, col + 1)
    n.x = 40 + col * 230
    n.y = 40 + l * 130
  }
  const orphanRefs = nodes.filter((n) => !byId.has(n.id)).map((n) => n.id)
  return { nodes, edges, orphanRefs }
}

/** Descarga un objeto JSON como fichero (bundles de export). */
export function downloadJson(obj: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

/** Trunca texto para tablas. */
export function truncate(text: string | undefined | null, max = 80): string {
  if (!text) {
    return ''
  }
  return text.length > max ? `${text.slice(0, max)}…` : text
}
