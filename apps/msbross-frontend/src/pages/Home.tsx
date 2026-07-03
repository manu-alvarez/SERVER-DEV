import { motion } from 'framer-motion';
import { ArrowRight, Globe, Database, Network, Box, Layers, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { APPS_DATA } from '../data/apps';
import { AmbientGlow } from '../components/ui/AmbientGlow';
import { InfiniteStream } from '../components/ui/InfiniteStream';

export default function Home() {
  const allApps = APPS_DATA;

  // We need enough items to scroll seamlessly
  const col1 = [...allApps.slice(0, 13), ...allApps.slice(0, 13)];
  const col2 = [...allApps.slice(13, 25), ...allApps.slice(13, 25)];

  return (
    <div className="min-h-[85vh] flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-8 relative overflow-hidden">
      <AmbientGlow />

      {/* Left Column: Typography */}
      <div className="w-full lg:w-1/2 space-y-8 relative z-50 p-2 lg:p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-xl"
        >
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
          <span className="font-mono text-indigo-400 text-xs tracking-widest uppercase">
            Mis Aplicaciones
          </span>
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-6xl lg:text-[5.5rem] font-black tracking-tighter leading-[1.05]"
        >
          <span className="text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-500 block">
            Mis Proyectos
          </span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-500 to-fuchsia-600 block pb-2 drop-shadow-[0_0_30px_rgba(99,102,241,0.4)]">
            Personales
          </span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-gray-400 text-xl lg:text-2xl max-w-xl leading-relaxed font-light"
        >
          Una modesta colección de herramientas, pequeños scripts y aplicaciones web que voy programando para intentar solucionar problemas del día a día.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-white/10"
        >
          <div className="group">
            <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-500 group-hover:scale-110 transition-transform origin-left">25</div>
            <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mt-2 flex items-center gap-1.5">
              <Globe className="w-3 h-3 text-indigo-500" /> Proyectos
            </div>
          </div>
          <Link to="/apps" className="group cursor-pointer">
            <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-500 group-hover:scale-110 transition-transform origin-left">6</div>
            <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mt-2 flex items-center gap-1.5 group-hover:text-pink-400 transition-colors">
              <Layers className="w-3 h-3 text-pink-500" /> Fases Estratégicas
            </div>
          </Link>
          <div className="group">
            <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500 group-hover:scale-110 transition-transform origin-left">20+</div>
            <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mt-2 flex items-center gap-1.5">
              <Database className="w-3 h-3 text-emerald-500" /> Contenedores
            </div>
          </div>
          <div className="group">
            <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 group-hover:scale-110 transition-transform origin-left">24/7</div>
            <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mt-2 flex items-center gap-1.5">
              <Network className="w-3 h-3 text-amber-500" /> Monitorizado
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="pt-8 flex gap-4"
        >
          <Link to="/apps" className="inline-block">
            <button className="group relative flex items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-700 px-8 py-4 text-white font-bold tracking-wide transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(6,182,212,0.6)]">
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
              <span className="relative z-10">Ver todos los proyectos</span>
              <ArrowRight className="relative z-10 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>
        </motion.div>

        {/* Gestor del servidor - Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          {[
            { name: 'Traefik', url: 'https://traefik.manuelalvarez.dev', icon: Network, color: 'text-indigo-400', bg: 'hover:bg-indigo-500/10 hover:border-indigo-500/30' },
            { name: 'Portainer', url: 'https://portainer.manuelalvarez.dev', icon: Box, color: 'text-cyan-400', bg: 'hover:bg-cyan-500/10 hover:border-cyan-500/30' },
            { name: 'Kuma', url: 'https://monitor.manuelalvarez.dev', icon: Activity, color: 'text-emerald-400', bg: 'hover:bg-emerald-500/10 hover:border-emerald-500/30' }
          ].map((service, idx) => {
            const Icon = service.icon;
            return (
              <a 
                key={idx}
                href={service.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`group flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 transition-all duration-300 ${service.bg}`}
              >
                <div className={`p-2 rounded-lg bg-white/5 group-hover:bg-transparent transition-colors`}>
                  <Icon className={`w-4 h-4 ${service.color}`} />
                </div>
                <div className="flex-1">
                  <span className="block text-sm font-bold text-gray-300 group-hover:text-white transition-colors">{service.name}</span>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
              </a>
            );
          })}
        </motion.div>
      </div>

      <InfiniteStream col1={col1} col2={col2} />
    </div>
  );
}
