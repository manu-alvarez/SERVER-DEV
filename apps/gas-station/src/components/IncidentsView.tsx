import { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Table, TableHead, TableRow, TableCell, TableBody, Chip, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, InputLabel, FormControl, CircularProgress, Alert, IconButton } from '@mui/material';
import { motion } from 'framer-motion';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { api } from '../api/client';

const statuses = ['abierta', 'en_curso', 'resuelta', 'cerrada'];
const severities = ['baja', 'media', 'alta', 'critica'];

export default function IncidentsView() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialog, setDialog] = useState(false);
  const [detailDialog, setDetailDialog] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [detailItem, setDetailItem] = useState<any>(null);
  const [form, setForm] = useState<any>({});

  const load = async () => {
    setLoading(true);
    try {
      const incs = await api.getIncidents();
      setIncidents(incs);
    } catch { setError('Error al cargar incidencias'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditItem(null); setForm({ category: '', description: '', status: 'abierta', urgency: 'media' }); setDialog(true); };
  const openEdit = (inc: any) => { setEditItem(inc); setForm({ ...inc }); setDialog(true); };
  const openDetail = async (inc: any) => {
    try {
      const full = await api.getIncident(inc.id);
      setDetailItem(full);
    } catch {
      setDetailItem(inc);
    }
    setDetailDialog(true);
  };

  const save = async () => {
    try {
      if (editItem) await api.updateIncident(editItem.id, form);
      else await api.createIncident(form);
      setDialog(false);
      await load();
    } catch {}
  };

  const remove = async (id: number) => {
    await api.deleteIncident(id);
    await load();
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;

  const severityColor = (s: string) => {
    switch (s) {
      case 'critica': return 'error';
      case 'alta': return 'warning';
      case 'media': return 'info';
      default: return 'success';
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'abierta': return 'error';
      case 'en_curso': return 'warning';
      case 'resuelta': return 'info';
      case 'cerrada': return 'success';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Incidencias</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openNew}>Nueva Incidencia</Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Título</TableCell>
            <TableCell>Severidad</TableCell>
            <TableCell>Estado</TableCell>
            <TableCell>Fecha</TableCell>
            <TableCell align="right">Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {incidents.map((inc, i) => (
            <motion.tr key={inc.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
              <TableCell sx={{ cursor: 'pointer' }} onClick={() => openDetail(inc)}>
                <Typography variant="body2" fontWeight={500}>{inc.category}</Typography>
                <Typography variant="caption" color="text.secondary">{inc.description?.substring(0, 60)}{inc.description?.length > 60 ? '...' : ''}</Typography>
              </TableCell>
              <TableCell><Chip size="small" label={inc.urgency} color={severityColor(inc.urgency) as any} /></TableCell>
              <TableCell><Chip size="small" label={inc.status} color={statusColor(inc.status) as any} /></TableCell>
              <TableCell><Typography variant="caption">{inc.created_at?.split('T')[0] || '-'}</Typography></TableCell>
              <TableCell align="right">
                <IconButton size="small" onClick={() => openDetail(inc)}><VisibilityIcon fontSize="small" /></IconButton>
                <IconButton size="small" onClick={() => openEdit(inc)}><EditIcon fontSize="small" /></IconButton>
                <IconButton size="small" color="error" onClick={() => remove(inc.id)}><DeleteIcon fontSize="small" /></IconButton>
              </TableCell>
            </motion.tr>
          ))}
          {incidents.length === 0 && <TableRow><TableCell colSpan={5} align="center"><Typography color="text.secondary">Sin incidencias</Typography></TableCell></TableRow>}
        </TableBody>
      </Table>

      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editItem ? 'Editar Incidencia' : 'Nueva Incidencia'}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }} autoFocus>
            <InputLabel>Categoría</InputLabel>
            <Select value={form.category || 'otros'} onChange={e => setForm({...form, category: e.target.value})} label="Categoría">
              <MenuItem value="surtidores">Surtidores / Pista</MenuItem>
              <MenuItem value="tienda">Tienda / Stock</MenuItem>
              <MenuItem value="limpieza">Limpieza / Aseos</MenuItem>
              <MenuItem value="sistemas">Sistemas / Informática</MenuItem>
              <MenuItem value="otros">Otros</MenuItem>
            </Select>
          </FormControl>
          <TextField fullWidth label="Descripción" multiline rows={3} value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} sx={{ mt: 2 }} />
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Urgencia</InputLabel>
            <Select value={form.urgency || 'media'} onChange={e => setForm({...form, urgency: e.target.value})} label="Urgencia">
              {severities.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Estado</InputLabel>
            <Select value={form.status || 'abierta'} onChange={e => setForm({...form, status: e.target.value})} label="Estado">
              {statuses.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={save}>{editItem ? 'Guardar' : 'Crear'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={detailDialog} onClose={() => setDetailDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{detailItem?.category}</DialogTitle>
        <DialogContent>
          {detailItem && (
            <Box>
              <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>{detailItem.description}</Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <Chip size="small" label={`Urgencia: ${detailItem.urgency}`} color={severityColor(detailItem.urgency) as any} />
                <Chip size="small" label={`Estado: ${detailItem.status}`} color={statusColor(detailItem.status) as any} />
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                Creado por: {detailItem.created_by_name || detailItem.created_by} | {detailItem.created_at ? new Date(detailItem.created_at).toLocaleString('es-ES') : ''}
              </Typography>
              {detailItem.resolved_at && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  Resuelto: {new Date(detailItem.resolved_at).toLocaleString('es-ES')}
                </Typography>
              )}
              {detailItem.images && detailItem.images.length > 0 && (
                <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {detailItem.images.map((img: string, i: number) => (
                    <Box key={i} component="img" src={img} sx={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 1 }} />
                  ))}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialog(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
