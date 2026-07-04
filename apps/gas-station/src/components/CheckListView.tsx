import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Trash2, 
  Edit3, 
  Plus, 
  ArrowUp, 
  ArrowDown, 
  Sunrise, 
  RefreshCcw, 
  Moon,
  CheckCircle2,
  Circle,
  Play
} from 'lucide-react';
import { api } from '../api/client';
import { Card, Button, Input, Modal, cn } from './ui';

const phases = [
  { id: 'apertura', label: 'Apertura', icon: <Sunrise size={18} /> },
  { id: 'cambio_turno', label: 'Cambio Turno', icon: <RefreshCcw size={18} /> },
  { id: 'cierre', label: 'Cierre', icon: <Moon size={18} /> },
];

export default function CheckListView() {
  const [phase, setPhase] = useState('apertura');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTemplate, setEditTemplate] = useState<any>(null);
  const [templateName, setTemplateName] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t, e] = await Promise.all([
        api.getTemplates(),
        api.getEntries(date, phase),
      ]);
      setTemplates(t);
      setEntries(e);
    } catch { setError('Error al cargar datos'); }
    setLoading(false);
  }, [date, phase]);

  useEffect(() => { load(); }, [load]);

  const toggleEntry = async (entry: any) => {
    try {
      await api.updateEntry(entry.id, { completed: !entry.completed });
      await load();
    } catch {}
  };

  const saveTemplate = async () => {
    if (!templateName.trim()) return;
    try {
      if (editTemplate) {
        await api.updateTemplate(editTemplate.id, { task_name: templateName, phase });
      } else {
        await api.createTemplate({ task_name: templateName, phase });
      }
      setDialogOpen(false);
      setTemplateName('');
      setEditTemplate(null);
      await load();
    } catch {}
  };

  const deleteTemplate = async (id: number) => {
    await api.deleteTemplate(id);
    await load();
  };

  const moveTemplate = async (id: number, dir: 'up' | 'down') => {
    await api.moveTemplate(id, dir);
    await load();
  };

  const createEntry = async (template: any) => {
    try {
      await api.updateEntry(0, { template_id: template.id, date, phase, completed: false });
      await load();
    } catch {}
  };

  const filteredTemplates = templates.filter(t => t.phase === phase);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Checklists Diarios</h1>
          <p className="text-muted-foreground mt-1">Gestión de tareas de estación</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Input 
            type="date" 
            value={date} 
            onChange={e => setDate(e.target.value)} 
            className="w-40"
          />
          <Button 
            variant="primary"
            onClick={() => { setEditTemplate(null); setTemplateName(''); setDialogOpen(true); }}
            className="shrink-0"
          >
            <Plus size={18} className="mr-2" /> Nueva Tarea
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Phase Toggle */}
      <div className="flex p-1 bg-black/40 rounded-xl border border-white/5 backdrop-blur-sm">
        {phases.map(p => (
          <button
            key={p.id}
            onClick={() => setPhase(p.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all",
              phase === p.id 
                ? "bg-brand-500/20 text-brand-400 shadow-[0_0_15px_rgba(249,115,22,0.15)]" 
                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
            )}
          >
            {p.icon}
            {p.label}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin text-brand-500"><RefreshCcw size={32} /></div>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-xl border border-dashed border-white/10">
            <p className="text-muted-foreground">No hay tareas configuradas para {phases.find(p => p.id === phase)?.label}.</p>
          </div>
        ) : (
          filteredTemplates.map((template, i) => {
            const entry = entries.find(e => e.template_id === template.id);
            const completed = entry?.completed || false;
            
            return (
              <motion.div key={template.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <div className={cn(
                  "flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl glass-panel transition-all duration-300",
                  completed ? "opacity-70 bg-emerald-900/10 border-emerald-500/20" : "hover:border-brand-500/30"
                )}>
                  
                  <div className="flex items-center gap-4 flex-1">
                    {entry ? (
                      <button 
                        onClick={() => toggleEntry(entry)}
                        className={cn(
                          "shrink-0 transition-colors",
                          completed ? "text-emerald-500" : "text-muted-foreground hover:text-brand-400"
                        )}
                      >
                        {completed ? <CheckCircle2 size={28} /> : <Circle size={28} />}
                      </button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => createEntry(template)} className="shrink-0 h-8 text-xs">
                        <Play size={14} className="mr-1" /> Iniciar
                      </Button>
                    )}
                    
                    <span className={cn(
                      "font-medium text-lg transition-colors",
                      completed ? "text-emerald-400 line-through decoration-emerald-500/50" : "text-foreground"
                    )}>
                      {template.task_name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 sm:gap-2 self-end sm:self-auto">
                    <Button size="icon" variant="ghost" onClick={() => moveTemplate(template.id, 'up')} disabled={i === 0}>
                      <ArrowUp size={18} />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => moveTemplate(template.id, 'down')} disabled={i === filteredTemplates.length - 1}>
                      <ArrowDown size={18} />
                    </Button>
                    <div className="w-px h-6 bg-white/10 mx-1"></div>
                    <Button size="icon" variant="ghost" onClick={() => { setEditTemplate(template); setTemplateName(template.task_name); setDialogOpen(true); }}>
                      <Edit3 size={18} />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => deleteTemplate(template.id)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                      <Trash2 size={18} />
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      <Modal 
        isOpen={dialogOpen} 
        onClose={() => setDialogOpen(false)} 
        title={editTemplate ? 'Editar Tarea' : 'Nueva Tarea'}
      >
        <div className="space-y-4 mt-2">
          <Input 
            placeholder="Nombre de la tarea"
            value={templateName}
            onChange={e => setTemplateName(e.target.value)}
            autoFocus
          />
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button variant="primary" onClick={saveTemplate}>{editTemplate ? 'Guardar Cambios' : 'Crear Tarea'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
