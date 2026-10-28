import { Box, Typography, Button, Paper, Chip, Grid, TextField } from '@mui/material'
import { CameraIcon as CameraMuiIcon, Image as ImageIcon, Code as CodeIcon } from '@mui/icons/material'
import { useState } from 'react'
import { api } from '../lib/api'

export default function VisionPage() {
  const [imageData, setImageData] = useState<string | null>(null)
  const [prompt, setPrompt] = useState('Analiza esta imagen en detalle')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleAnalyze = async () => {
    if (!imageData) return
    setLoading(true)
    try {
      const res = await api.post('/api/vision-analyze', { image: imageData, source: 'upload', prompt })
      setResult(res)
    } catch (e) {
      alert('Error en visión: ' + (e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: '-1px' }}>Visión Continua</Typography>
        <Typography sx={{ color: '#94a3b8' }}>Analiza imágenes, capturas de cámara y documentos en tiempo real.</Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid xs={12} lg={6}>
          <Paper sx={{ p: 3, borderRadius: '14px', background: 'rgba(10, 15, 26, 0.7)', border: '1px solid rgba(255,255,255,0.04)', height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {imageData ? (
              <img src={imageData} alt="vision" style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }} />
            ) : (
              <Box sx={{ textAlign: 'center', color: '#64748b' }}>
                <CameraMuiIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
                <Typography>No hay imagen cargada</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid xs={12} lg={6}>
          <Paper sx={{ p: 3, borderRadius: '14px', background: 'rgba(10, 15, 26, 0.7)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Capturar o Subir Imagen</Typography>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) return
                const reader = new FileReader()
                reader.onload = () => setImageData(reader.result as string)
                reader.readAsDataURL(file)
              }}
              className="hidden"
            />
            <Button
              variant="contained"
              startIcon={<ImageIcon sx({ fontSize: 24 }) as any />}
              onClick={() => (document.querySelector('input[type=file]') as HTMLInputElement).click()}
              sx={{ background: 'linear-gradient(135deg, #22d3ee 0%, #a78bfa 100%)', color: '#02040a', fontWeight: 800, borderRadius: '10px', mb: 2, width: '100%' }}
            >
              Seleccionar Imagen
            </Button>
            <TextField
              fullWidth
              multiline
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="¿Qué quieres que analice?"
              sx={{ borderRadius: '10px', mb: 2 }}
            />
            <Button
              variant="contained"
              onClick={handleAnalyze}
              disabled={loading || !imageData}
              startIcon={<CodeIcon sx({ fontSize: 24 }) as any />}
              sx={{ background: 'linear-gradient(135deg, #a78bfa 0%, #22d3ee 100%)', color: '#02040a', fontWeight: 800, borderRadius: '10px', width: '100%' }}
            >
              {loading ? 'Analizando...' : 'Analizar Imagen'}
            </Button>
          </Paper>

          {result && (
            <Paper sx={{ p: 3, borderRadius: '14px', background: 'rgba(10, 15, 26, 0.7)', border: '1px solid rgba(255,255,255,0.04)', mt: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Resultado del Análisis</Typography>
              <Typography sx={{ whiteSpace: 'pre-wrap', color: '#f8fafc' }}>{JSON.stringify(result, null, 2).slice(0, 1500)}</Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  )
}
