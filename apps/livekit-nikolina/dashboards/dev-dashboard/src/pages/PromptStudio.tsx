import { useEffect, useState } from 'react'
import {
  Box, Typography, Paper, TextField, Button, Slider, MenuItem,
  Stack, Alert, CircularProgress, Snackbar,
} from '@mui/material'
import { Save, Adb } from '@mui/icons-material'
import { devApi, type LLMConfig, type ModelsResponse, type VoicesResponse } from '../api'

export default function PromptStudio() {
  const [config, setConfig] = useState<LLMConfig | null>(null)
  const [models, setModels] = useState<string[]>([])
  const [voices, setVoices] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState<{ open: boolean, msg: string, err: boolean }>({
    open: false, msg: '', err: false,
  })

  useEffect(() => {
    devApi.getConfig()
      .then(({ data }) => setConfig(data))
      .catch(() => setError('No se pudo cargar la configuración del agente'))
    devApi.getModels()
      .then(({ data }: { data: ModelsResponse }) => setModels(data.models || []))
      .catch(() => { /* silencio */ })
    devApi.getVoices()
      .then(({ data }: { data: VoicesResponse }) => setVoices(data.voices || []))
      .catch(() => { /* silencio */ })
  }, [])

  const patch = (fields: Partial<LLMConfig>) =>
    setConfig((c) => (c ? { ...c, ...fields } : c))

  const save = async () => {
    if (!config) return
    setSaving(true)
    try {
      await devApi.updateConfig({
        model_name: config.model_name,
        voice: config.voice,
        temperature: config.temperature,
        system_prompt: config.system_prompt,
      })
      setToast({ open: true, msg: 'Configuración guardada ✓', err: false })
    } catch {
      setToast({ open: true, msg: 'Error al guardar. Revisa el servidor.', err: true })
    } finally {
      setSaving(false)
    }
  }

  const resetAgent = async () => {
    setResetting(true)
    try {
      await devApi.resetAgent()
      setToast({ open: true, msg: 'Señal de reset enviada al agente', err: false })
    } catch {
      setToast({ open: true, msg: 'No se pudo contactar al agente', err: true })
    } finally {
      setResetting(false)
    }
  }

  if (error) return <Alert severity="error">{error}</Alert>
  if (!config) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box>

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 800 }}>
            Prompt Studio
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Cerebro del agente: modelo, voz, temperatura y system prompt
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            startIcon={<Adb />}
            onClick={resetAgent}
            disabled={resetting}
            sx={{ borderRadius: '10px' }}
          >
            {resetting ? 'Enviando…' : 'Reiniciar agente'}
          </Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={save}
            disabled={saving}
            sx={{ borderRadius: '10px' }}
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </Button>
        </Stack>
      </Box>

      <Paper sx={{ p: 3, borderRadius: '14px', bgcolor: 'rgba(255,255,255,0.02)' }}>
        <Stack spacing={3}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            <TextField
              select
              label="Modelo LLM"
              value={config.model_name || ''}
              onChange={(e) => patch({ model_name: e.target.value })}
            >
              {(models.length ? models : [config.model_name]).map((m) => (
                <MenuItem key={m} value={m}>{m}</MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Voz TTS"
              value={config.voice || ''}
              onChange={(e) => patch({ voice: e.target.value })}
            >
              {(voices.length ? voices : [config.voice]).map((v) => (
                <MenuItem key={v} value={v}>{v}</MenuItem>
              ))}
            </TextField>
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Temperatura — creatividad de las respuestas
            </Typography>
            <Slider
              min={0}
              max={2}
              step={0.05}
              marks
              value={config.temperature ?? 0.5}
              onChange={(_, v) => patch({ temperature: v as number })}
              valueLabelDisplay="auto"
            />
          </Box>

          <TextField
            multiline
            minRows={14}
            maxRows={28}
            fullWidth
            label="System Prompt"
            placeholder="Eres Nikolina, una recepcionista de restaurant de lujo…"
            value={config.system_prompt || ''}
            onChange={(e) => patch({ system_prompt: e.target.value })}
            slotProps={{
              input: {
                sx: { fontFamily: '"JetBrains Mono", monospace', fontSize: 13, lineHeight: 1.7 },
              },
            }}
          />
        </Stack>
      </Paper>

      <Snackbar
        open={toast.open}
        autoHideDuration={3500}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      >
        <Alert severity={toast.err ? 'error' : 'success'} variant="filled">
          {toast.msg}
        </Alert>
      </Snackbar>
    </Stack>
  )
}
