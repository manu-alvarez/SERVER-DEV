import { Rocket, Box, Globe, Shield, Activity, Target, Layout, MessageSquare, Heart, Sparkles, ArrowUpRight, Zap } from 'lucide-react';
import { motion, type Variants } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';

export default function SaaS() {
  const [searchParams] = useSearchParams();
  const categoryFilter = searchParams.get('cat');

  const tools = [
    {
      name: 'CombiPro',
      desc: 'Generador de combinadas deportivas con algoritmo de probabilidad real y perfiles de riesgo.',
      tech: 'React 19, MUI 7',
      url: 'https://combipro.manuelalvarez.dev',
      icon: Activity,
      color: 'from-orange-400 to-red-500',
      glow: 'shadow-[0_0_30px_rgba(249,115,22,0.3)]',
      category: 'sports-ai'
    },
    {
      name: 'EliteScout',
      desc: 'Buscador semántico de viajes y productos mediante inteligencia artificial avanzada.',
      tech: 'Next.js 14, Tavily API',
      url: 'https://elitescout.manuelalvarez.dev',
      icon: Globe,
      color: 'from-yellow-400 to-amber-600',
      glow: 'shadow-[0_0_30px_rgba(250,204,21,0.3)]',
      category: 'enterprise'
    },
    {
      name: 'EXPOSITATOR RTE',
      desc: 'Motor interactivo de evaluación en tiempo real para exposiciones orales.',
      tech: 'PWA, Speech API, Vision API',
      url: 'https://expositator.manuelalvarez.dev',
      icon: Target,
      color: 'from-green-400 to-emerald-600',
      glow: 'shadow-[0_0_30px_rgba(74,222,128,0.3)]',
      category: 'vision-play'
    },
    {
      name: 'Gas Station',
      desc: 'App PWA de gestión operativa para Estación de Servicio Repsol.',
      tech: 'PWA, FastAPI, SQLite',
      url: 'https://gasstation.manuelalvarez.dev',
      icon: Rocket,
      color: 'from-orange-400 to-red-500',
      glow: 'shadow-[0_0_30px_rgba(249,115,22,0.3)]',
      category: 'enterprise'
    },
    {
      name: 'IndustrialPro',
      desc: 'Plataforma de gestión industrial para procesos productivos y mantenimiento.',
      tech: 'FastAPI, React, Tailwind',
      url: 'https://industrial.manuelalvarez.dev',
      icon: Shield,
      color: 'from-blue-400 to-indigo-600',
      glow: 'shadow-[0_0_30px_rgba(96,165,250,0.3)]',
      category: 'enterprise'
    },
    {
      name: 'IT English Coach',
      desc: 'Plataforma PWA multiproveedor para dominar inglés técnico IT.',
      tech: 'PWA, Node.js, Multi-LLM',
      url: 'https://itenglish.manuelalvarez.dev',
      icon: MessageSquare,
      color: 'from-cyan-400 to-blue-500',
      glow: 'shadow-[0_0_30px_rgba(34,211,238,0.3)]',
      category: 'dev-ai'
    },
    {
      name: 'LogiSearch',
      desc: 'Buscador logístico con IA, análisis de rutas y generación de RFQs.',
      tech: 'React 19, TypeScript, Supabase',
      url: 'https://logisearch.manuelalvarez.dev',
      icon: Globe,
      color: 'from-cyan-400 to-teal-500',
      glow: 'shadow-[0_0_30px_rgba(34,211,238,0.3)]',
      category: 'enterprise'
    },
    {
      name: 'LogiTrack Almacén',
      desc: 'Sistema de gestión integral de operaciones de almacén y supply chain.',
      tech: 'Trello, Kanban, Operaciones',
      url: 'https://logitrack.manuelalvarez.dev',
      icon: Box,
      color: 'from-blue-400 to-indigo-500',
      glow: 'shadow-[0_0_30px_rgba(96,165,250,0.3)]',
      category: 'enterprise'
    },
    {
      name: 'Mano Eléctrica Azul',
      desc: 'App multiplataforma en Google Play para exploración interactiva y Tzolkin.',
      tech: 'React Native, Expo Go',
      url: 'https://mano.manuelalvarez.dev',
      icon: Activity,
      color: 'from-green-400 to-emerald-500',
      glow: 'shadow-[0_0_30px_rgba(74,222,128,0.3)]',
      category: 'creative-ai'
    },
    {
      name: 'MAPFRE Infocol',
      desc: 'Sistema avanzado de información, tasación y gestión documental para seguros.',
      tech: 'Next.js 15, Enterprise',
      url: 'https://mapfre.manuelalvarez.dev',
      icon: Shield,
      color: 'from-red-400 to-rose-600',
      glow: 'shadow-[0_0_30px_rgba(248,113,113,0.3)]',
      category: 'enterprise'
    },
    {
      name: 'Moko-Tools',
      desc: 'Directorio curado de 167 herramientas de desarrollo en 15 categorías.',
      tech: 'React 19, Vite 7, Tailwind',
      url: 'https://mokotools.manuelalvarez.dev',
      icon: Layout,
      color: 'from-green-400 to-teal-500',
      glow: 'shadow-[0_0_30px_rgba(74,222,128,0.3)]',
      category: 'dev-ai'
    },
    {
      name: 'Perfume Trading',
      desc: 'Sistema ERP especializado en trading B2B de perfumería.',
      tech: 'ERP, Prisma, Next.js',
      url: 'https://perfume.manuelalvarez.dev',
      icon: Box,
      color: 'from-red-400 to-rose-500',
      glow: 'shadow-[0_0_30px_rgba(248,113,113,0.3)]',
      category: 'enterprise'
    },
    {
      name: 'TaskFlowPro',
      desc: 'Gestión de tareas con alarmas, categorías e integración WhatsApp.',
      tech: 'React 18, MUI 5, Zustand',
      url: 'https://taskflow.manuelalvarez.dev',
      icon: Layout,
      color: 'from-yellow-400 to-amber-500',
      glow: 'shadow-[0_0_30px_rgba(250,204,21,0.3)]',
      category: 'enterprise'
    },
    {
      name: 'Tu Energía Maya',
      desc: 'Plataforma interactiva sobre sabiduría Maya, kin y firma galáctica.',
      tech: 'Web App, JavaScript, Tzolkin',
      url: 'https://energia.manuelalvarez.dev',
      icon: Sparkles,
      color: 'from-yellow-400 to-orange-500',
      glow: 'shadow-[0_0_30px_rgba(250,204,21,0.3)]',
      category: 'creative-ai'
    },
    {
      name: 'TxaFitnessPro',
      desc: 'Plataforma integral de entrenamiento y nutrición inteligente con IA.',
      tech: 'Next.js 15, React 19, Tailwind',
      url: 'https://txafitness.manuelalvarez.dev',
      icon: Heart,
      color: 'from-purple-400 to-fuchsia-600',
      glow: 'shadow-[0_0_30px_rgba(192,132,252,0.3)]',
      category: 'sports-ai'
    },
    {
      name: 'Web Restaurante Atenea',
      desc: 'Experiencia culinaria de alta gastronomía con sistema de reservas.',
      tech: 'HTML5, CSS3, JavaScript',
      url: 'https://atenea.manuelalvarez.dev',
      icon: Layout,
      color: 'from-gray-300 to-slate-500',
      glow: 'shadow-[0_0_30px_rgba(209,213,219,0.3)]',
      category: 'enterprise'
    }
  ];

  const filteredTools = categoryFilter 
    ? tools.filter(tool => tool.category === categoryFilter)
    : tools;

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
      case 'dev-ai': return 'DEV AI Platforms';
      case 'sports-ai': return 'SPORTS AI Platforms';
      case 'creative-ai': return 'CREATIVE AI Platforms';
      case 'vision-play': return 'VISION PLAY Apps';
      case 'enterprise': return 'ENTERPRISE & Operations';
      default: return 'SaaS & B2B Platforms';
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
            <span className="text-white">Ecosistema </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 block sm:inline">
              {getCategoryTitle()}
            </span>
          </motion.h1>
          <p className="text-gray-400 text-lg max-w-xl leading-relaxed mt-2">
            Suite completa de aplicaciones empresariales, herramientas de productividad y ecosistemas escalables en el área de {categoryFilter ? categoryFilter.replace('-', ' ').toUpperCase() : 'múltiples sectores'}.
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
            return (
              <motion.a 
                key={i} 
                variants={itemVars}
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative overflow-hidden rounded-3xl bg-[#0A101C]/60 backdrop-blur-xl border border-white/5 p-6 transition-all duration-500 hover:-translate-y-2 hover:border-white/20"
              >
                {/* Subtle background glow */}
                <div className={`absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br ${tool.color} rounded-full blur-[80px] opacity-10 group-hover:opacity-30 transition-opacity duration-500 pointer-events-none`}></div>

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
