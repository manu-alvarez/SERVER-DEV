import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ClipboardCheck, 
  Calendar, 
  AlertTriangle, 
  Clock, 
  Sun, 
  Sunset,
  Loader2
} from 'lucide-react';
import { api } from '../api/client';
import { Card, Badge, Button, cn } from './ui';
import { useStore } from '../store';

interface Props {
  onNavigate: (view: string) => void;
}

export default function Dashboard({ onNavigate }: Props) {
  const user = useStore(state => state.user);
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
    { title: 'Checklists', icon: <ClipboardCheck size={32} />, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', value: summary.completed !== undefined ? `${summary.completed}/${summary.total}` : '-', desc: 'Hoy', onClick: () => onNavigate('checklist') },
    { title: 'Alertas Caducidad', icon: <Calendar size={32} />, color: alerts.length > 0 ? 'text-amber-400' : 'text-emerald-400', bg: alerts.length > 0 ? 'bg-amber-500/10' : 'bg-emerald-500/10', border: alerts.length > 0 ? 'border-amber-500/20' : 'border-emerald-500/20', value: alerts.length, desc: 'Productos próximos a caducar', onClick: () => onNavigate('expiry') },
    { title: 'Incidencias', icon: <AlertTriangle size={32} />, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', value: stats.open !== undefined ? stats.open : '-', desc: 'Abiertas', onClick: () => onNavigate('incidents') },
    { title: 'Timesheet', icon: <Clock size={32} />, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', value: summary.hours ? `${summary.hours}h` : '-', desc: 'Este mes', onClick: () => onNavigate('timesheet') },
  ];

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="animate-spin text-brand-500" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bienvenido, <span className="text-brand-400">{user?.name}</span></h1>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            <Clock size={16} /> {today}
          </p>
        </div>
        
        <div className="inline-flex rounded-lg border border-border p-1 bg-black/20 backdrop-blur-sm">
          <button
            onClick={() => setShift('mañana')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
              shift === 'mañana' ? "bg-brand-500/20 text-brand-400" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Sun size={16} /> Mañana (07-14h)
          </button>
          <button
            onClick={() => setShift('tarde')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
              shift === 'tarde' ? "bg-brand-500/20 text-brand-400" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Sunset size={16} /> Tarde (14-21h)
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="h-full">
            <Card portal className="h-full cursor-pointer hover:-translate-y-1 transition-transform" onClick={card.onClick}>
              <div className="flex flex-col items-center justify-center text-center py-4">
                <div className={cn("p-4 rounded-full mb-4 border", card.bg, card.color, card.border)}>
                  {card.icon}
                </div>
                <h3 className="text-4xl font-bold tracking-tighter mb-1">{card.value}</h3>
                <p className="font-semibold text-foreground">{card.title}</p>
                <p className="text-sm text-muted-foreground">{card.desc}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Alerts section */}
      {alerts.length > 0 && (
        <Card portal>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="text-amber-400" />
            <h2 className="text-lg font-semibold">Productos Próximos a Caducar</h2>
          </div>
          <div className="space-y-2">
            {alerts.slice(0, 5).map((a: any, i: number) => (
              <div key={i} className="flex justify-between items-center py-2 px-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                <span className="text-sm font-medium">{a.product_name} - <span className="text-muted-foreground">{a.batch_code || a.batch_id}</span></span>
                <Badge variant={a.days_left <= 7 ? 'danger' : 'warning'}>
                  {a.days_left !== undefined ? `${a.days_left} días` : a.expiry_date}
                </Badge>
              </div>
            ))}
          </div>
          <Button variant="ghost" className="w-full mt-4" onClick={() => onNavigate('expiry')}>Ver todas las alertas</Button>
        </Card>
      )}

      {/* Lists section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card portal className="flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="text-red-400" />
            <h2 className="text-lg font-semibold">Incidencias Recientes</h2>
          </div>
          <div className="space-y-2 flex-1">
            {stats.recent?.length > 0 ? stats.recent.slice(0, 5).map((inc: any, i: number) => (
              <div key={i} className="flex justify-between items-center py-2 px-3 rounded-lg bg-white/5 border border-white/5">
                <span className="text-sm font-medium truncate max-w-[200px]" title={inc.title}>{inc.title}</span>
                <Badge variant={inc.status === 'abierta' ? 'danger' : inc.status === 'en_curso' ? 'warning' : 'success'}>
                  {inc.status}
                </Badge>
              </div>
            )) : <p className="text-sm text-muted-foreground italic">Sin incidencias recientes</p>}
          </div>
        </Card>
        
        <Card portal className="flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardCheck className="text-brand-400" />
            <h2 className="text-lg font-semibold">Checklists - {shift === 'mañana' ? 'Apertura' : 'Cierre'}</h2>
          </div>
          <div className="space-y-2 flex-1">
            {summary.entries?.length > 0 ? summary.entries
              .filter((e: any) => {
                const n = e.template_name?.toLowerCase() || '';
                if (shift === 'mañana') return n.includes('apertura') || n.includes('cambio');
                return n.includes('cierre') || n.includes('cambio');
              })
              .map((e: any, i: number) => (
              <div key={i} className="flex justify-between items-center py-2 px-3 rounded-lg bg-white/5 border border-white/5">
                <span className="text-sm font-medium">{e.template_name}</span>
                <Badge variant={e.completed ? 'success' : 'warning'}>
                  {e.completed ? 'Completado' : 'Pendiente'}
                </Badge>
              </div>
            )) : <p className="text-sm text-muted-foreground italic">Sin tareas registradas hoy</p>}
          </div>
        </Card>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Acciones Rápidas</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => onNavigate('timesheet')}>
            <Clock size={24} />
            <span>Registrar Turno</span>
          </Button>
          <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => onNavigate('checklist')}>
            <ClipboardCheck size={24} />
            <span>Hacer Checklist</span>
          </Button>
          <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => onNavigate('expiry')}>
            <Calendar size={24} />
            <span>Añadir Caducidad</span>
          </Button>
          <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => onNavigate('incidents')}>
            <AlertTriangle size={24} />
            <span>Añadir Incidencia</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
