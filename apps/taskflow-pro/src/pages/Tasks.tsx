import React, { useState } from 'react';
import { Box, Typography, Paper, IconButton, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Tabs, Tab, Tooltip } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTaskStore, Task } from '../store/taskStore';
import { Plus, Trash2, CheckCircle, Circle, Filter, Edit2, AlertCircle } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

const Tasks: React.FC = () => {
  const { tasks, addTask, deleteTask, updateTask, clearTasks, categories } = useTaskStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const filterParam = searchParams.get('filter') || 'all';

  const [open, setOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [reminderTime, setReminderTime] = useState('');

  const filteredTasks = tasks.filter((task) => {
    if (filterParam === 'completed') return task.status === 'completed';
    if (filterParam === 'pending') return task.status === 'pending' || task.status === 'in_progress';
    if (filterParam === 'high') return task.priority === 'high';
    return true;
  });

  const requestPermission = async () => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      await Notification.requestPermission();
    }
  };

  const handleOpenDialog = (task?: Task) => {
    if (task) {
      setEditingTaskId(task.id);
      setTitle(task.title);
      setCategoryId(task.categoryId);
      setPriority(task.priority);
      setReminderTime(task.reminderTime || '');
    } else {
      setEditingTaskId(null);
      setTitle('');
      setCategoryId(categories[0]?.id || '');
      setPriority('medium');
      setReminderTime('');
    }
    setOpen(true);
    requestPermission();
  };

  const handleSave = () => {
    if (title.trim()) {
      const taskData = { 
        title, 
        description: '', 
        categoryId, 
        priority, 
        reminderTime: reminderTime || undefined
      };

      if (editingTaskId) {
        updateTask(editingTaskId, taskData);
      } else {
        addTask({ ...taskData, status: 'pending' });
      }
      
      setOpen(false);
    }
  };

  const handleClearAll = () => {
    if (window.confirm('⚠️ ¿Estás seguro de que quieres eliminar TODAS las misiones? Esta acción no se puede deshacer.')) {
      clearTasks();
    }
  };

  const getPriorityColor = (p: string) => {
    if (p === 'low') return 'success';
    if (p === 'medium') return 'warning';
    return 'error';
  };

  return (
    <Box sx={{ flexGrow: 1, position: 'relative' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h3" color="primary" sx={{ fontWeight: 800 }}>Mis Tareas</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {tasks.length > 0 && (
            <Button 
              variant="outlined" 
              color="error" 
              startIcon={<Trash2 size={18} />} 
              onClick={handleClearAll}
              sx={{ borderRadius: 100, px: 3, borderWeight: 2, fontWeight: 700 }}
            >
              Borrar Todo
            </Button>
          )}
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<Plus />} 
            onClick={() => handleOpenDialog()} 
            sx={{ borderRadius: 100, px: 3, fontWeight: 800 }}
          >
            Nueva Tarea
          </Button>
        </Box>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
        <Tabs 
          value={filterParam} 
          onChange={(_, val) => setSearchParams({ filter: val })}
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab label="Todas" value="all" />
          <Tab label="Pendientes" value="pending" />
          <Tab label="Completadas" value="completed" />
          <Tab label="Urgentes" value="high" />
        </Tabs>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <AnimatePresence mode="popLayout">
          {filteredTasks.map((task) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              layout
            >
              <Paper 
                sx={{ 
                  p: 2.5, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: { xs: 1.5, sm: 3 }, 
                  borderRadius: 3,
                  borderLeft: `5px solid`,
                  borderLeftColor: `${getPriorityColor(task.priority)}.main`,
                  bgcolor: task.status === 'completed' ? 'rgba(255,255,255,0.02)' : 'background.paper',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.05)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <IconButton 
                  color={task.status === 'completed' ? 'primary' : 'default'}
                  onClick={() => updateTask(task.id, { status: task.status === 'completed' ? 'pending' : 'completed' })}
                  sx={{ p: 1 }}
                >
                  {task.status === 'completed' ? <CheckCircle size={28} /> : <Circle size={28} />}
                </IconButton>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 600,
                    textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                    color: task.status === 'completed' ? 'text.secondary' : 'text.primary',
                    fontSize: { xs: '1rem', sm: '1.25rem' }
                  }}>
                    {task.title}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                    <Chip 
                      label={categories.find(c => c.id === task.categoryId)?.name || 'General'} 
                      size="small" 
                      variant="outlined"
                      sx={{ fontSize: '0.65rem', height: 20 }}
                    />
                    {task.reminderTime && (
                      <Chip 
                        label={`⏰ ${new Date(task.reminderTime).toLocaleString()}`}
                        size="small"
                        color="secondary"
                        variant="filled"
                        sx={{ fontSize: '0.65rem', height: 20, fontWeight: 700 }}
                      />
                    )}
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Tooltip title="Editar Alarma">
                    <IconButton size="small" color="primary" onClick={() => handleOpenDialog(task)}>
                      <Edit2 size={18} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Eliminar Misión">
                    <IconButton color="error" onClick={() => deleteTask(task.id)} size="small">
                      <Trash2 size={18} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Paper>
            </motion.div>
          ))}
          {filteredTasks.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Box sx={{ py: 10, textAlign: 'center', opacity: 0.5 }}>
                <Filter size={48} style={{ marginBottom: 16 }} />
                <Typography variant="h6">No hay tareas con este filtro</Typography>
                <Button size="small" onClick={() => setSearchParams({ filter: 'all' })}>Ver todas</Button>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} slotProps={{ paper: { sx: { borderRadius: 5, width: '100%', maxWidth: 450, p: 1, backgroundImage: 'none', bgcolor: 'background.paper' } } }}>
        <DialogTitle sx={{ fontWeight: 900, fontSize: '1.5rem', pb: 1, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {editingTaskId ? <Edit2 size={24} /> : <Plus size={24} />}
          {editingTaskId ? 'Modificar Misión' : 'Nueva Misión'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
          <TextField 
            autoFocus 
            fullWidth 
            label="¿Qué objetivo tienes?" 
            variant="filled" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)}
            sx={{ borderRadius: 2 }}
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField 
              select 
              fullWidth 
              label="Categoría" 
              variant="filled"
              value={categoryId} 
              onChange={(e) => setCategoryId(e.target.value)}
            >
              {categories.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.icon} {c.name}</MenuItem>
              ))}
            </TextField>
            <TextField 
              select 
              fullWidth 
              label="Prioridad" 
              variant="filled"
              value={priority} 
              onChange={(e) => setPriority(e.target.value as any)}
            >
              <MenuItem value="low">🟢 Baja</MenuItem>
              <MenuItem value="medium">🟡 Media</MenuItem>
              <MenuItem value="high">🔴 Alta</MenuItem>
            </TextField>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1, ml: 1, fontWeight: 700 }}>
              <AlertCircle size={14} /> PROGRAMAR ALARMA
            </Typography>
            <TextField
              fullWidth
              type="datetime-local"
              variant="filled"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ borderRadius: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpen(false)} color="inherit" sx={{ fontWeight: 700 }}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained" color="primary" sx={{ borderRadius: 10, px: 4, fontWeight: 800 }}>
            {editingTaskId ? 'Guardar Cambios' : 'Activar Alarma'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Tasks;
