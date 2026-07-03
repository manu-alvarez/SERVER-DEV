import { useAppStore } from '../store';
import { TEMARIO, READING, LISTENING } from '../lib/data';
import { motion } from 'framer-motion';
import { Target, Zap, BookOpen, Headphones, Flame } from 'lucide-react';
import SkillsRadar from '../components/SkillsRadar';

export default function DashboardView() {
  const { progress } = useAppStore();
  
  const completedModules = Object.values(progress.status).filter(Boolean).length;
  const totalModules = TEMARIO.length;
  const progressPct = Math.round((completedModules / totalModules) * 100) || 0;

  return (
    <div className="space-y-6 pb-12 h-full">
      <div className="glass-panel p-6 rounded-2xl flex items-center justify-between border-l-4 border-l-matrix-green">
        <div>
          <h2 className="text-sm font-mono text-matrix-green tracking-wider uppercase mb-1">Panel General</h2>
          <p className="text-muted text-sm">Tu progreso en IT English Coach.</p>
        </div>
        <Flame size={32} className="text-matrix-green opacity-80" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Target />} title="Módulos" value={`${completedModules}/${totalModules}`} color="text-neon-cyan" />
        <StatCard icon={<BookOpen />} title="Reading" value={READING.length.toString()} color="text-amber-500" />
        <StatCard icon={<Headphones />} title="Listening" value={LISTENING.length.toString()} color="text-purple-500" />
        <StatCard icon={<Zap />} title="Score" value={`${progressPct}%`} color="text-matrix-green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-2xl p-6 lg:col-span-2 flex flex-col">
          <h3 className="font-bold text-white mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-neon-cyan"></span> Skills Radar
          </h3>
          <div className="flex-1 min-h-[300px]">
            <SkillsRadar />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-matrix-green"></span> Próximo Paso
            </h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              Continúa con el módulo de <strong className="text-white">Redes y Conectividad</strong> para mejorar tu vocabulario técnico.
            </p>
          </div>
          <button className="w-full mt-6 bg-matrix-green/10 hover:bg-matrix-green/20 border border-matrix-green text-matrix-green font-bold py-3 rounded-xl transition-colors">
            Reanudar
          </button>
        </motion.div>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, color }: { icon: any, title: string, value: string, color: string }) {
  return (
    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel rounded-2xl p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-muted font-mono uppercase">{title}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </motion.div>
  );
}
