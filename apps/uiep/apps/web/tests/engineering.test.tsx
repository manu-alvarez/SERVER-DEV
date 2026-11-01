import { describe, expect, test } from 'vitest'
import { capacitySummary, executionStatusColor, graphToView, lifecycleColor, topoSortDraft, truncate } from '../src/lib/engineering'
import type { CatalogEntry, ProjectGraph } from '../src/lib/api'
import { renderToStaticMarkup } from 'react-dom/server'
import { CapacityChips, StateChip } from '../src/pages/engineering/shared'
import { createElement } from 'react'

/** Pruebas del Control Center (Misión 15): helpers puros y humo de render. */

describe('topoSortDraft (orden topológico del borrador del Composer)', () => {
  test('dependencias primero y orden estable', () => {
    const r = topoSortDraft([
      { ref: 'saas', dependencies: [{ ref: 'app' }] },
      { ref: 'app', dependencies: [{ ref: 'api' }] },
      { ref: 'api', dependencies: [] },
    ])
    expect(r).toEqual({ ok: true, order: ['api', 'app', 'saas'] })
  })
  test('detecta ciclos (igual que el backend fail-closed)', () => {
    const r = topoSortDraft([
      { ref: 'a', dependencies: [{ ref: 'b' }] },
      { ref: 'b', dependencies: [{ ref: 'a' }] },
    ])
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.cycle.sort()).toEqual(['a', 'b'])
    }
  })
  test('dependencias a refs inexistentes no bloquean el orden (el backend las rechaza)', () => {
    const r = topoSortDraft([{ ref: 'solo', dependencies: [{ ref: 'fantasma' }] }])
    expect(r).toEqual({ ok: true, order: ['solo'] })
  })
})

describe('capacitySummary — honestidad del catálogo', () => {
  test('tipo schema-only se declara como tal', () => {
    const entry: CatalogEntry = { type: 'saas-hipotetico', capabilities: { schema: true, generator: false, execution: false, validation: false } }
    expect(capacitySummary(entry)).toContain('Solo schema')
  })
  test('generable sin ejecución lo dice claramente', () => {
    const entry: CatalogEntry = { type: 'prompt-system', capabilities: { schema: true, generator: true, execution: false, validation: true } }
    const s = capacitySummary(entry)
    expect(s).toContain('genera documentos')
    expect(s).toContain('sandbox/módulos futuros')
  })
  test('ejecutable lo declara', () => {
    const entry: CatalogEntry = { type: 'agent', capabilities: { schema: true, generator: true, execution: true, validation: true } }
    expect(capacitySummary(entry)).toContain('se ejecuta con su runtime hoy')
  })
})

describe('graphToView — grafo REAL del backend a xyflow', () => {
  const graph: ProjectGraph = {
    artifacts: [
      { ref: 'api', type: 'api-platform', dependencies: [] },
      { ref: 'app', type: 'application', dependencies: [{ ref: 'api' }] },
      { ref: 'saas', type: 'saas', dependencies: [{ ref: 'app' }] },
    ],
    specRefs: [
      { artifact: { ref: 'api', type: 'api-platform' }, ref: 'm13-api', expectedKind: 'ApiPlatform', found: true, registeredVersion: '1.0.0' },
      { artifact: { ref: 'app', type: 'application' }, ref: 'no-existe', expectedKind: 'Application', found: false },
      { artifact: { ref: 'saas', type: 'saas' }, ref: 'm13-saas', expectedKind: 'Saas', found: true, registeredVersion: '1.0.0' },
    ],
  }
  test('capas por dependencias: dependencias arriba (y menor)', () => {
    const { nodes, edges } = graphToView(graph)
    const byId = new Map(nodes.map((n) => [n.id, n]))
    expect(byId.get('api')!.y).toBeLessThan(byId.get('app')!.y)
    expect(byId.get('app')!.y).toBeLessThan(byId.get('saas')!.y)
    expect(edges).toContainEqual({ from: 'api', to: 'app' })
    expect(edges).toContainEqual({ from: 'app', to: 'saas' })
  })
  test('refs no encontradas se marcan found=false (rojo en la UI)', () => {
    const { nodes } = graphToView(graph)
    expect(nodes.find((n) => n.id === 'app')!.found).toBe(false)
    expect(nodes.find((n) => n.id === 'api')!.found).toBe(true)
  })
})

describe('humo de render (MUI sin provider, SSR estático)', () => {
  test('CapacityChips refleja capacidades tachando las ausentes', () => {
    const entry: CatalogEntry = { type: 'harness', capabilities: { schema: true, generator: true, execution: false, validation: true } }
    const html = renderToStaticMarkup(createElement(CapacityChips, { entry }))
    expect(html).toContain('Ejecutable')
    expect(html).toContain('line-through')
  })
  test('StateChip de ciclo de vida y ejecución no explota', () => {
    expect(renderToStaticMarkup(createElement(StateChip, { state: 'generated', kind: 'lifecycle' }))).toContain('generated')
    expect(renderToStaticMarkup(createElement(StateChip, { state: 'cancelled', kind: 'execution' }))).toContain('cancelled')
  })
})

describe('utilidades menores', () => {
  test('lifecycleColor mapea estados conocidos', () => {
    expect(lifecycleColor('generated')).toBe('success')
    expect(lifecycleColor('failed')).toBe('error')
    expect(lifecycleColor('desconocido')).toBe('warning')
  })
  test('executionStatusColor mapea estados de run', () => {
    expect(executionStatusColor('succeeded')).toBe('success')
    expect(executionStatusColor('timeout')).toBe('warning')
    expect(executionStatusColor('running')).toBe('info')
  })
  test('truncate corta con elipsis', () => {
    expect(truncate('abcdef', 4)).toBe('abcd…')
    expect(truncate(null)).toBe('')
  })
})
