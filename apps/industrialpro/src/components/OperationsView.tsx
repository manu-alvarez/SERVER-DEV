import { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Card, CardContent, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, InputLabel, FormControl, Chip, IconButton, CircularProgress, Alert, LinearProgress, Grid } from '@mui/material';
import { motion } from 'framer-motion';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PowerIcon from '@mui/icons-material/Power';
import api from '../api/client';

export default function OperationsView() {
  const [operations, setOperations] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialog, setDialog] = useState(false);
  const [opName, setOpName] = useState('');
  const [opProduct, setOpProduct] = useState('');
  const [alerts, setAlerts] = useState<any[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const load = useCallback(async () => {
    try {
      const [ops, prods] = await Promise.all([
        api.get('/operations').then(r => r.data),
        api.get('/products').then(r => r.data),
      ]);
      setOperations(ops);
      setProducts(prods);
    } catch { setError('Error al cargar'); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const iv = setInterval(async () => {
      try {
        const res = await api.get('/timers/check');
        const finished = res.data.finished;
        if (finished.length > 0) {
          setAlerts(prev => [...prev, ...finished]);
          finished.forEach(f => {
            const n = new Notification('⏰ Timer Completado', {
              body: `${f.timer_name} - ${f.operation_name}`,
            });
            setTimeout(() => n.close(), 5000);
          });
          audioRef.current?.play().catch(() => {});
          await load();
        }
      } catch {}
    }, 3000);
    return () => clearInterval(iv);
  }, [load]);

  const createOp = async () => {
    if (!opName || !opProduct) return;
    try {
      await api.post('/operations', { name: opName, product_id: parseInt(opProduct) });
      setDialog(false);
      setOpName('');
      setOpProduct('');
      await load();
    } catch {}
  };

  const toggleTimer = async (timer: any) => {
    try {
      const now = new Date().toISOString();
      await api.put(`/timers/${timer.id}`, {
        is_running: timer.is_running ? 0 : 1,
        last_tick: now,
        elapsed_seconds: timer.elapsed_seconds,
      });
      await load();
    } catch {}
  };

  const resetTimer = async (timer: any) => {
    try {
      await api.put(`/timers/${timer.id}`, { elapsed_seconds: 0, is_running: 0 });
      await load();
    } catch {}
  };

  const addTimer = async (opId: number) => {
    const mins = prompt('Duración en minutos:');
    if (!mins || isNaN(Number(mins))) return;
    const name = prompt('Nombre:');
    if (!name) return;
    try {
      await api.post(`/operations/${opId}/timers`, { name, duration_seconds: Number(mins) * 60 });
      await load();
    } catch {}
  };

  const toggleValve = async (valve: any) => {
    const statuses = ['open', 'closed', 'maintenance'];
    const idx = statuses.indexOf(valve.status);
    const next = statuses[(idx + 1) % 3];
    try {
      await api.put(`/valves/${valve.id}`, { status: next });
      await load();
    } catch {}
  };

  const togglePump = async (pump: any) => {
    const running = pump.status === 'running';
    try {
      await api.put(`/pumps/${pump.id}`, { status: running ? 'stopped' : 'running', rpm: running ? 0 : 1450 });
      await load();
    } catch {}
  };

  const toggleChecklist = async (item: any) => {
    try {
      await api.put(`/checklists/${item.id}`, { checked: item.checked ? 0 : 1 });
      await load();
    } catch {}
  };

  const completeOp = async (opId: number) => {
    try {
      await api.put(`/operations/${opId}`, { status: 'completed' });
      await load();
    } catch {}
  };

  const addValve = async (opId: number) => {
    const name = prompt('Nombre de la válvula:');
    if (!name) return;
    await api.post(`/operations/${opId}/valves`, { name });
    await load();
  };

  const addPump = async (opId: number) => {
    const name = prompt('Nombre de la bomba:');
    if (!name) return;
    await api.post(`/operations/${opId}/pumps`, { name });
    await load();
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const runningOps = operations.filter(o => o.status === 'running');

  return (
    <Box>
      <audio ref={audioRef} src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACAf39/f4B/f3+AgH9/f3+AgH9/f3+AgH9/f3+AgH9/f3+AgH9/f3+AgH9/f3+AgH9/f3+AgH9/f3+AgH9/f38=" preload="auto" />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h4">Operaciones</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialog(true)}>Nueva Operación</Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {alerts.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }} action={<Button size="small" onClick={() => setAlerts([])}>Cerrar</Button>}>
          {alerts.map((a, i) => <div key={i}>⏰ {a.timer_name} - {a.operation_name}</div>)}
        </Alert>
      )}

      {runningOps.map((op, i) => (
        <motion.div key={op.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="h6">{op.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Producto: {op.product_name || '-'} | Inicio: {new Date(op.start_time).toLocaleString('es-ES')}
                  </Typography>
                </Box>
                <Button variant="outlined" color="success" size="small" onClick={() => completeOp(op.id)}
                  startIcon={<CheckCircleIcon />}>Completar</Button>
              </Box>

              <Grid container spacing={2}>
                {/* Timers */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary">⏱ Temporizadores</Typography>
                    <Button size="small" onClick={() => addTimer(op.id)} startIcon={<AddIcon />}>Añadir</Button>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {op.timers?.map(t => {
                      const remain = Math.max(0, t.duration_seconds - t.elapsed_seconds);
                      const pct = (t.elapsed_seconds / t.duration_seconds) * 100;
                      const finished = remain <= 0;
                      return (
                        <Card key={t.id} variant="outlined" sx={{ p: 1, minWidth: 160, borderColor: finished ? 'error.main' : t.is_running ? 'success.main' : 'divider' }}>
                          <Typography variant="caption" fontWeight={600}>{t.name}</Typography>
                          <Typography variant="h5" fontFamily="monospace" fontWeight={700} color={finished ? 'error.main' : t.is_running ? 'success.main' : 'text.secondary'}>
                            {formatTime(remain)}
                          </Typography>
                          <LinearProgress variant="determinate" value={Math.min(pct, 100)} color={finished ? 'error' : 'primary'} sx={{ my: 0.5, height: 4, borderRadius: 2 }} />
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <IconButton size="small" onClick={() => toggleTimer(t)}>{t.is_running ? <PauseIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" />}</IconButton>
                            <IconButton size="small" onClick={() => resetTimer(t)}><RestartAltIcon fontSize="small" /></IconButton>
                          </Box>
                        </Card>
                      );
                    })}
                    {(!op.timers || op.timers.length === 0) && <Typography variant="caption" color="text.secondary">Sin temporizadores</Typography>}
                  </Box>
                </Grid>

                {/* Valves */}
                <Grid size={{ xs: 12, md: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary">🔧 Válvulas</Typography>
                    <Button size="small" onClick={() => addValve(op.id)}><AddIcon fontSize="small" /></Button>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {op.valves?.map(v => (
                      <Chip key={v.id} label={`${v.name}: ${v.status === 'open' ? '🟢' : v.status === 'closed' ? '🔴' : '🟡'}`}
                        onClick={() => toggleValve(v)}
                        color={v.status === 'open' ? 'success' : v.status === 'closed' ? 'error' : 'warning'} size="small" variant="outlined" />
                    ))}
                  </Box>
                </Grid>

                {/* Pumps */}
                <Grid size={{ xs: 12, md: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary">⚡ Bombas</Typography>
                    <Button size="small" onClick={() => addPump(op.id)}><AddIcon fontSize="small" /></Button>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {op.pumps?.map(p => (
                      <Chip key={p.id} icon={<PowerIcon />}
                        label={`${p.name}: ${p.status === 'running' ? `${p.rpm} RPM` : 'STOP'}`}
                        onClick={() => togglePump(p)}
                        color={p.status === 'running' ? 'success' : 'default'} size="small" variant="outlined" />
                    ))}
                  </Box>
                </Grid>
              </Grid>

              {/* Checklist */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                  ✅ Checklist: {op.checklists?.filter((c: any) => c.checked).length || 0}/{op.checklists?.length || 0}
                </Typography>
                <LinearProgress variant="determinate" value={op.checklists?.length ? ((op.checklists.filter((c: any) => c.checked).length / op.checklists.length) * 100) : 0} sx={{ height: 6, borderRadius: 3, mb: 1 }} />
                <Grid container spacing={0.5}>
                  {op.checklists?.map((item: any) => (
                    <Grid size={{ xs: 12, sm: 6 }} key={item.id}>
                      <Chip label={item.text} onClick={() => toggleChecklist(item)}
                        color={item.checked ? 'success' : 'default'}
                        variant={item.checked ? 'filled' : 'outlined'} size="small" sx={{ width: '100%', justifyContent: 'flex-start' }} />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </motion.div>
      ))}

      {runningOps.length === 0 && (
        <Card><CardContent><Typography color="text.secondary" textAlign="center" sx={{ py: 4 }}>No hay operaciones activas. Crea una nueva.</Typography></CardContent></Card>
      )}

      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Nueva Operación</DialogTitle>
        <DialogContent>
          <TextField autoFocus fullWidth label="Nombre" value={opName} onChange={e => setOpName(e.target.value)} sx={{ mt: 2 }} />
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Producto</InputLabel>
            <Select value={opProduct} onChange={e => setOpProduct(e.target.value)} label="Producto">
              {products.map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={createOp}>Crear</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
