import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Alert, Box, Button, Chip, LinearProgress, MenuItem, Stack, TextField, Typography } from '@mui/material'
import RocketIcon from '@mui/icons-material/RocketLaunchRounded'
import StopIcon from '@mui/icons-material/StopCircleOutlined'
import UndoIcon from '@mui/icons-material/UndoRounded'
import HealthIcon from '@mui/icons-material/MonitorHeartOutlined'
import PlayIcon from '@mui/icons-material/PlayCircleOutlineRounded'
import RefreshIcon from '@mui/icons-material/RefreshRounded'
import { api, type DeploymentRecord } from '../../lib/api'
import { truncate } from '../../lib/engineering'
import { JsonBox, Panel, SectionHeader, StateChip } from './shared'

/**
 * Deployment Engine (Misión FINAL): despliegues CONTROLADOS de artefactos
 * ejecutables (AgenticApp/ApiPlatform) al runtime del sandbox — con health
 * check real, historial de versiones, rollback y aislamiento por tenant.
 * SIN routing público (decisión de seguridad): solo operadores autorizados.
 */

export default function Deployments(): ReactNode {
  const [deployments, setDeployments] = useState<DeploymentRecord[] | null>(null)
  const [kind, setKind] = useState('AgenticApp')
  const [id, setId] = useState('')
  const [version, setVersion] = useState('')
  const [invocationText, setInvocationText] = useState('{"input":"turno del deployment"}')
  const [runResult, setRunResult] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const load = useCallback(() => {
    api.eng
      .deployments.list()
      .then((r) => setDeployments(r.deployments))
      .catch((e) => {
        setError((e as { status?: number }).status === 403 ? 'Sin permiso de deployments.' : 'No se pudo cargar la lista.')
        setDeployments([])
      })
  }, [])

  useEffect(load, [load])

  const act = async (fn: () => Promise<unknown>, okMsg: string) => {
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      await fn
      setMessage(okMsg)
      load()
    } catch (e) {
      const payload = (e as { payload?: { error?: string } }).payload
      setError(truncate(JSON.stringify(payload ?? (e as Error).message), 160))
    } finally {
      setBusy(false)
    }
  }

  const invoke = async (deploymentId: string) => {
    setBusy(true)
    setError(null)
    setRunResult(null)
    try {
      const inv = JSON.parse(invocationText) as Record<string, unknown>
      const run = await api.eng.deployments.invoke(deploymentId, inv)
      setRunResult(`${run.runId}: ${run.status}\n${JSON.stringify(run.result ?? {}, null, 2).slice(0, 800)}`)
      load()
    } catch (e) {
      setError(truncate(JSON.stringify((e as { payload?: unknown }).payload ?? (e as Error).message), 200))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Panel>
      <SectionHeader
        title="Deployment Engine"
        subtitle="Despliegues controlados al runtime del sandbox (health checks, versiones, rollback). SIN routing público — decisión de seguridad."
        action={<RefreshIcon onClick={load} color="primary" sx={{ cursor: 'pointer' }} />}
      />
      {busy && <LinearProgress sx={{ mb: 2 }} />}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 2, alignItems: { md: 'center' }, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          select
          label="tipo"
          value={kind}
          onChange={(e) => setKind(e.target.value)}
          sx={{ maxWidth: 170 }}
          SelectProps={{ MenuProps: { PaperProps: { sx: { maxHeight: 160 } } } }}
        >
          {['AgenticApp', 'ApiPlatform'].map((k) => (
            <MenuItem key={k} value={k}>{k}</MenuItem>
          ))}
        </TextField>
        <TextField size="small" label="id del artefacto" value={id} onChange={(e) => setId(e.target.value)} slotProps={{ input: { sx: { fontFamily: 'ui-monospace, Menlo, monospace' } } }} />
        <TextField size="small" label="versión (opcional)" value={version} onChange={(e) => setVersion(e.target.value)} sx={{ maxWidth: 140 }} slotProps={{ input: { sx: { fontFamily: 'ui-monospace, Menlo, monospace' } } }} />
        <TextField
          size="small"
          label="invocación (JSON)"
          value={invocationText}
          onChange={(e) => setInvocationText(e.target.value)}
          sx={{ minWidth: 280 }}
          slotProps={{ input: { sx: { fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 12 } } }}
        />
        <TextField
          size="small"
          label="invocación (JSON)"
          value={invocationText}
          onChange={(e) => setInvocationText(e.target.value)}
          sx={{ minWidth: 280 }}
          slotProps={{ input: { sx: { fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 12 } } }}
        />
        <Button variant="contained" startIcon={<RocketIcon />} disabled={busy || !id} onClick={() => act(() => api.eng.deployments.deploy({ kind, id, version: version || undefined }), `Desplegado ${kind}/${id}${version ? `@${version}` : ' (latest)'}.`)}>
          Desplegar
        </Button>
      </Stack>

      <Stack spacing={1.5}>
        {(deployments ?? []).map((d) => (
          <Stack key={d.deploymentId} spacing={1} sx={{ p: 1.2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0.5, sm: 1.5 }} sx={{ alignItems: { sm: 'center' }, flexWrap: 'wrap' }}>
              <Typography variant="body2" sx={{ fontFamily: 'ui-monospace, Menlo, monospace', fontWeight: 600 }}>{d.deploymentId}</Typography>
              <StateChip kind="execution" state={d.status === 'deployed' ? 'succeeded' : 'default'} />
              <Typography variant="caption" color="text.secondary">
                {d.artifact.kind}/{d.artifact.id}@{d.artifact.version} · tenant {d.tenantId} · {d.versions.length} versión(es)
              </Typography>
              <Chip size="small" variant="outlined" label={d.health.lastOk === null ? 'sin health aún' : d.health.lastOk ? 'health OK' : 'health FALLO'} color={d.health.lastOk === null ? 'default' : d.health.lastOk ? 'success' : 'error'} sx={{ fontSize: 11 }} />
            </Stack>
            <Typography variant="caption" color="text.secondary">{d.health.detail}</Typography>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              <Button size="small" variant="text" startIcon={<HealthIcon />} onClick={() => act(() => api.eng.deployments.health(d.deploymentId), 'Health check ejecutado.')}>
                health
              </Button>
              <Button size="small" variant="text" startIcon={<PlayIcon />} onClick={() => invoke(d.deploymentId)}>
                invocar
              </Button>
              <Button size="small" variant="text" startIcon={<UndoIcon />} onClick={() => act(() => api.eng.deployments.rollback(d.deploymentId), 'Rollback a la versión anterior.')}>
                rollback
              </Button>
              {d.status === 'deployed' && (
                <Button size="small" variant="text" color="error" startIcon={<StopIcon />} onClick={() => act(() => api.eng.deployments.stop(d.deploymentId), 'Despliegue detenido.')}>
                  stop
                </Button>
              )}
            </Stack>
          </Stack>
        ))}
        {deployments !== null && deployments.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            Sin despliegues todavía — despliega una AgenticApp o ApiPlatform generada.
          </Typography>
        )}
      </Stack>

      {runResult && (
        <Box sx={{ mt: 2 }}>
          <JsonBox data={runResult} max={260} />
        </Box>
      )}
    </Panel>
  )
}
