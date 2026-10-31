import { useEffect, useState, type ReactNode } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import HealthIcon from '@mui/icons-material/HealthAndSafetyRounded'
import BoltIcon from '@mui/icons-material/BoltRounded'
import LinkIcon from '@mui/icons-material/LinkRounded'
import Grid2 from '@mui/material/Grid2'
import { api, type InvocationDescriptor, type ProfileHealth, type ProfileTestResult, type SpecDoc, type SpecSummary } from '../lib/api'

interface ProfileDetail {
  summary: SpecSummary
  doc: SpecDoc
  health?: ProfileHealth
  healthLoading?: boolean
  test?: ProfileTestResult
  testLoading?: boolean
  resolve?: InvocationDescriptor
  resolveLoading?: boolean
}

export default function Models(): ReactNode {
  const [rows, setRows] = useState<ProfileDetail[] | null>(null)
  const [prompt, setPrompt] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const patch = (id: string, data: Partial<ProfileDetail>) =>
    setRows((rs) => (rs === null ? null : rs.map((r) => (r.summary.id === id ? { ...r, ...data } : r))))

  const load = async () => {
    setRefreshing(true)
    const summaries = await api.profiles.list().catch(() => [] as SpecSummary[])
    const details: ProfileDetail[] = []
    for (const summary of summaries.filter((s) => s.kind === 'ModelProfile')) {
      const doc = await api.profiles.get(summary.id).catch(() => null)
      details.push({
        summary,
        doc: doc ?? {
          apiVersion: 'uiep.io/v1',
          kind: 'ModelProfile',
          metadata: { id: summary.id, name: summary.name, version: summary.version },
          spec: {},
        },
      })
    }
    setRows(details)
    setRefreshing(false)
  }

  useEffect(() => {
    void load()
  }, [])

  if (rows === null) {
    return <LinearProgress sx={{ mt: 6, mx: 4, borderRadius: 2 }} />
  }

  const health = (id: string) => {
    patch(id, { healthLoading: true })
    api.profiles
      .health(id)
      .then((h) => patch(id, { health: h, healthLoading: false }))
      .catch(() =>
        patch(id, {
          health: { provider: '?', model: '?', endpoint: '?', ok: false, detail: 'consulta fallida' },
          healthLoading: false,
        }),
      )
  }

  const runTest = (id: string) => {
    patch(id, { testLoading: true })
    api.profiles
      .test(id, prompt.trim() || undefined)
      .then((t) => patch(id, { test: t, testLoading: false }))
      .catch(() =>
        patch(id, {
          test: { provider: '?', model: '?', endpoint: '?', ok: false, error: 'la prueba falló (502 o red)' },
          testLoading: false,
        }),
      )
  }

  const resolve = (id: string) => {
    patch(id, { resolveLoading: true })
    api.profiles
      .resolve(id)
      .then((x) => patch(id, { resolve: x.invocation, resolveLoading: false }))
      .catch(() => patch(id, { resolveLoading: false }))
  }

  return (
    <Stack spacing={2.4}>
      <Stack direction="row" sx={{ alignItems: 'center' }}>
        <Typography variant="h4">Modelos</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Button onClick={() => void load()} disabled={refreshing}>
          {refreshing ? 'Actualizando…' : 'Recargar'}
        </Button>
      </Stack>
      <Typography color="text.secondary" fontSize={14.6}>
        Perfiles registrados con disponibilidad real contra el proveedor. El endpoint viaja por referencia
        (<code>env:OLLAMA_BASE_URL</code>): el valor resuelto nunca sale de la infraestructura.
      </Typography>

      <Box sx={{ maxWidth: 520 }}>
        <TextField
          label="Prompt de prueba (opcional)"
          placeholder='Responde exclusivamente con la palabra: OK'
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          size="small"
          fullWidth
        />
      </Box>

      {rows.length === 0 && <Alert severity="info">Sin ModelProfiles. El seed 'default' llega con cada arranque del backend.</Alert>}

      {rows.map((r) => {
        const spec = (r.doc.spec ?? {}) as { provider?: string; model?: string; endpointEnv?: string }
        return (
          <Card key={r.summary.id}>
            <CardContent sx={{ p: 2.4, '&:last-child': { pb: 2.4 } }}>
              <Stack direction="row" sx={{ alignItems: 'center', gap: 1.2, flexWrap: 'wrap', mb: 1.2 }}>
                <Typography variant="h6">
                  {r.summary.name} <code style={{ opacity: 0.7 }}>{r.summary.id}</code>
                </Typography>
                <Chip size="small" variant="outlined" label={`v${r.summary.version}`} />
                <Box sx={{ flexGrow: 1 }} />
                <Button size="small" startIcon={<HealthIcon />} onClick={() => health(r.summary.id)} disabled={r.healthLoading}>
                  Salud
                </Button>
                <Button size="small" startIcon={<BoltIcon />} onClick={() => runTest(r.summary.id)} disabled={r.testLoading}>
                  Probar
                </Button>
                <Button size="small" startIcon={<LinkIcon />} onClick={() => resolve(r.summary.id)} disabled={r.resolveLoading}>
                  Resolve
                </Button>
              </Stack>
              <Grid2 container sx={{ mb: 1.2 }}>
                <Grid2 size={{ xs: 4 }}>
                  <Labelled label="provider" value={spec.provider ?? '—'} />
                </Grid2>
                <Grid2 size={{ xs: 4 }}>
                  <Labelled label="model" value={spec.model ?? '—'} />
                </Grid2>
                <Grid2 size={{ xs: 4 }}>
                  <Labelled label="endpoint" value={spec.endpointEnv ? `env:${spec.endpointEnv}` : '—'} />
                </Grid2>
              </Grid2>

              {r.health && (
                <Alert severity={r.health.ok ? 'success' : 'error'} variant="outlined" sx={{ mt: 1.2 }}>
                  <strong>{r.health.ok ? 'DISPONIBLE' : 'NO DISPONIBLE'}</strong> · {r.health.detail}
                </Alert>
              )}
              {r.test && (
                <Box sx={{ mt: 1.2, p: 1.2, border: 1, borderColor: 'divider', borderRadius: 2, bgcolor: 'rgba(2,6,23,0.4)' }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                    <Chip size="small" color={r.test.ok ? 'success' : 'error'} variant="status" label={r.test.ok ? 'OK' : r.test.error ?? 'fallo'} />
                    {r.test.ok && <Chip size="small" variant="outlined" label={`latencia ${r.test.latencyMs ?? '?'} ms`} />}
                  </Stack>
                  {r.test.ok && (
                    <Typography fontSize={14} sx={{ mt: 0.6 }}>
                      «{r.test.text}»
                    </Typography>
                  )}
                </Box>
              )}
              {r.resolve && (
                <Box sx={{ mt: 1.2, p: 1.2, border: 1, borderColor: 'divider', borderRadius: 2, bgcolor: 'rgba(2,6,23,0.4)' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    INVOCACIÓN RESUELTA
                  </Typography>
                  <Box component="pre" sx={{ m: 0.4, fontSize: 12, overflowX: 'auto' }}>
                    {JSON.stringify(r.resolve, null, 2)}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        )
      })}
    </Stack>
  )
}

function Labelled({ label, value }: { label: string; value: string }): ReactNode {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
        {label}
      </Typography>
      <Typography fontSize={14}>
        <code>{value}</code>
      </Typography>
    </Box>
  )
}
