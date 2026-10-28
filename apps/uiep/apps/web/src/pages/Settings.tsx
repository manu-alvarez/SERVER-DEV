import { Box, Paper, Typography, Grid, Button, Chip } from '@mui/material'
import { Shield as ShieldIcon, Settings as SettingsIcon, User as PersonIcon } from 'lucide-react'

export default function Settings() {
  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: '-1px' }}>Configuración</Typography>
        <Typography sx={{ color: '#94a3b8' }}>Ajustes de cuenta, claves de API locales y preferencias de la plataforma.</Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: '14px', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Claves de API Locales</Typography>
            <Typography sx={{ color: '#94a3b8', mb: 2 }}>UIEP puede ejecutarse totalmente local. Configura claves opcionales para proveedores externos si deseas capacidades adicionales.</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <input placeholder="OPENAI_API_KEY (opcional)" className="bg-[#030712] border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:border-cyan-400 focus:outline-none" />
              <input placeholder="ANTHROPIC_API_KEY (opcional)" className="bg-[#030712] border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:border-cyan-400 focus:outline-none" />
              <input placeholder="GOOGLE_API_KEY (opcional)" className="bg-[#030712] border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:border-cyan-400 focus:outline-none" />
            </Box>
          </Paper>
        </Grid>

        <Grid xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: '14px', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Cuenta</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <PersonIcon sx={{ color: '#22d3ee' }} />
              <Typography sx={{ fontWeight: 600 }}>usuario@local</Typography>
            </Box>
            <Chip label="Plan: Free (Local)" size="small" sx={{ color: '#94a3b8', borderColor: 'rgba(148,163,184,0.3)' }} />
            <Chip label="Modo: 100% Local" size="small" sx={{ color: '#4ade80', borderColor: 'rgba(74,222,128,0.3)' }} />
            <Box sx={{ mt: 3 }}>
              <Button
                variant="outlined"
                startIcon={<ShieldIcon />}
                sx={{ borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc' }}
              >
                Exportar Configuración
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}
