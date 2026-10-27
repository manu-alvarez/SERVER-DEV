import { useEffect, useRef, useState } from 'react'
import {
  Box, Typography, Paper, Stack, Chip, List, ListItem,
  ListItemText, Alert, CircularProgress, IconButton, Tooltip,
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import { devApi, type AgentStatusResponse, type LogEntry, type ProvidersResponse } from '../api'

const fmtUptime = (s: number) => {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m ${s % 60}s`
}

export default function Status() {
  const [status, setStatus] = useState<AgentStatusResponse | null>(null)
  const [providers, setProviders] = useState<ProvidersResponse | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = async () => {
    try {
      const [s, p, l] = await Promise.all([
        devApi.getStatus(),
        devApi.getProvidersStatus(),
        devApi.getLogs().catch(() => ({ data: [] as LogEntry[] })),
      ])
      setStatus(s.data)
      setProviders(p.data)
      setLogs(Array.isArray(l.data) ? l.data : [])
      setErr('')
    } catch {
      setErr('No se pudo contactar con el backend de Nikolina')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    timer.current = setInterval(load, 15000)
    return () => { if (timer.current) clearInterval(timer.current) }
  }, [])

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box>
  if (err || !status) return <Alert severity="error">{err || 'Sin datos'}</Alert>

  const memPct = status.metrics.memory?.total
    ? Math.round((status.metrics.memory.used / status.metrics.memory.total) * 100)
    : 0

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 800 }}>
            System Status
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Monitorización del agente en vivo — refresco cada 15s
          </Typography>
        </Box>
        <Tooltip title="Refrescar ahora">
          <IconButton onClick={load} sx={{ color: '#94a3b8' }}><RefreshIcon /></IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
        <Paper sx={{ p: 2.5, borderRadius: '14px', bgcolor: 'rgba(255,255,255,0.02)' }}>
          <Typography variant="caption" color="text.secondary" fontWeight={700} letterSpacing="0.1em">
            AGENTE
          </Typography>
          <Stack direction="row" spacing={1.5} alignItems="center" mt={1}>
            <Chip
              size="small"
              label={status.status.toUpperCase()}
              color={status.status === 'active' ? 'success' : 'info'}
            />
            <Typography fontWeight={800}>uptime {fmtUptime(status.uptime_seconds)}</Typography>
          </Stack>
          <Stack spacing={0.5} mt={2}>
            <Typography variant="body2" color="text.secondary">
              Modelo: <b>{status.model}</b> · Voz: <b>{status.voice}</b>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Pipeline activo: <b>{status.active_pipeline}</b>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sesiones hoy: <b>{status.sessions_today}</b> · Última llamada: <b>{status.last_call}</b>
            </Typography>
          </Stack>
        </Paper>

        <Paper sx={{ p: 2.5, borderRadius: '14px', bgcolor: 'rgba(255,255,255,0.02)' }}>
          <Typography variant="caption" color="text.secondary" fontWeight={700} letterSpacing="0.1em">
            RECURSOS
          </Typography>
          <Stack spacing={1.5} mt={1}>
            <Box>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">CPU</Typography>
                <Typography variant="body2" fontWeight={700}>{(status.metrics.cpu ?? 0).toFixed(1)}%</Typography>
              </Stack>
            </Box>
            <Box>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Memoria</Typography>
                <Typography variant="body2" fontWeight={700}>
                  {(status.metrics.memory?.used ?? 0).toFixed(1)} / {(status.metrics.memory?.total ?? 0).toFixed(1)} GB ({memPct}%)
                </Typography>
              </Stack>
            </Box>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">Salas activas</Typography>
              <Typography variant="body2" fontWeight={700}>{status.metrics.active_sessions ?? 0}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">Latencia API</Typography>
              <Typography variant="body2" fontWeight={700}>
                {status.metrics.latency ? `${status.metrics.latency} ms` : 'n/d'}
              </Typography>
            </Stack>
          </Stack>
        </Paper>
      </Box>

      {providers && (
        <Paper sx={{ p: 2.5, borderRadius: '14px', bgcolor: 'rgba(255,255,255,0.02)' }}>
          <Typography variant="caption" color="text.secondary" fontWeight={700} letterSpacing="0.1em">
            PROVEEDORES
          </Typography>
          <Stack direction="row" spacing={1.5} flexWrap="wrap" mt={1.5} useFlexGap>
            {Object.entries(providers)
              .filter(([k]) => !['status', 'timestamp'].includes(k))
              .map(([k, v]) => {
                const p = v as { available: boolean }
                return (
                  <Chip
                    key={k}
                    label={k.replace(/_/g, ' ')}
                    color={p?.available ? 'success' : 'error'}
                    variant="outlined"
                    size="small"
                    sx={{ textTransform: 'capitalize' }}
                  />
                )
              })}
          </Stack>
        </Paper>
      )}

      <Paper sx={{ p: 2.5, borderRadius: '14px', bgcolor: 'rgba(0,0,0,0.35)' }}>
        <Typography variant="caption" color="text.secondary" fontWeight={700} letterSpacing="0.1em">
          REGISTRO (journalctl livekit-agent · {logs.length})
        </Typography>
        {logs.length === 0 ? (
          <Typography variant="body2" color="text.secondary" mt={1}>
            Sin registros disponibles — comprobar permisos journalctl del servicio.
          </Typography>
        ) : (
          <List dense sx={{ maxHeight: 420, overflow: 'auto', fontFamily: '"JetBrains Mono", monospace' }}>
            {logs.map((l, i) => (
              <ListItem key={i} disableGutters>
                <ListItemText
                  primary={
                    <Typography component="span" sx={{ fontSize: 12, fontFamily: '"JetBrains Mono", monospace', display: 'flex', gap: 1 }}>
                      <span style={{ color: '#64748b' }}>{(l.timestamp || '').slice(11, 19)}</span>
                      <span style={{
                        color: l.level === 'ERROR' ? '#f87171' : l.level === 'WARNING' ? '#facc15' : '#4ade80',
                        minWidth: 64,
                      }}>
                        {l.level}
                      </span>
                      <span style={{ color: '#cbd5e1' }}>{l.message}</span>
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>
    </Stack>
  )
}
