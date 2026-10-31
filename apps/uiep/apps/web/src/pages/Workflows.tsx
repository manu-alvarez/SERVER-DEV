import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import PlayIcon from '@mui/icons-material/PlayArrowRounded'
import StopIcon from '@mui/icons-material/StopCircleOutlined'
import ReplayIcon from '@mui/icons-material/ReplayRounded'
import RefreshIcon from '@mui/icons-material/Refresh'
import CheckIcon from '@mui/icons-material/CheckCircleRounded'
import ErrorIcon from '@mui/icons-material/ErrorRounded'
import PendingIcon from '@mui/icons-material/ScheduleRounded'
import SkipIcon from '@mui/icons-material/SkipNextRounded'
import { api, ApiError, type SpecSummary, type WorkflowNodeStep, type WorkflowRunRecord, type WorkflowRunSummary } from '../lib/api'
import { fmtDate, fmtDuration } from '../theme'

/**
 * Workflows (Fase 6): administración del motor de orquestación propio.
 * El editor MVP es JSON (con validación del contrato en el backend): el
 * producto pidió motor determinista primero y experiencia visual después.
 * Inspector por nodo: estado, intentos, entrada renderizada, salida, error y
 * trazabilidad hacia la sesión/run del agente.
 */

const wfStatusColor = (s: WorkflowRunRecord['status']) =>
  s === 'completed' ? 'success' : s === 'failed' ? 'error' : s === 'cancelled' ? 'warning' : 'primary'

const nodeStatus = (s: WorkflowNodeStep['status']) =>
  s === 'completed' ? 'success' : s === 'failed' ? 'error' : s === 'running' ? 'primary' : s === 'cancelled' ? 'warning' : s === 'skipped' ? 'default' : 'default'

