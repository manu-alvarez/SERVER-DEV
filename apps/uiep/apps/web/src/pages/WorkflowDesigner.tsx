import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ReactFlow, Background, Controls, MiniMap, useNodesState, useEdgesState, type Node as FlowNode, type Edge as FlowEdge, type Connection, MarkerType } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import {
  Alert, Box, Button, Card, CardContent, Chip, IconButton, LinearProgress, MenuItem, Stack, TextField, Typography, Divider,
} from '@mui/material'
import SaveIcon from '@mui/icons-material/Save'
import AddIcon from '@mui/icons-material/AddCircleOutline'
import DeleteIcon from '@mui/icons-material/DeleteOutline'
import CodeIcon from '@mui/icons-material/Code'
import ArrowUpIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownIcon from '@mui/icons-material/ArrowDownward'
import { api, ApiError, type SpecSummary, type WorkflowSpecInput } from '../lib/api'

/**
 * Visual Workflow Designer (Fase 9) — canvas de nodos/conexiones sobre
 * @xyflow/react (necesidad demostrada: el motor es estable, toca la
 * experiencia). Sincronía bidireccional con el WorkflowSpec:
 *   · orden de la secuencia = panel izquierdo (reordenable)
 *   · ramas (condition then/else, parallel.branches) = edges del canvas
 *   · plantillas de entrada editables por nodo (panel derecho)
 * Validación: local (refs rotas marcadas) + del contrato al guardar (backend).
 * Las POSICIONES del canvas se guardan por workflow en localStorage (el spec
 * sigue siendo funcional puro — el layout no es contrato).
 */

type WfNode = NonNullable<WorkflowSpecInput['nodes'][number]>

interface DocState {
  id: string
  name: string
  version: string
  spec: WorkflowSpecInput
}

const nodeColor = (t: string): string => (t === 'agent' ? '#7c8cff' : t === 'condition' ? '#f5a524' : '#22d3ee')

