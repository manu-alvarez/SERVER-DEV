import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTaskStore, Category } from '../store/taskStore';
import { Plus, Edit2, Trash2, X } from 'lucide-react';

const PRESET_COLORS = ['#22d3ee', '#e879f9', '#f97316', '#10b981', '#ef4444', '#8b5cf6', '#facc15', '#06b6d4'];
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
    <div className="flex-1 flex flex-col relative pb-20">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
        <h2 className="text-4xl font-display font-black text-white">Categorías</h2>
        <button 
          onClick={() => handleOpen()}
          className="btn-premium flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-extrabold shadow-xl cursor-pointer"
        >
          <Plus size={20} className="relative z-10" />
          <span className="relative z-10">Nueva Categoría</span>
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {categories.map((category, index) => {
          const catTasks = tasks.filter(t => t.categoryId === category.id);
          const completed = catTasks.filter(t => t.status === 'completed').length;
          const total = catTasks.length;
          const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

          return (
            <motion.div 
              key={category.id}
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="portal-card group h-full"
            >
              <div 
                className="portal-card-inner p-6 relative overflow-hidden h-full flex flex-col justify-between"
              >
                <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: category.color }} />
                
                <div>
                  <div className="flex justify-between items-start mb-4 mt-2">
                    <h3 className="text-2xl font-display font-black flex items-center gap-3">
                      <span>{category.icon}</span> 
                      <span className="truncate">{category.name}</span>
                    </h3>
                    <div className="flex gap-1 shrink-0 ml-2">
                      <button onClick={() => handleOpen(category)} className="p-1.5 text-muted-foreground hover:text-brand-400 transition-colors cursor-pointer">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => deleteCategory(category.id)} className="p-1.5 text-muted-foreground hover:text-rose-500 transition-colors cursor-pointer">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <p className="text-muted-foreground font-semibold mb-4 text-sm">
                    {total} misiones · {completed} completadas
                  </p>
                </div>
                
                {/* Progress Bar */}
                <div className="h-2 rounded-full bg-white/10 overflow-hidden w-full">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: category.color, boxShadow: `0 0 10px ${category.color}` }}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Tailwind Dialog */}
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={handleClose}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-card border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="flex justify-between items-center p-5 border-b border-white/10">
                <h3 className="text-xl font-display font-black text-brand-400">
                  {editing ? 'Editar Categoría' : 'Nueva Categoría'}
                </h3>
                <button onClick={handleClose} className="text-muted-foreground hover:text-white transition-colors cursor-pointer">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-5 flex flex-col gap-5">
                {/* Name */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-white/50 uppercase">Nombre</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-400 transition-colors font-medium"
                    placeholder="E.g. Trabajo, Casa..."
                  />
                </div>

                {/* Color */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-white/50 uppercase">Color</label>
                  <div className="flex gap-2 flex-wrap">
                    {PRESET_COLORS.map(c => (
                      <button 
                        key={c} 
                        onClick={() => setColor(c)}
                        className={`w-9 h-9 rounded-full cursor-pointer transition-all ${
                          color === c ? 'ring-2 ring-white scale-110' : 'ring-2 ring-transparent opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c, boxShadow: color === c ? `0 0 15px ${c}` : 'none' }}
                        aria-label={`Seleccionar color ${c}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Icon */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-white/50 uppercase">Icono</label>
                  <div className="flex gap-2 flex-wrap">
                    {PRESET_ICONS.map(i => (
                      <button 
                        key={i} 
                        onClick={() => setIcon(i)}
                        className={`w-10 h-10 flex items-center justify-center rounded-lg text-xl cursor-pointer transition-all ${
                          icon === i ? 'bg-brand-500/20 border-2 border-brand-400 scale-110' : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                        }`}
                      >
                        {i}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="p-5 border-t border-white/10 flex justify-end gap-3 bg-white/5">
                <button 
                  onClick={handleClose}
                  className="px-5 py-2 rounded-lg font-bold text-muted-foreground hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSave}
                  disabled={!name.trim()}
                  className="btn-premium px-5 py-2.5 rounded-xl text-white font-extrabold disabled:opacity-50 transition-colors cursor-pointer"
                >
                  <span className="relative z-10">{editing ? 'Guardar' : 'Crear'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Categories;
