import { useState, useEffect } from 'react';
import { Grid, Card, CardContent, Typography, Box, Chip, CircularProgress, Button, Alert, IconButton, ButtonGroup } from '@mui/material';
import { motion } from 'framer-motion';
import ChecklistIcon from '@mui/icons-material/Checklist';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TodayIcon from '@mui/icons-material/Today';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import WbTwilightIcon from '@mui/icons-material/WbTwilight';
import AddTaskIcon from '@mui/icons-material/AddTask';
import { api } from '../api/client';

interface Props {
  user: any;
  onNavigate: (view: string) => void;
}

export default function Dashboard({ user, onNavigate }: Props) {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [summary, setSummary] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const currentHour = new Date().getHours();
  const [shift, setShift] = useState<'mañana'|'tarde'>(currentHour < 14 ? 'mañana' : 'tarde');

  useEffect(() => {
    Promise.all([
      api.getAlerts().catch(() => []),
      api.getIncidentStats().catch(() => ({})),
      api.getSummary('period=month').catch(() => ({})),
    ]).then(([a, s, sum]) => {
      setAlerts(a);
      setStats(s);
      setSummary(sum);
    }).finally(() => setLoading(false));
  }, []);

  const today = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const cards = [
    { title: 'Checklists', icon: <ChecklistIcon sx={{ fontSize: 40 }} />, color: '#2ecc71', value: summary.completed !== undefined ? `${summary.completed}/${summary.total}` : '-', desc: 'Hoy', onClick: () => onNavigate('checklist') },
    { title: 'Alertas Caducidad', icon: <WarningAmberIcon sx={{ fontSize: 40 }} />, color: alerts.length > 0 ? '#f39c12' : '#2ecc71', value: alerts.length, desc: 'Productos próximos a caducar', onClick: () => onNavigate('expiry') },
    { title: 'Incidencias', icon: <ReportProblemIcon sx={{ fontSize: 40 }} />, color: '#e74c3c', value: stats.open !== undefined ? stats.open : '-', desc: 'Abiertas', onClick: () => onNavigate('incidents') },
    { title: 'Timesheet', icon: <AccessTimeIcon sx={{ fontSize: 40 }} />, color: '#3498db', value: summary.hours ? `${summary.hours}h` : '-', desc: 'Este mes', onClick: () => onNavigate('timesheet') },
  ];

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4">Bienvenido, {user?.name}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
            <TodayIcon fontSize="small" /> {today}
          </Typography>
        </Box>
        <ButtonGroup variant="outlined" size="small">
          <Button 
            variant={shift === 'mañana' ? 'contained' : 'outlined'} 
            onClick={() => setShift('mañana')}
            startIcon={<WbSunnyIcon />}
          >
            Mañana (07-14h)
          </Button>
          <Button 
            variant={shift === 'tarde' ? 'contained' : 'outlined'} 
            onClick={() => setShift('tarde')}
            startIcon={<WbTwilightIcon />}
          >
            Tarde (14-21h)
          </Button>
        </ButtonGroup>
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

      {alerts.length > 0 && (
        <Box className="portal-card" sx={{ mb: 3 }}>
        <Card className="portal-card-inner" sx={{ border: 'none', background: 'transparent', boxShadow: 'none' }}>
          <CardContent>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <WarningAmberIcon color="warning" /> Productos Próximos a Caducar
            </Typography>
            {alerts.slice(0, 5).map((a: any, i: number) => (
              <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5, borderBottom: i < alerts.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                <Typography variant="body2">{a.product_name} - {a.batch_code || a.batch_id}</Typography>
                <Chip size="small" label={a.days_left !== undefined ? `${a.days_left} días` : a.expiry_date} color={a.days_left <= 7 ? 'error' : 'warning'} />
              </Box>
            ))}
            <Button size="small" sx={{ mt: 1 }} onClick={() => onNavigate('expiry')}>Ver todas</Button>
          </CardContent>
        </Card>
        </Box>
      )}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Box className="portal-card" sx={{ height: '100%' }}>
          <Card className="portal-card-inner" sx={{ border: 'none', background: 'transparent', boxShadow: 'none', height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>Incidencias Recientes</Typography>
              {stats.recent?.length > 0 ? stats.recent.slice(0, 5).map((inc: any, i: number) => (
                <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>{inc.title}</Typography>
                  <Chip size="small" label={inc.status} color={inc.status === 'abierta' ? 'error' : inc.status === 'en_curso' ? 'warning' : 'success'} />
                </Box>
              )) : <Typography variant="body2" color="text.secondary">Sin incidencias recientes</Typography>}
            </CardContent>
          </Card>
          </Box>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Box className="portal-card" sx={{ height: '100%' }}>
          <Card className="portal-card-inner" sx={{ border: 'none', background: 'transparent', boxShadow: 'none', height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>Checklists - {shift === 'mañana' ? 'Apertura' : 'Cierre'}</Typography>
              {summary.entries?.length > 0 ? summary.entries
                .filter((e: any) => {
                  const n = e.template_name?.toLowerCase() || '';
                  if (shift === 'mañana') return n.includes('apertura') || n.includes('cambio');
                  return n.includes('cierre') || n.includes('cambio');
                })
                .map((e: any, i: number) => (
                <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <Typography variant="body2">{e.template_name}</Typography>
                  <Chip size="small" label={e.completed ? '✅' : '⏳'} color={e.completed ? 'success' : 'warning'} />
                </Box>
              )) : <Typography variant="body2" color="text.secondary">Sin tareas registradas hoy</Typography>}
            </CardContent>
          </Card>
          </Box>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Acciones Rápidas</Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Button fullWidth variant="outlined" startIcon={<AccessTimeIcon />} onClick={() => onNavigate('timesheet')} sx={{ py: 1.5 }}>
              Registrar Turno
            </Button>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Button fullWidth variant="outlined" startIcon={<ChecklistIcon />} onClick={() => onNavigate('checklist')} sx={{ py: 1.5 }}>
              Hacer Checklist
            </Button>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Button fullWidth variant="outlined" startIcon={<WarningAmberIcon />} onClick={() => onNavigate('expiry')} sx={{ py: 1.5 }}>
              Añadir Caducidad
            </Button>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Button fullWidth variant="outlined" startIcon={<ReportProblemIcon />} onClick={() => onNavigate('incidents')} sx={{ py: 1.5 }}>
              Añadir Incidencia
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
