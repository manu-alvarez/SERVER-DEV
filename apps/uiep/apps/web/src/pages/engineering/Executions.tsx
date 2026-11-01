import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Alert, Button, Chip, FormControl, IconButton, InputLabel, LinearProgress, MenuItem, Select, Stack, TextField, Tooltip, Typography } from '@mui/material'
import RefreshIcon from '@mui/icons-material/RefreshRounded'
import CancelIcon from '@mui/icons-material/CancelOutlined'
import HealingIcon from '@mui/icons-material/HealingRounded'
import PlayIcon from '@mui/icons-material/PlayCircleOutline'
import { api, type ExecutionRecord, type SandboxStatus } from '../../lib/api'
import { truncate } from '../../lib/engineering'
import { JsonBox, KV, Panel, SectionHeader, StateChip } from './shared'

/**
 * Execution Center (Misión 15) — ejecuciones REALES en el sandbox aislado:
 * lanzar (por artefacto), consultar (estado/métricas/logs), cancelar y
 * reconciliar runs zombis. Sin simulaciones: si el sandbox no está, se dice.
 */

const RUN_KINDS = [
  { kind: 'agentic-app', label: 'Agentic App (agentes + workflow reales)', needs: 'id de la app' },
  { kind: 'api-platform', label: 'API Runtime (invocar endpoint del contrato)', needs: 'id del contrato + endpointId' },
  { kind: 'evaluation', label: 'Dataset (evaluar agente, requiere agentSpecId)', needs: 'id del dataset + agentSpecId' },
  { kind: 'harness', label: 'Harness (fixtures, requiere agentSpecId)', needs: 'id del harness + agentSpecId' },
]

