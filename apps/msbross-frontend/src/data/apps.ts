import { Rocket, Box, Globe, Shield, Activity, Target, Layout, MessageSquare, Heart, Sparkles } from 'lucide-react';

export const APPS_DATA = [
  {
    name: 'App Generator',
    desc: 'Generador de páginas web estáticas mediante prompts de texto. Crea, visualiza y descarga el código fuente.',
    tech: 'React 19, Vite, Gemini API',
    url: 'https://appgen.manuelalvarez.dev',
    icon: Activity,
    color: 'from-[#f472b6] to-[#ec4899]',
    glow: 'shadow-[0_0_30px_rgba(244,114,182,0.3)]',
    category: 'utilities',
    tag: 'DEV AI'
  },
  {
    name: 'CombiPro',
    desc: 'Herramienta de cálculo y simulación de combinadas deportivas basada en probabilidades básicas.',
    tech: 'React 19, Material-UI (MUI)',
    url: 'https://combipro.manuelalvarez.dev',
    icon: Activity,
    color: 'from-[#f97316] to-[#f97316]',
    glow: 'shadow-[0_0_30px_rgba(249,115,22,0.3)]',
    category: 'industrial',
    tag: 'SPORTS TOOL'
  },
  {
    name: 'Cuentos Mágicos',
    desc: 'Plataforma experimental para la generación de cuentos infantiles personalizados usando LLMs.',
    tech: 'React, FastAPI, Celery, PostgreSQL',
    url: 'https://cuentos.manuelalvarez.dev',
    icon: Sparkles,
    color: 'from-[#fbbf24] to-[#f59e0b]',
    glow: 'shadow-[0_0_30px_rgba(251,191,36,0.3)]',
    category: 'core',
    tag: 'CREATIVE AI'
  },
  {
    name: 'Edelweiss',
    desc: 'Sistema integral de reservas y gestión administrativa para refugios de montaña.',
    tech: 'Next.js 14, Tailwind CSS, Prisma, Postgres',
    url: 'https://edelweiss.manuelalvarez.dev',
    icon: Globe,
    color: 'from-[#ec4899] to-[#db2777]',
    glow: 'shadow-[0_0_30px_rgba(236,72,153,0.3)]',
    category: 'frontend',
    tag: 'MANAGEMENT B2B'
  },
  {
    name: 'EliteScout',
    desc: 'Buscador inteligente para la consolidación y filtrado de datos de viajes y productos mediante agentes de búsqueda.',
    tech: 'Next.js 14, Node.js, PostgreSQL, Tavily API',
    url: 'https://elitescout.manuelalvarez.dev',
    icon: Globe,
    color: 'from-[#D4AF37] to-[#b4952f]',
    glow: 'shadow-[0_0_30px_rgba(212,175,55,0.3)]',
    category: 'platforms',
    tag: 'SEARCH AI'
  },
  {
    name: 'EXPOSITATOR RTE',
    desc: 'Aplicación web progresiva (PWA) para grabar, transcribir y evaluar exposiciones orales en tiempo real.',
    tech: 'React PWA, Web Speech API, Tailwind',
    url: 'https://expositator.manuelalvarez.dev',
    icon: Target,
    color: 'from-[#10b981] to-[#059669]',
    glow: 'shadow-[0_0_30px_rgba(16,185,129,0.3)]',
    category: 'utilities',
    tag: 'EVALUATOR'
  },
  {
    name: 'Gas Station',
    desc: 'Herramienta PWA de apoyo operativo para el control interno en Estaciones de Servicio.',
    tech: 'React PWA, FastAPI, SQLite',
    url: 'https://gasstation.manuelalvarez.dev',
    icon: Rocket,
    color: 'from-[#f97316] to-[#ea580c]',
    glow: 'shadow-[0_0_30px_rgba(249,115,22,0.3)]',
    category: 'core',
    tag: 'OPS PWA'
  },
  {
    name: 'IAProd OS',
    desc: 'Sistema operativo web para la monitorización, orquestación y mantenimiento del servidor VPS central.',
    tech: 'React, Vite, FastAPI, Python',
    url: 'https://iaprod.manuelalvarez.dev',
    icon: Shield,
    color: 'from-[#8b5cf6] to-[#7c3aed]',
    glow: 'shadow-[0_0_30px_rgba(139,92,246,0.3)]',
    category: 'platforms',
    tag: 'INFRA OS'
  },
  {
    name: 'IndustrialPro',
    desc: 'Sistema B2B para la digitalización de procesos de mantenimiento preventivo y producción industrial.',
    tech: 'React, Tailwind, FastAPI, PostgreSQL',
    url: 'https://industrial.manuelalvarez.dev',
    icon: Shield,
    color: 'from-[#3b82f6] to-[#2563eb]',
    glow: 'shadow-[0_0_30px_rgba(59,130,246,0.3)]',
    category: 'industrial',
    tag: 'INDUSTRY B2B'
  },
  {
    name: 'IT English Coach',
    desc: 'Tutor conversacional de inglés enfocado en vocabulario técnico IT, impulsado por IA multimodal.',
    tech: 'React, Tailwind, Express, OpenAI Audio API',
    url: 'https://itenglish.manuelalvarez.dev',
    icon: MessageSquare,
    color: 'from-[#00FFCC] to-[#00cca3]',
    glow: 'shadow-[0_0_30px_rgba(0,255,204,0.3)]',
    category: 'utilities',
    tag: 'LANGUAGE AI'
  },
  {
    name: 'JartosDTo',
    desc: 'Compañero conversacional B2C diseñado con una personalidad sarcástica para interacciones de ocio.',
    tech: 'Next.js 14, Tailwind, OpenAI GPT-4',
    url: 'https://jartosdto.manuelalvarez.dev',
    icon: Target,
    color: 'from-[#8b5cf6] to-[#7c3aed]',
    glow: 'shadow-[0_0_30px_rgba(139,92,246,0.3)]',
    category: 'utilities',
    tag: 'SOCIAL AI'
  },
  {
    name: 'LIVEKIT Nikolina',
    desc: 'Asistente de voz en tiempo real con baja latencia para interacciones conversacionales fluidas.',
    tech: 'LiveKit WebRTC, Next.js, Gemini 2.0',
    url: 'https://nikolina.manuelalvarez.dev',
    icon: MessageSquare,
    color: 'from-[#06b6d4] to-[#0891b2]',
    glow: 'shadow-[0_0_30px_rgba(6,182,212,0.3)]',
    category: 'platforms',
    tag: 'VOICE AI'
  },
  {
    name: 'LogiSearch',
    desc: 'Motor de búsqueda interno para la localización rápida de bultos y referencias en almacén.',
    tech: 'React, Tailwind, Supabase',
    url: 'https://logisearch.manuelalvarez.dev',
    icon: Globe,
    color: 'from-[#00E5FF] to-[#00b8cc]',
    glow: 'shadow-[0_0_30px_rgba(0,229,255,0.3)]',
    category: 'industrial',
    tag: 'LOGISTICS'
  },
  {
    name: 'LogiTrack Almacén',
    desc: 'Plataforma de gestión de inventarios y control de stock en tiempo real.',
    tech: 'React, Tailwind, Firebase',
    url: 'https://logitrack.manuelalvarez.dev',
    icon: Box,
    color: 'from-[#0ea5e9] to-[#0284c7]',
    glow: 'shadow-[0_0_30px_rgba(14,165,233,0.3)]',
    category: 'industrial',
    tag: 'LOGISTICS B2B'
  },
  {
    name: 'Mano Eléctrica Azul',
    desc: 'Aplicación nativa móvil (Android/iOS) para la gestión personal de energía.',
    tech: 'React Native, Expo, SQLite',
    url: 'https://mano.manuelalvarez.dev',
    icon: Activity,
    color: 'from-[#10b981] to-[#059669]',
    glow: 'shadow-[0_0_30px_rgba(16,185,129,0.3)]',
    category: 'frontend',
    tag: 'MOBILE APP'
  },
  {
    name: 'Manuel Álvarez',
    desc: 'Portfolio profesional interactivo y currículum vitae.',
    tech: 'React, Tailwind CSS, Framer Motion',
    url: 'https://cv.manuelalvarez.dev',
    icon: Layout,
    color: 'from-[#3b82f6] to-[#2563eb]',
    glow: 'shadow-[0_0_30px_rgba(59,130,246,0.3)]',
    category: 'frontend',
    tag: 'PORTFOLIO'
  },
  {
    name: 'MAPFRE Gestión',
    desc: 'Portal de pruebas de concepto para la automatización y gestión de partes de seguros.',
    tech: 'Next.js 14, Tailwind, Python Backend',
    url: 'https://mapfre.manuelalvarez.dev',
    icon: Shield,
    color: 'from-[#e60028] to-[#b3001f]',
    glow: 'shadow-[0_0_30px_rgba(230,0,40,0.3)]',
    category: 'industrial',
    tag: 'INSURANCE POC'
  },
  {
    name: 'Moko-Tools',
    desc: 'Colección de utilidades web ligeras para el parseo de datos y tareas comunes de desarrollo.',
    tech: 'Vanilla JavaScript, HTML5, CSS3',
    url: 'https://mokotools.manuelalvarez.dev',
    icon: Layout,
    color: 'from-[#14b8a6] to-[#0d9488]',
    glow: 'shadow-[0_0_30px_rgba(20,184,166,0.3)]',
    category: 'utilities',
    tag: 'DEV TOOLS'
  },
  {
    name: 'MSBrOSs Assistant',
    desc: 'Consola técnica y laboratorio de pruebas B2B (BYOK) para inyección de contexto y experimentación con LLMs.',
    tech: 'React, Node.js, Múltiples APIs LLM',
    url: 'https://assistant.manuelalvarez.dev',
    icon: MessageSquare,
    color: 'from-[#a855f7] to-[#9333ea]',
    glow: 'shadow-[0_0_30px_rgba(168,85,247,0.3)]',
    category: 'core',
    tag: 'AI LAB'
  },
  {
    name: 'Perfume Trading',
    desc: 'Prototipo de Marketplace B2B orientado a operaciones comerciales mayoristas de perfumería.',
    tech: 'Next.js 14, Tailwind, Prisma, PostgreSQL',
    url: 'https://perfume.manuelalvarez.dev',
    icon: Box,
    color: 'from-[#f43f5e] to-[#e11d48]',
    glow: 'shadow-[0_0_30px_rgba(244,63,94,0.3)]',
    category: 'platforms',
    tag: 'TRADING B2B'
  },
  {
    name: 'TaskFlowPro',
    desc: 'Aplicación de gestión de tareas con sincronización en tiempo real y arquitectura orientada a eventos.',
    tech: 'React, Tailwind, Firebase Realtime DB',
    url: 'https://taskflow.manuelalvarez.dev',
    icon: Layout,
    color: 'from-[#f59e0b] to-[#d97706]',
    glow: 'shadow-[0_0_30px_rgba(245,158,11,0.3)]',
    category: 'core',
    tag: 'PRODUCTIVITY'
  },
  {
    name: 'Traductor PRO',
    desc: 'Interfaz para traducción neural orientada a mantener formatos y estilos específicos.',
    tech: 'React, Tailwind, DeepL API',
    url: 'https://traductor.manuelalvarez.dev',
    icon: Globe,
    color: 'from-[#10b981] to-[#059669]',
    glow: 'shadow-[0_0_30px_rgba(16,185,129,0.3)]',
    category: 'utilities',
    tag: 'TRANSLATION'
  },
  {
    name: 'Tu Energía Maya',
    desc: 'Herramienta interactiva para calcular kines y sincronarios del calendario maya Tzolkin.',
    tech: 'React, Vite, CSS Modules',
    url: 'https://manu-alvarez.github.io/TuEnergiaMaya/',
    icon: Sparkles,
    color: 'from-[#f59e0b] to-[#d97706]',
    glow: 'shadow-[0_0_30px_rgba(245,158,11,0.3)]',
    category: 'frontend',
    tag: 'WEB APP'
  },
  {
    name: 'TxaFitnessPro',
    desc: 'Aplicación SaaS para monitorizar entrenamientos, dietas y progresión física.',
    tech: 'Next.js 15, Tailwind, Prisma, PostgreSQL',
    url: 'https://txafitness.manuelalvarez.dev',
    icon: Heart,
    color: 'from-[#a855f7] to-[#9333ea]',
    glow: 'shadow-[0_0_30px_rgba(168,85,247,0.3)]',
    category: 'platforms',
    tag: 'FITNESS SAAS'
  },
  {
    name: 'Web Atenea',
    desc: 'Página estática informativa (Landing Page) diseñada para un negocio local de restauración.',
    tech: 'HTML5, CSS3, JavaScript',
    url: 'https://atenea.manuelalvarez.dev',
    icon: Layout,
    color: 'from-[#c4b5fd] to-[#a78bfa]',
    glow: 'shadow-[0_0_30px_rgba(196,181,253,0.3)]',
    category: 'frontend',
    tag: 'GASTRONOMY'
  }
];
