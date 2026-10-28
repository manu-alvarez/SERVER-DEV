import { Box, Paper, Typography, Grid, Button, Chip, TextField } from '@mui/material'
import { Shield as ShieldIcon, Bug as BugIcon, PlayCircle as PlayIcon, Code as CodeIcon } from 'lucide-react'

export default function Adversarial() {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: '-1px' }}>Tests Adversariales</Typography>
          <Typography sx={{ color: '#94a3b8' }}>Genera y ejecuta prompts y casos de prueba adversariales para validar la robustez de tus agentes.</Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid xs={12} lg={8}>
          <Paper sx={{ p: 3, borderRadius: '14px', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Generador de Casos Adversariales</Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Describe el agente o sistema a testear..."
              sx={{ mt: 1, borderRadius: '10px' }}
            />
            <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip label="Inyección de Prompt" color="default" sx={{ fontSize: '0.75rem' }} />
              <Chip label="Fuga de Datos" color="default" sx={{ fontSize: '0.75rem' }} />
              <Chip label="Bypass de Seguridad" color="default" sx={{ fontSize: '0.75rem' }} />
              <Chip label="Toxicidad" color="default" sx={{ fontSize: '0.75rem' }} />
              <Chip label="Hallucinación" color="default" sx={{ fontSize: '0.75rem' }} />
            </Box>
            <Box sx={{ mt: 3 }}>
              <Button
                variant="contained"
                startIcon={<PlayCircle />}
                sx={{ background: 'linear-gradient(135deg, #f472b6 0%, #a78bfa 100%)', color: '#030712', fontWeight: 800, borderRadius: '10px' }}
              >
                Ejecutar Suite Adversarial
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid xs={12} lg={4}>
          <Paper sx={{ p: 3, borderRadius: '14px', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Estado de Seguridad</Typography>
            <Grid container spacing={2}>
              <Grid xs={6}>
                <Chip label="0 Fallos Críticos" size="small" sx={{ color: '#4ade80', fontWeight: 700, borderColor: 'rgba(74,222,128,0.3)' }} />
              </Grid>
              <Grid xs={6}>
                <Chip label="0 Advertencias" size="small" sx={{ color: '#fde047', fontWeight: 700, borderColor: 'rgba(253,224,71,0.3)' }} />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}