export default function Workflows(): ReactNode {
  const [specs, setSpecs] = useState<SpecSummary[] | null>(null)
  const [runs, setRuns] = useState<WorkflowRunSummary[]>([])
  const [openRun, setOpenRun] = useState<string | null>(null)
  const [runDetail, setRunDetail] = useState<WorkflowRunRecord | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  /* Editor */
  const [editorOpen, setEditorOpen] = useState(false)
  const [json, setJson] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  /* Ejecutar */
  const [runInput, setRunInput] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)

  const load = useCallback(() => {
    api.workflows.list().then(setSpecs).catch(() => setSpecs([]))
    api.workflows.runs().then(setRuns).catch(() => setRuns([]))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  /* Poll del run abierto mientras corre */
  useEffect(() => {
    if (!openRun) return
    const tick = async () => {
      try {
        const r = await api.workflows.runDetail(openRun)
        setRunDetail(r)
        if (r.status !== 'running' && r.status !== 'cancelling') {
          stop()
          load()
        }
      } catch {
        /* próximo intento */
      }
    }
    const stop = () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
    pollRef.current = setInterval(() => void tick(), 2500)
    void tick()
    return stop
  }, [openRun, load])

  const openEditor = async (id: string | null) => {
    setSaveError(null)
    if (id) {
      try {
        const doc = await api.workflows.get(id)
        setJson(JSON.stringify(doc, null, 2))
        setEditingId(id)
      } catch {
        setSaveError(`No se pudo cargar ${id}.`)
        return
      }
    } else {
      setJson(JSON.stringify(EMPTY_WF, null, 2))
      setEditingId(null)
    }
    setEditorOpen(true)
  }

  const save = async () => {
    setSaving(true)
    setSaveError(null)
    try {
      const doc = JSON.parse(json)
      await api.workflows.save(doc)
      setEditorOpen(false)
      load()
    } catch (err) {
      if (err instanceof ApiError && err.payload && typeof err.payload === 'object') {
        setSaveError(`WorkflowSpec rechazado: ${JSON.stringify(err.payload).slice(0, 600)}`)
      } else if (err instanceof SyntaxError) {
        setSaveError(`JSON inválido: ${err.message}`)
      } else {
        setSaveError('Fallo al guardar.')
      }
    } finally {
      setSaving(false)
    }
  }

  const run = async (id: string) => {
    setActionError(null)
    try {
      const r = await api.workflows.run(id, runInput.trim() || 'entrada del workflow')
      setOpenRun(r.workflowRunId)
      setRunDetail(null)
    } catch (err) {
      setActionError(pretty(err))
    }
  }

  const act = async (fn: () => Promise<unknown>) => {
    setActionError(null)
    try {
      await fn()
      load()
    } catch (err) {
      setActionError(pretty(err))
    }
  }

  return (
    <Stack spacing={2.6}>
      <Stack direction="row" sx={{ alignItems: 'center' }}>
        <Typography variant="h4">Workflows</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Button onClick={() => void openEditor(null)} startIcon={<PlayIcon sx={{ transform: 'rotate(180deg)' }} />}>
          Nuevo workflow
        </Button>
        <Tooltip title="Recargar">
          <IconButton onClick={load}><RefreshIcon /></IconButton>
        </Tooltip>
      </Stack>
      <Typography color="text.secondary" fontSize={14.6} maxWidth={860}>
        Motor de orquestación propio y determinista: nodos <code>agent</code> (pipeline completo del agente),
        <code> condition</code> (predicados deterministas) y <code>parallel</code> (con tope de concurrencia).
        Ejecución persistente con reintentos, timeout, cancelación en punto seguro y reanudación.
      </Typography>

      {actionError && <Alert severity="error" onClose={() => setActionError(null)}>{actionError}</Alert>}

      {/* Editor JSON */}
      {editorOpen && (
        <Card>
          <CardContent sx={{ p: 2.4, '&:last-child': { pb: 2.4 } }}>
            <Stack direction="row" sx={{ alignItems: 'center', mb: 1.2 }}>
              <Typography variant="h6">{editingId ? `Editar workflow · ${editingId}` : 'Nuevo WorkflowSpec'}</Typography>
              <Box sx={{ flexGrow: 1 }} />
              <Button onClick={() => setEditorOpen(false)}>Cancelar</Button>
              <Button variant="contained" onClick={() => void save()} disabled={saving}>
                {saving ? 'Guardando…' : 'Validar y registrar'}
              </Button>
            </Stack>
            {saveError && <Alert severity="error" sx={{ mb: 1.2 }}>{saveError}</Alert>}
            <TextField
              value={json}
              onChange={(e) => setJson(e.target.value)}
              multiline
              fullWidth
              minRows={16}
              slotProps={{ input: { sx: { fontFamily: 'ui-monospace, monospace', fontSize: 12.5 } } }}
            />
          </CardContent>
        </Card>
      )}

      {/* Listado de specs */}
      {specs === null && <LinearProgress />}
      {specs?.length === 0 && !editorOpen && <Alert severity="info">Sin WorkflowSpecs. Crea el primero.</Alert>}
      <Stack spacing={1.4}>
        {specs?.map((w) => (
          <Card key={w.id}>
            <CardContent sx={{ p: 2.2, '&:last-child': { pb: 2.2 } }}>
              <Stack direction="row" sx={{ alignItems: 'center', gap: 1.2, flexWrap: 'wrap' }}>
                <Typography variant="h6" fontSize={15.5}>{w.name} <code style={{ opacity: 0.65, fontSize: 12 }}>{w.id}</code></Typography>
                <Chip size="small" variant="outlined" label={`v${w.version}`} />
                <Box sx={{ flexGrow: 1 }} />
                <Button size="small" onClick={() => void openEditor(w.id)}>Editar</Button>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<PlayIcon />}
                  onClick={() => void run(w.id)}
                >
                  Ejecutar
                </Button>
              </Stack>
              {w.description && <Typography fontSize={13} color="text.secondary" sx={{ mt: 0.4 }}>{w.description}</Typography>}
            </CardContent>
          </Card>
        ))}
      </Stack>

      {/* Ejecutar: entrada */}
      <Card>
        <CardContent sx={{ p: 2.2, '&:last-child': { pb: 2.2 } }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            {'Entrada para la próxima ejecución ({{input}} del workflow)'}
          </Typography>
          <TextField
            fullWidth
            size="small"
            value={runInput}
            onChange={(e) => setRunInput(e.target.value)}
            placeholder="Entrada del workflow…"
          />
        </CardContent>
      </Card>

      {/* Ejecuciones */}
      <Typography variant="h6">Ejecuciones ({runs.length})</Typography>
      <Stack spacing={1.2}>
        {runs.map((r) => (
          <Paper
            key={r.workflowRunId}
            variant="outlined"
            onClick={() => setOpenRun(r.workflowRunId)}
            sx={{ p: 1.6, cursor: 'pointer', bgcolor: openRun === r.workflowRunId ? 'rgba(124,140,255,0.08)' : 'transparent', '&:hover': { borderColor: 'primary.main' } }}
          >
            <Stack direction="row" sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Chip size="small" color={wfStatusColor(r.status)} variant="status" label={r.status.toUpperCase()} />
              <code style={{ fontSize: 12, opacity: 0.7 }}>{r.workflowRunId}</code>
              <Typography fontSize={13.4}>{r.workflowId} · v{r.workflowVersion}</Typography>
              <Chip size="small" variant="outlined" label={`${r.nodesDone}/${r.nodesTotal} nodos`} />
              <Box sx={{ flexGrow: 1 }} />
              {r.status === 'running' || r.status === 'cancelling' ? (
                <Button
                  size="small"
                  color="warning"
                  startIcon={<StopIcon />}
                  onClick={(e) => {
                    e.stopPropagation()
                    void act(() => api.workflows.cancel(r.workflowRunId))
                  }}
                >
                  Cancelar
                </Button>
              ) : (
                <Button
                  size="small"
                  startIcon={<ReplayIcon />}
                  onClick={(e) => {
                    e.stopPropagation()
                    void act(() => api.workflows.resume(r.workflowRunId))
                  }}
                >
                  Reanudar
                </Button>
              )}
            </Stack>
            {r.output && <Typography fontSize={12.6} color="text.secondary" noWrap sx={{ mt: 0.5 }}>{r.output}</Typography>}
            <Typography variant="caption" color="text.secondary">
              {fmtDate(r.startedAt)}{r.finishedAt ? ` → ${fmtDate(r.finishedAt)}` : ' · en curso'}
            </Typography>
          </Paper>
        ))}
        {runs.length === 0 && <Typography color="text.secondary" fontSize={14}>Sin ejecuciones todavía.</Typography>}
      </Stack>

      {/* Inspector del run abierto */}
      {openRun && runDetail && (
        <Card>
          <CardContent sx={{ p: 2.4, '&:last-child': { pb: 2.4 } }}>
            <Stack direction="row" sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1.6 }}>
              <Typography variant="h6">Inspector · <code>{runDetail.workflowRunId}</code></Typography>
              <Chip size="small" color={wfStatusColor(runDetail.status)} variant="status" label={runDetail.status.toUpperCase()} />
              <Chip size="small" variant="outlined" label={`wf: ${runDetail.workflowId} v${runDetail.workflowVersion}`} />
              <Box sx={{ flexGrow: 1 }} />
              <Button size="small" onClick={() => { setOpenRun(null); setRunDetail(null) }}>Cerrar</Button>
            </Stack>
            <Stack spacing={1.2}>
              {runDetail.order.map((nodeId) => {
                const s = runDetail.steps[nodeId]
                if (!s) return null
                const icon =
                  s.status === 'completed' ? <CheckIcon fontSize="small" /> :
                  s.status === 'failed' ? <ErrorIcon fontSize="small" /> :
                  s.status === 'running' ? <PendingIcon fontSize="small" /> :
                  <SkipIcon fontSize="small" />
                return (
                  <Box key={nodeId} sx={{ p: 1.4, border: 1, borderColor: 'divider', borderRadius: 2, bgcolor: 'rgba(124,140,255,0.04)' }}>
                    <Stack direction="row" sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      {icon}
                      <Typography fontSize={14} fontWeight={600}>{nodeId}</Typography>
                      <Chip size="small" variant="outlined" label={s.type} />
                      <Chip size="small" color={nodeStatus(s.status)} variant="status" label={s.status.toUpperCase()} />
                      {s.attempts > 1 && <Chip size="small" variant="outlined" label={`${s.attempts} intentos`} />}
                      {s.durationMs !== undefined && <Chip size="small" variant="outlined" label={fmtDuration(s.durationMs)} />}
                      <Box sx={{ flexGrow: 1 }} />
                      {s.agentExecutionId && (
                        <Tooltip title={`sesión ${s.agentSessionId ?? ''}`}>
                          <Chip size="small" variant="outlined" label={`agente: ${s.agentExecutionId.slice(0, 14)}…`} />
                        </Tooltip>
                      )}
                    </Stack>
                    {s.renderedInput && (
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }} noWrap>
                        in: {s.renderedInput.slice(0, 160)}
                      </Typography>
                    )}
                    {s.output && (
                      <Typography fontSize={12.8} sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                        out: {s.output.slice(0, 300)}{s.output.length > 300 ? '…' : ''}
                      </Typography>
                    )}
                    {s.error && <Alert severity="error" sx={{ mt: 0.6 }}>{s.error}</Alert>}
                    {s.branchOutputs && (
                      <Stack spacing={0.6} sx={{ mt: 0.6 }}>
                        {s.branchOutputs.map((b) => (
                          <Typography key={b.nodeId} variant="caption" color="text.secondary">
                            rama {b.nodeId}: {b.ok ? 'OK' : `FALLO — ${b.error}`} {b.output ? `· ${b.output.slice(0, 80)}` : ''}
                          </Typography>
                        ))}
                      </Stack>
                    )}
                  </Box>
                )
              })}
            </Stack>
            {runDetail.errors.length > 0 && (
              <Alert severity="warning" sx={{ mt: 1.6 }}>
                {runDetail.errors.map((e, i) => <Box key={i} component="div" fontSize={12.4}>{e}</Box>)}
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
      {openRun && !runDetail && <LinearProgress />}
    </Stack>
  )
}

const EMPTY_WF = {
  apiVersion: 'uiep.io/v1',
  kind: 'Workflow',
  metadata: { id: 'mi-workflow', name: 'Mi workflow', version: '1.0.0' },
  spec: {
    start: 'nodo-1',
    nodes: [
      { id: 'nodo-1', type: 'agent', agentSpecId: 'mi-agente', input: '{{input}}', retries: 0 },
      { id: 'nodo-2', type: 'agent', agentSpecId: 'mi-agente', input: 'Anterior: {{prev}}', retries: 0 },
    ],
  },
}

function pretty(err: unknown): string {
  if (err instanceof ApiError) {
    return `Error ${err.status}: ${JSON.stringify(err.payload).slice(0, 200)}`
  }
  return 'Fallo de red.'
}
