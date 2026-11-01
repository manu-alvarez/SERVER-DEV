import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Alert, Box, Button, Chip, Divider, FormControl, IconButton, InputLabel, MenuItem, Paper, Select, Stack, TextField, Tooltip, Typography } from '@mui/material'
import { ReactFlow, Background, Controls, type Edge as FlowEdge, type Node as FlowNode, MarkerType } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import AddIcon from '@mui/icons-material/AddCircleOutline'
import DeleteIcon from '@mui/icons-material/DeleteOutline'
import PlayIcon from '@mui/icons-material/PlayCircleOutline'
import RefreshIcon from '@mui/icons-material/RefreshRounded'
import { api, type CompositionArtifactResult, type ProjectGraph } from '../../lib/api'
import { graphToView, topoSortDraft } from '../../lib/engineering'
import { JsonBox, Panel, SectionHeader } from './shared'

/**
 * Project Composer (Misión 15) — crea proyectos UES compuestos (specRef o
 * generate), muestra el ORDEN TOPOLÓGICO del borrador (presentación; la
 * validación real es del backend) y el grafo REAL del proyecto registrado
 * (GET /projects/:id/graph). Componer = POST /compositions del backend.
 */

const TYPES = ['agent', 'workflow', 'multi-agent-system', 'prompt-system', 'tool-collection', 'knowledge-base', 'rag-system', 'mcp-server', 'skill-pack', 'evaluation', 'harness', 'framework', 'api-platform', 'application', 'agentic-app', 'saas']

interface DraftArtifact {
  ref: string
  type: string
  mode: 'specRef' | 'generate'
  kind: string
  id: string
  version: string
  generateJson: string
  deps: string
}

const EMPTY_ROW: DraftArtifact = { ref: '', type: 'agent', mode: 'specRef', kind: 'Agent', id: '', version: '', generateJson: '{}', deps: '' }