function specToFlow(doc: DocState, positions: Record<string, { x: number; y: number }>): { nodes: FlowNode[]; edges: FlowEdge[] } {
  const nodes: FlowNode[] = doc.spec.nodes.map((n, i) => ({
    id: n.id,
    position: positions[n.id] ?? { x: 60 + (i % 3) * 220, y: 40 + Math.floor(i / 3) * 120 },
    data: { label: `${n.id} · ${n.type}` },
    style: { background: '#111827', color: '#e6e9f2', border: `1.5px solid ${nodeColor(n.type)}`, borderRadius: 10, fontSize: 12, padding: 8, width: 190 },
  }))
  const edges: FlowEdge[] = []
  doc.spec.nodes.forEach((n) => {
    if (n.type === 'condition') {
      edges.push({ id: `${n.id}-then`, source: n.id, target: n.then, label: 'then', style: { stroke: '#2fbf71' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#2fbf71' } })
      edges.push({ id: `${n.id}-else`, source: n.id, target: n.else, label: 'else', style: { stroke: '#e5484d' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#e5484d' } })
    }
    if (n.type === 'parallel') {
      n.branches.forEach((b, bi) => edges.push({ id: `${n.id}-b${bi}`, source: n.id, target: b, label: `rama ${bi + 1}`, style: { stroke: '#22d3ee' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#22d3ee' } }))
    }
  })
  return { nodes, edges }
}

export default function WorkflowDesigner({ specId, onDone }: { specId: string | null; onDone: () => void }): ReactNode {
  const [agents, setAgents] = useState<SpecSummary[]>([])
  const [doc, setDoc] = useState<DocState | null>(null)
  const [loading, setLoading] = useState(specId !== null)
  const [error, setError] = useState<string | null>(null)
  const [saving] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [jsonMode, setJsonMode] = useState(false)
  const [jsonText, setJsonText] = useState('')
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<FlowEdge>([])
  const positionsRef = useRef<Record<string, { x: number; y: number }>>({})

  useEffect(() => {
    api.specs.list().then((all) => setAgents(all.filter((s) => s.kind === 'Agent'))).catch(() => setAgents([]))
  }, [])

  useEffect(() => {
    if (specId === null) {
      setDoc({ id: '', name: '', version: '1.0.0', spec: { start: '', nodes: [] } })
      setLoading(false)
      return
    }
    api.workflows
      .get(specId)
      .then((d) => {
        const state: DocState = { id: d.metadata.id, name: d.metadata.name, version: d.metadata.version, spec: (d.spec ?? { start: '', nodes: [] }) as WorkflowSpecInput }
        setDoc(state)
        positionsRef.current = JSON.parse(localStorage.getItem(`wf-layout-${state.id}`) ?? '{}') as Record<string, { x: number; y: number }>
        const { nodes: fn, edges: fe } = specToFlow(state, positionsRef.current)
        setNodes(fn)
        setEdges(fe)
        setLoading(false)
      })
      .catch(() => {
        setError(`No se pudo cargar ${specId}.`)
        setLoading(false)
      })
  }, [specId, setNodes, setEdges])

  const syncFlow = useCallback(
    (d: DocState) => {
      setNodes((prev) => {
        const { nodes: fn } = specToFlow(d, positionsRef.current)
        // conserva posiciones arrastradas
        return fn.map((n) => {
          const old = prev.find((p) => p.id === n.id)
          return old ? { ...n, position: old.position } : n
        })
      })
      const { edges: fe } = specToFlow(d, positionsRef.current)
      setEdges(fe)
    },
    [setNodes, setEdges],
  )

  const mutate = (fn: (d: DocState) => DocState) => {
    setDoc((d) => {
      if (!d) return d
      const next = fn(d)
      syncFlow(next)
      return next
    })
  }

  const addNode = (type: 'agent' | 'condition' | 'parallel') => {
    mutate((d) => {
      const base = `nodo-${d.spec.nodes.length + 1}-${Math.random().toString(36).slice(2, 5)}`
      let node: WfNode
      if (type === 'agent') {
        node = { id: base, type: 'agent', agentSpecId: agents[0]?.id ?? 'agente', input: '{{input}}', retries: 0 }
      } else if (type === 'condition') {
        node = { id: base, type: 'condition', input: '{{prev}}', check: { op: 'contains', value: '', caseSensitive: false }, then: d.spec.start, else: d.spec.start }
      } else {
        node = { id: base, type: 'parallel', branches: [] }
      }
      return { ...d, spec: { ...d.spec, nodes: [...d.spec.nodes, node], start: d.spec.start || base } }
    })
  }

  const removeNode = (id: string) => {
    mutate((d) => {
      const nodes2 = d.spec.nodes.filter((n) => n.id !== id)
      const cleaned = nodes2.map((n) => {
        if (n.type === 'condition') {
          return { ...n, then: n.then === id ? '' : n.then, else: n.else === id ? '' : n.else }
        }
        if (n.type === 'parallel') {
          return { ...n, branches: n.branches.filter((b) => b !== id) }
        }
        return n
      })
      return { ...d, spec: { ...d.spec, nodes: cleaned, start: d.spec.start === id ? (cleaned[0]?.id ?? '') : d.spec.start } }
    })
  }

  const reorder = (id: string, dir: -1 | 1) => {
    mutate((d) => {
      const arr = [...d.spec.nodes]
      const i = arr.findIndex((n) => n.id === id)
      const j = i + dir
      if (i < 0 || j < 0 || j >= arr.length) return d
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
      return { ...d, spec: { ...d.spec, nodes: arr } }
    })
  }

  const updateSelected = (patch: Partial<WfNode>) => {
    if (!selected) return
    mutate((d) => ({ ...d, spec: { ...d.spec, nodes: d.spec.nodes.map((n) => (n.id === selected ? ({ ...n, ...patch } as WfNode) : n)) } }))
  }

  const validationErrors = useMemo(() => {
    if (!doc) return []
    const errors: string[] = []
    const ids = new Set(doc.spec.nodes.map((n) => n.id))
    if (!doc.spec.start || !ids.has(doc.spec.start)) errors.push('start no existe')
    for (const n of doc.spec.nodes) {
      if (n.type === 'condition') {
        if (!ids.has(n.then)) errors.push(`${n.id}: rama then rota`)
        if (!ids.has(n.else)) errors.push(`${n.id}: rama else rota`)
      }
      if (n.type === 'parallel') {
        for (const b of n.branches) {
          if (!ids.has(b)) errors.push(`${n.id}: rama ${b} rota`)
        }
      }
    }
    return errors
  }, [doc])

  const save = async () => {
    if (!doc) return
    setError(null)
    try {
      const payload = { apiVersion: 'uiep.io/v1', kind: 'Workflow', metadata: { id: doc.id.trim(), name: doc.name.trim() || doc.id.trim(), version: doc.version.trim() || '1.0.0' }, spec: doc.spec }
      await api.workflows.save(payload)
      localStorage.setItem(`wf-layout-${doc.id.trim()}`, JSON.stringify(positionsRef.current))
      onDone()
    } catch (err) {
      setError(`El backend rechazó el WorkflowSpec: ${err instanceof ApiError ? JSON.stringify(err.payload).slice(0, 400) : 'fallo de red'}`)
    }
  }

  const exportJson = () => {
    if (!doc) return
    const blob = new Blob([JSON.stringify({ apiVersion: 'uiep.io/v1', kind: 'Workflow', metadata: { id: doc.id, name: doc.name, version: doc.version }, spec: doc.spec }, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${doc.id || 'workflow'}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const importJson = (file: File) => {
    file.text().then((t) => {
      try {
        const d = JSON.parse(t) as { metadata?: { id?: string; name?: string; version?: string }; spec?: WorkflowSpecInput }
        if (!d.spec?.nodes) throw new Error('sin spec.nodes')
        setDoc({ id: d.metadata?.id ?? 'importado', name: d.metadata?.name ?? 'Importado', version: d.metadata?.version ?? '1.0.0', spec: d.spec })
        setJsonMode(false)
      } catch (e) {
        setError(`Import inválido: ${(e as Error).message}`)
      }
    })
  }

  if (loading) return <LinearProgress sx={{ mt: 6, mx: 4, borderRadius: 2 }} />

  const sel = doc?.spec.nodes.find((n) => n.id === selected) ?? null

  return (
    <Stack spacing={2}>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1.2, flexWrap: 'wrap' }}>
        <Typography variant="h4">{specId ? 'Editar workflow' : 'Nuevo workflow'}</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Button onClick={() => setJsonMode((v) => !v)} startIcon={<CodeIcon />}>{jsonMode ? 'Canvas' : 'JSON'}</Button>
        <Button onClick={exportJson}>Exportar</Button>
        <Button component="label">Importar<input type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])} /></Button>
        <Button variant="contained" startIcon={<SaveIcon />} onClick={() => void save()} disabled={saving || validationErrors.length > 0}>
          {saving ? 'Guardando…' : 'Validar y guardar'}
        </Button>
        <Button onClick={onDone}>Cerrar</Button>
      </Stack>

      <Stack direction="row" spacing={1.2} sx={{ flexWrap: 'wrap' }}>
        <TextField size="small" label="id" value={doc?.id ?? ''} onChange={(e) => setDoc((d) => (d ? { ...d, id: e.target.value } : d))} sx={{ width: 220 }} disabled={specId !== null} />
        <TextField size="small" label="nombre" value={doc?.name ?? ''} onChange={(e) => setDoc((d) => (d ? { ...d, name: e.target.value } : d))} sx={{ width: 240 }} />
        <TextField size="small" label="versión" value={doc?.version ?? ''} onChange={(e) => setDoc((d) => (d ? { ...d, version: e.target.value } : d))} sx={{ width: 110 }} />
        <TextField select size="small" label="start" value={doc?.spec.start ?? ''} onChange={(e) => setDoc((d) => (d ? { ...d, spec: { ...d.spec, start: e.target.value } } : d))} sx={{ width: 180 }}>
          {doc?.spec.nodes.map((n) => <MenuItem key={n.id} value={n.id}>{n.id}</MenuItem>)}
        </TextField>
        <Stack direction="row" spacing={0.6} sx={{ alignItems: 'center' }}>
          <Button size="small" startIcon={<AddIcon />} onClick={() => addNode('agent')}>agent</Button>
          <Button size="small" startIcon={<AddIcon />} onClick={() => addNode('condition')}>condition</Button>
          <Button size="small" startIcon={<AddIcon />} onClick={() => addNode('parallel')}>parallel</Button>
        </Stack>
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}
      {validationErrors.length > 0 && <Alert severity="warning">{validationErrors.join(' · ')}</Alert>}

      {jsonMode ? (
        <TextField
          value={jsonText || (doc ? JSON.stringify({ ...doc, kind: 'Workflow', apiVersion: 'uiep.io/v1' }, null, 2) : '')}
          onChange={(e) => {
            setJsonText(e.target.value)
            try {
              const d = JSON.parse(e.target.value) as DocState & { kind?: string }
              if (d.spec?.nodes) {
                setDoc({ id: d.id, name: d.name, version: d.version, spec: d.spec })
                syncFlow({ id: d.id, name: d.name, version: d.version, spec: d.spec })
              }
            } catch { /* parcial mientras escribe */ }
          }}
          multiline
          fullWidth
          minRows={18}
          slotProps={{ input: { sx: { fontFamily: 'ui-monospace, monospace', fontSize: 12.5 } } }}
        />
      ) : (
        <Box sx={{ height: 480, border: 1, borderColor: 'divider', borderRadius: 3, overflow: 'hidden', bgcolor: 'rgba(2,6,23,0.4)' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={(_, n) => setSelected(n.id)}
            onNodeDragStop={(_, n) => { positionsRef.current[n.id] = n.position }}
            onConnect={(c: Connection) => {
              if (!selected) return
              const selNode = doc?.spec.nodes.find((n) => n.id === selected)
              if (!selNode) return
              if (selNode.type === 'condition') {
                mutate((d) => ({ ...d, spec: { ...d.spec, nodes: d.spec.nodes.map((n) => (n.id === selected && n.type === 'condition' ? { ...n, then: c.target } : n)) } }))
              } else if (selNode.type === 'parallel') {
                mutate((d) => ({ ...d, spec: { ...d.spec, nodes: d.spec.nodes.map((n) => (n.id === selected && n.type === 'parallel' ? { ...n, branches: [...n.branches, c.target] } : n)) } }))
              }
            }}
            fitView
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#1e293b" gap={18} />
            <Controls />
            <MiniMap pannable zoomable maskColor="rgba(2,6,23,0.7)" style={{ background: '#0a0f1c' }} />
          </ReactFlow>
        </Box>
      )}

      {/* Orden de la secuencia + propiedades */}
      <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
        <Card sx={{ flex: '1 1 320px' }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Typography variant="h6" fontSize={14.6} sx={{ mb: 1 }}>Orden de la secuencia</Typography>
            <Stack spacing={0.6}>
              {doc?.spec.nodes.map((n, i) => (
                <Stack key={n.id} direction="row" sx={{ alignItems: 'center', gap: 0.8 }}>
                  <Chip size="small" label={`${i + 1}`} variant="outlined" onClick={() => setSelected(n.id)} sx={{ cursor: 'pointer', borderColor: selected === n.id ? 'primary.main' : undefined }} />
                  <Typography fontSize={13} onClick={() => setSelected(n.id)} sx={{ cursor: 'pointer', flexGrow: 1 }}>
                    {n.id} <Box component="span" sx={{ color: nodeColor(n.type) }}>· {n.type}</Box>
                  </Typography>
                  <IconButton size="small" onClick={() => reorder(n.id, -1)}><ArrowUpIcon sx={{ fontSize: 16 }} /></IconButton>
                  <IconButton size="small" onClick={() => reorder(n.id, 1)}><ArrowDownIcon sx={{ fontSize: 16 }} /></IconButton>
                  <IconButton size="small" onClick={() => removeNode(n.id)}><DeleteIcon sx={{ fontSize: 16 }} /></IconButton>
                </Stack>
              ))}
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ flex: '1 1 380px' }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Typography variant="h6" fontSize={14.6} sx={{ mb: 1 }}>
              Propiedades {sel ? `· ${sel.id}` : '(selecciona un nodo)'}
            </Typography>
            {!sel && <Typography fontSize={13} color="text.secondary">Haz click en un nodo del canvas o de la lista.</Typography>}
            {sel?.type === 'agent' && (
              <Stack spacing={1.4}>
                <TextField select size="small" label="agentSpecId" value={sel.agentSpecId} onChange={(e) => updateSelected({ agentSpecId: e.target.value } as Partial<WfNode>)}>
                  {agents.map((a) => <MenuItem key={a.id} value={a.id}>{a.id}</MenuItem>)}
                </TextField>
                <TextField size="small" label="entrada (plantilla)" value={sel.input} onChange={(e) => updateSelected({ input: e.target.value } as Partial<WfNode>)} helperText="{{input}} · {{prev}} · {{nodoId}}" />
                <TextField select size="small" label="reintentos" value={String(sel.retries ?? 0)} onChange={(e) => updateSelected({ retries: Number(e.target.value) } as Partial<WfNode>)}>
                  {[0, 1, 2, 3].map((r) => <MenuItem key={r} value={String(r)}>{r}</MenuItem>)}
                </TextField>
              </Stack>
            )}
            {sel?.type === 'condition' && (
              <Stack spacing={1.4}>
                <TextField size="small" label="texto a evaluar (plantilla)" value={sel.input} onChange={(e) => updateSelected({ input: e.target.value } as Partial<WfNode>)} />
                <Stack direction="row" spacing={1}>
                  <TextField select size="small" label="operación" value={sel.check.op} onChange={(e) => updateSelected({ check: { ...sel.check, op: e.target.value as typeof sel.check.op } } as Partial<WfNode>)} sx={{ width: 160 }}>
                    {['contains', 'equals', 'not_empty', 'starts_with'].map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                  </TextField>
                  <TextField size="small" label="valor" value={sel.check.value} onChange={(e) => updateSelected({ check: { ...sel.check, value: e.target.value } } as Partial<WfNode>)} />
                </Stack>
                <TextField select size="small" label="then (si TRUE)" value={sel.then} onChange={(e) => updateSelected({ then: e.target.value } as Partial<WfNode>)}>
                  {doc?.spec.nodes.map((n) => <MenuItem key={n.id} value={n.id}>{n.id}</MenuItem>)}
                </TextField>
                <TextField select size="small" label="else (si FALSE)" value={sel.else} onChange={(e) => updateSelected({ else: e.target.value } as Partial<WfNode>)}>
                  {doc?.spec.nodes.map((n) => <MenuItem key={n.id} value={n.id}>{n.id}</MenuItem>)}
                </TextField>
              </Stack>
            )}
            {sel?.type === 'parallel' && (
              <Stack spacing={1}>
                <Typography fontSize={13} color="text.secondary">Ramas (agent): conéctalas arrastrando desde este nodo en el canvas, o gestiona aquí:</Typography>
                <Stack spacing={0.6}>
                  {sel.branches.map((b, bi) => (
                    <Stack key={`${b}-${bi}`} direction="row" sx={{ alignItems: 'center', gap: 0.8 }}>
                      <Chip size="small" variant="outlined" label={b} />
                      <IconButton size="small" onClick={() => updateSelected({ branches: sel.branches.filter((_, i) => i !== bi) } as Partial<WfNode>)}><DeleteIcon sx={{ fontSize: 15 }} /></IconButton>
                    </Stack>
                  ))}
                </Stack>
                <TextField select size="small" label="añadir rama" value="" onChange={(e) => e.target.value && updateSelected({ branches: [...sel.branches, e.target.value] } as Partial<WfNode>)}>
                  {doc?.spec.nodes.filter((n) => n.type === 'agent' && n.id !== sel.id && !sel.branches.includes(n.id)).map((n) => <MenuItem key={n.id} value={n.id}>{n.id}</MenuItem>)}
                </TextField>
              </Stack>
            )}
            <Divider sx={{ my: 1.4 }} />
            <Typography variant="caption" color="text.secondary">
              Las posiciones del canvas se guardan localmente; el WorkflowSpec sigue siendo
              funcional puro (exportable/reproducible).
            </Typography>
          </CardContent>
        </Card>
      </Stack>
    </Stack>
  )
}
