import { useEffect, useState } from 'react'
import {
  Box, Typography, Paper, Stack, Slider, Button, TextField, MenuItem,
  CircularProgress, Snackbar, Alert,
} from '@mui/material'
import SaveIcon from '@mui/icons-material/Save'
import { devApi, type LLMConfig } from '../api'

const TURN_DETECTIONS = ['server', 'semantic', 'agentic', 'manual']

export default function VAD() {
  const [config, setConfig] = useState<LLMConfig | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ open: boolean, msg: string, err: boolean }>({
    open: false, msg: '', err: false,
  })

  useEffect(() => {
    devApi.getConfig().then(({ data }) => setConfig(data)).catch(() => { /* */ })
  }, [])

  const patch = (fields: Partial<LLMConfig>) =>
    setConfig((c) => (c ? { ...c, ...fields } : c))

  const save = async () => {
    if (!config) return
    setSaving(true)
    try {
      await devApi.updateConfig({
        vad_sensitivity: config.vad_sensitivity,
        turn_detection_mode: config.turn_detection_mode,
        max_call_duration_minutes: config.max_call_duration_minutes,
      })
      setToast({ open: true, msg: 'Ajustes de conversación guardados ✓', err: false })
    } catch {
      setToast({ open: true, msg: 'Error al guardar', err: true })
    } finally {
      setSaving(false)
    }
  }

  if (!config) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box>
  }

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 800 }}>
            VAD Settings
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Detección de actividad de voz y gestión de turnos en conversación
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={save}
          disabled={saving}
          sx={{ borderRadius: '10px' }}
        >
          {saving ? 'Guardando…' : 'Guardar'}
        </Button>
      </Box>

      <Paper sx={{ p: 3, borderRadius: '14px', bgcolor: 'rgba(255,255,255,0.02)' }}>
        <Stack spacing={4}>
          <Box>
            <Stack direction="row" justifyContent="space-between">
              <Typography fontWeight={600}>Sensibilidad VAD</Typography>
              <Typography fontWeight={800} color="text.primary">
                {(config.vad_sensitivity ?? 0.5).toFixed(2)}
              </Typography>
            </Stack>
            <Slider
              min={0}
              max={1}
              step={0.01}
              value={config.vad_sensitivity ?? 0.5}
              onChange={(_, v) => patch({ vad_sensitivity: v as number })}
              valueLabelDisplay="auto"
            />
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="caption" color="text.secondary">0.00 — solo habla clara</Typography>
              <Typography variant="caption" color="text.secondary">1.00 — detecta susurros</Typography>
            </Stack>
          </Box>

          <Alert severity="info" variant="outlined" icon={false}>
            Sensibilidad alta = el agente interviene más rápido, pero puede cortar pausas naturals.
            Para recepción telefónica se recomienda 0.4–0.6.
          </Alert>

          <TextField
            select
            label="Modo de detección de turnos"
            value={config.turn_detection_mode || 'server'}
            onChange={(e) => patch({ turn_detection_mode: e.target.value })}
            sx={{ maxWidth: 260 }}
          >
            {TURN_DETECTIONS.map((m) => (
              <MenuItem key={m} value={m}>{m}</MenuItem>
            ))}
          </TextField>

          <TextField
            type="number"
            label="Duración máxima de llamada (minutos)"
            value={config.max_call_duration_minutes ?? 0}
            onChange={(e) => patch({ max_call_duration_minutes: Number(e.target.value) })}
            sx={{ maxWidth: 260 }}
          />
        </Stack>
      </Paper>

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
