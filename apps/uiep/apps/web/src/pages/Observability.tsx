import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Alert, Box, Card, CardContent, Chip, Grid2, IconButton, LinearProgress, Stack, Table, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography } from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import { fmtDuration } from '../theme'

/**
 * Observabilidad (Fase 8): vista transversal de la plataforma — métricas por
 * plano (integraciones/tools/agentes/workflows), límites globales vigentes y
 * cola de auditoría correlacionada (sin secretos). Consolidación, no expansión.
 */

interface ObsPayload {
  generatedAt: string
  limits: { agentRunsInFlight: number; workflowRunsInFlight: number; agentLimit: number; workflowLimit: number }
  metrics: Array<{ key: string; calls: number; errors: number; avgMs: number | null; latencyMaxMs: number; lastError?: string; lastErrorAt?: string }>
  integrations: Array<{ id: string; type: string; baseUrl: string; authRef: string | null }>
  audit: Array<{ ts: string; actor: { kind: string; id?: string }; action: string; correlation: Record<string, string | undefined>; detail: Record<string, unknown> }>
}

export default function Observability(): ReactNode {
  const [obs, setObs] = useState<ObsPayload | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    setError(null)
    fetch('/api/console/observability', { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: unknown) => setObs(d as ObsPayload))
      .catch(() => setError('No se pudo cargar la observabilidad.'))
  }, [])

  useEffect(() => {
    load()
    const t = setInterval(load, 15000)
    return () => clearInterval(t)
  }, [load])

  if (error && !obs) {
    return <Alert severity="error">{error}</Alert>
  }
  if (!obs) {
    return <LinearProgress sx={{ mt: 6, mx: 4, borderRadius: 2 }} />
  }

  const errRate = (m: ObsPayload['metrics'][number]) => (m.calls > 0 ? `${((m.errors / m.calls) * 100).toFixed(0)}%` : '0%')

  return (
    <Stack spacing={2.6}>
      <Stack direction="row" sx={{ alignItems: 'center' }}>
        <Typography variant="h4">Observabilidad</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Typography variant="caption" color="text.secondary">
          actualizado {new Date(obs.generatedAt).toLocaleTimeString('es-ES')}
        </Typography>
        <IconButton onClick={load}><RefreshIcon /></IconButton>
      </Stack>

      {/* Límites globales vigentes (governance) */}
      <Grid2 container spacing={2}>
        <Grid2 size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent sx={{ p: 2.2, '&:last-child': { pb: 2.2 } }}>
              <Typography variant="h6" fontSize={15}>Límites globales (backpressure)</Typography>
              <Stack spacing={0.8} sx={{ mt: 1 }} fontSize={13.6}>
                <Box>
                  Ejecuciones de agente: <strong>{obs.limits.agentRunsInFlight}/{obs.limits.agentLimit}</strong> en vuelo
                </Box>
                <Box>
                  Workflows: <strong>{obs.limits.workflowRunsInFlight}/{obs.limits.workflowLimit}</strong> en vuelo
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Variables: RUNTIME_MAX_CONCURRENT_RUNS · WORKFLOW_MAX_CONCURRENT_RUNS (429 al saturar)
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid2>
        <Grid2 size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
              <Typography variant="h6" fontSize={15} sx={{ p: 2.2, pb: 0.6 }}>Métricas por plano</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ pl: 2.2 }}>Plano:serie</TableCell>
                    <TableCell>Llamadas</TableCell>
                    <TableCell>Errores</TableCell>
                    <TableCell>Lat. media</TableCell>
                    <TableCell>Lat. máx</TableCell>
                    <TableCell sx={{ pr: 2.2 }}>Último error</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {obs.metrics.length === 0 && (
                    <TableRow><TableCell colSpan={6} sx={{ pl: 2.2, color: 'text.secondary' }}>Sin métricas aún (se alimentan con cada ejecución/llamada).</TableCell></TableRow>
                  )}
                  {obs.metrics.map((m) => (
                    <TableRow key={m.key}>
                      <TableCell sx={{ pl: 2.2 }}><code>{m.key}</code></TableCell>
                      <TableCell>{m.calls}</TableCell>
                      <TableCell>{m.errors} ({errRate(m)})</TableCell>
                      <TableCell>{m.avgMs !== null ? fmtDuration(m.avgMs) : '—'}</TableCell>
                      <TableCell>{fmtDuration(m.latencyMaxMs)}</TableCell>
                      <TableCell sx={{ pr: 2.2, color: 'error.main', fontSize: 12 }}>
                        {m.lastError ? `${m.lastError} (${m.lastErrorAt ? new Date(m.lastErrorAt).toLocaleTimeString('es-ES') : ''})` : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid2>
      </Grid2>

      {/* Integraciones registradas (diagnóstico rápido) */}
      <Card>
        <CardContent sx={{ p: 2.2, '&:last-child': { pb: 2.2 } }}>
          <Typography variant="h6" fontSize={15} sx={{ mb: 1 }}>Integraciones ({obs.integrations.length})</Typography>
          <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
            {obs.integrations.map((i) => (
              <Tooltip key={i.id} title={i.baseUrl}>
                <Chip size="small" variant="outlined" label={`${i.id} (${i.type})`} />
              </Tooltip>
            ))}
            {obs.integrations.length === 0 && <Typography fontSize={13.4} color="text.secondary">Sin integraciones registradas.</Typography>}
          </Stack>
        </CardContent>
      </Card>

      {/* Auditoría */}
      <Card>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          <Typography variant="h6" fontSize={15} sx={{ p: 2.2, pb: 0.6 }}>Auditoría reciente (últimos {obs.audit.length} eventos — sin secretos)</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ pl: 2.2 }}>Hora</TableCell>
                <TableCell>Actor</TableCell>
                <TableCell>Acción</TableCell>
                <TableCell sx={{ pr: 2.2 }}>Correlación / detalle</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {obs.audit.slice().reverse().map((e, idx) => (
                <TableRow key={idx}>
                  <TableCell sx={{ pl: 2.2, fontSize: 12, color: 'text.secondary' }}>{e.ts ? new Date(e.ts).toLocaleTimeString('es-ES') : '—'}</TableCell>
                  <TableCell sx={{ fontSize: 13 }}>{e.actor.kind}{e.actor.id ? `: ${e.actor.id}` : ''}</TableCell>
                  <TableCell><code style={{ fontSize: 12 }}>{e.action}</code></TableCell>
                  <TableCell sx={{ pr: 2.2, fontSize: 12, color: 'text.secondary' }}>
                    {JSON.stringify({ ...e.correlation, ...e.detail }).slice(0, 160)}
                  </TableCell>
                </TableRow>
              ))}
              {obs.audit.length === 0 && (
                <TableRow><TableCell colSpan={4} sx={{ pl: 2.2, color: 'text.secondary' }}>Sin eventos aún.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Stack>
  )
}
