import { Rocket, Box, Globe, Shield, Activity, Target, Layout, MessageSquare, Heart, Sparkles, Layers } from 'lucide-react';

export const APPS_DATA = [
  {
    name: 'App Generator',
    desc: 'Generador de páginas web simples utilizando inteligencia artificial.',
    tech: 'React 19, Vite, Gemini API',
    url: 'https://appgenerator.manuelalvarez.dev',
    icon: Activity,
    color: 'from-[#f472b6] to-[#ec4899]',
    glow: 'shadow-[0_0_30px_rgba(244,114,182,0.3)]',
    category: 'utilities',
    tag: 'DEV AI'
  },
  {
    name: 'CombiPro',
    desc: 'Calculadora y generador de combinadas deportivas con probabilidad básica.',
    tech: 'React 19, MUI 7',
    url: 'https://combipro.manuelalvarez.dev',
    icon: Activity,
    color: 'from-[#f97316] to-[#f97316]',
    glow: 'shadow-[0_0_30px_rgba(249,115,22,0.3)]',
    category: 'industrial',
    tag: 'SPORTS AI'
  },
  {
    name: 'Cuentos Mágicos',
    desc: 'Pequeño generador de cuentos infantiles.',
    tech: 'FastAPI, Celery, AI',
    url: 'https://cuentos.manuelalvarez.dev',
    icon: Sparkles,
    color: 'from-[#fbbf24] to-[#f59e0b]',
    glow: 'shadow-[0_0_30px_rgba(251,191,36,0.3)]',
    category: 'core',
    tag: 'CREATIVE AI'
  },
  {
    name: 'Edelweiss',
    desc: 'Plataforma de gestión y reservas para refugio de montaña.',
    tech: 'Next.js 14, Tailwind, Prisma',
    url: 'https://edelweiss.manuelalvarez.dev',
    icon: Globe,
    color: 'from-[#ec4899] to-[#db2777]',
    glow: 'shadow-[0_0_30px_rgba(236,72,153,0.3)]',
    category: 'frontend',
    tag: 'VISION PLAY'
  },
  {
    name: 'EliteScout',
    desc: 'Buscador de viajes y productos impulsado por IA.',
    tech: 'Next.js 14, Tavily API',
    url: 'https://elitescout.manuelalvarez.dev',
    icon: Globe,
    color: 'from-[#D4AF37] to-[#b4952f]',
    glow: 'shadow-[0_0_30px_rgba(212,175,55,0.3)]',
    category: 'platforms',
    tag: 'TRAVEL AI'
  },
  {
    name: 'EXPOSITATOR RTE',
    desc: 'Herramienta de evaluación y feedback para exposiciones orales.',
    tech: 'PWA, Speech API, Vision API',
    url: 'https://expositator.manuelalvarez.dev',
    icon: Target,
    color: 'from-[#10b981] to-[#059669]',
    glow: 'shadow-[0_0_30px_rgba(16,185,129,0.3)]',
    category: 'utilities',
    tag: 'EVALUATOR AI'
  },
  {
    name: 'Gas Station',
    desc: 'App PWA de gestión operativa para Estación de Servicio Repsol.',
    tech: 'PWA, FastAPI, SQLite',
    url: 'https://gasstation.manuelalvarez.dev',
    icon: Rocket,
    color: 'from-[#f97316] to-[#ea580c]',
    glow: 'shadow-[0_0_30px_rgba(249,115,22,0.3)]',
    category: 'core',
    tag: 'OPS PWA'
  },
  {
    name: 'IAPuta OS',
    desc: 'Bot para ayuda en tareas de gestión de servidor por terminal.',
    tech: 'FastAPI, Python, LLM',
    url: 'https://iaputa.manuelalvarez.dev',
    icon: Shield,
    color: 'from-[#8b5cf6] to-[#7c3aed]',
    glow: 'shadow-[0_0_30px_rgba(139,92,246,0.3)]',
    category: 'platforms',
    tag: 'CORE AI'
  },
  {
    name: 'IndustrialPro',
    desc: 'App de gestión para procesos de mantenimiento y producción.',
    tech: 'FastAPI, React, Tailwind',
    url: 'https://industrial.manuelalvarez.dev',
    icon: Shield,
    color: 'from-[#3b82f6] to-[#2563eb]',
    glow: 'shadow-[0_0_30px_rgba(59,130,246,0.3)]',
    category: 'industrial',
    tag: 'INDUSTRY'
  },
  {
    name: 'IT English Coach',
    desc: 'Coach de inglés conversacional con voz.',
    tech: 'React, OpenAI API',
    url: 'https://english.manuelalvarez.dev',
    icon: MessageSquare,
    color: 'from-[#00FFCC] to-[#00cca3]',
    glow: 'shadow-[0_0_30px_rgba(0,255,204,0.3)]',
    category: 'utilities',
    tag: 'LANGUAGE AI'
  },
  {
    name: 'JartosDTo',
    desc: 'Chatbot gamberro y sarcástico.',
    tech: 'Next.js, OpenAI',
    url: 'https://jartos.manuelalvarez.dev',
    icon: Target,
    color: 'from-[#8b5cf6] to-[#7c3aed]',
    glow: 'shadow-[0_0_30px_rgba(139,92,246,0.3)]',
    category: 'utilities',
    tag: 'AI CHAT'
  },
  {
    name: 'LIVEKIT Nikolina',
    desc: 'Asistente de voz en tiempo real con WebRTC.',
    tech: 'LiveKit, Next.js',
    url: 'https://nikolina.manuelalvarez.dev',
    icon: MessageSquare,
    color: 'from-[#06b6d4] to-[#0891b2]',
    glow: 'shadow-[0_0_30px_rgba(6,182,212,0.3)]',
    category: 'platforms',
    tag: 'VOICE AI'
  },
  {
    name: 'LogiSearch',
    desc: 'Buscador y localizador de bultos por IA.',
    tech: 'React, Supabase',
    url: 'https://logisearch.manuelalvarez.dev',
    icon: Globe,
    color: 'from-[#00E5FF] to-[#00b8cc]',
    glow: 'shadow-[0_0_30px_rgba(0,229,255,0.3)]',
    category: 'industrial',
    tag: 'LOGISTICS AI'
  },
  {
    name: 'LogiTrack Almacén',
    desc: 'Gestor de stock para almacén.',
    tech: 'React, Firebase',
    url: 'https://almacen.manuelalvarez.dev',
    icon: Box,
    color: 'from-[#0ea5e9] to-[#0284c7]',
    glow: 'shadow-[0_0_30px_rgba(14,165,233,0.3)]',
    category: 'industrial',
    tag: 'LOGISTICS'
  },
  {
    name: 'Mano Eléctrica Azul',
    desc: 'Aplicación nativa móvil para gestión de energía.',
    tech: 'React Native, Expo',
    url: 'https://mano.manuelalvarez.dev',
    icon: Activity,
    color: 'from-[#10b981] to-[#059669]',
    glow: 'shadow-[0_0_30px_rgba(16,185,129,0.3)]',
    category: 'frontend',
    tag: 'MOBILE APP'
  },
  {
    name: 'Manuel Álvarez',
    desc: 'Mi portfolio personal y CV interactivo.',
    tech: 'React, Tailwind CSS',
    url: 'https://manuelalvarez.dev',
    icon: Layout,
    color: 'from-[#3b82f6] to-[#2563eb]',
    glow: 'shadow-[0_0_30px_rgba(59,130,246,0.3)]',
    category: 'frontend',
    tag: 'CV'
  },
  {
    name: 'MAPFRE Infocol',
    desc: 'Portal interno para empleados de Mapfre.',
    tech: 'Angular, .NET',
    url: 'https://mapfre.manuelalvarez.dev',
    icon: Shield,
    color: 'from-[#e60028] to-[#b3001f]',
    glow: 'shadow-[0_0_30px_rgba(230,0,40,0.3)]',
    category: 'industrial',
    tag: 'INSURANCE'
  },
  {
    name: 'Moko-Tools',
    desc: 'Herramientas de parseo y utilidades para devs.',
    tech: 'Vanilla JS',
    url: 'https://tools.manuelalvarez.dev',
    icon: Layout,
    color: 'from-[#14b8a6] to-[#0d9488]',
    glow: 'shadow-[0_0_30px_rgba(20,184,166,0.3)]',
    category: 'utilities',
    tag: 'DEV TOOLS'
  },
  {
    name: 'MSBrOSs Assistant',
    desc: 'Antiguo asistente personal virtual.',
    tech: 'React, Node.js',
    url: 'https://assistant.manuelalvarez.dev',
    icon: MessageSquare,
    color: 'from-[#a855f7] to-[#9333ea]',
    glow: 'shadow-[0_0_30px_rgba(168,85,247,0.3)]',
    category: 'core',
    tag: 'ASSISTANT'
  },
  {
    name: 'Perfume Trading',
    desc: 'B2B Marketplace para traders de perfumes.',
    tech: 'Next.js, Prisma',
    url: 'https://perfume.manuelalvarez.dev',
    icon: Box,
    color: 'from-[#f43f5e] to-[#e11d48]',
    glow: 'shadow-[0_0_30px_rgba(244,63,94,0.3)]',
    category: 'platforms',
    tag: 'TRADING B2B'
  },
  {
    name: 'TaskFlowPro',
    desc: 'Gestor de tareas avanzado con sincronización real-time.',
    tech: 'React, Firebase',
    url: 'https://taskflow.manuelalvarez.dev',
    icon: Layout,
    color: 'from-[#f59e0b] to-[#d97706]',
    glow: 'shadow-[0_0_30px_rgba(245,158,11,0.3)]',
    category: 'core',
    tag: 'PRODUCTIVITY'
  },
  {
    name: 'Traductor PRO',
    desc: 'Traductor neural con retención de formato.',
    tech: 'React, DeepL API',
    url: 'https://traductor.manuelalvarez.dev',
    icon: Globe,
    color: 'from-[#10b981] to-[#059669]',
    glow: 'shadow-[0_0_30px_rgba(16,185,129,0.3)]',
    category: 'utilities',
    tag: 'TRANSLATION'
  },
  {
    name: 'Tu Energía Maya',
    desc: 'Calculadora de calendarios Mayas Tzolkin.',
    tech: 'React, Vite',
    url: 'https://maya.manuelalvarez.dev',
    icon: Sparkles,
    color: 'from-[#f59e0b] to-[#d97706]',
    glow: 'shadow-[0_0_30px_rgba(245,158,11,0.3)]',
    category: 'frontend',
    tag: 'WEB APP'
  },
  {
    name: 'TxaFitnessPro',
    desc: 'Plataforma para monitorizar entrenamientos y nutrición.',
    tech: 'Next.js 15, Prisma',
    url: 'https://txafitness.manuelalvarez.dev',
    icon: Heart,
    color: 'from-[#a855f7] to-[#9333ea]',
    glow: 'shadow-[0_0_30px_rgba(168,85,247,0.3)]',
    category: 'platforms',
    tag: 'FITNESS AI'
  },
  {
    name: 'Web Atenea',
    desc: 'Landing page para restaurante Atenea.',
    tech: 'HTML, CSS',
    url: 'https://atenea.manuelalvarez.dev',
    icon: Layout,
    color: 'from-[#c4b5fd] to-[#a78bfa]',
    glow: 'shadow-[0_0_30px_rgba(196,181,253,0.3)]',
    category: 'frontend',
    tag: 'GASTRONOMY'
  }
];
