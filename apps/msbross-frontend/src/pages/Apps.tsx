import { ArrowUpRight, Zap } from 'lucide-react';
import { motion, type Variants } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { APPS_DATA } from '../data/apps';
import { BentoGrid } from '../components/ui/BentoGrid';
import { MagneticCard } from '../components/ui/MagneticCard';
import { AmbientGlow } from '../components/ui/AmbientGlow';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  }
};

export default function Apps() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = searchParams.get('filter') || 'all';

  const filters = [
    { id: 'all', label: 'Todas las Apps' },
    { id: 'AI', label: 'Inteligencia Artificial' },
    { id: 'TOOL', label: 'Herramientas' },
    { id: 'WEB', label: 'Web' },
    { id: 'HEALTH', label: 'Salud & Fitness' }
  ];

  const filteredApps = APPS_DATA.filter(app => {
    if (filter === 'all') return true;
    return app.tag === filter;
  });

  return (
    <div className="min-h-screen pt-12 pb-24 relative z-10">
      <AmbientGlow />

      <div className="text-center mb-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono text-sm mb-6"
        >
          <Zap className="w-4 h-4" />
          <span>Ecosistema Activo</span>
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-7xl font-black tracking-tight mb-6 text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-indigo-400"
        >
          Proyectos <br className="md:hidden" />
          Desplegados
        </motion.h1>

        {/* Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap justify-center gap-3 px-4"
        >
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => setSearchParams({ filter: f.id })}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                filter === f.id 
                  ? 'bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)]' 
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              {f.label}
            </button>
          ))}
        </motion.div>
      </div>

      {/* Grid de Aplicaciones usando BentoGrid y MagneticCard */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full relative z-10"
      >
        <BentoGrid className="max-w-7xl mx-auto px-4 md:px-8">
          {filteredApps.map((app, index) => {
            const Icon = app.icon;
            // Damos mayor peso visual a las apps AI o según un índice para el BentoGrid
            const isFeatured = index === 0 || index === 3;
            
            return (
              <motion.div key={app.name} variants={itemVariants} className={isFeatured ? 'md:col-span-2' : ''}>
                <MagneticCard className="h-full p-6 flex flex-col justify-between" glowColor={app.color.includes('cyan') ? 'rgba(6,182,212,0.15)' : 'rgba(99,102,241,0.15)'}>
                  <div className="flex justify-between items-start mb-6">
                    <div className={`p-4 rounded-2xl bg-gradient-to-br ${app.color} bg-opacity-10 backdrop-blur-sm border border-white/10 shadow-lg`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <span className="text-xs font-mono text-white/60 bg-white/5 px-3 py-1 rounded-full border border-white/10 uppercase tracking-wider">
                      {app.tag}
                    </span>
                  </div>

                  <div className="mt-auto">
                    <h3 className="text-2xl font-bold text-white mb-2">{app.name}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed mb-6">
                      {app.desc}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.6)]"></div>
                        <span className="text-xs font-mono text-emerald-400/80 uppercase tracking-widest">Online</span>
                      </div>
                      <a 
                        href={app.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm font-bold text-white bg-white/10 px-4 py-2 rounded-lg hover:bg-white/20 transition-colors border border-white/5 group"
                      >
                        Launch
                        <ArrowUpRight className="w-4 h-4 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
                      </a>
                    </div>
                  </div>
                </MagneticCard>
              </motion.div>
            );
          })}
        </BentoGrid>
      </motion.div>

      {/* Empty State */}
      {filteredApps.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <div className="w-20 h-20 bg-white/5 rounded-3xl mx-auto flex items-center justify-center mb-6">
            <Zap className="w-8 h-8 text-gray-500" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">No se encontraron apps</h3>
          <p className="text-gray-400">Prueba con otro filtro de categoría.</p>
        </motion.div>
      )}
    </div>
  );
}
