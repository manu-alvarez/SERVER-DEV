import { Box, Typography, Button, Paper, Chip, Grid, TextField, CircularProgress, Avatar } from '@mui/material'
import { Mic as MicIcon, CameraIcon as CameraMuiIcon, Code as CodeIcon, Shield as ShieldIcon } from '@mui/icons/material'
import { useState } from 'react'
import { api } from '../lib/api'

export default function OrbPage() {
  const [prompt, setPrompt] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [volume, setVolume] = useState(0)

  const handleExecute = async () => {
    if (!prompt.trim()) return
    setLoading(true)
    try {
      const res = await api.post('/api/text-command', { text: prompt })
      setResult(res)
    } catch (e) {
      alert('Error: ' + (e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  // Simular volumen de voz (reemplazar con Web Audio real en siguiente fase)
  const simVolume = setInterval(() => setVolume(Math.random()), 300)

  return (
    <Box sx={{ position: 'relative', minHeight: 'calc(100vh - 120px)', overflow: 'hidden' }}>
      <NeuralScenePlaceholder />
      <Box sx={{ position: 'relative', zIndex: 10, p: 3, maxWidth: 800, margin: '0 auto' }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Avatar sx={{ width: 72, height: 72, bgcolor: 'linear-gradient(135deg, #22d3ee 0%, #a78bfa 100%)', color: '#02040a', margin: '0 auto', mb: 2, boxShadow: '0 0 30px rgba(34,211,238,0.6)' }}>I</Avatar>
          <Typography variant="h3" sx={{ fontWeight: 900, letterSpacing: '-1px', background: 'linear-gradient(135deg, #22d3ee 0%, #a78bfa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            IA Prod OS
          </Typography>
          <Typography sx={{ color: '#94a3b8', mt: 1, fontSize: '1.1rem' }}>
            Sistema operativo cognitivo — dime qué hacer y lo ejecuto
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'center', mb: 4 }}>
          <TextField
            fullWidth
            maxWidth: 600
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ej: Abre el navegador, busca información sobre MCP y crea un resumen..."
            sx={{ borderRadius: '14px', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' }, '&:focus-within .MuiOutlinedInput-notchedOutline': { borderColor: '#22d3ee' } }}
            InputProps={{ style: { color: '#f8fafc' } }}
          />
          <Button
            variant="contained"
            onClick={handleExecute}
            disabled={loading || !prompt.trim()}
            sx={{
              background: 'linear-gradient(135deg, #22d3ee 0%, #a78bfa 100%)',
              color: '#02040a',
              fontWeight: 900,
              borderRadius: '14px',
              px: 4,
              py: 1.5,
              '&:hover': { opacity: 0.9 },
              '&:disabled': { opacity: 0.5 },
            }}
          >
            {loading ? 'Ejecutando...' : 'Ejecutar Acción'}
          </Button>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'center', mb: 4 }}>
          <Box sx={{ p: 2, borderRadius: '50%', background: 'rgba(34,211,238,0.1)', border: `2px solid ${volume > 0.5 ? '#22d3ee' : 'rgba(34,211,238,0.3)'}`, width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Box sx={{ width: 40, height: 40, borderRadius: '50%', background: volume > 0.5 ? '#22d3ee' : 'rgba(34,211,238,0.2)', animation: 'pulse 2s infinite' }} />
          </Box>
          <Typography sx={{ color: '#94a3b8', fontSize: '0.9rem' }}>
            Estado del núcleo: {loading ? 'Procesando...' : 'Listo'}
          </Typography>
        </Box>

        {result && (
          <Paper sx={{ p: 3, borderRadius: '14px', background: 'rgba(10, 15, 26, 0.7)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CodeIcon sx={{ color: '#22d3ee' }} /> Resultado de Ejecución
            </Typography>
            <Typography variant="body2" sx={{ color: '#f8fafc', mb: 2, whiteSpace: 'pre-wrap' }}>{result.response || 'Sin respuesta'}</Typography>
            {result.audio_url && (
              <Button variant="outlined" startIcon={<ShieldIcon />} sx={{ borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc', mt: 1 }}>
                Reproducir Audio de Respuesta
              </Button>
            )}
          </Paper>
        )}
      </Box>
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.6; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </Box>
  )
}

function NeuralScenePlaceholder() {
  return (
    <div
      className="absolute inset-0 -z-10"
      style={{
        background: 'radial-gradient(circle at 50% 50%, rgba(34,211,238,0.08) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(167,139,250,0.06) 0%, transparent 40%)',
      }}
    />
  )
}
