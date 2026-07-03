import { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, InputLabel, FormControl, IconButton, CircularProgress, Grid } from '@mui/material';
import { motion } from 'framer-motion';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../api/client';

export default function ProductsView() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ name: '', category: 'Zumos', color: '#3b82f6' });

  const load = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditItem(null); setForm({ name: '', category: 'Zumos', color: '#3b82f6' }); setDialog(true); };
  const openEdit = (p: any) => { setEditItem(p); setForm({ name: p.name, category: p.category, color: p.color }); setDialog(true); };

  const save = async () => {
    try {
      if (editItem) await api.put(`/products/${editItem.id}`, form);
      else await api.post('/products', form);
      setDialog(false);
      await load();
    } catch {}
  };

  const remove = async (id: number) => {
    await api.delete(`/products/${id}`);
    await load();
  };

  const categories = ['Zumos', 'Concentrados', 'Cremas'];

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Productos</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openNew}>Nuevo Producto</Button>
      </Box>

      <Grid container spacing={2}>
        {products.map((p, i) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={p.id}>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Box sx={{ width: 20, height: 20, borderRadius: 1, bgcolor: p.color, flexShrink: 0 }} />
                    <Typography variant="h6" sx={{ flex: 1 }}>{p.name}</Typography>
                    <IconButton size="small" onClick={() => openEdit(p)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => remove(p.id)}><DeleteIcon fontSize="small" /></IconButton>
                  </Box>
                  <Typography variant="caption" color="text.secondary">{p.category}</Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
        {products.length === 0 && (
          <Grid size={{ xs: 12 }}><Card><CardContent><Typography color="text.secondary" textAlign="center">Sin productos</Typography></CardContent></Card></Grid>
        )}
      </Grid>

      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editItem ? 'Editar' : 'Nuevo'} Producto</DialogTitle>
        <DialogContent>
          <TextField autoFocus fullWidth label="Nombre" value={form.name} onChange={e => setForm({...form, name: e.target.value})} sx={{ mt: 2 }} />
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Categoría</InputLabel>
            <Select value={form.category} onChange={e => setForm({...form, category: e.target.value})} label="Categoría">
              {categories.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField fullWidth label="Color" type="color" value={form.color} onChange={e => setForm({...form, color: e.target.value})} sx={{ mt: 2 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={save}>{editItem ? 'Guardar' : 'Crear'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
