import { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, TextField, Button, Alert, Divider, Switch, FormControlLabel, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress } from '@mui/material';
import { motion } from 'framer-motion';
import LockResetIcon from '@mui/icons-material/LockReset';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import { api, setToken } from '../api/client';

interface Props {
  user: any;
  onLogout: () => void;
}

export default function SettingsView({ user, onLogout }: Props) {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [pinDialog, setPinDialog] = useState(false);
  const [pinForm, setPinForm] = useState({ pin: '', newPin: '', confirmPin: '' });

  useEffect(() => {
    api.getSettings().then(s => setSettings(s || {})).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    try {
      await api.updateSettings(settings);
      setMessage('Ajustes guardados');
    } catch { setMessage('Error al guardar'); }
    setSaving(false);
  };

  const changePin = async () => {
    if (pinForm.newPin !== pinForm.confirmPin) { setMessage('Los PINs no coinciden'); return; }
    if (pinForm.newPin.length < 4) { setMessage('El PIN debe tener al menos 4 dígitos'); return; }
    try {
      await api.changePin(pinForm.pin, pinForm.newPin);
      setPinDialog(false);
      setPinForm({ pin: '', newPin: '', confirmPin: '' });
      setMessage('PIN actualizado correctamente');
    } catch (e: any) { setMessage(e.message); }
  };

  const handleExport = async () => {
    try {
      const data = await api.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gas-station-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { setMessage('Error al exportar'); }
  };

  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: any) => {
      try {
        const text = await e.target.files[0].text();
        await api.importData(JSON.parse(text));
        setMessage('Datos importados correctamente');
      } catch { setMessage('Error al importar'); }
    };
    input.click();
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2 }}>Ajustes</Typography>

      {message && <Alert severity={message.includes('Error') || message.includes('no coinciden') ? 'error' : 'success'} sx={{ mb: 2 }}>{message}</Alert>}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <LockResetIcon /> Seguridad
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Typography variant="body2">Usuario: <strong>{user?.name}</strong></Typography>
                <Button variant="outlined" size="small" onClick={() => setPinDialog(true)}>Cambiar PIN</Button>
              </Box>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Preferencias</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {Object.entries(settings).filter(([k]) => !k.startsWith('_')).map(([key, val]) => (
                  typeof val === 'boolean' ? (
                    <FormControlLabel key={key} control={<Switch checked={val} onChange={e => setSettings({...settings, [key]: e.target.checked})} />} label={key} />
                  ) : (
                    <TextField key={key} size="small" label={key} value={val || ''} onChange={e => setSettings({...settings, [key]: e.target.value})} />
                  )
                ))}
                {Object.keys(settings).filter(k => !k.startsWith('_')).length === 0 && (
                  <Typography variant="body2" color="text.secondary">Sin ajustes configurados</Typography>
                )}
              </Box>
              <Button variant="contained" sx={{ mt: 2 }} onClick={saveSettings} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar Ajustes'}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Datos</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={handleExport}>Exportar</Button>
                <Button variant="outlined" startIcon={<FileUploadIcon />} onClick={handleImport}>Importar</Button>
              </Box>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardContent>
              <Button variant="outlined" color="error" onClick={onLogout}>Cerrar Sesión</Button>
            </CardContent>
          </Card>
        </motion.div>
      </Box>

      <Dialog open={pinDialog} onClose={() => setPinDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Cambiar PIN</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="PIN Actual" type="password" value={pinForm.pin} onChange={e => setPinForm({...pinForm, pin: e.target.value})} sx={{ mt: 2 }} />
          <TextField fullWidth label="Nuevo PIN" type="password" value={pinForm.newPin} onChange={e => setPinForm({...pinForm, newPin: e.target.value})} sx={{ mt: 2 }} />
          <TextField fullWidth label="Confirmar PIN" type="password" value={pinForm.confirmPin} onChange={e => setPinForm({...pinForm, confirmPin: e.target.value})} sx={{ mt: 2 }} onKeyDown={e => e.key === 'Enter' && changePin()} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPinDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={changePin}>Cambiar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
