import { useState, useEffect } from 'react';
import { Grid, Card, CardContent, Typography, Box, Chip, CircularProgress } from '@mui/material';
import { motion } from 'framer-motion';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TimerIcon from '@mui/icons-material/Timer';
import InventoryIcon from '@mui/icons-material/Inventory';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import api from '../api/client';

interface Props {
  user: any;
  onNavigate: (view: string) => void;
}

export default function Dashboard({ user, onNavigate }: Props) {
  const [stats, setStats] = useState<any>({});
  const [recentOps, setRecentOps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/stats').then(r => r.data).catch(() => ({})),
      api.get('/operations').then(r => r.data).catch(() => []),
    ]).then(([s, ops]) => {
      setStats(s);
      setRecentOps(ops.slice(0, 5));
    }).finally(() => setLoading(false));
  }, []);

  const cards = [
    { title: 'Operaciones', icon: <PrecisionManufacturingIcon sx={{ fontSize: 40 }} />, color: '#3b82f6', value: stats.total_operations || 0, desc: 'Totales', onClick: () => onNavigate('operations') },
    { title: 'Activas', icon: <PlayArrowIcon sx={{ fontSize: 40 }} />, color: '#10b981', value: stats.running_operations || 0, desc: 'En curso', onClick: () => onNavigate('operations') },
    { title: 'Completadas', icon: <CheckCircleIcon sx={{ fontSize: 40 }} />, color: '#6366f1', value: stats.completed_operations || 0, desc: 'Historial', onClick: () => onNavigate('history') },
    { title: 'Temporizadores', icon: <TimerIcon sx={{ fontSize: 40 }} />, color: '#f59e0b', value: stats.active_timers || 0, desc: stats.total_timers ? `de ${stats.total_timers} activos` : 'Sin timers', onClick: () => onNavigate('operations') },
  ];

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4">Bienvenido, {user?.name}</Typography>
        <Typography variant="body2" color="text.secondary">Panel de Control IndustrialPro</Typography>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {cards.map((card, i) => (
          <Grid size={{ xs: 6, md: 3 }} key={i}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <Box className="portal-card" sx={{ cursor: 'pointer', '&:hover': { transform: 'translateY(-2px)', transition: 'all 0.2s' } }} onClick={card.onClick}>
                <Card className="portal-card-inner" sx={{ border: 'none', background: 'transparent', boxShadow: 'none' }}>
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Box sx={{ color: card.color, mb: 1 }}>{card.icon}</Box>
                    <Typography variant="h4" fontWeight={700}>{card.value}</Typography>
                    <Typography variant="body2" fontWeight={600}>{card.title}</Typography>
                    <Typography variant="caption" color="text.secondary">{card.desc}</Typography>
                  </CardContent>
                </Card>
              </Box>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      <Typography variant="h6" sx={{ mb: 2 }}>Operaciones Recientes</Typography>
      <Grid container spacing={2}>
        {recentOps.map((op, i) => {
          const isRunning = op.status === 'running';
          return (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={op.id}>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                <Box className="portal-card" sx={{ cursor: 'pointer' }}>
                <Card className="portal-card-inner" sx={{ border: 'none', background: 'transparent', boxShadow: 'none' }} onClick={() => onNavigate('operations')}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle1" fontWeight={700}>{op.name}</Typography>
                      <Chip size="small" label={isRunning ? 'Activa' : 'Completada'} color={isRunning ? 'success' : 'default'} />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Producto: {op.product_name || '-'} | {new Date(op.created_at).toLocaleDateString('es-ES')}
                    </Typography>
                  </CardContent>
                </Card>
                </Box>
              </motion.div>
            </Grid>
          );
        })}
        {recentOps.length === 0 && (
          <Grid size={{ xs: 12 }}>
            <Card><CardContent><Typography color="text.secondary" textAlign="center">No hay operaciones. Crea una nueva.</Typography></CardContent></Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
