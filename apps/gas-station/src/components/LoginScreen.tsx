import { useState } from 'react';
import { Box, Card, TextField, Button, Typography, Alert, InputAdornment, IconButton } from '@mui/material';
import { motion } from 'framer-motion';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import { api, setToken } from '../api/client';

interface Props {
  onLogin: (user: any) => void;
}

export default function LoginScreen({ onLogin }: Props) {
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!name || !pin) { setError('Introduce usuario y PIN'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await api.login(name, pin);
      setToken(res.token);
      onLogin(res.user);
    } catch (e: any) {
      setError(e.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(ellipse at center, #1a1a2e 0%, #0f0f1a 100%)', p: 2 }}>
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
        <Card sx={{ p: 4, width: 380, maxWidth: '100%' }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <LocalGasStationIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700 }}>Gas Station</Typography>
            <Typography variant="body2" color="text.secondary">Estación de Servicio</Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <TextField fullWidth label="Usuario" value={name} onChange={e => setName(e.target.value)}
            sx={{ mb: 2 }} autoFocus onKeyDown={e => e.key === 'Enter' && !loading && handleLogin()} />

          <TextField fullWidth label="PIN" type={showPin ? 'text' : 'password'} value={pin}
            onChange={e => setPin(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !loading && handleLogin()}
            slotProps={{ input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPin(!showPin)} edge="end" size="small">
                    {showPin ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            } }} sx={{ mb: 3 }} />

          <Button fullWidth variant="contained" size="large" onClick={handleLogin} disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>

          <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 1, fontSize: '0.8rem', color: 'text.secondary', textAlign: 'left' }}>
            <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 'bold', color: 'primary.main' }}>Entorno de Pruebas Activo</Typography>
            <Typography variant="body2">• Supervisor: <b>Demo</b> / PIN: <b>1234</b></Typography>
            <Typography variant="body2">• Expendedor: <b>Test</b> / PIN: <b>0000</b></Typography>
          </Box>
        </Card>
      </motion.div>
    </Box>
  );
}
