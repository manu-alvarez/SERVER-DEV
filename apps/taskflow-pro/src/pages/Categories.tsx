import React, { useState } from 'react';
import { Box, Typography, Grid, Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton } from '@mui/material';
import { motion } from 'framer-motion';
import { useTaskStore, Category } from '../store/taskStore';
import { Plus, Edit2, Trash2, X } from 'lucide-react';

const PRESET_COLORS = ['#00F5FF', '#FF00E4', '#FFB800', '#10b981', '#ef4444', '#8b5cf6', '#f97316', '#06b6d4'];
const PRESET_ICONS = ['📋', '💼', '👶', '🏠', '💪', '📚', '🎯', '💡', '🔥', '⭐', '🎨', '🎵'];

const Categories: React.FC = () => {
  const { categories, tasks, addCategory, updateCategory, deleteCategory } = useTaskStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [icon, setIcon] = useState(PRESET_ICONS[0]);

  const handleOpen = (cat?: Category) => {
    if (cat) {
      setEditing(cat); setName(cat.name); setColor(cat.color); setIcon(cat.icon);
    } else {
      setEditing(null); setName(''); setColor(PRESET_COLORS[0]); setIcon(PRESET_ICONS[0]);
    }
    setOpen(true);
  };

  const handleClose = () => { setOpen(false); setEditing(null); };

  const handleSave = () => {
    if (!name.trim()) return;
    if (editing) updateCategory(editing.id, { name, color, icon });
    else addCategory({ name, color, icon });
    handleClose();
  };

  return (
    <Box sx={{ flexGrow: 1, position: 'relative' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h3" color="secondary" sx={{ fontWeight: 800 }}>Categorías</Typography>
        <Button variant="contained" startIcon={<Plus size={20} />} onClick={() => handleOpen()}
          sx={{ background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)', fontWeight: 700 }}>
          Nueva Categoría
        </Button>
      </Box>

      <Grid container spacing={3}>
        {categories.map((category, index) => {
          const catTasks = tasks.filter(t => t.categoryId === category.id);
          const completed = catTasks.filter(t => t.status === 'completed').length;
          const total = catTasks.length;
          const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

          return (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={category.id}>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}>
                <Paper sx={{ p: 4, borderTop: `4px solid ${category.color}`, position: 'relative', overflow: 'hidden' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>{category.icon} {category.name}</Typography>
                    <Box>
                      <IconButton size="small" onClick={() => handleOpen(category)}><Edit2 size={16} /></IconButton>
                      <IconButton size="small" onClick={() => deleteCategory(category.id)}><Trash2 size={16} color="#ef4444" /></IconButton>
                    </Box>
                  </Box>
                  <Typography color="text.secondary">{total} tareas · {completed} completadas</Typography>
                  <Box sx={{ mt: 2, height: 6, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                    <Box sx={{ height: '100%', width: `${pct}%`, bgcolor: category.color, borderRadius: 3, transition: 'width 0.5s' }} />
                  </Box>
                </Paper>
              </motion.div>
            </Grid>
          );
        })}
      </Grid>

      <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth
        slotProps={{ paper: { sx: { bgcolor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' } } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {editing ? 'Editar Categoría' : 'Nueva Categoría'}
          <IconButton onClick={handleClose} size="small"><X size={20} /></IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Nombre" value={name} onChange={e => setName(e.target.value)}
            sx={{ mb: 3, mt: 1 }} slotProps={{ inputLabel: { sx: { color: '#888' } }, input: { sx: { color: '#fff', bgcolor: 'rgba(255,255,255,0.05)' } } }} />
          <Typography variant="subtitle2" sx={{ mb: 1, color: '#888' }}>Color</Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
            {PRESET_COLORS.map(c => (
              <Box key={c} onClick={() => setColor(c)}
                sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: c, cursor: 'pointer',
                  border: color === c ? '3px solid #fff' : '3px solid transparent', transition: 'all 0.2s' }} />
            ))}
          </Box>
          <Typography variant="subtitle2" sx={{ mb: 1, color: '#888' }}>Icono</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {PRESET_ICONS.map(i => (
              <Box key={i} onClick={() => setIcon(i)}
                sx={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: 2, bgcolor: icon === i ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
                  cursor: 'pointer', fontSize: 20, border: icon === i ? '2px solid #8b5cf6' : '2px solid transparent' }}
              >{i}</Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} sx={{ color: '#888' }}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained" disabled={!name.trim()}
            sx={{ background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)', fontWeight: 700 }}>
            {editing ? 'Guardar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Categories;
