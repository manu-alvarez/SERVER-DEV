import { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Table, TableHead, TableRow, TableCell, TableBody, Chip, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, InputLabel, FormControl, Tabs, Tab, Alert, CircularProgress, IconButton, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { motion } from 'framer-motion';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { api } from '../api/client';

export default function ExpiryView() {
  const [tab, setTab] = useState(0);
  const [products, setProducts] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<'product' | 'batch' | null>(null);
  const [editItem, setEditItem] = useState<any>(null);
  const [error, setError] = useState('');

  const [form, setForm] = useState<any>({});

  const load = async () => {
    setLoading(true);
    try {
      const [p, b, a] = await Promise.all([
        api.getProducts(),
        api.getBatches(),
        api.getAlerts(),
      ]);
      setProducts(p);
      setBatches(b);
      setAlerts(a);
    } catch { setError('Error al cargar datos'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openDialog = (type: 'product' | 'batch', item?: any) => {
    setDialog(type);
    setEditItem(item || null);
    if (item) setForm(item);
    else setForm(type === 'product' ? { name: '', category: '' } : { product_id: '', batch_code: '', quantity: '', expiry_date: '' });
  };

  const save = async () => {
    try {
      if (editItem) {
        if (dialog === 'product') await api.updateProduct(editItem.id, form);
        else await api.updateBatch(editItem.id, form);
      } else {
        if (dialog === 'product') await api.createProduct(form);
        else await api.createBatch(form);
      }
      setDialog(null);
      setEditItem(null);
      await load();
    } catch {}
  };

  const remove = async (type: string, id: number) => {
    if (type === 'product') await api.deleteProduct(id);
    else await api.deleteBatch(id);
    await load();
  };

  const getProductName = (id: number) => products.find(p => p.id === id)?.name || `ID: ${id}`;

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Control de Caducidades</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => openDialog('product')}>Producto</Button>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => openDialog('batch')}>Lote</Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {alerts.length > 0 && (
        <Card sx={{ mb: 2, borderColor: 'warning.main', bgcolor: 'rgba(243,156,18,0.08)' }}>
          <CardContent>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <WarningAmberIcon color="warning" /> {alerts.length} producto{alerts.length > 1 ? 's' : ''} próximo{alerts.length > 1 ? 's' : ''} a caducar
            </Typography>
            {alerts.map((a: any, i: number) => {
              const aDaysLeft = a.expiry_date ? Math.ceil((new Date(a.expiry_date).getTime() - Date.now()) / 86400000) : null;
              return (
              <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.3 }}>
                <Typography variant="body2">{a.product_name} - {'Lote #' + a.id?.substring(0,6)}</Typography>
                <Chip size="small" label={aDaysLeft !== null ? `${aDaysLeft} días` : a.expiry_date} color={aDaysLeft !== null && aDaysLeft <= 7 ? 'error' : 'warning'} />
              </Box>
            )})}
          </CardContent>
        </Card>
      )}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Productos" />
        <Tab label="Lotes" />
      </Tabs>

      {tab === 0 && (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Categoría</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((p, i) => (
              <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                <TableCell>{p.name}</TableCell>
                <TableCell><Chip size="small" label={p.category || '-'} variant="outlined" /></TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => openDialog('product', p)}><EditIcon fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => remove('product', p.id)}><DeleteIcon fontSize="small" /></IconButton>
                </TableCell>
              </motion.tr>
            ))}
            {products.length === 0 && <TableRow><TableCell colSpan={3} align="center"><Typography color="text.secondary">Sin productos</Typography></TableCell></TableRow>}
          </TableBody>
        </Table>
      )}

      {tab === 1 && (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Producto</TableCell>
              <TableCell>Lote</TableCell>
              <TableCell>Cantidad</TableCell>
              <TableCell>Caducidad</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {batches.map((b, i) => {
              const daysLeft = b.expiry_date ? Math.ceil((new Date(b.expiry_date).getTime() - Date.now()) / 86400000) : null;
              return (
                <motion.tr key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                  <TableCell>{getProductName(b.product_id)}</TableCell>
                  <TableCell>{b.id?.substring(0,6) || '-'}</TableCell>
                  <TableCell>{b.quantity}</TableCell>
                  <TableCell>{b.expiry_date || '-'}</TableCell>
                  <TableCell>
                    {daysLeft !== null ? (
                      <Chip size="small" label={daysLeft <= 0 ? 'Caducado' : `${daysLeft} días`}
                        color={daysLeft <= 0 ? 'error' : daysLeft <= 30 ? 'warning' : 'success'} />
                    ) : <Chip size="small" label="Sin fecha" variant="outlined" />}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => openDialog('batch', b)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => remove('batch', b.id)}><DeleteIcon fontSize="small" /></IconButton>
                  </TableCell>
                </motion.tr>
              );
            })}
            {batches.length === 0 && <TableRow><TableCell colSpan={6} align="center"><Typography color="text.secondary">Sin lotes</Typography></TableCell></TableRow>}
          </TableBody>
        </Table>
      )}

      <Dialog open={!!dialog} onClose={() => setDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{editItem ? 'Editar' : 'Nuevo'} {dialog === 'product' ? 'Producto' : 'Lote'}</DialogTitle>
        <DialogContent>
          {dialog === 'product' ? (
            <>
              <TextField autoFocus fullWidth label="Nombre" value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} sx={{ mt: 2 }} />
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Categoría</InputLabel>
                <Select value={form.category || 'otros'} onChange={e => setForm({...form, category: e.target.value})} label="Categoría">
                  <MenuItem value="bebidas">Bebidas</MenuItem>
                  <MenuItem value="snacks">Snacks</MenuItem>
                  <MenuItem value="aditivos">Aditivos</MenuItem>
                  <MenuItem value="tabaco">Tabaco</MenuItem>
                  <MenuItem value="otros">Otros</MenuItem>
                </Select>
              </FormControl>
            </>
          ) : (
            <>
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Producto</InputLabel>
                <Select value={form.product_id || ''} onChange={e => setForm({...form, product_id: e.target.value as number})} label="Producto">
                  {products.map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField fullWidth label="Cantidad" type="number" value={form.quantity || ''} onChange={e => setForm({...form, quantity: parseInt(e.target.value) || 0})} sx={{ mt: 2 }} />
              <TextField fullWidth label="Fecha de Caducidad" type="date" value={form.expiry_date || ''} onChange={e => setForm({...form, expiry_date: e.target.value})} sx={{ mt: 2 }} InputLabelProps={{ shrink: true }} />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)}>Cancelar</Button>
          <Button variant="contained" onClick={save}>{editItem ? 'Guardar' : 'Crear'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
