import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import Grid2 from '@mui/material/Grid2'
import RefreshIcon from '@mui/icons-material/Refresh'
import PlayIcon from '@mui/icons-material/PlayArrowOutlined'
import ArrowIcon from '@mui/icons-material/ArrowForwardRounded'
import { api, type Overview } from '../lib/api'
import { fmtDuration, runStatusColor, runStatusLabel } from '../theme'
import RunDialog from '../components/RunDialog'

const POLL_MS = 15000

export default function Dashboard(): ReactNode {
  const [ov, setOv] = useState<Overview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [openRun, setOpenRun] = useState<string | null>(null)
  const navigate = useNavigate()

  const load = useCallback(() => {
    setError(null)
    api
      .overview()
      .then(setOv)
      .catch((e) => setError(`No se pudo cargar el estado (${e.status ?? ''}). Reintenta o revisa el backend.`))
  }, [])

  useEffect(() => {
    load()
    const t = setInterval(load, POLL_MS)
    return () => clearInterval(t)
  }, [load])

  if (error && !ov) {
    return (
      <Stack spacing={2}>
        <Alert severity="error">{error}</Alert>
        <Button onClick={load} startIcon={<RefreshIcon />} sx={{ alignSelf: 'flex-start' }}>
          Reintentar
        </Button>
      </Stack>
    )
  }
  if (!ov) {
    return <LinearProgress sx={{ mt: 6, mx: 4, borderRadius: 2 }} />
  }

  const { counts, services } = ov

  return (
    <Stack spacing={2.6}>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1.4 }}>
        <Typography variant="h4" sx={{ width: 'auto' }}>
          Panel general
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Tooltip title={new Date(ov.generatedAt).toLocaleString('es-ES')}>
          <Typography variant="caption" color="text.secondary">
            actualizado {new Date(ov.generatedAt).toLocaleTimeString('es-ES')}
          </Typography>
        </Tooltip>
        <IconButton onClick={load} title="Refrescar">
          <RefreshIcon />
        </IconButton>
      </Stack>

      {error && <Alert severity="warning">{error}</Alert>}

      <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
        <Chip label={`agentes ${counts.agents}`} variant="outlined" />
        <Chip label={`modelos ${counts.profiles}`} variant="outlined" />
        <Chip label={`herramientas ${counts.tools}`} variant="outlined" />
        <Chip label={`sesiones ${counts.sessions}`} variant="outlined" />
        <Chip label={`ejecuciones ${counts.runs}`} variant="outlined" />
      </Stack>

      {/* 4 cuadrantes (referencia mockup) */}
      <Grid2 container spacing={2.4}>
        {/* 1 — Servicios */}
        <Grid2 size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2.4, '&:last-child': { pb: 2.4 } }}>
              <Stack direction="row" sx={{ mb: 1.4, alignItems: 'center' }}>
                <Typography variant="h6">Servicios</Typography>
              </Stack>
              <Stack spacing={1.2} fontSize={14}>
                <ServiceRow label="UIEP backend" right={
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Chip size="small" color="success" variant="status" label="activo" />
                    <Typography variant="caption" color="text.secondary">
                      node {services.backend.node} · uptime {fmtDuration(services.backend.uptimeSec * 1000)}
                    </Typography>
                  </Stack>
                } />
                <ServiceRow label="Proveedores (gateway)" right={
                  services.ollama.ok ? (
                    <Stack direction="row" sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Chip size="small" color="success" variant="status" label="alcanzable" />
                      <Chip size="small" variant="outlined" label={services.ollama.model ?? '—'} />
                      {(services.ollama.capabilities ?? []).map((c) => (
                        <Chip key={c} size="small" variant="outlined" sx={{ opacity: 0.75 }} label={c} />
                      ))}
                    </Stack>
                  ) : (
                    <Chip size="small" color="error" variant="status" label="no alcanzable" />
                  )
                } />
                <ServiceRow label="Runtime (token)" right={
                  <Chip
                    size="small"
                    color={services.backend.runtimeTokenConfigured ? 'success' : 'error'}
                    variant="status"
                    label={services.backend.runtimeTokenConfigured ? 'configurado' : 'AUSENTE'}
                  />
                } />
                <ServiceRow label="Consola (BFF)" right={
                  <Chip size="small" color={services.backend.consoleConfigured ? 'success' : 'warning'} variant="status" label={services.backend.consoleConfigured ? 'configurada' : 'sin contraseña'} />
                } />
              </Stack>
            </CardContent>
          </Card>
        </Grid2>

        {/* 2 — Ejecuciones (arriba a la derecha en el mockup) */}
        <Grid2 size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
              <Stack direction="row" sx={{ p: 2.4, pb: 0.8, alignItems: 'center' }}>
                <Typography variant="h6">Ejecuciones recientes</Typography>
                <Box sx={{ flexGrow: 1 }} />
                <Button size="small" endIcon={<ArrowIcon />} onClick={() => navigate('/playground')}>
                  Playground
                </Button>
              </Stack>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ pl: 2.4 }}>Estado</TableCell>
                    <TableCell>Agente</TableCell>
                    <TableCell>Tools</TableCell>
                    <TableCell>Duración</TableCell>
                    <TableCell sx={{ pr: 2.4 }}>Fecha</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ov.recentRuns.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} sx={{ pl: 2.4, color: 'text.secondary' }}>
                        Aún no hay ejecuciones. Abre el Playground y lanza la primera sesión.
                      </TableCell>
                    </TableRow>
                  )}
                  {ov.recentRuns.map((r) => (
                    <TableRow key={r.executionId} hover onClick={() => setOpenRun(r.executionId)} sx={{ cursor: 'pointer' }}>
                      <TableCell sx={{ pl: 2.4 }}>
                        <Chip size="small" color={runStatusColor(r.status)} variant="status" label={runStatusLabel(r.status)} />
                      </TableCell>
                      <TableCell sx={{ pl: 2.4, fontSize: 13, color: 'text.secondary' }}>{r.agentSpecId}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.6}>
                          <Chip size="small" variant="outlined" label={`${r.toolCount && r.toolCount >= 0 ? r.toolCount : 0} calls`} />
                          {r.toolFailures > 0 && <Chip size="small" color="error" variant="outlined" label={`${r.toolFailures} rechazos`} />}
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ fontSize: 13 }}>{fmtDuration(r.durationMs)}</TableCell>
                      <TableCell sx={{ pr: 2.4, fontSize: 12.4 }} color="text.secondary">
                        {new Date(r.startedAt).toLocaleTimeString('es-ES')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid2>

        {/* 3 — Agentes */}
        <Grid2 size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2.4, '&:last-child': { pb: 2.4 } }}>
              <Stack direction="row" sx={{ mb: 1.4, alignItems: 'center' }}>
                <Typography variant="h6">Agentes registrados</Typography>
                <Box sx={{ flexGrow: 1 }} />
                <Button size="small" endIcon={<ArrowIcon />} onClick={() => navigate('/agents')}>
                  Gestor
                </Button>
              </Stack>
              {ov.agents.length === 0 ? (
                <Typography color="text.secondary" fontSize={14}>
                  Ningún AgentSpec registrado todavía.
                </Typography>
              ) : (
                <Stack spacing={1.1}>
                  {ov.agents.map((a) => (
                    <Stack key={a.id} direction="row" sx={{ alignItems: 'center', gap: 1.2 }}>
                      <PlayIcon fontSize="small" sx={{ color: 'primary.main' }} />
                      <Box>
                        <Typography fontSize={14}>
                          {a.name} <code style={{ opacity: 0.7 }}>{a.id}</code>
                        </Typography>
                        {a.description && (
                          <Typography fontSize={12} color="text.secondary" noWrap maxWidth={420}>
                            {a.description}
                          </Typography>
                        )}
                      </Box>
                    </Stack>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid2>

        {/* 4 — Modelos */}
        <Grid2 size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2.4, '&:last-child': { pb: 2.4 } }}>
              <Stack direction="row" sx={{ mb: 1.4, alignItems: 'center' }}>
                <Typography variant="h6">Modelos (perfiles)</Typography>
                <Box sx={{ flexGrow: 1 }} />
                <Button size="small" endIcon={<ArrowIcon />} onClick={() => navigate('/models')}>
                  Model Manager
                </Button>
              </Stack>
              {ov.profiles.length === 0 ? (
                <Typography color="text.secondary" fontSize={14}>
                  Sin ModelProfiles registrados.
                </Typography>
              ) : (
                <Stack spacing={1.1}>
                  {ov.profiles.map((p) => (
                    <ServiceRow
                      key={p.id}
                      label={`${p.name} · ${p.id}`}
                      right={<Chip size="small" variant="outlined" label={`v${p.version}`} />}
                    />
                  ))}
                </Stack>
              )}
              {services.ollama.ok && (
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1.4 }}>
                  Proveedor activo: {services.ollama.model}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid2>
      </Grid2>

      <RunDialog executionId={openRun} onClose={() => setOpenRun(null)} />
    </Stack>
  )
}

export function ServiceRow({ label, right }: { label: string; right: ReactNode }): ReactNode {
  return (
    <Stack direction="row" sx={{ alignItems: 'center', gap: 1.4 }}>
      <Typography fontSize={14} sx={{ flexShrink: 0, minWidth: 150, color: 'text.secondary' }}>
        {label}
      </Typography>
      <Box sx={{ flexWrap: 'wrap', minWidth: 0 }}>{right}</Box>
    </Stack>
  )
}
