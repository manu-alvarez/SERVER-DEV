import { useState } from 'react'
import { Box, Typography, Card, TextField, Button, CircularProgress, Stack, Chip, Select, MenuItem, InputLabel, FormControl } from '@mui/material'
import { Brush, Download, Image as ImageIcon, AutoFixHigh } from '@mui/icons-material'

const STYLES = [
  { id: 'photorealistic', label: 'Fotorealista' },
  { id: '3d-model', label: 'Modelo 3D / Render' },
  { id: 'watercolor', label: 'Acuarela' },
  { id: 'cyberpunk', label: 'Cyberpunk' },
  { id: 'cinematic', label: 'Cinemático' }
]

export default function CreativeStudio() {
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState('photorealistic')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const generateImage = async () => {
    if (!prompt.trim()) return
    setLoading(true)
    setImageUrl(null)
    
    try {
      // Optimizamos el prompt añadiendo el estilo y detalles de alta calidad
      const enhancedPrompt = `${prompt}, ${style} style, masterpiece, best quality, highly detailed, 8k resolution, professional lighting`
      // Pollinations.ai genera imágenes instantáneas a partir de la URL (Seed aleatoria para que siempre cambie)
      const seed = Math.floor(Math.random() * 1000000)
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?seed=${seed}&width=1024&height=576&nologo=true`
      
      // Pre-cargar la imagen para mostrarla solo cuando esté lista
      const img = new Image()
      img.src = url
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
      })
      
      setImageUrl(url)
    } catch (error) {
      console.error('Error generating image', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!imageUrl) return
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `msbross-creative-${Date.now()}.jpg`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading', error)
    }
  }

  return (
    <Card sx={{ p: { xs: 2, md: 4 }, maxWidth: 900, mx: 'auto', mt: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: 'primary.dark', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Brush sx={{ color: 'white', fontSize: 24 }} />
        </Box>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Estudio Creativo</Typography>
          <Typography variant="body2" color="text.secondary">Genera banners e imágenes de logística para presentaciones</Typography>
        </Box>
      </Box>

      <Stack spacing={3}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
          <TextField 
            fullWidth 
            label="¿Qué quieres crear?" 
            placeholder="Ej: Un barco portacontenedores de MSBross navegando al atardecer..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            multiline
            rows={2}
          />
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Estilo</InputLabel>
            <Select value={style} label="Estilo" onChange={(e) => setStyle(e.target.value)}>
              {STYLES.map(s => <MenuItem key={s.id} value={s.id}>{s.label}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>

        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="caption" sx={{ alignSelf: 'center', mr: 1, color: 'text.secondary' }}>Ideas:</Typography>
          {['Contenedores 3D', 'Puerto nocturno', 'Avión de carga', 'Almacén robótico'].map(idea => (
            <Chip 
              key={idea} 
              label={idea} 
              size="small" 
              onClick={() => setPrompt(`Vista espectacular de ${idea.toLowerCase()}, relacionado con logística internacional`)}
              sx={{ cursor: 'pointer' }}
            />
          ))}
        </Stack>

        <Button 
          variant="contained" 
          color="primary" 
          size="large" 
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <AutoFixHigh />}
          onClick={generateImage}
          disabled={!prompt.trim() || loading}
          sx={{ py: 1.5 }}
        >
          {loading ? 'Generando Obra de Arte...' : 'Generar Imagen'}
        </Button>

        {(loading || imageUrl) && (
          <Box sx={{ mt: 4, textAlign: 'center', position: 'relative', minHeight: 300, bgcolor: 'background.default', borderRadius: 2, border: '1px dashed', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {loading ? (
              <Stack spacing={2} sx={{ alignItems: 'center' }}>
                <CircularProgress color="primary" />
                <Typography variant="body2" color="text.secondary">Pintando píxeles logísticos...</Typography>
              </Stack>
            ) : imageUrl ? (
              <>
                <img src={imageUrl} alt="Generated" style={{ width: '100%', height: 'auto', maxHeight: 600, objectFit: 'contain' }} />
                <Button 
                  variant="contained" 
                  startIcon={<Download />} 
                  onClick={handleDownload}
                  sx={{ position: 'absolute', bottom: 16, right: 16, backdropFilter: 'blur(10px)', bgcolor: 'rgba(0,0,0,0.6)', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' } }}
                >
                  Descargar HD
                </Button>
              </>
            ) : (
              <Box sx={{ color: 'text.disabled', textAlign: 'center' }}>
                <ImageIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                <Typography>La imagen aparecerá aquí</Typography>
              </Box>
            )}
          </Box>
        )}
      </Stack>
    </Card>
  )
}