export default function Executions(): ReactNode {
  const [sandbox, setSandbox] = useState<SandboxStatus | null>(null)
  const [executions, setExecutions] = useState<Array<ExecutionRecord['status'] extends never ? never : { runId: string; kind: string; artifact: { kind: string; id: string; version: string }; status: ExecutionRecord['status']; durationMs: number | null; startedAt: string; error?: string | null }>>([])
  const [detail, setDetail] = useState<ExecutionRecord | null>(null)
  const [kind, setKind] = useState('agentic-app')
  const [artifactId, setArtifactId] = useState('')
  const [input, setInput] = useState('')
  const [agentSpecId, setAgentSpecId] = useState('')
  const [endpointId, setEndpointId] = useState('')
  const [timeoutMs, setTimeoutMs] = useState('300000')
  const [busy, setBusy] = useState(false)
  const [reconciling, setReconciling] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = useCallback(() => {
    api.eng.sandbox().then(setSandbox).catch(() => setSandbox(null))
    api.eng
      .executions(30)
      .then((r) => setExecutions(r.executions))
      .catch(() => setExecutions([]))
  }, [])

  useEffect(() => {
    load()
    // Auto-refresco mientras haya runs en curso (polling ligero).
    pollRef.current = setInterval(load, 15_000)
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
      }
    }
  }, [load])

  const launch = async () => {
    setBusy(true)
    setError(null)
    setMessage(null)
    setDetail(null)
    try {
      const invocation: Record<string, unknown> = { timeoutMs: Number(timeoutMs) || 300000 }
      if (input) {
        invocation.input = input
      }
      if (agentSpecId) {
        invocation.agentSpecId = agentSpecId
      }
      if (endpointId) {
        invocation.endpointId = endpointId
      }
      const rec = await api.eng.run(kind, artifactId, invocation)
      setMessage(`Ejecución ${rec.runId} terminó: ${rec.status}`)
      setDetail(rec)
      load()
    } catch (e) {
      const payload = (e as { payload?: { error?: unknown; detail?: unknown } }).payload
      setError(JSON.stringify(payload ?? (e as Error).message).slice(0, 300))
      load()
    } finally {
      setBusy(false)
    }
  }

  const cancel = async (runId: string) => {
    try {
      await api.eng.cancelExecution(runId)
      setMessage(`Cancelación solicitada para ${runId}.`)
      load()
    } catch {
      setError(`No se pudo cancelar ${runId} (¿ya terminó?).`)
    }
  }

  const reconcile = async () => {
    setReconciling(true)
    try {
      const r = await api.eng.reconcile()
      setMessage(r.reconciled.length > 0 ? `Reconciliados ${r.reconciled.length} run(s) zombi(s).` : 'Sin runs zombis (todo limpio).')
      load()
    } catch {
      setError('No se pudo reconciliar.')
    } finally {
      setReconciling(false)
    }
  }

  const openDetail = async (runId: string) => {
    try {
      setDetail(await api.eng.execution(runId))
    } catch {
      setError(`No se pudo cargar ${runId}.`)
    }
  }

  return (
    <Stack spacing={2}>
      <Panel>
        <SectionHeader
          title="Execution Center"
          subtitle="Ejecución aislada en el contenedor uiep-sandbox (red interna sin salida, límites duros). Fail-closed."
          action={<RefreshIcon onClick={load} color="primary" sx={{ cursor: 'pointer' }} />}
        />
        {sandbox && (
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', mb: 2 }}>
            <Chip size="small" label={sandbox.configured ? 'sandbox configurado' : 'SANDBOX NO CONFIGURADO (503)'} color={sandbox.configured ? 'success' : 'error'} variant="outlined" />
            <Chip size="small" label={sandbox.healthy ? 'healthy' : 'sin respuesta'} color={sandbox.healthy ? 'success' : 'warning'} variant="outlined" />
            <Typography variant="caption" color="text.secondary">{sandbox.note}</Typography>
          </Stack>
        )}

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ alignItems: { md: 'center' }, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 260 }}>
            <InputLabel>Tipo de ejecución</InputLabel>
            <Select label="Tipo de ejecución" value={kind} onChange={(e) => setKind(e.target.value)}>
              {RUN_KINDS.map((k) => (
                <MenuItem key={k.kind} value={k.kind}>{k.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField size="small" label="id del artefacto" value={artifactId} onChange={(e) => setArtifactId(e.target.value)} slotProps={{ input: { sx: { fontFamily: 'ui-monospace, Menlo, monospace' } } }} />
          {kind === 'api-platform' && (
            <TextField size="small" label="endpointId" value={endpointId} onChange={(e) => setEndpointId(e.target.value)} sx={{ maxWidth: 150 }} slotProps={{ input: { sx: { fontFamily: 'ui-monospace, Menlo, monospace' } } }} />
          )}
          {(kind === 'evaluation' || kind === 'harness') && (
            <TextField size="small" label="agentSpecId objetivo" value={agentSpecId} onChange={(e) => setAgentSpecId(e.target.value)} sx={{ maxWidth: 200 }} slotProps={{ input: { sx: { fontFamily: 'ui-monospace, Menlo, monospace' } } }} />
          )}
          <TextField size="small" label="timeoutMs" value={timeoutMs} onChange={(e) => setTimeoutMs(e.target.value)} sx={{ maxWidth: 130 }} slotProps={{ input: { sx: { fontFamily: 'ui-monospace, Menlo, monospace' } } }} />
        </Stack>
        {kind !== 'api-platform' && (
          <TextField
            size="small"
            label="entrada (input) para la ejecución"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            fullWidth
            sx={{ mt: 1.5 }}
          />
        )}
        <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
          <Button variant="contained" startIcon={<PlayIcon />} disabled={busy || !artifactId} onClick={launch}>
            {busy ? 'Ejecutando…' : 'Ejecutar en el sandbox'}
          </Button>
          <Tooltip title="Cierra como failed los runs 'running' cuyo job ya no existe en el sandbox (también corre automático cada 5 min).">
            <Button variant="outlined" startIcon={<HealingIcon />} disabled={reconciling} onClick={reconcile}>
              {reconciling ? 'Reconciliando…' : 'Reconciliar runs zombis'}
            </Button>
          </Tooltip>
        </Stack>
        {busy && <LinearProgress sx={{ mt: 2 }} />}
        {message && <Alert severity="info" sx={{ mt: 2 }}>{message}</Alert>}
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </Panel>

      {detail && (
        <Panel>
          <SectionHeader
            title={`Ejecución ${detail.runId}`}
            action={detail.status === 'running' || detail.status === 'queued' ? (
              <Button size="small" color="error" startIcon={<CancelIcon />} onClick={() => cancel(detail.runId)}>
                Cancelar
              </Button>
            ) : undefined}
          />
          <Stack spacing={1}>
            <KV k="Artefacto" v={`${detail.artifact.kind}/${detail.artifact.id}@${detail.artifact.version}`} />
            <KV k="Estado" v={<StateChip kind="execution" state={detail.status} />} />
            <KV k="Duración" v={`${detail.durationMs ?? '—'} ms`} />
            <KV k="Sandbox" v={detail.sandbox.image} />
            {detail.error && <Alert severity={detail.error.startsWith('orphan') ? 'warning' : 'error'}>{detail.error}</Alert>}
            {detail.result && <JsonBox data={detail.result} max={300} />}
            {detail.logs && detail.logs.length > 0 && <JsonBox data={detail.logs} max={120} />}
          </Stack>
        </Panel>
      )}

      <Panel>
        <SectionHeader title="Ejecuciones recientes" subtitle="Registro del backend (tolerante a fallos del sandbox)." />
        <Stack spacing={0.8}>
          {executions.length === 0 && <Typography variant="body2" color="text.secondary">Sin ejecuciones todavía.</Typography>}
          {executions.map((e) => (
            <Stack key={e.runId} direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0.5, sm: 1.5 }} sx={{ alignItems: { sm: 'center' } }}>
              <Button size="small" variant="text" onClick={() => openDetail(e.runId)} sx={{ fontFamily: 'ui-monospace, Menlo, monospace', justifyContent: 'flex-start', minWidth: 200 }}>
                {e.runId}
              </Button>
              <Chip size="small" label={e.kind} variant="outlined" sx={{ fontSize: 11 }} />
              <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'ui-monospace, Menlo, monospace' }}>
                {e.artifact.id}
              </Typography>
              <StateChip kind="execution" state={e.status} />
              {e.durationMs !== null && <Typography variant="caption" color="text.disabled">{e.durationMs} ms</Typography>}
              {(e.status === 'running' || e.status === 'queued') && (
                <IconButton size="small" onClick={() => cancel(e.runId)} aria-label="cancelar">
                  <CancelIcon fontSize="small" />
                </IconButton>
              )}
              {e.error && <Typography variant="caption" color="text.secondary">{truncate(e.error, 60)}</Typography>}
            </Stack>
          ))}
        </Stack>
      </Panel>
    </Stack>
  )
}
