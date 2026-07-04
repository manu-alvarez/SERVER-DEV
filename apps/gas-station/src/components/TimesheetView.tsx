import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  Plus, 
  Edit3, 
  Trash2, 
  Calendar,
  Euro,
  RefreshCcw,
  Briefcase
} from 'lucide-react';
import { api } from '../api/client';
import { Card, Button, Input, Modal, Select, Badge, cn } from './ui';

const entryTypes = ['mañana', 'tarde', 'noche', 'descanso', 'vacaciones', 'baja', 'formacion', 'especial'];

export default function TimesheetView() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [entries, setEntries] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [dialog, setDialog] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState<any>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [e, s] = await Promise.all([
        api.getTimesheet(month, year),
        api.getTimesheetSummary(month, year),
      ]);
      setEntries(e);
      setSummary(s);
    } catch { setError('Error al cargar timesheet'); }
    setLoading(false);
  }, [month, year]);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setEditItem(null);
    setForm({ date: new Date().toISOString().split('T')[0], shift_type: 'mañana', start_time: '', end_time: '', break_minutes: 0, notes: '' });
    setDialog(true);
  };

  const openEdit = (e: any) => {
    setEditItem(e);
    setForm({ ...e, date: e.date?.split('T')[0] || e.date });
    setDialog(true);
  };

  const save = async () => {
    try {
      if (editItem) await api.updateTimesheet(editItem.id, form);
      else await api.createTimesheet(form);
      setDialog(false);
      await load();
    } catch {}
  };

  const remove = async (id: number) => {
    await api.deleteTimesheet(id);
    await load();
  };

  const workedDays = entries.filter(e => !['descanso', 'vacaciones', 'baja'].includes(e.shift_type)).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Timesheet</h1>
          <p className="text-muted-foreground mt-1">Control horario y turnos</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex bg-black/40 rounded-lg p-1 border border-white/5">
            <Input 
              type="number" 
              value={month} 
              onChange={e => setMonth(parseInt(e.target.value) || 1)} 
              className="w-20 h-9 border-none bg-transparent focus:ring-0 text-center"
              min="1" max="12"
            />
            <div className="w-px bg-white/10 my-1 mx-1" />
            <Input 
              type="number" 
              value={year} 
              onChange={e => setYear(parseInt(e.target.value) || now.getFullYear())} 
              className="w-24 h-9 border-none bg-transparent focus:ring-0 text-center"
            />
          </div>
          <Button variant="primary" onClick={openNew}>
            <Plus size={18} className="mr-2" /> Turno
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {summary && summary.salary && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className={cn(
              "flex flex-col items-center justify-center p-4",
              summary.difference >= 0 ? "border-emerald-500/30 bg-emerald-500/5 shadow-[0_0_20px_rgba(16,185,129,0.05)]" : "border-red-500/30 bg-red-500/5 shadow-[0_0_20px_rgba(239,68,68,0.05)]"
            )}>
              <span className={cn(
                "text-3xl font-bold tracking-tight",
                summary.difference >= 0 ? "text-emerald-400" : "text-red-400"
              )}>
                {summary.difference > 0 ? '+' : ''}{summary.difference?.toFixed(1)}h
              </span>
              <span className="text-sm text-muted-foreground mt-1">Desviación Contrato</span>
            </Card>

            <Card className="flex flex-col items-center justify-center p-4">
              <span className="text-3xl font-bold tracking-tight text-foreground">
                {summary.totalWorked?.toFixed(1)}
              </span>
              <span className="text-sm text-muted-foreground mt-1">Horas Totales</span>
            </Card>

            <Card className="flex flex-col items-center justify-center p-4">
              <span className="text-3xl font-bold tracking-tight text-foreground">
                {workedDays} / {summary.expectedWorkDays}
              </span>
              <span className="text-sm text-muted-foreground mt-1">Días Trabajados</span>
            </Card>

            <Card className="flex flex-col items-center justify-center p-4 border-brand-500/30 bg-brand-500/5 shadow-[0_0_30px_rgba(249,115,22,0.1)]">
              <span className="text-3xl font-bold tracking-tight text-brand-400 flex items-center">
                {summary.salary.estimated?.toFixed(2)}<Euro size={24} className="ml-1" />
              </span>
              <span className="text-sm text-brand-500/70 mt-1 font-medium">Salario Estimado</span>
            </Card>
          </div>
          
          <div className="flex flex-wrap gap-4 px-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5"><Badge variant="outline" className="bg-brand-500/10 text-brand-400 border-brand-500/20">M</Badge> Mañana: {summary.shifts?.morning?.count}</div>
            <div className="flex items-center gap-1.5"><Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20">T</Badge> Tarde: {summary.shifts?.afternoon?.count}</div>
            <div className="flex items-center gap-1.5"><Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20">E</Badge> Especial: {summary.shifts?.special?.count}</div>
            <div className="flex items-center gap-1.5"><Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">D</Badge> Descanso: {summary.shifts?.descanso?.count}</div>
            <div className="flex items-center gap-1.5 ml-auto border border-white/10 rounded-full px-3 py-1 bg-black/40"><Briefcase size={12} className="mr-1" /> Base: {summary.salary.hourlyRate}€/h</div>
          </div>
        </div>
      )}

      <Card className="p-0 overflow-hidden border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-black/40 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 font-semibold"><div className="flex items-center gap-2"><Calendar size={14} /> Fecha</div></th>
                <th className="px-6 py-4 font-semibold text-center">Tipo</th>
                <th className="px-6 py-4 font-semibold text-center">Entrada</th>
                <th className="px-6 py-4 font-semibold text-center">Salida</th>
                <th className="px-6 py-4 font-semibold text-center">Pausa</th>
                <th className="px-6 py-4 font-semibold text-center">Horas</th>
                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center"><div className="inline-block animate-spin text-brand-500"><RefreshCcw size={24} /></div></td></tr>
              ) : entries.length > 0 ? (
                entries.map((e, i) => {
                  const [sh, sm] = (e.start_time || '0:0').split(':').map(Number);
                  const [eh, em] = (e.end_time || '0:0').split(':').map(Number);
                  const mins = e.start_time && e.end_time ? (eh * 60 + em) - (sh * 60 + sm) - (e.break_minutes || 0) : 0;
                  const hours = Math.max(0, mins / 60);
                  return (
                    <motion.tr key={e.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">{e.date?.split('T')[0] || e.date}</td>
                      <td className="px-6 py-4 text-center">
                        <Badge variant={['descanso', 'vacaciones', 'baja'].includes(e.shift_type) ? 'default' : 'outline'}>
                          {e.shift_type}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-center text-muted-foreground font-mono">{e.start_time || '-'}</td>
                      <td className="px-6 py-4 text-center text-muted-foreground font-mono">{e.end_time || '-'}</td>
                      <td className="px-6 py-4 text-center text-muted-foreground">{e.break_minutes ? `${e.break_minutes}m` : '-'}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={cn("font-bold", hours > 0 ? "text-emerald-400" : "text-muted-foreground")}>
                          {hours > 0 ? hours.toFixed(1) : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="icon" variant="ghost" onClick={() => openEdit(e)}><Edit3 size={16} /></Button>
                          <Button size="icon" variant="ghost" onClick={() => remove(e.id)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10"><Trash2 size={16} /></Button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              ) : (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">Sin registros este mes</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={dialog} onClose={() => setDialog(false)} title={editItem ? 'Editar Turno' : 'Registrar Turno'}>
        <div className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Fecha</label>
            <Input type="date" value={form.date || ''} onChange={e => setForm({...form, date: e.target.value})} autoFocus />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Tipo de Turno</label>
            <Select value={form.shift_type || 'mañana'} onChange={e => setForm({...form, shift_type: e.target.value})}>
              {entryTypes.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Entrada</label>
              <Input type="time" value={form.start_time || ''} onChange={e => setForm({...form, start_time: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Salida</label>
              <Input type="time" value={form.end_time || ''} onChange={e => setForm({...form, end_time: e.target.value})} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Descanso (Minutos)</label>
            <Input type="number" value={form.break_minutes || 0} onChange={e => setForm({...form, break_minutes: parseInt(e.target.value) || 0})} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Notas</label>
            <textarea 
              className="flex w-full rounded-lg border border-border bg-background/50 px-3 py-2 text-sm text-foreground shadow-inner backdrop-blur-sm transition-all focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 min-h-[80px] resize-y"
              value={form.notes || ''} 
              onChange={e => setForm({...form, notes: e.target.value})}
            />
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" onClick={() => setDialog(false)}>Cancelar</Button>
            <Button variant="primary" onClick={save}>{editItem ? 'Guardar Cambios' : 'Registrar Turno'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
