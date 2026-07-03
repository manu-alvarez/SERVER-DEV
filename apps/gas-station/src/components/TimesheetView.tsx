import { useState, useEffect, useCallback } from 'react';
import { Box, Card, CardContent, Typography, Table, TableHead, TableRow, TableCell, TableBody, Chip, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, InputLabel, FormControl, IconButton, CircularProgress, Alert } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { motion } from 'framer-motion';
import { api } from '../api/client';

const entryTypes = ['mañana', 'tarde', 'noche', 'descanso', 'vacaciones', 'baja', 'formacion', 'especial'];

export default function TimesheetView() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [entries, setEntries] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialog, setDialog] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState<any>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [e, s] = await Promise.all([
        api.getTimesheet(month, year),
        api.getTimesheetSummary(month, year),
      ]);
      setEntries(e);
      setSummary(s);
    } catch { setError('Error al cargar timesheet'); }
    setLoading(false);
  }, [month, year]);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setEditItem(null);
    setForm({ date: new Date().toISOString().split('T')[0], shift_type: 'turno', start_time: '', end_time: '', break_minutes: 0, notes: '' });
    setDialog(true);
  };

  const openEdit = (e: any) => {
    setEditItem(e);
    setForm({ ...e, date: e.date?.split('T')[0] || e.date });
    setDialog(true);
  };

  const save = async () => {
    try {
      if (editItem) await api.updateTimesheet(editItem.id, form);
      else await api.createTimesheet(form);
      setDialog(false);
      await load();
    } catch {}
  };

  const remove = async (id: number) => {
    await api.deleteTimesheet(id);
    await load();
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;

  const totalHours = entries.reduce((acc, e) => {
    if (e.start_time && e.end_time) {
      const [sh, sm] = e.start_time.split(':').map(Number);
      const [eh, em] = e.end_time.split(':').map(Number);
      const mins = (eh * 60 + em) - (sh * 60 + sm) - (e.break_minutes || 0);
      return acc + Math.max(0, mins);
    }
    return acc;
  }, 0);

  const workedDays = entries.filter(e => !['descanso', 'vacaciones', 'baja'].includes(e.shift_type)).length;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h4">Timesheet</Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <TextField type="number" label="Mes" value={month} onChange={e => setMonth(parseInt(e.target.value) || 1)} sx={{ width: 80 }} size="small" />
          <TextField type="number" label="Año" value={year} onChange={e => setYear(parseInt(e.target.value) || now.getFullYear())} sx={{ width: 90 }} size="small" />
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openNew}>Nuevo</Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {summary && summary.salary && (
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' }, gap: 2, mb: 2 }}>
            <Card sx={{ bgcolor: summary.difference >= 0 ? '#ecfdf5' : '#fef2f2', border: `1px solid ${summary.difference >= 0 ? '#10b981' : '#ef4444'}` }}>
              <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                <Typography variant="h5" fontWeight={700} color={summary.difference >= 0 ? '#059669' : '#dc2626'}>
                  {summary.difference > 0 ? '+' : ''}{summary.difference?.toFixed(1)}h
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>Diferencia Contrato</Typography>
              </CardContent>
            </Card>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                <Typography variant="h5" fontWeight={700}>{summary.totalWorked?.toFixed(1)}</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>Horas Trabajadas</Typography>
              </CardContent>
            </Card>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                <Typography variant="h5" fontWeight={700}>{workedDays} / {summary.expectedWorkDays}</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>Días (Reales / Previstos)</Typography>
              </CardContent>
            </Card>
            <Card sx={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(59,130,246,0.1) 100%)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                <Typography variant="h5" fontWeight={700} color="success.main">{summary.salary.estimated?.toFixed(2)}€</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>Salario Estimado</Typography>
              </CardContent>
            </Card>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 1, typography: 'caption', color: 'text.secondary' }}>
            <Typography variant="caption">☀️ Mañana: {summary.shifts?.morning?.count}</Typography>
            <Typography variant="caption">🌅 Tarde: {summary.shifts?.afternoon?.count}</Typography>
            <Typography variant="caption">⭐ Especial: {summary.shifts?.special?.count}</Typography>
            <Typography variant="caption">🏖️ Descanso: {summary.shifts?.descanso?.count}</Typography>
            <Typography variant="caption">💰 Base: {summary.salary.hourlyRate}€/h</Typography>
          </Box>
        </Box>
      )}

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Fecha</TableCell>
            <TableCell>Tipo</TableCell>
            <TableCell>Entrada</TableCell>
            <TableCell>Salida</TableCell>
            <TableCell>Pausa</TableCell>
            <TableCell>Horas</TableCell>
            <TableCell align="right">Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {entries.map((e, i) => {
            const [sh, sm] = (e.start_time || '0:0').split(':').map(Number);
            const [eh, em] = (e.end_time || '0:0').split(':').map(Number);
            const mins = e.start_time && e.end_time ? (eh * 60 + em) - (sh * 60 + sm) - (e.break_minutes || 0) : 0;
            const hours = Math.max(0, mins / 60);
            return (
              <motion.tr key={e.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                <TableCell>{e.date?.split('T')[0] || e.date}</TableCell>
                <TableCell><Chip size="small" label={e.shift_type} variant="outlined" /></TableCell>
                <TableCell>{e.start_time || '-'}</TableCell>
                <TableCell>{e.end_time || '-'}</TableCell>
                <TableCell>{e.break_minutes ? `${e.break_minutes}min` : '-'}</TableCell>
                <TableCell><Typography fontWeight={600}>{hours > 0 ? hours.toFixed(1) : '-'}</Typography></TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => openEdit(e)}><EditIcon fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => remove(e.id)}><DeleteIcon fontSize="small" /></IconButton>
                </TableCell>
              </motion.tr>
            );
          })}
          {entries.length === 0 && <TableRow><TableCell colSpan={7} align="center"><Typography color="text.secondary">Sin registros</Typography></TableCell></TableRow>}
        </TableBody>
      </Table>

      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editItem ? 'Editar Registro' : 'Nuevo Registro'}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Fecha" type="date" value={form.date || ''} onChange={e => setForm({...form, date: e.target.value})} sx={{ mt: 2 }} InputLabelProps={{ shrink: true }} />
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Tipo</InputLabel>
            <Select value={form.shift_type || 'mañana'} onChange={e => setForm({...form, shift_type: e.target.value})} label="Tipo">
              {entryTypes.map(t => <MenuItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField fullWidth label="Hora Entrada" type="time" value={form.start_time || ''} onChange={e => setForm({...form, start_time: e.target.value})} sx={{ mt: 2 }} InputLabelProps={{ shrink: true }} />
          <TextField fullWidth label="Hora Salida" type="time" value={form.end_time || ''} onChange={e => setForm({...form, end_time: e.target.value})} sx={{ mt: 2 }} InputLabelProps={{ shrink: true }} />
          <TextField fullWidth label="Pausa (minutos)" type="number" value={form.break_minutes || 0} onChange={e => setForm({...form, break_minutes: parseInt(e.target.value) || 0})} sx={{ mt: 2 }} />
          <TextField fullWidth label="Notas" value={form.notes || ''} onChange={e => setForm({...form, notes: e.target.value})} sx={{ mt: 2 }} multiline rows={2} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={save}>{editItem ? 'Guardar' : 'Crear'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
