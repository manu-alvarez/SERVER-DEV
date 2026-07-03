import { motion } from 'framer-motion';
import { PhoneCall, Clock, FileText } from 'lucide-react';

interface CallHistoryProps {
  calls: any[];
}

export function CallHistory({ calls }: CallHistoryProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <PhoneCall className="w-8 h-8 text-cyan-400" />
        <h2 className="text-3xl font-serif text-cyan-400 font-bold tracking-tight">Historial de Interacciones</h2>
      </div>

      {calls.length === 0 ? (
        <div className="p-8 text-center border border-white/5 rounded-2xl bg-white/[0.02]">
          <p className="text-gray-500 font-mono">Sin llamadas registradas.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {calls.map((c: any, i: number) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              key={c.id} 
              className="group relative bg-[#0a1520]/80 backdrop-blur-xl border border-cyan-500/10 rounded-2xl p-5 hover:border-cyan-400/30 transition-all shadow-lg overflow-hidden glitch-hover-effect"
            >
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-3">
                  <span className="flex items-center gap-2 text-sm text-gray-400 font-mono">
                    <Clock className="w-4 h-4 text-cyan-500/50" />
                    {c.started_at}
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-sm text-cyan-400 font-mono font-bold tracking-wider">
                    ⏱️ {c.duration_seconds || '?'}s
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-[#f8f8f0] leading-relaxed">
                    {c.transcript_summary || 'Sin transcripción procesada.'}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
