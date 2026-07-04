import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Factory, CheckCircle2, Timer, PlayCircle } from 'lucide-react';
import api from '../api/client';
import { Card, Badge } from './ui';
import { useStore } from '../store';

interface Props {
  onNavigate: (view: string) => void;
}

export default function Dashboard({ onNavigate }: Props) {
  const { user } = useStore();
  const [stats, setStats] = useState<any>({});
  const [recentOps, setRecentOps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/stats').then(r => r.data).catch(() => ({})),
      api.get('/operations').then(r => r.data).catch(() => []),
    ]).then(([s, ops]) => {
      setStats(s);
      setRecentOps(ops.slice(0, 5));
    }).finally(() => setLoading(false));
  }, []);

  const cards = [
    { title: 'Operaciones Totales', icon: <Factory size={32} />, color: 'text-msb-primary', bg: 'bg-msb-primary/10', border: 'border-msb-primary/20', value: stats.total_operations || 0, desc: 'Histórico', onClick: () => onNavigate('operations') },
    { title: 'Operaciones Activas', icon: <PlayCircle size={32} />, color: 'text-msb-success', bg: 'bg-msb-success/10', border: 'border-msb-success/20', value: stats.running_operations || 0, desc: 'En curso', onClick: () => onNavigate('operations') },
    { title: 'Completadas', icon: <CheckCircle2 size={32} />, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', value: stats.completed_operations || 0, desc: 'Exitosas', onClick: () => onNavigate('history') },
    { title: 'Temporizadores', icon: <Timer size={32} />, color: 'text-msb-accent', bg: 'bg-msb-accent/10', border: 'border-msb-accent/20', value: stats.active_timers || 0, desc: stats.total_timers ? `de ${stats.total_timers} activos` : 'Ninguno activo', onClick: () => onNavigate('operations') },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-msb-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Bienvenido, {user?.name}</h1>
        <p className="text-slate-400">Panel de Control IndustrialPro</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card 
              portal
              onClick={card.onClick}
              className={`p-6 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${card.bg.replace('10', '5')} ${card.border}`}
            >
              <div className={`${card.color} mb-4`}>{card.icon}</div>
              <div className="text-4xl font-bold text-white mb-1">{card.value}</div>
              <div className="text-sm font-semibold text-slate-300">{card.title}</div>
              <div className="text-xs text-slate-500 mt-2">{card.desc}</div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold text-white mb-4">Operaciones Recientes</h2>
        
        {recentOps.length === 0 ? (
          <Card className="p-8 text-center text-slate-400 border-dashed border-2 border-slate-800">
            No hay operaciones recientes. Ve a la pestaña de operaciones para crear una nueva.
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {recentOps.map((op, i) => {
              const isRunning = op.status === 'running';
              return (
                <motion.div key={op.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}>
                  <Card 
                    portal={isRunning} 
                    className={`p-5 cursor-pointer transition-colors hover:border-msb-primary/50 ${isRunning ? 'border-msb-success/30 bg-msb-success/5 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : ''}`}
                    onClick={() => onNavigate('operations')}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-lg text-white truncate pr-2">{op.name}</h3>
                      <Badge variant={isRunning ? 'success' : 'outline'}>
                        {isRunning ? 'Activa' : 'Completada'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-slate-400 mt-4">
                      <Package size={14} className="text-msb-primary" />
                      <span className="truncate">{op.product_name || 'Sin producto'}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-slate-500 mt-2">
                      <Timer size={14} />
                      <span>{new Date(op.created_at).toLocaleDateString('es-ES')}</span>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
