import { Box, Typography, Button, Paper, Chip, Grid, TextField } from '@mui/material'
import { Settings as SettingsIcon, Lock as LockIcon, Person as PersonIcon } from '@mui/icons/material'
import { useState } from 'react'
import { api } from '../lib/api'

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('')
  const [jwt, setJwt] = useState('')

  const handleSaveKey = async () => {
    try {
      await api.post('/api/vault-update', { key: 'api_key', value: apiKey })
      alert('Clave guardada en vault local')
    } catch (e) {
      alert('Error guardando clave')
    }
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: '-1px' }}>Configuración</Typography>
        <Typography sx={{ color: '#94a3b8' }}>Claves de API locales, autenticación y preferencias del sistema.</Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: '14px', background: 'rgba(10, 15, 26, 0.7)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <SettingsIcon sx={{ color: '#22d3ee' }} /> Preferencias
            </Typography>
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <input
                placeholder="Tema de interfaz"
                value="Oscuro Neón"
                readOnly
                className="bg-[#030712] border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
              />
              <input
                placeholder="Idioma"
                value="Español"
                readOnly
                className="bg-[#030712] border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
              />
              <Button variant="outlined" sx={{ borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc' }}>
                Restablecer Predeterminados
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: '14px', background: 'rgba(10, 15, 26, 0.7)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <LockIcon sx={{ color: '#a78bfa' }} /> Seguridad y Claves
            </Typography>
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <TextField
                fullWidth
                label="Clave API Local (opcional)"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                sx={{ borderRadius: '10px' }}
              />
              <Button
                variant="contained"
                onClick={handleSaveKey}
                sx={{ background: 'linear-gradient(135deg, #22d3ee 0%, #a78bfa 100%)', color: '#02040a', fontWeight: 800, borderRadius: '10px' }}
              >
                Guardar en Vault Local
              </Button>
              <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                <Chip label="JWT: Activo" size="small" sx={{ color: '#4ade80', borderColor: 'rgba(74,222,128,0.3)' }} />
                <Chip label="Rate Limiting: Activo" size="small" sx={{ color: '#4ade80', borderColor: 'rgba(74,222,128,0.3)' }} />
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}
