import { ArrowUpRight, Zap } from 'lucide-react';
import { motion, type Variants } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { APPS_DATA } from '../data/apps';

export default function SaaS() {
  const [searchParams] = useSearchParams();
  const categoryFilter = searchParams.get('cat');

  const tools = APPS_DATA;

  const filteredTools = (categoryFilter 
    ? tools.filter(tool => tool.category === categoryFilter)
    : tools
  ).sort((a, b) => a.name.localeCompare(b.name));

  const containerVars: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVars: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 20 } },
  };

  const getCategoryTitle = () => {
    switch (categoryFilter) {
      case 'core': return 'Eje Core & APIs';
      case 'platforms': return 'Plataformas Externas';
      case 'industrial': return 'Ecosistema Industrial';
      case 'frontend': return 'Frontend & Ocio';
      case 'operations': return 'Operaciones';
      case 'utilities': return 'Utilidades';
      default: return 'Mis Aplicaciones';
    }
  };

  return (
    <div className="space-y-10 min-h-[85vh]">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }} 
            key={categoryFilter}
            className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full bg-indigo-950/40 border border-indigo-500/30"
          >
            <Zap className="w-4 h-4 text-indigo-400 fill-indigo-400" />
            <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest">{categoryFilter ? categoryFilter.replace('-', ' ') : 'Operaciones & Enterprise'}</span>
          </motion.div>
          <motion.h1 
            key={`h1-${categoryFilter}`}
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="text-5xl md:text-6xl font-extrabold tracking-tight mb-2"
          >
            <span className="text-white">Proyectos </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 block sm:inline">
              {getCategoryTitle()}
            </span>
          </motion.h1>
          <p className="text-gray-400 text-lg max-w-xl leading-relaxed mt-2">
            Lista de aplicaciones, pequeños proyectos y herramientas para el área de {categoryFilter ? categoryFilter.replace('-', ' ').toUpperCase() : 'diferentes áreas'}.
          </p>
        </div>
      </div>

      <motion.div 
        key={`grid-${categoryFilter}`}
        variants={containerVars}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        {filteredTools.length > 0 ? (
          filteredTools.map((tool, i) => {
            const Icon = tool.icon;
            const match = tool.glow.match(/rgba\((.*?)\)/);
            const rgbValues = match ? match[1].split(',').slice(0, 3).join(',') : '99,102,241';
            const neonStyle = { '--neon-color': `rgba(${rgbValues}, 0.5)`, '--neon-border': `rgba(${rgbValues}, 0.8)` } as React.CSSProperties;

            return (
              <motion.a 
                key={i} 
                variants={itemVars}
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                style={neonStyle}
                className="group relative overflow-hidden rounded-3xl bg-[#0A101C]/60 backdrop-blur-xl border border-white/5 p-6 transition-all duration-500 hover:-translate-y-2 hover-neon"
              >
                {/* Subtle background glow */}
                <div className={`absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br ${tool.color} rounded-full blur-[80px] opacity-10 group-hover:opacity-40 transition-opacity duration-500 pointer-events-none`}></div>

                <div className="flex flex-col h-full relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div className={`p-3.5 rounded-2xl bg-gradient-to-br ${tool.color} ${tool.glow} transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex items-center gap-1.5 bg-[#050B14]/80 px-2.5 py-1 rounded-full border border-white/5">
                      <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${tool.color} animate-pulse`}></div>
                      <span className="text-[9px] text-gray-300 font-mono font-medium tracking-widest">LIVE</span>
                    </div>
                  </div>

                  <div className="mt-auto">
                    <h3 className="text-xl font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-400 transition-all mb-2 flex items-center justify-between">
                      {tool.name}
                      <ArrowUpRight className="w-5 h-5 text-gray-500 opacity-0 group-hover:opacity-100 group-hover:text-white transition-all transform translate-x-2 group-hover:translate-x-0" />
                    </h3>
                    <p className="text-gray-400 text-sm mb-4 leading-relaxed line-clamp-2">
                      {tool.desc}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {tool.tech.split(',').map((t, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-gray-400">
                          {t.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.a>
            );
          })
        ) : (
          <div className="col-span-full py-20 text-center text-gray-500 font-mono border border-white/5 rounded-3xl bg-white/[0.02]">
            No se encontraron aplicaciones activas en esta categoría.
          </div>
        )}
      </motion.div>
    </div>
  );
}
