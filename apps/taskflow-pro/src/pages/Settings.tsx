import React from 'react';
import { Box, Typography, Paper, TextField, Switch, FormControlLabel, Button } from '@mui/material';
import { motion } from 'framer-motion';
import { useTaskStore, playNotificationSound } from '../store/taskStore';
import { Smartphone, BellRing } from 'lucide-react';

const Settings: React.FC = () => {
  const { settings, updateSettings } = useTaskStore();

  const handleSave = () => {
    // We already update in real time, but a visual save gives confidence.
    alert('Configuración de WhatsApp guardada correctamente en su dispositivo.');
  };

  return (
    <Box sx={{ flexGrow: 1, maxWidth: 800, mx: 'auto', w: '100%' }}>
      <Typography variant="h3" color="primary" sx={{ mb: 4, fontWeight: 800 }}>Ajustes</Typography>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Paper sx={{ p: 4, mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'primary.main', color: '#000' }}>
              <BellRing />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Experiencia Sensorial</Typography>
          </Box>
          <FormControlLabel
            control={
              <Switch 
                color="primary" 
                checked={settings.soundEnabled} 
                onChange={(e) => {
                  const enabled = e.target.checked;
                  updateSettings({ soundEnabled: enabled });
                  if (enabled) {
                    playNotificationSound();
                  }
                }} 
              />
            }
            label="Efectos de Sonido"
          />
        </Paper>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
        <Paper sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'secondary.main', color: '#fff' }}>
              <Smartphone />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>WhatsApp & CallMeBot</Typography>
              <Typography variant="body2" color="text.secondary">Recibe notificaciones en tu móvil</Typography>
            </Box>
          </Box>

          <FormControlLabel
            control={<Switch color="secondary" checked={settings.whatsappEnabled} onChange={(e) => updateSettings({ whatsappEnabled: e.target.checked })} />}
            label="Activar Conexión CallMeBot"
            sx={{ mb: 3 }}
          />

          {settings.whatsappEnabled && (
            <Box sx={{ pl: { xs: 0, md: 3 }, borderLeft: { xs: 'none', md: '2px solid rgba(255,0,228,0.3)' } }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 3 }}>
                ⚠️ Importante: Los teléfonos deben llevar el prefijo +34, seguidos del número sin ningún espacio (Ej: +34651352065).
              </Typography>

              {/* Usuario 1 */}
              <Typography variant="subtitle1" color="primary" sx={{ fontWeight: 700, mb: 2 }}>Usuario Principal</Typography>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mb: 4 }}>
                <TextField 
                  fullWidth 
                  label="Teléfono (+34 sin espacios)" 
                  variant="outlined" 
                  value={settings.whatsappPhone1}
                  onChange={(e) => updateSettings({ whatsappPhone1: e.target.value })}
                />
                <TextField 
                  fullWidth 
                  label="API Key de CallMeBot" 
                  variant="outlined" 
                  type="password"
                  value={settings.whatsappApiKey1}
                  onChange={(e) => updateSettings({ whatsappApiKey1: e.target.value })}
                />
              </Box>

              {/* Usuario 2 */}
              <Typography variant="subtitle1" color="secondary" sx={{ fontWeight: 700, mb: 2 }}>Usuario Secundario</Typography>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mb: 4 }}>
                <TextField 
                  fullWidth 
                  label="Teléfono (+34 sin espacios)" 
                  variant="outlined" 
                  value={settings.whatsappPhone2}
                  onChange={(e) => updateSettings({ whatsappPhone2: e.target.value })}
                />
                <TextField 
                  fullWidth 
                  label="API Key de CallMeBot" 
                  variant="outlined" 
                  type="password"
                  value={settings.whatsappApiKey2}
                  onChange={(e) => updateSettings({ whatsappApiKey2: e.target.value })}
                />
              </Box>

              <Button variant="contained" color="primary" onClick={handleSave} size="large" fullWidth>
                Guardar Configuración WhatsApp
              </Button>
            </Box>
          )}
        </Paper>
      </motion.div>
    </Box>
  );
};

export default Settings;
