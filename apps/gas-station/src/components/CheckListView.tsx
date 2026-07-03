import { useState, useEffect, useCallback } from 'react';
import { Box, Card, CardContent, Typography, ToggleButtonGroup, ToggleButton, Chip, IconButton, Checkbox, FormControlLabel, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress, Alert } from '@mui/material';
import { motion } from 'framer-motion';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { api } from '../api/client';

const phases = [
  { id: 'apertura', label: 'Apertura', icon: '🌅' },
  { id: 'cambio_turno', label: 'Cambio Turno', icon: '🔄' },
  { id: 'cierre', label: 'Cierre', icon: '🌙' },
];

export default function CheckListView() {
  const [phase, setPhase] = useState('apertura');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<'template' | null>(null);
  const [editTemplate, setEditTemplate] = useState<any>(null);
  const [templateName, setTemplateName] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t, e] = await Promise.all([
        api.getTemplates(),
        api.getEntries(date, phase),
      ]);
      setTemplates(t);
      setEntries(e);
    } catch { setError('Error al cargar datos'); }
    setLoading(false);
  }, [date, phase]);

  useEffect(() => { load(); }, [load]);

  const toggleEntry = async (entry: any) => {
    try {
      await api.updateEntry(entry.id, { completed: !entry.completed });
      await load();
    } catch {}
  };

  const saveTemplate = async () => {
    if (!templateName.trim()) return;
    try {
      if (editTemplate) {
        await api.updateTemplate(editTemplate.id, { task_name: templateName, phase });
      } else {
        await api.createTemplate({ task_name: templateName, phase });
      }
      setDialog(null);
      setTemplateName('');
      setEditTemplate(null);
      await load();
    } catch {}
  };

  const deleteTemplate = async (id: number) => {
    await api.deleteTemplate(id);
    await load();
  };

  const moveTemplate = async (id: number, dir: 'up' | 'down') => {
    await api.moveTemplate(id, dir);
    await load();
  };

  const createEntry = async (template: any) => {
    try {
      await api.updateEntry(0, { template_id: template.id, date, phase, completed: false });
      await load();
    } catch {}
  };

  const filteredTemplates = templates.filter(t => t.phase === phase);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2 }}>Checklists</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField type="date" value={date} onChange={e => setDate(e.target.value)} size="small" sx={{ width: 180 }} />
        <Box sx={{ flex: 1 }} />
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => { setEditTemplate(null); setTemplateName(''); setDialog('template'); }}>
          Nueva Tarea
        </Button>
      </Box>

      <ToggleButtonGroup value={phase} exclusive onChange={(_, v) => v && setPhase(v)} sx={{ mb: 3, display: 'flex', gap: 0 }}>
        {phases.map(p => (
          <ToggleButton key={p.id} value={p.id} sx={{ flex: 1, textTransform: 'none' }}>
            {p.icon} {p.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {filteredTemplates.map((template, i) => {
          const entry = entries.find(e => e.template_id === template.id);
          const completed = entry?.completed || false;
          return (
            <motion.div key={template.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
              <Card sx={{ opacity: completed ? 0.7 : 1 }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Chip label={template.task_name} sx={{ flex: 1, justifyContent: 'flex-start', bgcolor: completed ? 'success.main' : 'background.paper', color: completed ? '#fff' : 'text.primary', fontWeight: 500, borderRadius: 1 }} />
                  {entry ? (
                    <FormControlLabel control={<Checkbox checked={completed} onChange={() => toggleEntry(entry)} sx={{ '&.Mui-checked': { color: 'success.main' } }} />} label="" sx={{ m: 0 }} />
                  ) : (
                    <Button size="small" variant="outlined" onClick={() => createEntry(template)}>Iniciar</Button>
                  )}
                  <IconButton size="small" onClick={() => moveTemplate(template.id, 'up')} disabled={i === 0}><ArrowUpwardIcon fontSize="small" /></IconButton>
                  <IconButton size="small" onClick={() => moveTemplate(template.id, 'down')} disabled={i === filteredTemplates.length - 1}><ArrowDownwardIcon fontSize="small" /></IconButton>
                  <IconButton size="small" onClick={() => { setEditTemplate(template); setTemplateName(template.task_name); setDialog('template'); }}><EditIcon fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => deleteTemplate(template.id)}><DeleteIcon fontSize="small" /></IconButton>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
        {filteredTemplates.length === 0 && (
          <Card><CardContent><Typography color="text.secondary" textAlign="center">No hay tareas para {phases.find(p => p.id === phase)?.label}. Crea una nueva.</Typography></CardContent></Card>
        )}
      </Box>

      <Dialog open={dialog === 'template'} onClose={() => setDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{editTemplate ? 'Editar Tarea' : 'Nueva Tarea'}</DialogTitle>
        <DialogContent>
          <TextField autoFocus fullWidth label="Nombre de la tarea" value={templateName} onChange={e => setTemplateName(e.target.value)} sx={{ mt: 1 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)}>Cancelar</Button>
          <Button variant="contained" onClick={saveTemplate}>{editTemplate ? 'Guardar' : 'Crear'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
