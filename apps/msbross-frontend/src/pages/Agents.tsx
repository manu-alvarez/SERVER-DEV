import { Bot, Cpu, Activity, Sparkles, Brain, ArrowUpRight, Zap } from 'lucide-react';
import { motion, type Variants } from 'framer-motion';

export default function Agents() {
  const agents = [
    {
      name: 'IAPuta OS',
      desc: 'Asistente IA personal con modelo 3D y conexión a herramientas del servidor.',
      tech: 'FastAPI, React 19, Three.js',
      url: 'https://iaputa.manuelalvarez.dev',
      icon: Brain,
      color: 'from-cyan-400 to-blue-600',
      glow: 'shadow-[0_0_40px_rgba(6,182,212,0.4)]',
      bentoSize: 'col-span-1 md:col-span-2 lg:col-span-2 row-span-2',
    },
    {
      name: 'JartosDTo',
      desc: 'Chat IA con documentos cargados y aplicación móvil nativa.',
      tech: 'FastAPI, LangChain, pgvector',
      url: 'https://jartosdto.manuelalvarez.dev',
      icon: Bot,
      color: 'from-magenta-500 to-purple-600',
      glow: 'shadow-[0_0_30px_rgba(236,72,153,0.3)]',
      bentoSize: 'col-span-1 lg:col-span-1',
    },
    {
      name: 'MSBrOSs',
      desc: 'Asistente conversacional de propósito general.',
      tech: 'Python, Flask, Gemini API',
      url: 'https://assistant.manuelalvarez.dev',
      icon: Sparkles,
      color: 'from-green-400 to-emerald-600',
      glow: 'shadow-[0_0_30px_rgba(16,185,129,0.3)]',
      bentoSize: 'col-span-1 lg:col-span-1',
    },
    {
      name: 'App Generator',
      desc: 'Herramienta para generar páginas web simples utilizando inteligencia artificial.',
      tech: 'React 19, Vite, Gemini API',
      url: 'https://appgenerator.manuelalvarez.dev',
      icon: Activity,
      color: 'from-amber-400 to-orange-600',
      glow: 'shadow-[0_0_30px_rgba(245,158,11,0.3)]',
      bentoSize: 'col-span-1 md:col-span-2 lg:col-span-1',
    },
    {
      name: 'Traductor PRO',
      desc: 'Traductor automático usando diferentes modelos de IA y reconocimiento de texto.',
      tech: 'Express, React 19, MUI 7',
      url: 'https://traductor.manuelalvarez.dev',
      icon: Cpu,
      color: 'from-indigo-400 to-cyan-500',
      glow: 'shadow-[0_0_30px_rgba(99,102,241,0.3)]',
      bentoSize: 'col-span-1 lg:col-span-1',
    }
  ];

  const containerVars: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVars: Variants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 200, damping: 20 } },
  };

  return (
    <div className="space-y-10 min-h-[85vh]">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }} 
            className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full bg-cyan-950/40 border border-cyan-500/30"
          >
            <Zap className="w-4 h-4 text-cyan-400 fill-cyan-400" />
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest">Bots e Inteligencia Artificial</span>
          </motion.div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-2">
            <span className="text-white">Agentes </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              Inteligentes
            </span>
          </h1>
          <p className="text-gray-400 text-lg max-w-xl leading-relaxed">
            Colección de pequeños agentes conversacionales y asistentes virtuales de pruebas.
          </p>
        </div>
      </div>

      <motion.div 
        variants={containerVars}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-min"
      >
        {agents.map((agent, i) => {
          const Icon = agent.icon;
          const isHero = agent.bentoSize.includes('row-span-2');

          return (
            <motion.a 
              key={i}
              variants={itemVars}
              href={agent.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`group relative overflow-hidden rounded-3xl bg-[#0A101C]/60 backdrop-blur-xl border border-white/5 transition-all duration-500 hover:-translate-y-2 hover:border-white/20 ${agent.bentoSize}`}
            >
              {/* Background Glow Effect */}
              <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${agent.color} rounded-full blur-[100px] opacity-10 group-hover:opacity-30 transition-opacity duration-500 pointer-events-none`}></div>
              
              <div className={`flex flex-col h-full ${isHero ? 'p-10' : 'p-8'}`}>
                <div className="flex justify-between items-start mb-6">
                  <div className={`p-4 rounded-2xl bg-gradient-to-br ${agent.color} ${agent.glow} transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-2 bg-[#050B14]/80 px-3 py-1.5 rounded-full border border-white/5">
                      <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${agent.color} animate-pulse`}></div>
                      <span className="text-[10px] text-gray-300 font-mono font-medium tracking-widest">ONLINE</span>
                    </div>
                    <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-x-2 group-hover:translate-x-0">
                      <ArrowUpRight className="w-6 h-6 text-gray-400 group-hover:text-white" />
                    </div>
                  </div>
                </div>

                <div className="mt-auto">
                  <h3 className={`font-extrabold text-white tracking-wide mb-3 ${isHero ? 'text-4xl' : 'text-2xl'}`}>
                    {agent.name}
                  </h3>
                  <p className={`text-gray-400 leading-relaxed mb-6 ${isHero ? 'text-lg' : 'text-sm'}`}>
                    {agent.desc}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {agent.tech.split(',').map((t, idx) => (
                      <span key={idx} className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-gray-300">
                        {t.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.a>
          );
        })}
      </motion.div>
    </div>
  );
}
