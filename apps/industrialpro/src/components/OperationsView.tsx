import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Plus, CheckCircle2, Power, Settings2, CheckSquare, Square, Wrench, Package } from 'lucide-react';
import api from '../api/client';
import { Card, Button, Input, Modal, Select, Badge } from './ui';

export default function OperationsView() {
  const [operations, setOperations] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Dialogs
  const [newOpDialog, setNewOpDialog] = useState(false);
  const [opName, setOpName] = useState('');
  const [opProduct, setOpProduct] = useState('');
  
  const [newTimerDialog, setNewTimerDialog] = useState<{isOpen: boolean; opId: number | null}>({isOpen: false, opId: null});
  const [timerForm, setTimerForm] = useState({ name: '', duration: '' });

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
    } catch { setError('Error al cargar datos'); }
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
          finished.forEach((f: any) => {
            const n = new Notification('⏰ Timer Completado', {
              body: `${f.timer_name} - ${f.operation_name}`,
            });
            setTimeout(() => n.close(), 5000);
          });
          audioRef.current?.play().catch(() => {});
          await load();
        }
      } catch (err) { console.error("Polling error", err); }
    }, 3000);
    return () => clearInterval(iv);
  }, [load]);

  const createOp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!opName || !opProduct) return;
    try {
      await api.post('/operations', { name: opName, product_id: parseInt(opProduct) });
      setNewOpDialog(false);
      setOpName('');
      setOpProduct('');
      await load();
    } catch (err) { alert("Operación fallida."); console.error(err); }
  };

  const createTimer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!timerForm.name || !timerForm.duration || !newTimerDialog.opId) return;
    try {
      await api.post(`/operations/${newTimerDialog.opId}/timers`, { 
        name: timerForm.name, 
        duration_seconds: Number(timerForm.duration) * 60 
      });
      setNewTimerDialog({isOpen: false, opId: null});
      setTimerForm({ name: '', duration: '' });
      await load();
    } catch (err) { alert("Operación fallida."); console.error(err); }
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
    } catch (err) { alert("Operación fallida."); }
  };

  const resetTimer = async (timer: any) => {
    try {
      await api.put(`/timers/${timer.id}`, { elapsed_seconds: 0, is_running: 0 });
      await load();
    } catch (err) { alert("Operación fallida."); }
  };

  const toggleValve = async (valve: any) => {
    const statuses = ['open', 'closed', 'maintenance'];
    const idx = statuses.indexOf(valve.status);
    const next = statuses[(idx + 1) % 3];
    try {
      await api.put(`/valves/${valve.id}`, { status: next });
      await load();
    } catch (err) { alert("Operación fallida."); }
  };

  const togglePump = async (pump: any) => {
    const running = pump.status === 'running';
    try {
      await api.put(`/pumps/${pump.id}`, { status: running ? 'stopped' : 'running', rpm: running ? 0 : 1450 });
      await load();
    } catch (err) { alert("Operación fallida."); }
  };

  const toggleChecklist = async (item: any) => {
    try {
      await api.put(`/checklists/${item.id}`, { checked: item.checked ? 0 : 1 });
      await load();
    } catch (err) { alert("Operación fallida."); }
  };

  const completeOp = async (opId: number) => {
    try {
      await api.put(`/operations/${opId}`, { status: 'completed' });
      await load();
    } catch (err) { alert("Operación fallida."); }
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

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-msb-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const runningOps = operations.filter(o => o.status === 'running');

  return (
    <div className="space-y-6">
      {/* Hidden audio element for alarms */}
      <audio ref={audioRef} src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACAf39/f4B/f3+AgH9/f3+AgH9/f3+AgH9/f3+AgH9/f3+AgH9/f3+AgH9/f3+AgH9/f3+AgH9/f3+AgH9/f38=" preload="auto" />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Operaciones en Curso</h1>
          <p className="text-slate-400">Control de procesos activos en planta</p>
        </div>
        <Button onClick={() => setNewOpDialog(true)} className="whitespace-nowrap">
          <Plus size={18} className="mr-2" />
          Nueva Operación
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-msb-error/10 border border-msb-error/30 text-msb-error">
          {error}
        </div>
      )}

      <AnimatePresence>
        {alerts.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="p-4 rounded-lg bg-msb-accent/10 border border-msb-accent/30 text-msb-accent flex justify-between items-start">
              <div className="space-y-2">
                {alerts.map((a, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="animate-pulse">⏰</span>
                    <span className="font-bold">{a.timer_name}</span> 
                    <span className="text-msb-accent/70">en</span> 
                    <span>{a.operation_name}</span>
                  </div>
                ))}
              </div>
              <Button variant="ghost" size="sm" onClick={() => setAlerts([])} className="text-msb-accent hover:text-white hover:bg-msb-accent/20">
                Descartar
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-6">
        {runningOps.map((op, i) => (
          <motion.div key={op.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card portal className="p-6">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 pb-6 border-b border-white/5">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    {op.name}
                    <span className="flex h-3 w-3 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-msb-success opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-msb-success"></span>
                    </span>
                  </h2>
                  <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                    <span className="flex items-center gap-1"><Package size={14} className="text-msb-primary"/> {op.product_name || '-'}</span>
                    <span>Inicio: {new Date(op.start_time).toLocaleTimeString('es-ES')}</span>
                  </div>
                </div>
                
                <Button variant="outline" onClick={() => completeOp(op.id)} className="border-msb-success text-msb-success hover:bg-msb-success/10 group">
                  <CheckCircle2 size={18} className="mr-2 group-hover:scale-110 transition-transform" />
                  Completar
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Timers Section */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <Timer size={16} className="text-msb-accent" /> Temporizadores
                    </h3>
                    <button onClick={() => setNewTimerDialog({isOpen: true, opId: op.id})} className="p-1.5 rounded-md bg-white/5 hover:bg-msb-primary/20 text-msb-primary transition-colors">
                      <Plus size={16} />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {op.timers?.map((t: any) => {
                      const remain = Math.max(0, t.duration_seconds - t.elapsed_seconds);
                      const pct = (t.elapsed_seconds / t.duration_seconds) * 100;
                      const finished = remain <= 0;
                      
                      let stateColor = 'text-slate-400';
                      let borderColor = 'border-white/10 bg-white/5';
                      let barColor = 'bg-slate-600';
                      
                      if (finished) {
                        stateColor = 'text-msb-error';
                        borderColor = 'border-msb-error/50 bg-msb-error/10 shadow-[0_0_15px_rgba(239,68,68,0.15)] animate-pulse';
                        barColor = 'bg-msb-error';
                      } else if (t.is_running) {
                        stateColor = 'text-msb-success neon-text-primary'; // Reuse neon glow for timer
                        borderColor = 'border-msb-primary/30 bg-msb-primary/5';
                        barColor = 'bg-msb-primary';
                      }

                      return (
                        <div key={t.id} className={`p-4 rounded-xl border ${borderColor} transition-colors flex flex-col`}>
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-semibold text-slate-300 truncate pr-2">{t.name}</span>
                          </div>
                          
                          <div className={`text-3xl font-mono font-bold tracking-tight mb-3 ${stateColor} ${t.is_running ? 'animate-pulse' : ''}`}>
                            {formatTime(remain)}
                          </div>
                          
                          <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden mb-4">
                            <div className={`h-full ${barColor} transition-all duration-1000 ease-linear`} style={{ width: `${Math.min(pct, 100)}%` }} />
                          </div>
                          
                          <div className="flex justify-between mt-auto pt-2 border-t border-white/5">
                            <button 
                              onClick={() => toggleTimer(t)} 
                              className={`p-2 rounded-lg transition-colors ${t.is_running ? 'bg-msb-accent/20 text-msb-accent hover:bg-msb-accent/30' : 'bg-msb-success/20 text-msb-success hover:bg-msb-success/30'}`}
                            >
                              {t.is_running ? <Pause size={16} /> : <Play size={16} />}
                            </button>
                            <button 
                              onClick={() => resetTimer(t)} 
                              className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                            >
                              <RotateCcw size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    
                    {(!op.timers || op.timers.length === 0) && (
                      <div className="col-span-full p-4 border border-dashed border-slate-700 rounded-xl text-center text-sm text-slate-500">
                        No hay temporizadores activos
                      </div>
                    )}
                  </div>
                </div>

                {/* Valves & Pumps */}
                <div className="lg:col-span-4 space-y-6">
                  {/* Valves */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                        <Settings2 size={16} className="text-msb-secondary" /> Válvulas
                      </h3>
                      <button onClick={() => addValve(op.id)} className="p-1.5 rounded-md bg-white/5 hover:bg-msb-primary/20 text-msb-primary transition-colors">
                        <Plus size={16} />
                      </button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {op.valves?.map((v: any) => {
                        const isOpen = v.status === 'open';
                        const isMaint = v.status === 'maintenance';
                        
                        let colorClass = 'border-msb-error/30 text-msb-error bg-msb-error/10 hover:bg-msb-error/20 hover:border-msb-error/50';
                        if (isOpen) colorClass = 'border-msb-success/50 text-msb-success bg-msb-success/10 hover:bg-msb-success/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]';
                        if (isMaint) colorClass = 'border-msb-accent/30 text-msb-accent bg-msb-accent/10 hover:bg-msb-accent/20';

                        return (
                          <button 
                            key={v.id} 
                            onClick={() => toggleValve(v)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${colorClass}`}
                          >
                            <div className={`w-2 h-2 rounded-full ${isOpen ? 'bg-msb-success shadow-[0_0_5px_#10b981]' : isMaint ? 'bg-msb-accent' : 'bg-msb-error'}`} />
                            {v.name}
                          </button>
                        );
                      })}
                      {(!op.valves || op.valves.length === 0) && <span className="text-sm text-slate-500">Sin válvulas configuradas</span>}
                    </div>
                  </div>

                  {/* Pumps */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                        <Power size={16} className="text-indigo-400" /> Bombas
                      </h3>
                      <button onClick={() => addPump(op.id)} className="p-1.5 rounded-md bg-white/5 hover:bg-msb-primary/20 text-msb-primary transition-colors">
                        <Plus size={16} />
                      </button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {op.pumps?.map((p: any) => {
                        const isRunning = p.status === 'running';
                        
                        return (
                          <button 
                            key={p.id} 
                            onClick={() => togglePump(p)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                              isRunning 
                                ? 'border-indigo-500/50 text-indigo-300 bg-indigo-500/10 shadow-[0_0_10px_rgba(99,102,241,0.2)] hover:bg-indigo-500/20' 
                                : 'border-slate-700 text-slate-400 bg-white/5 hover:bg-white/10'
                            }`}
                          >
                            <Power size={14} className={isRunning ? 'text-indigo-400 animate-pulse' : 'text-slate-500'} />
                            {p.name}
                            {isRunning && <span className="ml-1 text-xs opacity-75">{p.rpm} RPM</span>}
                          </button>
                        );
                      })}
                      {(!op.pumps || op.pumps.length === 0) && <span className="text-sm text-slate-500">Sin bombas configuradas</span>}
                    </div>
                  </div>
                </div>

                {/* Checklist */}
                <div className="lg:col-span-3 space-y-4">
                  <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <CheckSquare size={16} className="text-msb-success" /> Checklist
                  </h3>
                  
                  {op.checklists?.length > 0 ? (
                    <>
                      <div className="mb-4">
                        <div className="flex justify-between text-xs font-semibold text-slate-400 mb-2">
                          <span>Progreso</span>
                          <span>{op.checklists.filter((c: any) => c.checked).length} / {op.checklists.length}</span>
                        </div>
                        <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-msb-primary to-msb-success transition-all duration-500" 
                            style={{ width: `${(op.checklists.filter((c: any) => c.checked).length / op.checklists.length) * 100}%` }} 
                          />
                        </div>
                      </div>

                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {op.checklists?.map((item: any) => (
                          <button
                            key={item.id}
                            onClick={() => toggleChecklist(item)}
                            className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
                              item.checked 
                                ? 'bg-msb-success/10 border-msb-success/30 text-slate-300' 
                                : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                            }`}
                          >
                            <div className={`mt-0.5 shrink-0 ${item.checked ? 'text-msb-success' : 'text-slate-500'}`}>
                              {item.checked ? <CheckSquare size={16} /> : <Square size={16} />}
                            </div>
                            <span className={`text-sm ${item.checked ? 'line-through opacity-70' : ''}`}>
                              {item.text}
                            </span>
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="p-4 border border-dashed border-slate-700 rounded-xl text-center text-sm text-slate-500">
                      Sin tareas de checklist
                    </div>
                  )}
                </div>

              </div>
            </Card>
          </motion.div>
        ))}

        {runningOps.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="p-12 text-center flex flex-col items-center justify-center border-dashed border-2 border-slate-700 bg-white/5">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-slate-500 mb-4">
                <Wrench size={32} />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No hay operaciones activas</h3>
              <p className="text-slate-400 mb-6 max-w-md">Inicia una nueva operación de planta para monitorizar válvulas, bombas y temporizadores.</p>
              <Button onClick={() => setNewOpDialog(true)}>
                <Plus size={18} className="mr-2" /> Crear Operación
              </Button>
            </Card>
          </motion.div>
        )}
      </div>

      {/* New Operation Modal */}
      <Modal isOpen={newOpDialog} onClose={() => setNewOpDialog(false)} title="Nueva Operación">
        <form onSubmit={createOp} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Nombre</label>
            <Input autoFocus value={opName} onChange={e => setOpName(e.target.value)} placeholder="Ej. Mezcla Tanque 1" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Producto Asociado</label>
            <Select value={opProduct} onChange={e => setOpProduct(e.target.value)}>
              <option value="" disabled>Seleccionar producto...</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" type="button" onClick={() => setNewOpDialog(false)}>Cancelar</Button>
            <Button type="submit">Iniciar Operación</Button>
          </div>
        </form>
      </Modal>

      {/* New Timer Modal */}
      <Modal isOpen={newTimerDialog.isOpen} onClose={() => setNewTimerDialog({isOpen: false, opId: null})} title="Añadir Temporizador">
        <form onSubmit={createTimer} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Nombre del temporizador</label>
            <Input autoFocus value={timerForm.name} onChange={e => setTimerForm({...timerForm, name: e.target.value})} placeholder="Ej. Calentamiento" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Duración (minutos)</label>
            <Input type="number" min="1" value={timerForm.duration} onChange={e => setTimerForm({...timerForm, duration: e.target.value})} placeholder="Ej. 15" />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" type="button" onClick={() => setNewTimerDialog({isOpen: false, opId: null})}>Cancelar</Button>
            <Button type="submit">Añadir</Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
