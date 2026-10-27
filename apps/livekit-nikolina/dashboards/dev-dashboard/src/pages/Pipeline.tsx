import { useEffect, useState } from 'react'
import {
  Box, Typography, Card, CardContent, Stack, Chip, Button,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Slider, Alert, CircularProgress, Snackbar, Tooltip,
} from '@mui/material'
import SettingsIcon from '@mui/icons-material/Settings'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import RefreshIcon from '@mui/icons-material/Refresh'
import {
  devApi,
  type PipelineConfig,
  type PipelineCatalogResponse,
} from '../api'

export default function Pipeline() {
  const [configs, setConfigs] = useState<PipelineConfig[]>([])
  const [catalog, setCatalog] = useState<PipelineCatalogResponse | null>(null)
  const [editing, setEditing] = useState<PipelineConfig | null>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ open: boolean, msg: string, err: boolean }>({
    open: false, msg: '', err: false,
  })

  const load = async () => {
    setLoading(true)
    try {
      const [cfgs, cat] = await Promise.all([
        devApi.getAllPipelineConfigs(),
        devApi.getPipelineCatalog(),
      ])
      setConfigs(cfgs.data.configs || [])
      setCatalog(cat.data)
    } catch {
      setToast({ open: true, msg: 'Error cargando pipelines', err: true })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const activate = async (id: number) => {
    try {
      const { data } = await devApi.activatePipeline(id)
      setConfigs((cs) => cs.map((c) => ({
        ...c,
        is_active: data?.active_config && (data as { active_config?: PipelineConfig }).active_config?.id === c.id ? 1 : 0,
      })))
      setToast({ open: true, msg: `Pipeline #${id} activado`, err: false })
    } catch {
      setToast({ open: true, msg: 'No se pudo activar el pipeline', err: true })
    }
  }

  const saveEdit = async () => {
    if (!editing) return
    setSaving(true)
    try {
      const { data } = await devApi.updatePipelineConfig(editing.id, {
        name: editing.name,
        architecture: editing.architecture,
        llm_provider: editing.llm_provider,
        llm_model: editing.llm_model,
        llm_base_url: editing.llm_base_url,
        llm_temperature: editing.llm_temperature,
        stt_provider: editing.stt_provider,
        stt_model: editing.stt_model,
        stt_language: editing.stt_language,
        tts_provider: editing.tts_provider,
        tts_voice: editing.tts_voice,
        tts_speed: editing.tts_speed,
        realtime_provider: editing.realtime_provider,
        realtime_model: editing.realtime_model,
        realtime_voice: editing.realtime_voice,
      })
      setConfigs((cs) => cs.map((c) => (c.id === editing.id ? (data as PipelineConfig) : c)))
      setEditing(null)
      setToast({ open: true, msg: 'Pipeline guardado ✓', err: false })
    } catch {
      setToast({ open: true, msg: 'Error guardando el pipeline', err: true })
    } finally {
      setSaving(false)
    }
  }

  const patch = (fields: Partial<PipelineConfig>) =>
    setEditing((e) => (e ? { ...e, ...fields } : e))

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box>
  }

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 800 }}>
            Pipeline Configuration
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Arquitectura realtime vs modular — proveedores LLM / STT / TTS
          </Typography>
        </Box>
        <IconButton onClick={load} sx={{ color: '#94a3b8' }}><RefreshIcon /></IconButton>
      </Box>

      {catalog && (
        <Alert severity="info" variant="outlined" icon={false}>
          Catálogo cargado — LLM: {catalog.llm?.providers?.length ?? 0} · STT: {catalog.stt?.providers?.length ?? 0} ·
          {' '}TTS: {catalog.tts?.providers?.length ?? 0} · Realtime: {catalog.realtime?.providers?.length ?? 0}
        </Alert>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
        {configs.map((c) => (
          <Card
            key={c.id}
            sx={{
              bgcolor: c.is_active ? 'rgba(124,58,237,0.08)' : 'rgba(255,255,255,0.02)',
              border: c.is_active ? '1px solid rgba(124,58,237,0.45)' : '1px solid rgba(255,255,255,0.06)',
              borderRadius: '14px',
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
                <Box>
                  <Typography fontWeight={700}>{c.name || `Pipeline #${c.id}`}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {c.architecture}
                  </Typography>
                </Box>
                {c.is_active ? (
                  <Chip
                    size="small"
                    icon={<CheckCircleIcon />}
                    label="ACTIVO"
                    sx={{ bgcolor: 'rgba(16,185,129,0.1)', color: '#10b981', fontWeight: 700 }}
                  />
                ) : (
                  <Tooltip title="Activar este pipeline">
                    <IconButton
                      size="small"
                      onClick={() => activate(c.id)}
                      sx={{ color: '#4ade80' }}
                    >
                      <PlayArrowIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>

              <Stack spacing={0.75} mb={2}>
                {c.architecture === 'realtime' ? (
                  <Typography variant="body2" color="text.secondary">
                    Realtime: <b>{c.realtime_provider}</b> · {c.realtime_model || '—'} · voz {c.realtime_voice || '—'}
                  </Typography>
                ) : (
                  <>
                    <Typography variant="body2" color="text.secondary">
                      LLM: <b>{c.llm_provider}</b> · {c.llm_model || '—'} (T {c.llm_temperature})
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      STT: <b>{c.stt_provider}</b> · {c.stt_model || '—'} ({c.stt_language || 'es'})
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      TTS: <b>{c.tts_provider}</b> · {c.tts_voice || '—'} ×{c.tts_speed}
                    </Typography>
                  </>
                )}
              </Stack>

              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  startIcon={<SettingsIcon />}
                  variant="outlined"
                  fullWidth
                  onClick={() => setEditing(c)}
                  sx={{ borderRadius: '10px' }}
                >
                  Editar
                </Button>
                {!c.is_active && (
                  <Button
                    size="small"
                    variant="contained"
                    fullWidth
                    onClick={() => activate(c.id)}
                    sx={{ borderRadius: '10px' }}
                  >
                    Activar
                  </Button>
                )}
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Dialog open={!!editing} onClose={() => setEditing(null)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>
          {editing ? `Editar ${editing.name || `Pipeline #${editing.id}`}` : ''}
        </DialogTitle>
        <DialogContent dividers>
          {editing && (
            <Stack spacing={2.5} mt={1}>
              <TextField
                size="small" label="Nombre" value={editing.name || ''}
                onChange={(e) => patch({ name: e.target.value })}
              />
              <TextField
                select size="small" label="Arquitectura" value={editing.architecture}
                onChange={(e) => patch({ architecture: e.target.value as PipelineConfig['architecture'] })}
              >
                <MenuItem value="realtime">realtime</MenuItem>
                <MenuItem value="modular">modular</MenuItem>
              </TextField>

              {editing.architecture === 'realtime' ? (
                <>
                  <TextField
                    select size="small" label="Proveedor realtime"
                    value={editing.realtime_provider}
                    onChange={(e) => patch({ realtime_provider: e.target.value })}
                  >
                    {(catalog?.realtime?.providers || []).map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                  </TextField>
                  <TextField
                    select size="small" label="Modelo realtime"
                    value={editing.realtime_model || ''}
                    onChange={(e) => patch({ realtime_model: e.target.value })}
                  >
                    {(catalog?.realtime?.models || [editing.realtime_model || '']).map((m) => (
                      <MenuItem key={m} value={m}>{m}</MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    size="small" label="Voz realtime" value={editing.realtime_voice || ''}
                    onChange={(e) => patch({ realtime_voice: e.target.value })}
                  />
                </>
              ) : (
                <>
                  <TextField
                    select size="small" label="Proveedor LLM"
                    value={editing.llm_provider}
                    onChange={(e) => patch({ llm_provider: e.target.value })}
                  >
                    {(catalog?.llm?.providers || []).map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                  </TextField>
                  <TextField
                    select size="small" label="Modelo LLM"
                    value={editing.llm_model || ''}
                    onChange={(e) => patch({ llm_model: e.target.value })}
                  >
                    {(catalog?.llm?.models || [editing.llm_model || '']).map((m) => (
                      <MenuItem key={m} value={m}>{m}</MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    size="small" label="LLM base URL" placeholder="https://api.deepseek.com/v1"
                    value={editing.llm_base_url || ''}
                    onChange={(e) => patch({ llm_base_url: e.target.value })}
                  />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Temperatura LLM</Typography>
                    <Slider
                      min={0} max={2} step={0.05}
                      value={editing.llm_temperature ?? 0.5}
                      onChange={(_, v) => patch({ llm_temperature: v as number })}
                      valueLabelDisplay="auto"
                    />
                  </Box>
                  <TextField
                    select size="small" label="Proveedor STT"
                    value={editing.stt_provider}
                    onChange={(e) => patch({ stt_provider: e.target.value })}
                  >
                    {(catalog?.stt?.providers || []).map((pr) => <MenuItem key={pr} value={pr}>{pr}</MenuItem>)}
                  </TextField>
                  <TextField
                    size="small" label="Modelo STT" value={editing.stt_model || ''}
                    onChange={(e) => patch({ stt_model: e.target.value })}
                  />
                  <TextField
                    size="small" label="Idioma STT" value={editing.stt_language || ''}
                    onChange={(e) => patch({ stt_language: e.target.value })}
                  />
                  <TextField
                    select size="small" label="Proveedor TTS"
                    value={editing.tts_provider}
                    onChange={(e) => patch({ tts_provider: e.target.value })}
                  >
                    {(catalog?.tts?.providers || []).map((pr) => <MenuItem key={pr} value={pr}>{pr}</MenuItem>)}
                  </TextField>
                  <TextField
                    size="small" label="Voz TTS" value={editing.tts_voice || ''}
                    onChange={(e) => patch({ tts_voice: e.target.value })}
                  />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Velocidad TTS</Typography>
                    <Slider
                      min={0.5} max={2} step={0.05}
                      value={editing.tts_speed ?? 1}
                      onChange={(_, v) => patch({ tts_speed: v as number })}
                      valueLabelDisplay="auto"
                    />
                  </Box>
                </>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditing(null)}>Cancelar</Button>
          <Button variant="contained" onClick={saveEdit} disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

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
