import { Box, Paper, Typography, Grid, Chip, Button, CircularProgress } from '@mui/material'
import { PlayCircle as PlayIcon, Layout as LayersIcon, Code as CodeIcon, Shield as ShieldIcon, Terminal as TerminalIcon, Extension as ExtensionIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getHealth } from '../lib/api'

export default function Layout() {
  const [health, setHealth] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getHealth().then((r) => { setHealth(r.data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const stats = [
    { label: 'Agentes Creados', value: '12', icon: <LayersIcon />, color: '#22d3ee' },
    { label: 'Subagentes Activos', value: '34', icon: <CodeIcon />, color: '#a78bfa' },
    { label: 'Plantillas', value: '8', icon: <TerminalIcon />, color: '#4ade80' },
    { label: 'Servidores MCP', value: '3', icon: <ExternalLink />, color: '#fde047' },
    { label: 'Tests Adversariales', value: '0', icon: <ShieldIcon />, color: '#f472b6' },
  ]

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: '-1px' }}>Panel de Control</Typography>
          <Typography sx={{ color: '#94a3b8' }}>Estado del sistema y generación de agentes</Typography>
        </Box>
        <Button variant="contained" startIcon={<PlayCircle />} size="large" sx={{ background: 'linear-gradient(135deg, #22d3ee 0%, #a78bfa 100%)', color: '#030712', fontWeight: 800, px: 4, py: 1.5, borderRadius: '10px', '&:hover': { opacity: 0.9 } }}>
          Crear Nuevo Agente
        </Button>
      </Box>

      <Grid container spacing={3}>
        {stats.map((s) => (
          <Grid key={s.label} xs={12} sm={6} md={3}>
            <Paper sx={{ p: 3, borderRadius: '14px', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 2, borderRadius: '10px', background: `rgba(${s.color === '#22d3ee' ? '34,211,238' : s.color === '#a78bfa' ? '167,139,250' : s.color === '#4ade80' ? '74,222,128' : s.color === '#fde047' ? '253,224,71' : '244,114,182'}, 0.1)`, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {s.icon}
              </Box>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}>{s.value}</Typography>
                <Typography variant="caption" sx={{ color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ mt: 4, p: 3, borderRadius: '14px', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(255,255,255,0.04)' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Estado del Backend</Typography>
        {loading ? <CircularProgress size={24} /> : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: health?.status === 'ok' ? '#4ade80' : '#f43f5e' }} />
            <Typography sx={{ fontWeight: 600, color: health?.status === 'ok' ? '#4ade80' : '#f43f5e' }}>
              {health?.status === 'ok' ? 'Sistema operativo' : 'Sistema no disponible'}
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  )
}
