import { Rocket, Box, Globe, Shield, Activity, Target, Layout, MessageSquare, Heart, Sparkles, ArrowUpRight, Zap } from 'lucide-react';
import { motion, type Variants } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';

export default function SaaS() {
  const [searchParams] = useSearchParams();
  const categoryFilter = searchParams.get('cat');

  const tools = [
    {
      name: 'App Generator',
      desc: 'Generador de páginas web simples utilizando inteligencia artificial.',
      tech: 'React 19, Vite, Gemini API',
      url: 'https://appgenerator.manuelalvarez.dev',
      icon: Activity,
      color: 'from-pink-400 to-pink-500',
      glow: 'shadow-[0_0_30px_rgba(244,114,182,0.3)]',
      category: 'dev-ai'
    },
    {
      name: 'CombiPro',
      desc: 'Calculadora y generador de combinadas deportivas con probabilidad básica.',
      tech: 'React 19, MUI 7',
      url: 'https://combipro.manuelalvarez.dev',
      icon: Activity,
      color: 'from-orange-500 to-orange-600',
      glow: 'shadow-[0_0_30px_rgba(249,115,22,0.3)]',
      category: 'sports-ai'
    },
    {
      name: 'Cuentos Mágicos AI',
      desc: 'Pequeño generador de cuentos infantiles.',
      tech: 'FastAPI, Celery, AI',
      url: 'https://cuentos.manuelalvarez.dev',
      icon: Sparkles,
      color: 'from-amber-400 to-amber-500',
      glow: 'shadow-[0_0_30px_rgba(251,191,36,0.3)]',
      category: 'creative-ai'
    },
    {
      name: 'Edelweiss',
      desc: 'Plataforma de gestión y reservas para refugio de montaña.',
      tech: 'Next.js 14, Tailwind, Prisma',
      url: 'https://edelweiss.manuelalvarez.dev',
      icon: Globe,
      color: 'from-pink-500 to-rose-600',
      glow: 'shadow-[0_0_30px_rgba(236,72,153,0.3)]',
      category: 'enterprise'
    },
    {
      name: 'EliteScout',
      desc: 'Buscador de viajes y productos impulsado por IA.',
      tech: 'Next.js 14, Tavily API',
      url: 'https://elitescout.manuelalvarez.dev',
      icon: Globe,
      color: 'from-yellow-400 to-yellow-600',
      glow: 'shadow-[0_0_30px_rgba(212,175,55,0.3)]',
      category: 'enterprise'
    },
    {
      name: 'EXPOSITATOR RTE',
      desc: 'Herramienta de evaluación y feedback para exposiciones orales.',
      tech: 'PWA, Speech API, Vision API',
      url: 'https://expositator.manuelalvarez.dev',
      icon: Target,
      color: 'from-emerald-400 to-emerald-600',
      glow: 'shadow-[0_0_30px_rgba(16,185,129,0.3)]',
      category: 'vision-play'
    },
    {
      name: 'Gas Station',
      desc: 'App PWA de gestión operativa para Estación de Servicio Repsol.',
      tech: 'PWA, FastAPI, SQLite',
      url: 'https://gasstation.manuelalvarez.dev',
      icon: Rocket,
      color: 'from-orange-500 to-orange-600',
      glow: 'shadow-[0_0_30px_rgba(249,115,22,0.3)]',
      category: 'enterprise'
    },
    {
      name: 'IAPuta OS',
      desc: 'Bot para ayuda en tareas de gestión de servidor por terminal.',
      tech: 'FastAPI, Python, LLM',
      url: 'https://iaputa.manuelalvarez.dev',
      icon: Shield,
      color: 'from-violet-500 to-purple-600',
      glow: 'shadow-[0_0_30px_rgba(139,92,246,0.3)]',
      category: 'dev-ai'
    },
    {
      name: 'IndustrialPro',
      desc: 'App de gestión para procesos de mantenimiento y producción.',
      tech: 'FastAPI, React, Tailwind',
      url: 'https://industrial.manuelalvarez.dev',
      icon: Shield,
      color: 'from-blue-500 to-blue-600',
      glow: 'shadow-[0_0_30px_rgba(59,130,246,0.3)]',
      category: 'enterprise'
    },
    {
      name: 'IT English Coach',
      desc: 'Plataforma PWA multiproveedor para dominar inglés técnico IT.',
      tech: 'PWA, Node.js, Multi-LLM',
      url: 'https://itenglish.manuelalvarez.dev',
      icon: MessageSquare,
      color: 'from-teal-300 to-teal-500',
      glow: 'shadow-[0_0_30px_rgba(0,255,204,0.3)]',
      category: 'dev-ai'
    },
    {
      name: 'Jartosdto',
      desc: 'Chatbot con RAG y documentos sobre un bot de Telegram.',
      tech: 'Python, RAG, Vector DB',
      url: 'https://jartosdto.manuelalvarez.dev',
      icon: Target,
      color: 'from-violet-500 to-purple-600',
      glow: 'shadow-[0_0_30px_rgba(139,92,246,0.3)]',
      category: 'dev-ai'
    },
    {
      name: 'LogiSearch',
      desc: 'Buscador logístico de rutas y simulador de tarifas (RFQs).',
      tech: 'React 19, TypeScript, Supabase',
      url: 'https://logisearch.manuelalvarez.dev',
      icon: Globe,
      color: 'from-cyan-400 to-cyan-500',
      glow: 'shadow-[0_0_30px_rgba(0,229,255,0.3)]',
      category: 'enterprise'
    },
    {
      name: 'LogiTrack Almacén',
      desc: 'App sencilla para la gestión de tareas de almacén y suministro.',
      tech: 'Trello, Kanban, Operaciones',
      url: 'https://logitrack.manuelalvarez.dev',
      icon: Box,
      color: 'from-sky-500 to-sky-600',
      glow: 'shadow-[0_0_30px_rgba(14,165,233,0.3)]',
      category: 'enterprise'
    },
    {
      name: 'Mano Eléctrica Azul',
      desc: 'App multiplataforma en Google Play para exploración interactiva y Tzolkin.',
      tech: 'React Native, Expo Go',
      url: 'https://mano.manuelalvarez.dev',
      icon: Activity,
      color: 'from-emerald-400 to-emerald-600',
      glow: 'shadow-[0_0_30px_rgba(16,185,129,0.3)]',
      category: 'creative-ai'
    },
    {
      name: 'MAPFRE Infocol',
      desc: 'App de información y gestión de documentos para seguros.',
      tech: 'Next.js 15, Enterprise',
      url: 'https://mapfre.manuelalvarez.dev',
      icon: Shield,
      color: 'from-red-600 to-red-700',
      glow: 'shadow-[0_0_30px_rgba(230,0,40,0.3)]',
      category: 'enterprise'
    },
    {
      name: 'Moko-Tools',
      desc: 'Directorio curado de 167 herramientas de desarrollo en 15 categorías.',
      tech: 'React 19, Vite 7, Tailwind',
      url: 'https://mokotools.manuelalvarez.dev',
      icon: Layout,
      color: 'from-teal-500 to-teal-600',
      glow: 'shadow-[0_0_30px_rgba(20,184,166,0.3)]',
      category: 'dev-ai'
    },
    {
      name: 'MSBross Voice Server',
      desc: 'Servidor central de voz Adele para interacciones auditivas.',
      tech: 'Python, Audio Processing',
      url: 'https://msbross-voice.manuelalvarez.dev',
      icon: Activity,
      color: 'from-purple-500 to-purple-600',
      glow: 'shadow-[0_0_30px_rgba(168,85,247,0.3)]',
      category: 'dev-ai'
    },
    {
      name: 'Nikolina Voice AI',
      desc: 'Prueba de bot de voz en tiempo real usando LiveKit.',
      tech: 'Python, LiveKit, WebRTC',
      url: 'https://nikolina.manuelalvarez.dev',
      icon: MessageSquare,
      color: 'from-cyan-500 to-cyan-600',
      glow: 'shadow-[0_0_30px_rgba(6,182,212,0.3)]',
      category: 'dev-ai'
    },
    {
      name: 'Perfume Trading',
      desc: 'Sistema ERP especializado en trading B2B de perfumería.',
      tech: 'ERP, Prisma, Next.js',
      url: 'https://perfume.manuelalvarez.dev',
      icon: Box,
      color: 'from-rose-500 to-rose-600',
      glow: 'shadow-[0_0_30px_rgba(244,63,94,0.3)]',
      category: 'enterprise'
    },
    {
      name: 'TaskFlowPro',
      desc: 'Gestión de tareas con alarmas, categorías e integración WhatsApp.',
      tech: 'React 18, MUI 5, Zustand',
      url: 'https://taskflow.manuelalvarez.dev',
      icon: Layout,
      color: 'from-amber-500 to-orange-500',
      glow: 'shadow-[0_0_30px_rgba(245,158,11,0.3)]',
      category: 'enterprise'
    },
    {
      name: 'Traductor Pro',
      desc: 'Un proxy básico para traducciones automatizadas.',
      tech: 'Express, Node.js, AI',
      url: 'https://traductor.manuelalvarez.dev',
      icon: Globe,
      color: 'from-emerald-400 to-emerald-600',
      glow: 'shadow-[0_0_30px_rgba(16,185,129,0.3)]',
      category: 'enterprise'
    },
    {
      name: 'Tu Energía Maya',
      desc: 'Web interactiva sobre astrología Maya, kin y firmas galácticas.',
      tech: 'Web App, JavaScript, Tzolkin',
      url: 'https://energia.manuelalvarez.dev',
      icon: Sparkles,
      color: 'from-amber-500 to-orange-500',
      glow: 'shadow-[0_0_30px_rgba(245,158,11,0.3)]',
      category: 'creative-ai'
    },
    {
      name: 'TxaFitnessPro',
      desc: 'Aplicación para seguimiento de entrenamientos y nutrición.',
      tech: 'Next.js 15, React 19, Tailwind',
      url: 'https://txafitness.manuelalvarez.dev',
      icon: Heart,
      color: 'from-purple-500 to-purple-600',
      glow: 'shadow-[0_0_30px_rgba(168,85,247,0.3)]',
      category: 'sports-ai'
    },
    {
      name: 'Web Restaurante Atenea',
      desc: 'Web informativa y sistema básico de reservas.',
      tech: 'HTML5, CSS3, JavaScript',
      url: 'https://atenea.manuelalvarez.dev',
      icon: Layout,
      color: 'from-violet-300 to-violet-400',
      glow: 'shadow-[0_0_30px_rgba(196,181,253,0.3)]',
      category: 'enterprise'
    }
  ];

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
      case 'dev-ai': return 'DEV & AI';
      case 'sports-ai': return 'Deportes';
      case 'creative-ai': return 'Creatividad';
      case 'vision-play': return 'Visión & Juegos';
      case 'enterprise': return 'Gestión & Logística';
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
