import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye,
  RefreshCcw
} from 'lucide-react';
import { api } from '../api/client';
import { Card, Button, Input, Modal, Select, Badge, cn } from './ui';

const statuses = ['abierta', 'en_curso', 'resuelta', 'cerrada'];
const severities = ['baja', 'media', 'alta', 'critica'];

export default function IncidentsView() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [dialog, setDialog] = useState(false);
  const [detailDialog, setDetailDialog] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [detailItem, setDetailItem] = useState<any>(null);
  const [form, setForm] = useState<any>({});

  const load = async () => {
    setLoading(true);
    try {
      const incs = await api.getIncidents();
      setIncidents(incs);
    } catch { setError('Error al cargar incidencias'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditItem(null); setForm({ category: 'otros', description: '', status: 'abierta', urgency: 'media' }); setDialog(true); };
  const openEdit = (inc: any) => { setEditItem(inc); setForm({ ...inc }); setDialog(true); };
  const openDetail = async (inc: any) => {
    try {
      const full = await api.getIncident(inc.id);
      setDetailItem(full);
    } catch {
      setDetailItem(inc);
    }
    setDetailDialog(true);
  };

  const save = async () => {
    try {
      if (editItem) await api.updateIncident(editItem.id, form);
      else await api.createIncident(form);
      setDialog(false);
      await load();
    } catch {}
  };

  const remove = async (id: number) => {
    await api.deleteIncident(id);
    await load();
  };

  const severityBadge = (s: string) => {
    switch (s) {
      case 'critica': return <Badge variant="danger">Crítica</Badge>;
      case 'alta': return <Badge variant="warning">Alta</Badge>;
      case 'media': return <Badge variant="outline">Media</Badge>;
      default: return <Badge variant="success">Baja</Badge>;
    }
  };

  const statusBadge = (s: string) => {
    switch (s) {
      case 'abierta': return <Badge variant="danger">Abierta</Badge>;
      case 'en_curso': return <Badge variant="warning">En Curso</Badge>;
      case 'resuelta': return <Badge variant="success">Resuelta</Badge>;
      case 'cerrada': return <Badge variant="default">Cerrada</Badge>;
      default: return <Badge variant="outline">{s}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Incidencias</h1>
          <p className="text-muted-foreground mt-1">Registro y seguimiento de reportes</p>
        </div>
        
        <Button variant="primary" onClick={openNew}>
          <Plus size={18} className="mr-2" /> Nueva Incidencia
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <Card className="p-0 overflow-hidden border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-black/40 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 font-semibold">Reporte</th>
                <th className="px-6 py-4 font-semibold text-center">Severidad</th>
                <th className="px-6 py-4 font-semibold text-center">Estado</th>
                <th className="px-6 py-4 font-semibold">Fecha</th>
                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center"><div className="inline-block animate-spin text-brand-500"><RefreshCcw size={24} /></div></td></tr>
              ) : incidents.length > 0 ? (
                incidents.map((inc, i) => (
                  <motion.tr key={inc.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4 cursor-pointer" onClick={() => openDetail(inc)}>
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          inc.urgency === 'critica' || inc.status === 'abierta' ? "bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]" : "bg-transparent"
                        )} />
                        <div>
                          <p className="font-medium text-foreground group-hover:text-brand-400 transition-colors uppercase text-xs">{inc.category}</p>
                          <p className="text-muted-foreground max-w-xs truncate">{inc.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">{severityBadge(inc.urgency)}</td>
                    <td className="px-6 py-4 text-center">{statusBadge(inc.status)}</td>
                    <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">{inc.created_at?.split('T')[0] || '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="icon" variant="ghost" onClick={() => openDetail(inc)}><Eye size={16} /></Button>
                        <Button size="icon" variant="ghost" onClick={() => openEdit(inc)}><Edit3 size={16} /></Button>
                        <Button size="icon" variant="ghost" onClick={() => remove(inc.id)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10"><Trash2 size={16} /></Button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">Sin incidencias registradas</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* CREATE/EDIT MODAL */}
      <Modal isOpen={dialog} onClose={() => setDialog(false)} title={editItem ? 'Editar Incidencia' : 'Nueva Incidencia'}>
        <div className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Categoría</label>
            <Select value={form.category || 'otros'} onChange={e => setForm({...form, category: e.target.value})} autoFocus>
              <option value="surtidores">Surtidores / Pista</option>
              <option value="tienda">Tienda / Stock</option>
              <option value="limpieza">Limpieza / Aseos</option>
              <option value="sistemas">Sistemas / Informática</option>
              <option value="otros">Otros</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Descripción detallada</label>
            <textarea 
              className="flex w-full rounded-lg border border-border bg-background/50 px-3 py-2 text-sm text-foreground shadow-inner backdrop-blur-sm transition-all focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 min-h-[100px] resize-y"
              value={form.description || ''} 
              onChange={e => setForm({...form, description: e.target.value})}
              placeholder="Explica qué ha sucedido..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Urgencia</label>
              <Select value={form.urgency || 'media'} onChange={e => setForm({...form, urgency: e.target.value})}>
                {severities.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Estado</label>
              <Select value={form.status || 'abierta'} onChange={e => setForm({...form, status: e.target.value})}>
                {statuses.map(s => <option key={s} value={s}>{s.replace('_', ' ').charAt(0).toUpperCase() + s.replace('_', ' ').slice(1)}</option>)}
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" onClick={() => setDialog(false)}>Cancelar</Button>
            <Button variant="primary" onClick={save}>{editItem ? 'Guardar Cambios' : 'Registrar Incidencia'}</Button>
          </div>
        </div>
      </Modal>

      {/* DETAIL MODAL */}
      <Modal isOpen={detailDialog} onClose={() => setDetailDialog(false)} title={`Detalle: ${detailItem?.category?.toUpperCase()}`}>
        {detailItem && (
          <div className="space-y-6">
            <div className="bg-white/5 rounded-lg p-4 whitespace-pre-wrap text-sm text-foreground/90 border border-white/5 leading-relaxed">
              {detailItem.description}
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {severityBadge(detailItem.urgency)}
              {statusBadge(detailItem.status)}
            </div>

            <div className="space-y-2 text-xs text-muted-foreground bg-black/40 p-4 rounded-lg border border-white/5">
              <div className="flex justify-between">
                <span>Reportado por:</span>
                <span className="font-medium text-foreground">{detailItem.created_by_name || detailItem.created_by}</span>
              </div>
              <div className="flex justify-between">
                <span>Fecha de creación:</span>
                <span className="font-medium text-foreground">{detailItem.created_at ? new Date(detailItem.created_at).toLocaleString('es-ES') : '-'}</span>
              </div>
              {detailItem.resolved_at && (
                <div className="flex justify-between pt-2 border-t border-white/5 mt-2">
                  <span className="text-emerald-400">Fecha de resolución:</span>
                  <span className="font-medium text-emerald-400">{new Date(detailItem.resolved_at).toLocaleString('es-ES')}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
