import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTaskStore, Task } from '../store/taskStore';
import { Plus, Trash2, CheckCircle, Circle, Edit2, X } from 'lucide-react';
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

      if (editingTaskId) updateTask(editingTaskId, taskData);
      else addTask({ ...taskData, status: 'pending' });
      
      setOpen(false);
    }
  };

  const handleClearAll = () => {
    if (window.confirm('⚠️ ¿Estás seguro de que quieres eliminar TODAS las misiones? Esta acción no se puede deshacer.')) {
      clearTasks();
    }
  };

  const getPriorityColor = (p: string) => {
    if (p === 'low') return 'border-brand-500';
    if (p === 'medium') return 'border-accent-500';
    return 'border-rose-500';
  };

  const tabs = [
    { id: 'all', label: 'Todas' },
    { id: 'pending', label: 'Pendientes' },
    { id: 'completed', label: 'Completadas' },
    { id: 'high', label: 'Urgentes' },
  ];

  return (
    <div className="flex-1 flex flex-col relative pb-20">
      <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
        <h2 className="text-4xl font-display font-black text-white">Mis Misiones</h2>
        <div className="flex gap-3">
          {tasks.length > 0 && (
            <button 
              onClick={handleClearAll}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-rose-500/50 text-rose-400 hover:bg-rose-500/10 font-bold transition-colors cursor-pointer"
            >
              <Trash2 size={18} />
              Borrar Todo
            </button>
          )}
          <button 
            onClick={() => handleOpenDialog()}
            className="btn-premium flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-extrabold shadow-xl cursor-pointer"
          >
            <Plus size={20} className="relative z-10" />
            <span className="relative z-10">Nueva Tarea</span>
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 border-b border-white/10 custom-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setSearchParams({ filter: tab.id })}
            className={`whitespace-nowrap px-4 py-2 rounded-t-lg font-bold transition-colors cursor-pointer ${
              filterParam === tab.id 
                ? 'text-brand-400 border-b-2 border-brand-400 bg-brand-500/10' 
                : 'text-muted-foreground hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <AnimatePresence mode="popLayout">
          {filteredTasks.map((task) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -10, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 10, scale: 0.95 }}
              layout
              className={`p-4 md:p-5 flex items-center gap-4 border-l-4 rounded-r-xl ${getPriorityColor(task.priority)} ${
                task.status === 'completed' ? 'opacity-50 glass-panel' : 'glass-panel hover:-translate-y-1 hover:shadow-lg transition-transform'
              }`}
            >
              <button 
                onClick={() => updateTask(task.id, { status: task.status === 'completed' ? 'pending' : 'completed' })}
                className={`p-1 rounded-full transition-colors cursor-pointer ${
                  task.status === 'completed' ? 'text-brand-400' : 'text-muted-foreground hover:text-brand-400'
                }`}
              >
                {task.status === 'completed' ? <CheckCircle size={28} /> : <Circle size={28} />}
              </button>
              
              <div className="flex-1 min-w-0">
                <h3 className={`text-lg md:text-xl font-bold truncate ${
                  task.status === 'completed' ? 'line-through text-white/50' : 'text-white/90'
                }`}>
                  {task.title}
                </h3>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  <span className="px-2 py-0.5 rounded text-xs font-semibold border border-white/20 text-white/70">
                    {categories.find(c => c.id === task.categoryId)?.name || 'General'}
                  </span>
                  {task.reminderTime && (
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-accent-500/20 text-accent-300">
                      ⏰ {new Date(task.reminderTime).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-1 opacity-50 hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleOpenDialog(task)}
                  className="p-2 text-brand-400 hover:bg-brand-500/20 rounded-lg transition-colors cursor-pointer"
                  title="Editar Alarma"
                >
                  <Edit2 size={18} />
                </button>
                <button 
                  onClick={() => deleteTask(task.id)}
                  className="p-2 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors cursor-pointer"
                  title="Eliminar Misión"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </motion.div>
          ))}
          {filteredTasks.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-10 text-center border border-dashed border-white/10 rounded-2xl glass-panel">
              <p className="text-muted-foreground font-bold text-lg">No hay misiones aquí.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-card border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="flex justify-between items-center p-5 border-b border-white/10">
                <h3 className="text-xl font-display font-black text-brand-400">
                  {editingTaskId ? 'Editar Misión' : 'Nueva Misión'}
                </h3>
                <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-white cursor-pointer">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-5 flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-white/50 uppercase">Título de la tarea</label>
                  <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    autoFocus
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-400 transition-colors font-medium"
                    placeholder="E.g. Preparar informe final"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-white/50 uppercase">Categoría</label>
                  <select 
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-400 transition-colors font-medium appearance-none"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id} className="bg-card">{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-white/50 uppercase">Prioridad</label>
                  <select 
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-400 transition-colors font-medium appearance-none"
                  >
                    <option value="low" className="bg-card">Baja (Verde)</option>
                    <option value="medium" className="bg-card">Media (Amarilla)</option>
                    <option value="high" className="bg-card">Alta (Roja)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-white/50 uppercase">Recordatorio (Alarma)</label>
                  <input 
                    type="datetime-local" 
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-400 transition-colors font-medium"
                  />
                </div>
              </div>
              
              <div className="p-5 border-t border-white/10 flex justify-end gap-3 bg-white/5">
                <button 
                  onClick={() => setOpen(false)}
                  className="px-5 py-2 rounded-lg font-bold text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSave}
                  disabled={!title.trim()}
                  className="btn-premium px-5 py-2.5 rounded-xl text-white font-extrabold disabled:opacity-50 transition-colors cursor-pointer"
                >
                  <span className="relative z-10">Guardar Misión</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Tasks;
