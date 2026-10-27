import { useEffect, useState } from 'react'
import {
  Box, Typography, Paper, Stack, Button, Switch, FormControlLabel,
  Grid, Alert, CircularProgress, Snackbar, Chip,
} from '@mui/material'
import AdbIcon from '@mui/icons-material/Adb'
import PublicIcon from '@mui/icons-material/Public'
import MemoryIcon from '@mui/icons-material/Memory'
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver'
import GraphicEqIcon from '@mui/icons-material/GraphicEq'
import { devApi, type LLMConfig, type ProvidersResponse } from '../api'

export default function Tools() {
  const [config, setConfig] = useState<LLMConfig | null>(null)
  const [providers, setProviders] = useState<ProvidersResponse | null>(null)
  const [resetting, setResetting] = useState(false)
  const [toast, setToast] = useState<{ open: boolean, msg: string, err: boolean }>({
    open: false, msg: '', err: false,
  })

  useEffect(() => {
    devApi.getConfig().then(({ data }) => setConfig(data)).catch(() => { /* */ })
    devApi.getProvidersStatus().then(({ data }) => setProviders(data)).catch(() => { /* */ })
  }, [])

  const toggleSearch = async (enabled: boolean) => {
    if (!config) return
    setConfig({ ...config, enable_internet_search: enabled ? 1 : 0 })
    try {
      await devApi.updateConfig({ enable_internet_search: enabled ? 1 : 0 })
      setToast({ open: true, msg: `Búsqueda web ${enabled ? 'activada' : 'desactivada'}`, err: false })
    } catch {
      setConfig({ ...config, enable_internet_search: config.enable_internet_search })
      setToast({ open: true, msg: 'No se pudo guardar en el servidor', err: true })
    }
  }

  const resetAgent = async () => {
    setResetting(true)
    try {
      await devApi.resetAgent()
      setToast({ open: true, msg: 'Agente reiniciado', err: false })
    } catch {
      setToast({ open: true, msg: 'Fallo el contacto con el agente', err: true })
    } finally {
      setResetting(false)
    }
  }

  if (!config) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box>
  }

  const providerCards = providers ? Object.entries(providers).filter(([k]) => !['status', 'timestamp'].includes(k)) : []

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 800 }}>
          Tools Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Capacidades del agente y estado de proveedores
        </Typography>
      </Box>

      <Paper sx={{ p: 3, borderRadius: '14px', bgcolor: 'rgba(255,255,255,0.02)' }}>
        <Stack spacing={2.5}>
          <FormControlLabel
            control={
              <Switch
                checked={config.enable_internet_search === 1}
                onChange={(e) => toggleSearch(e.target.checked)}
                color="secondary"
              />
            }
            label={
              <Stack direction="row" spacing={1} alignItems="center">
                <PublicIcon fontSize="small" />
                <Box>
                  <Typography fontWeight={600}>Enable Internet Search</Typography>
                  <Typography variant="caption" color="text.secondary">
                    El agente puede consultar la web en tiempo real durante las llamadas
                  </Typography>
                </Box>
              </Stack>
            }
          />
        </Stack>
      </Paper>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
        {providerCards.map(([key, val]) => {
          const p = val as { available: boolean, url?: string, note?: string }
          const icon =
            key.toLowerCase().includes('ollama') ? <MemoryIcon />
              : key.toLowerCase().includes('kokoro') ? <RecordVoiceOverIcon />
                : key.toLowerCase().includes('whisper') ? <GraphicEqIcon />
                  : <PublicIcon />
          return (
            <Paper key={key} sx={{
              p: 2.5, borderRadius: '14px',
              bgcolor: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
                {icon}
                <Typography fontWeight={700} sx={{ textTransform: 'capitalize' }}>
                  {key.replace(/_/g, ' ')}
                </Typography>
              </Stack>
              <Chip
                size="small"
                label={p?.available ? 'ONLINE' : 'OFFLINE'}
                color={p?.available ? 'success' : 'error'}
                variant="outlined"
              />
              {p?.url && (
                <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                  {p.url}
                </Typography>
              )}
              {p?.note && (
                <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                  {p.note}
                </Typography>
              )}
            </Paper>
          )
        })}
      </Box>

      <Grid container>
        <Grid size={{ xs: 12 }}>
          <Alert
            severity="warning"
            variant="outlined"
            icon={<AdbIcon />}
            action={
              <Button variant="contained" size="small" onClick={resetAgent} disabled={resetting}>
                {resetting ? 'Enviando…' : 'Reset'}
              </Button>
            }
          >
            Reiniciar el agente obliga a recargar la sesión LiveKit active — las llamadas en curso pueden cortarse.
          </Alert>
        </Grid>
      </Grid>

      <Snackbar
        open={toast.open}
        autoHideDuration={3500}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      >
        <Alert severity={toast.err ? 'error' : 'success'} variant="filled">{toast.msg}</Alert>
      </Snackbar>
    </Stack>
  )
}
