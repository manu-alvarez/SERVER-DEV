import { motion } from 'framer-motion';
import { Database, Activity, Server, PhoneCall, CalendarCheck } from 'lucide-react';

interface AdminDashboardProps {
  isConnectedBackend: boolean;
  reservationsCount: number;
  callsCount: number;
}

export function AdminDashboard({ isConnectedBackend, reservationsCount, callsCount }: AdminDashboardProps) {
  const cards = [
    {
      id: 'backend',
      title: 'BACKEND LOCAL',
      value: isConnectedBackend ? 'Estable' : 'Abortado',
      icon: Server,
      color: isConnectedBackend ? 'text-emerald-400' : 'text-red-400',
      bgGlow: isConnectedBackend ? 'from-emerald-500/20' : 'from-red-500/20'
    },
    {
      id: 'reservations',
      title: 'RESERVAS TOTALES',
      value: reservationsCount,
      icon: CalendarCheck,
      color: 'text-cyan-400',
      bgGlow: 'from-cyan-500/20'
    },
    {
      id: 'calls',
      title: 'LLAMADAS LOG',
      value: callsCount,
      icon: PhoneCall,
      color: 'text-cyan-400',
      bgGlow: 'from-cyan-500/20'
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Database className="w-8 h-8 text-cyan-400" />
        <h2 className="text-3xl font-serif text-cyan-400 font-bold tracking-tight">Estado del Sistema</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={card.id}
            className="group relative bg-[#0a1520]/80 backdrop-blur-xl border border-cyan-500/10 rounded-3xl p-6 hover:border-cyan-400/30 transition-all shadow-lg overflow-hidden"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${card.bgGlow} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-white/5 rounded-xl border border-white/5">
                  <card.icon className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xs font-mono text-gray-400 tracking-widest">{card.title}</h3>
              </div>
              <div className={`text-4xl font-bold tracking-tight ${card.color}`}>
                {card.value}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-12 p-6 rounded-2xl bg-cyan-950/20 border border-cyan-900/50 text-center"
      >
        <Activity className="w-6 h-6 text-cyan-500/50 mx-auto mb-3" />
        <p className="text-sm text-cyan-200/50 leading-relaxed max-w-2xl mx-auto">
          Nota: Todos los datos son despachados en tiempo real desde la red interna (localhost:8001). 
          Esta dashboard WebRTC controla a Nikolina AI mediante WebSockets asegurados.
        </p>
      </motion.div>
    </div>
  );
}