export default function Composer(): ReactNode {
  const [projects, setProjects] = useState<Array<{ id: string; version?: string; lifecycle?: string; artifacts?: number }>>([])
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [graph, setGraph] = useState<ProjectGraph | null>(null)
  const [graphError, setGraphError] = useState<string | null>(null)

  const [metaId, setMetaId] = useState('')
  const [metaName, setMetaName] = useState('')
  const [metaVersion, setMetaVersion] = useState('1.0.0')
  const [rows, setRows] = useState<DraftArtifact[]>([{ ...EMPTY_ROW }])
  const [composing, setComposing] = useState(false)
  const [composed, setComposed] = useState<CompositionArtifactResult[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadProjects = useCallback(() => {
    api.eng
      .projects()
      .then((r) => setProjects(Array.isArray(r) ? r : r.projects ?? []))
      .catch(() => setProjects([]))
  }, [])

  useEffect(loadProjects, [loadProjects])

  const loadGraph = useCallback((id: string) => {
    setSelectedProject(id)
    setGraphError(null)
    api.eng
      .projectGraph(id)
      .then(setGraph)
      .catch(() => setGraphError('No se pudo cargar el grafo del proyecto.'))
  }, [])

  const topo = useMemo(() => topoSortDraft(rows.map((r) => ({ ref: r.ref, dependencies: (r.deps || '').split(',').map((d) => d.trim()).filter(Boolean).map((ref) => ({ ref })) }))), [rows])

  const patchRow = (idx: number, patch: Partial<DraftArtifact>) => {
    setRows((rs) => rs.map((r, i) => (i === idx ? { ...r, ...patch } : r)))
  }

  const compose = async () => {
    setComposing(true)
    setError(null)
    setComposed(null)
    try {
      const artifacts = rows.map((r) => ({
        ref: r.ref,
        type: r.type,
        dependencies: (r.deps || '').split(',').map((d) => d.trim()).filter(Boolean).map((ref) => ({ ref })),
        ...(r.mode === 'specRef'
          ? { specRef: { id: r.id, kind: r.kind, ...(r.version ? { version: r.version } : {}) } }
          : { generate: JSON.parse(r.generateJson || '{}') as Record<string, unknown> }),
      }))
      const project = {
        apiVersion: 'uiep.io/ues/v1',
        kind: 'Project',
        metadata: { id: metaId, name: metaName || metaId, version: metaVersion },
        artifacts,
      }
      const r = await api.eng.compose(project)
      setComposed(r.artifacts)
      loadProjects()
      loadGraph(r.projectId)
    } catch (e) {
      const payload = (e as { payload?: { error?: unknown; details?: unknown } }).payload
      setError(JSON.stringify(payload ?? (e as Error).message).slice(0, 400))
    } finally {
      setComposing(false)
    }
  }

  const flowNodes: FlowNode[] = useMemo(() => {
    if (!graph) {
      return []
    }
    const { nodes } = graphToView(graph)
    return nodes.map((n) => ({
      id: n.id,
      position: { x: n.x, y: n.y },
      data: { label: `${n.label}\n${n.type}${n.version ? ` @${n.version}` : ''}` },
      style: {
        background: n.found ? 'rgba(79,125,255,0.14)' : 'rgba(242,78,93,0.16)',
        border: `1px solid ${n.found ? '#4f7dff' : '#f24e5d'}`,
        borderRadius: 10,
        color: '#e8ebf6',
        fontSize: 11,
        whiteSpace: 'pre-line',
        padding: 8,
      },
    }))
  }, [graph])

  const flowEdges: FlowEdge[] = useMemo(() => {
    if (!graph) {
      return []
    }
    const { edges } = graphToView(graph)
    return edges.map((e, i) => ({
      id: `e${i}`,
      source: e.from,
      target: e.to,
      markerEnd: { type: MarkerType.ArrowClosed, color: '#3b4a6b' },
      style: { stroke: '#3b4a6b' },
    }))
  }, [graph])

  return (
    <Stack spacing={2}>
      <Panel>
        <SectionHeader
          title="Project Composer"
          subtitle="Componer proyectos UES reutilizando artefactos (specRef) o generándolos (generate) — orden topológico garantizado por el backend."
          action={<RefreshIcon onClick={loadProjects} color="primary" sx={{ cursor: 'pointer' }} />}
        />
        {projects.length > 0 && (
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 2 }}>
            {projects.map((p) => (
              <Chip
                key={p.id}
                label={`${p.id}${p.version ? ` @${p.version}` : ''}`}
                onClick={() => loadGraph(p.id)}
                variant={selectedProject === p.id ? 'filled' : 'outlined'}
                color={selectedProject === p.id ? 'primary' : 'default'}
                size="small"
              />
            ))}
          </Stack>
        )}

        {graph && (
          <Box sx={{ height: 300, border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 2, overflow: 'hidden' }}>
            <ReactFlow nodes={flowNodes} edges={flowEdges} fitView proOptions={{ hideAttribution: true }} nodesDraggable={false} nodesConnectable={false}>
              <Background color="#1e293b" gap={18} />
              <Controls showInteractive={false} />
            </ReactFlow>
          </Box>
        )}
        {graphError && <Alert severity="error" sx={{ mb: 2 }}>{graphError}</Alert>}

        <Divider sx={{ my: 2 }}>
          <Typography variant="caption" color="text.secondary">NUEVA COMPOSICIÓN</Typography>
        </Divider>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 1.5 }}>
          <TextField size="small" label="id del proyecto" value={metaId} onChange={(e) => setMetaId(e.target.value)} slotProps={{ input: { sx: { fontFamily: 'ui-monospace, Menlo, monospace' } } }} />
          <TextField size="small" label="nombre" value={metaName} onChange={(e) => setMetaName(e.target.value)} />
          <TextField size="small" label="versión" value={metaVersion} onChange={(e) => setMetaVersion(e.target.value)} sx={{ maxWidth: 120 }} />
        </Stack>

        {rows.map((r, i) => (
          <Paper key={i} variant="outlined" sx={{ p: 1.5, mb: 1.5, bgcolor: 'rgba(5,7,15,0.4)' }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ alignItems: { md: 'center' } }}>
              <TextField size="small" label="ref" value={r.ref} onChange={(e) => patchRow(i, { ref: e.target.value })} sx={{ maxWidth: 140 }} slotProps={{ input: { sx: { fontFamily: 'ui-monospace, Menlo, monospace' } } }} />
              <FormControl size="small" sx={{ maxWidth: 190 }}>
                <InputLabel>tipo</InputLabel>
                <Select label="tipo" value={r.type} onChange={(e) => patchRow(i, { type: e.target.value })}>
                  {TYPES.map((t) => (
                    <MenuItem key={t} value={t}>{t}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ maxWidth: 140 }}>
                <InputLabel>modo</InputLabel>
                <Select label="modo" value={r.mode} onChange={(e) => patchRow(i, { mode: e.target.value as DraftArtifact['mode'] })}>
                  <MenuItem value="specRef">specRef (reutilizar)</MenuItem>
                  <MenuItem value="generate">generate (crear)</MenuItem>
                </Select>
              </FormControl>
              <TextField size="small" label="dependencias (refs,)" value={r.deps} onChange={(e) => patchRow(i, { deps: e.target.value })} sx={{ maxWidth: 200 }} slotProps={{ input: { sx: { fontFamily: 'ui-monospace, Menlo, monospace' } } }} />
              {rows.length > 1 && (
                <Tooltip title="Quitar">
                  <IconButton onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))} size="small">
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
            {r.mode === 'specRef' ? (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1 }}>
                <TextField size="small" label="kind" value={r.kind} onChange={(e) => patchRow(i, { kind: e.target.value })} sx={{ maxWidth: 170 }} />
                <TextField size="small" label="id registrado" value={r.id} onChange={(e) => patchRow(i, { id: e.target.value })} slotProps={{ input: { sx: { fontFamily: 'ui-monospace, Menlo, monospace' } } }} />
                <TextField size="small" label="versión (opcional)" value={r.version} onChange={(e) => patchRow(i, { version: e.target.value })} sx={{ maxWidth: 140 }} />
              </Stack>
            ) : (
              <TextField
                size="small"
                label='entrada generate (JSON — usa "$ref:otro-ref" para referenciar)'
                value={r.generateJson}
                onChange={(e) => patchRow(i, { generateJson: e.target.value })}
                multiline
                minRows={2}
                maxRows={6}
                fullWidth
                sx={{ mt: 1 }}
                slotProps={{ input: { sx: { fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 12 } } }}
              />
            )}
          </Paper>
        ))}

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: { sm: 'center' } }}>
          <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={() => setRows((rs) => [...rs, { ...EMPTY_ROW }])}>
            Añadir artefacto
          </Button>
          <Button variant="contained" startIcon={<PlayIcon />} disabled={composing || !topo.ok || !metaId} onClick={compose}>
            {composing ? 'Componiendo…' : 'Componer proyecto'}
          </Button>
          <Chip
            size="small"
            variant="outlined"
            label={topo.ok ? `orden topológico: ${topo.order.join(' → ')}` : `CICLO: ${topo.cycle.join(' → ')}`}
            color={topo.ok ? 'default' : 'error'}
            sx={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 11 }}
          />
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            <JsonBox data={error} max={140} />
          </Alert>
        )}
        {composed && (
          <Alert severity="success" sx={{ mt: 2 }}>
            Proyecto registrado — {composed.map((a) => `${a.ref}:${a.action}`).join(' · ')}
          </Alert>
        )}
      </Panel>
    </Stack>
  )
}
