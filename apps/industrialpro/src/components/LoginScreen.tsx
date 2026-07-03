import { useState } from 'react';
import { Box, Card, TextField, Button, Typography, Alert, InputAdornment, IconButton, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { motion } from 'framer-motion';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import api, { setToken } from '../api/client';

interface Props {
  onLogin: (user: any) => void;
}

export default function LoginScreen({ onLogin }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name || !password) { setError('Introduce usuario y contraseña'); return; }
    setLoading(true);
    setError('');
    try {
      const ep = mode === 'login' ? '/auth/login' : '/auth/register';
      const res = await api.post(ep, { name, password });
      setToken(res.data.token);
      onLogin(res.data.user);
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(ellipse at center, #0a0e17 0%, #1a1a2e 50%, #0a1a2e 100%)', p: 2 }}>
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
        <Card sx={{ p: 4, width: 400, maxWidth: '100%', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <PrecisionManufacturingIcon sx={{ fontSize: 48, color: '#3b82f6', mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              IndustrialPro
            </Typography>
            <Typography variant="body2" color="text.secondary">Control de Procesos Industriales</Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <ToggleButtonGroup value={mode} exclusive onChange={(_, v) => v && setMode(v)} sx={{ mb: 2, display: 'flex' }}>
            <ToggleButton value="login" sx={{ flex: 1 }}>Entrar</ToggleButton>
            <ToggleButton value="register" sx={{ flex: 1 }}>Registrarse</ToggleButton>
          </ToggleButtonGroup>

          <TextField fullWidth label="Usuario" value={name} onChange={e => setName(e.target.value)}
            sx={{ mb: 2 }} autoFocus onKeyDown={e => e.key === 'Enter' && !loading && handleSubmit()} />
          <TextField fullWidth label="Contraseña" type={showPw ? 'text' : 'password'} value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !loading && handleSubmit()}
            slotProps={{ input: { endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowPw(!showPw)} edge="end" size="small">{showPw ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment> } }}
            sx={{ mb: 3 }} />

          <Button fullWidth variant="contained" size="large" onClick={handleSubmit} disabled={loading}
            sx={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }}>
            {loading ? 'Procesando...' : mode === 'login' ? 'Entrar' : 'Crear Cuenta'}
          </Button>

          <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 1, fontSize: '0.8rem', color: 'text.secondary', textAlign: 'left' }}>
            <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 'bold', color: '#3b82f6' }}>Entorno de Pruebas Activo</Typography>
            <Typography variant="body2">• Admin: <b>Demo</b> / Pass: <b>demo123</b></Typography>
            <Typography variant="body2">• Operario: <b>Test</b> / Pass: <b>test123</b></Typography>
          </Box>
        </Card>
      </motion.div>
    </Box>
  );
}
