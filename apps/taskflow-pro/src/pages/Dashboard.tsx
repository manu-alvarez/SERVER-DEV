import React from 'react';
import { Box, Typography, Grid, Paper, Button } from '@mui/material';
import { motion } from 'framer-motion';
import { Flame, CheckCircle2, Clock, Plus, Target, ChevronRight } from 'lucide-react';
import { useTaskStore } from '../store/taskStore';
import { useNavigate } from 'react-router-dom';

const MotionPaper = motion(Paper);

const Dashboard: React.FC = () => {
  const { tasks, settings } = useTaskStore();
  const navigate = useNavigate();

  // Forzar cálculos reactivos sobre el store
  const today = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter(t => t.createdAt && t.createdAt.startsWith(today));
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
  const highPriorityTasks = tasks.filter(t => t.priority === 'high' && t.status !== 'completed');

  const stats = [
    { id: 'today', title: 'Tareas Hoy', value: todayTasks.length, icon: <Target size={24} />, color: '#00F5FF', filter: 'all' },
    { id: 'completed', title: 'Completadas', value: completedTasks.length, icon: <CheckCircle2 size={24} />, color: '#00FF66', filter: 'completed' },
    { id: 'pending', title: 'Pendientes', value: pendingTasks.length, icon: <Flame size={24} />, color: '#FF00E4', filter: 'pending' },
    { id: 'urgent', title: 'Urgentes', value: highPriorityTasks.length, icon: <Clock size={24} />, color: '#FF3366', filter: 'high' },
  ];

  const handleStatClick = (filter: string) => {
    navigate(`/tasks?filter=${filter}`);
  };

  return (
    <Box sx={{ flexGrow: 1, position: 'relative' }}>
      <Box sx={{ position: 'relative', zIndex: 1, mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            <Typography variant="h3" color="text.primary" sx={{ mb: 1, fontWeight: 800 }}>
              Buen día, <Box component="span" sx={{ color: 'primary.main' }}>{settings.whatsappPhone1 || 'Usuario MSB'}</Box> ✨
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Tienes {pendingTasks.length} misiones activas. ¡Optimiza tu flujo!
            </Typography>
          </motion.div>
        </Box>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<Plus />}
            onClick={() => navigate('/tasks')}
            sx={{ px: 4, py: 1.5, fontSize: '1rem', borderRadius: 100 }}
          >
            Nueva Tarea
          </Button>
        </motion.div>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4, position: 'relative', zIndex: 1 }}>
        {stats.map((stat, i) => (
          <Grid size={{ xs: 6, md: 3 }} key={stat.id}>
            <Box className="portal-card">
            <MotionPaper
              className="portal-card-inner"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              onClick={() => handleStatClick(stat.filter)}
              sx={{
                p: 3,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                cursor: 'pointer',
                borderRadius: 4,
                bgcolor: 'transparent',
                border: 'none',
                boxShadow: 'none',
              }}
            >
              <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: `${stat.color}15`, color: stat.color, display: 'flex' }}>
                {stat.icon}
              </Box>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>{stat.value}</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
                  {stat.title}
                </Typography>
              </Box>
            </MotionPaper>
            </Box>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ position: 'relative', zIndex: 1 }}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Misiones de Próxima Ejecución</Typography>
            <Button size="small" endIcon={<ChevronRight />} onClick={() => navigate('/tasks')}>Ver todas</Button>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {pendingTasks.slice(0, 5).map((task, i) => (
               <MotionPaper
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.4 + (i * 0.1) }}
                sx={{ 
                  p: 2.5, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  borderRadius: 3,
                  borderLeft: `4px solid`,
                  borderLeftColor: task.priority === 'high' ? 'error.main' : task.priority === 'medium' ? 'warning.main' : 'success.main',
                  bgcolor: 'background.paper'
                }}
               >
                 <Box>
                   <Typography sx={{ fontWeight: 600 }}>{task.title}</Typography>
                   <Typography variant="caption" color="text.secondary">Prioridad {task.priority.toUpperCase()}</Typography>
                 </Box>
                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {task.reminderTime && <Clock size={14} color="#00F5FF" />}
                 </Box>
               </MotionPaper>
            ))}
            {pendingTasks.length === 0 && (
              <Box sx={{ p: 4, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 4, border: '1px dashed rgba(255,255,255,0.1)' }}>
                <Typography color="text.secondary">No hay misiones activas. Disfruta el silencio.</Typography>
              </Box>
            )}
          </Box>
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 700 }}>Ratio de Ejecución</Typography>
          <Box className="portal-card">
          <MotionPaper
            className="portal-card-inner"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.6 }}
            sx={{ p: 3, borderRadius: 4, textAlign: 'center', bgcolor: 'primary.main', color: 'primary.contrastText', boxShadow: 'none', border: 'none' }}
           >
            <Typography variant="h2" sx={{ fontWeight: 900 }}>
              {tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0}%
            </Typography>
            <Typography sx={{ opacity: 0.8, fontWeight: 600 }}>Tareas Completadas</Typography>
          </MotionPaper>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
