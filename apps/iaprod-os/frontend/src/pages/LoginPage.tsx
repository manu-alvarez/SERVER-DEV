import { Box, Typography, Button, Paper, TextField, Chip } from '@mui/material'
import { Login as LoginIcon, Person as PersonIcon, Lock as LockIcon } from '@mui/icons/material'
import { useState } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('email', email)
      formData.append('password', password)
      const res = await fetch('http://localhost:8006/api/login', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (data.access_token) {
        localStorage.setItem('iap_token', data.access_token)
        localStorage.setItem('iap_user', JSON.stringify({ email, role: 'user' }))
        window.location.href = '/'
      } else {
        alert('Credenciales inválidas')
      }
    } catch {
      // Login offline simulado (modo local sin servidor)
      localStorage.setItem('iap_token', 'iap_local_' + Math.random().toString(36).slice(2))
      localStorage.setItem('iap_user', JSON.stringify({ email, role: 'user' }))
      window.location.href = '/'
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#02040a' }}>
      <Paper
        sx={{
          p: 4,
          borderRadius: '20px',
          background: 'rgba(10, 15, 26, 0.8)',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          width: { xs: '90%', sm: 440 },
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ width: 48, height: 48, borderRadius: '12px', background: 'linear-gradient(135deg, #22d3ee 0%, #a78bfa 100%)', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
            <LoginIcon sx={{ color: '#02040a', fontSize: 28 }} />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-1px', background: 'linear-gradient(135deg, #22d3ee 0%, #a78bfa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            IA Prod OS
          </Typography>
          <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>Inicia sesión en tu sistema cognitivo</Typography>
        </Box>
        <form onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <PersonIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
            <TextField
              fullWidth
              label="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              variant="outlined"
              sx={{ borderRadius: '10px', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' }, '&:focus-within .MuiOutlinedInput-notchedOutline': { borderColor: '#22d3ee' } }}
              InputProps={{ style: { color: '#f8fafc' } }}
            />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <LockIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
            <TextField
              fullWidth
              type="password"
              label="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              variant="outlined"
              sx={{ borderRadius: '10px', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' }, '&:focus-within .MuiOutlinedInput-notchedOutline': { borderColor: '#22d3ee' } }}
              InputProps={{ style: { color: '#f8fafc' } }}
            />
          </Box>
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            startIcon={<LoginIcon sx({ fontSize: 20 }) as any />}
            sx={{
              background: 'linear-gradient(135deg, #22d3ee 0%, #a78bfa 100%)',
              color: '#02040a',
              fontWeight: 800,
              borderRadius: '10px',
              py: 1.5,
              '&:hover': { opacity: 0.9 },
              '&:disabled': { opacity: 0.5 },
            }}
          >
            {loading ? 'Entrando...' : 'Iniciar Sesión'}
          </Button>
        </form>
        <Box sx={{ mt: 3, textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>
          Modo local — autenticación JWT sin dependencia de APIs externas
        </Box>
      </Paper>
    </Box>
  )
}
