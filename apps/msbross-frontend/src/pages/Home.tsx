import { motion } from 'framer-motion';
import { ArrowRight, Globe, Database, Network, Activity, Target, Shield, Box, Layout, MessageSquare, Heart, Sparkles, Rocket, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  const allApps = [
    { name: 'App Generator', tag: 'DEV AI', color: 'from-[#f472b6] to-[#ec4899]', icon: Activity },
    { name: 'CombiPro', tag: 'SPORTS AI', color: 'from-[#f97316] to-[#f97316]', icon: Activity },
    { name: 'Cuentos Mágicos', tag: 'CREATIVE AI', color: 'from-[#fbbf24] to-[#f59e0b]', icon: Sparkles },
    { name: 'Edelweiss', tag: 'VISION PLAY', color: 'from-[#ec4899] to-[#db2777]', icon: Globe },
    { name: 'EliteScout', tag: 'TRAVEL AI', color: 'from-[#D4AF37] to-[#b4952f]', icon: Globe },
    { name: 'EXPOSITATOR RTE', tag: 'EVALUATOR AI', color: 'from-[#10b981] to-[#059669]', icon: Target },
    { name: 'Gas Station', tag: 'OPS PWA', color: 'from-[#f97316] to-[#ea580c]', icon: Rocket },
    { name: 'IAPuta OS', tag: 'CORE AI', color: 'from-[#8b5cf6] to-[#7c3aed]', icon: Shield },
    { name: 'IndustrialPro', tag: 'INDUSTRY', color: 'from-[#3b82f6] to-[#2563eb]', icon: Shield },
    { name: 'IT English Coach', tag: 'LANGUAGE AI', color: 'from-[#00FFCC] to-[#00cca3]', icon: MessageSquare },
    { name: 'JartosDTo', tag: 'AI CHAT', color: 'from-[#8b5cf6] to-[#7c3aed]', icon: Target },
    { name: 'LIVEKIT Nikolina', tag: 'VOICE AI', color: 'from-[#06b6d4] to-[#0891b2]', icon: MessageSquare },
    { name: 'LogiSearch', tag: 'LOGISTICS AI', color: 'from-[#00E5FF] to-[#00b8cc]', icon: Globe },
    { name: 'LogiTrack Almacén', tag: 'LOGISTICS', color: 'from-[#0ea5e9] to-[#0284c7]', icon: Box },
    { name: 'Mano Eléctrica Azul', tag: 'MOBILE APP', color: 'from-[#10b981] to-[#059669]', icon: Activity },
    { name: 'Manuel Álvarez', tag: 'CV', color: 'from-[#3b82f6] to-[#2563eb]', icon: Layout },
    { name: 'MAPFRE Infocol', tag: 'INSURANCE', color: 'from-[#e60028] to-[#b3001f]', icon: Shield },
    { name: 'Moko-Tools', tag: 'DEV TOOLS', color: 'from-[#14b8a6] to-[#0d9488]', icon: Layout },
    { name: 'MSBrOSs Assistant', tag: 'ASSISTANT', color: 'from-[#a855f7] to-[#9333ea]', icon: MessageSquare },
    { name: 'Perfume Trading', tag: 'TRADING B2B', color: 'from-[#f43f5e] to-[#e11d48]', icon: Box },
    { name: 'TaskFlowPro', tag: 'PRODUCTIVITY', color: 'from-[#f59e0b] to-[#d97706]', icon: Layout },
    { name: 'Traductor PRO', tag: 'TRANSLATION', color: 'from-[#10b981] to-[#059669]', icon: Globe },
    { name: 'Tu Energía Maya', tag: 'WEB APP', color: 'from-[#f59e0b] to-[#d97706]', icon: Sparkles },
    { name: 'TxaFitnessPro', tag: 'FITNESS AI', color: 'from-[#a855f7] to-[#9333ea]', icon: Heart },
    { name: 'Web Atenea', tag: 'GASTRONOMY', color: 'from-[#c4b5fd] to-[#a78bfa]', icon: Layout }
  ];

  // We need enough items to scroll seamlessly
  const col1 = [...allApps.slice(0, 13), ...allApps.slice(0, 13)];
  const col2 = [...allApps.slice(13, 25), ...allApps.slice(13, 25)];

  return (
    <div className="min-h-[85vh] flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-8 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-900/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[600px] h-[600px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none"></div>

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

      {/* Right Column: Infinite Live Stream */}
      <div className="w-full lg:w-1/2 relative h-[700px] flex items-center justify-center overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)]">
        
        {/* Grid Background */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>

        <div className="flex gap-4 md:gap-6 relative w-full justify-center rotate-[-5deg] scale-[0.6] sm:scale-75 md:scale-100 lg:scale-110">
          
          {/* Column 1 (Scrolls UP) */}
          <motion.div 
            className="flex flex-col gap-6"
            animate={{ y: ["0%", "-50%"] }}
            transition={{ duration: 25, ease: "linear", repeat: Infinity }}
          >
            {col1.map((app, i) => {
              const Icon = app.icon;
              return (
                <div key={`col1-${i}`} className="w-56 md:w-64 p-4 md:p-5 rounded-2xl bg-[#0A101C]/90 backdrop-blur-md border border-white/10 shadow-xl flex flex-col gap-4 group hover:border-cyan-500/50 transition-colors">
                  <div className="flex justify-between items-center">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${app.color} bg-opacity-20`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[9px] font-mono text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full uppercase">
                      {app.tag}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg leading-none">{app.name}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span className="text-[10px] font-mono text-gray-500">SYS_ONLINE</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </motion.div>

          {/* Column 2 (Scrolls DOWN) */}
          <motion.div 
            className="flex flex-col gap-6"
            animate={{ y: ["-50%", "0%"] }}
            transition={{ duration: 30, ease: "linear", repeat: Infinity }}
          >
            {col2.map((app, i) => {
              const Icon = app.icon;
              return (
                <div key={`col2-${i}`} className="w-56 md:w-64 p-4 md:p-5 rounded-2xl bg-[#0A101C]/90 backdrop-blur-md border border-white/10 shadow-xl flex flex-col gap-4 group hover:border-purple-500/50 transition-colors">
                  <div className="flex justify-between items-center">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${app.color} bg-opacity-20`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[9px] font-mono text-magenta-400 border border-magenta-500/20 px-2 py-0.5 rounded-full uppercase">
                      {app.tag}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg leading-none">{app.name}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span className="text-[10px] font-mono text-gray-500">SYS_ONLINE</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
