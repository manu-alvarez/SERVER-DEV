import { motion } from 'framer-motion';
import { Calendar, Users, Phone, FileText } from 'lucide-react';

interface ReservationsListProps {
  reservations: any[];
}

export function ReservationsList({ reservations }: ReservationsListProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Calendar className="w-8 h-8 text-cyan-400" />
        <h2 className="text-3xl font-serif text-cyan-400 font-bold tracking-tight">Reservas en Tiempo Real</h2>
      </div>
      
      {reservations.length === 0 ? (
        <div className="p-8 text-center border border-white/5 rounded-2xl bg-white/[0.02]">
          <p className="text-gray-500 font-mono">Sin reservas todavía.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {reservations.map((res: any, i: number) => (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              key={res.id} 
              className="group relative bg-[#0a1520]/80 backdrop-blur-xl border border-cyan-500/10 rounded-2xl p-5 hover:border-cyan-400/30 transition-all shadow-lg glitch-hover-effect overflow-hidden"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">{res.customer_name}</h3>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1.5"><Phone className="w-4 h-4" /> {res.customer_phone || 'Sin tel'}</span>
                    <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md"><Users className="w-4 h-4" /> {res.num_guests} pax</span>
                    <span className="font-mono text-xs opacity-50 flex items-center">ID: {res.id}</span>
                  </div>
                  {res.notes && (
                    <div className="mt-3 flex items-start gap-2 text-sm text-cyan-200/70 bg-cyan-500/10 p-2 rounded-lg border border-cyan-500/10">
                      <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <p>{res.notes}</p>
                    </div>
                  )}
                </div>
                
                <div className="text-right border-l border-white/5 pl-4 flex flex-col justify-center min-w-[120px]">
                  <div className="text-2xl font-bold text-white tracking-tight">{res.date}</div>
                  <div className="text-cyan-400 font-mono text-lg">{res.time}h</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
