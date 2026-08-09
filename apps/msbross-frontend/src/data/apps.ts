import { Rocket, Box, Globe, Shield, Activity, Target, Layout, MessageSquare, Heart, Sparkles } from 'lucide-react';

export const APPS_DATA = [
  {
    name: 'App Generator',
    desc: 'Generador de UI estáticas (HTML/JS/CSS) a partir de prompts de texto. Interfaz para visualizar y descargar el código fuente generado por IA.',
    tech: 'React 19, Vite, Gemini Pro API',
    url: 'https://appgen.manuelalvarez.dev',
    icon: Activity,
    color: 'from-[#f472b6] to-[#ec4899]',
    glow: 'shadow-[0_0_30px_rgba(244,114,182,0.3)]',
    category: 'utilities',
    tag: 'DEV AI'
  },
  {
    name: 'CombiPro',
    desc: 'Calculadora de probabilidades simples para combinadas deportivas. Permite simular retornos basados en cuotas introducidas manualmente.',
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
    desc: 'Generador de relatos infantiles parametrizados. Permite configurar personajes y temáticas, utilizando LLMs para la redacción del texto.',
    tech: 'React, FastAPI, Celery, PostgreSQL, OpenAI API',
    url: 'https://cuentos.manuelalvarez.dev',
    icon: Sparkles,
    color: 'from-[#fbbf24] to-[#f59e0b]',
    glow: 'shadow-[0_0_30px_rgba(251,191,36,0.3)]',
    category: 'core',
    tag: 'CREATIVE AI'
  },
  {
    name: 'Edelweiss',
    desc: 'Panel de administración y sistema de reservas para refugios de montaña. Gestiona pernoctaciones, ocupación y servicios básicos.',
    tech: 'Next.js 14, Tailwind CSS, Prisma, PostgreSQL',
    url: 'https://edelweiss.manuelalvarez.dev',
    icon: Globe,
    color: 'from-[#ec4899] to-[#db2777]',
    glow: 'shadow-[0_0_30px_rgba(236,72,153,0.3)]',
    category: 'frontend',
    tag: 'MANAGEMENT B2B'
  },
  {
    name: 'EliteScout',
    desc: 'Herramienta de búsqueda en internet mediante agentes (Tavily). Agrupa y filtra resultados estructurados de viajes y productos.',
    tech: 'Next.js 14, Node.js, PostgreSQL, Tavily AI',
    url: 'https://elitescout.manuelalvarez.dev',
    icon: Globe,
    color: 'from-[#D4AF37] to-[#b4952f]',
    glow: 'shadow-[0_0_30px_rgba(212,175,55,0.3)]',
    category: 'platforms',
    tag: 'SEARCH AI'
  },
  {
    name: 'EXPOSITATOR RTE',
    desc: 'PWA para transcripción de voz a texto en el navegador (Web Speech API). Evalúa duración y pausas de exposiciones orales.',
    tech: 'React PWA, Vanilla JS Speech Recognition, Tailwind',
    url: 'https://expositator.manuelalvarez.dev',
    icon: Target,
    color: 'from-[#10b981] to-[#059669]',
    glow: 'shadow-[0_0_30px_rgba(16,185,129,0.3)]',
    category: 'utilities',
    tag: 'EVALUATOR'
  },
  {
    name: 'Gas Station',
    desc: 'Cuaderno de bitácora digital (PWA) para registrar incidencias y tareas rutinarias en estaciones de servicio.',
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
    desc: 'Suite de productividad y gestión documental empresarial (B2B). Orquesta flujos de trabajo generativos para empresas (Enterprise Core).',
    tech: 'React, Vite, FastAPI, Python, Ollama LLMs',
    url: 'https://iaprod.manuelalvarez.dev',
    icon: Shield,
    color: 'from-[#8b5cf6] to-[#7c3aed]',
    glow: 'shadow-[0_0_30px_rgba(139,92,246,0.3)]',
    category: 'platforms',
    tag: 'ENTERPRISE AI'
  },
  {
    name: 'IndustrialPro',
    desc: 'Dashboard CRUD para registro de mantenimientos de maquinaria y control de partes de producción.',
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
    desc: 'Aplicación de práctica de inglés conversacional con foco en vocabulario tecnológico mediante voz y texto.',
    tech: 'React, Tailwind, Express, OpenAI Whisper & TTS',
    url: 'https://itenglish.manuelalvarez.dev',
    icon: MessageSquare,
    color: 'from-[#00FFCC] to-[#00cca3]',
    glow: 'shadow-[0_0_30px_rgba(0,255,204,0.3)]',
    category: 'utilities',
    tag: 'LANGUAGE AI'
  },
  {
    name: 'JartosDTo',
    desc: 'Chatbot conversacional de ocio (B2C) con personalidad irónica. Playground accesible para usuarios finales sin configuración técnica.',
    tech: 'Next.js 14, Tailwind, Ollama, Tailscale',
    url: 'https://jartosdto.manuelalvarez.dev',
    icon: Target,
    color: 'from-[#8b5cf6] to-[#7c3aed]',
    glow: 'shadow-[0_0_30px_rgba(139,92,246,0.3)]',
    category: 'utilities',
    tag: 'SOCIAL AI'
  },
  {
    name: 'LIVEKIT Nikolina',
    desc: 'Prueba de concepto de agente de voz WebRTC para reservas de restaurante. Latencia baja con pipeline modular.',
    tech: 'LiveKit Agents, Google STT/TTS, Gemini 2.0 Flash',
    url: 'https://nikolina.manuelalvarez.dev',
    icon: MessageSquare,
    color: 'from-[#06b6d4] to-[#0891b2]',
    glow: 'shadow-[0_0_30px_rgba(6,182,212,0.3)]',
    category: 'platforms',
    tag: 'VOICE WEBRTC'
  },
  {
    name: 'LogiSearch',
    desc: 'Buscador de referencias de almacén con interfaz optimizada para lectura rápida y filtros básicos.',
    tech: 'React, Tailwind, Supabase (PostgREST)',
    url: 'https://logisearch.manuelalvarez.dev',
    icon: Globe,
    color: 'from-[#00E5FF] to-[#00b8cc]',
    glow: 'shadow-[0_0_30px_rgba(0,229,255,0.3)]',
    category: 'industrial',
    tag: 'LOGISTICS'
  },
  {
    name: 'LogiTrack Almacén',
    desc: 'Aplicación de gestión de inventarios para registrar entradas, salidas y visualizar el stock disponible.',
    tech: 'React, Tailwind, Firebase Auth & Firestore',
    url: 'https://logitrack.manuelalvarez.dev',
    icon: Box,
    color: 'from-[#0ea5e9] to-[#0284c7]',
    glow: 'shadow-[0_0_30px_rgba(14,165,233,0.3)]',
    category: 'industrial',
    tag: 'LOGISTICS B2B'
  },
  {
    name: 'Mano Eléctrica Azul',
    desc: 'App móvil (iOS/Android) para control de rutinas de consumo energético. Guarda el progreso en el dispositivo.',
    tech: 'React Native, Expo, SQLite local',
    url: 'https://mano.manuelalvarez.dev',
    icon: Activity,
    color: 'from-[#10b981] to-[#059669]',
    glow: 'shadow-[0_0_30px_rgba(16,185,129,0.3)]',
    category: 'frontend',
    tag: 'MOBILE APP'
  },
  {
    name: 'Manuel Álvarez',
    desc: 'Portfolio web estático y currículum vitae interactivo.',
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
    desc: 'Prototipo UI (PoC) para visualización y clasificación de siniestros. (Datos simulados, sin integración con la aseguradora).',
    tech: 'Next.js 14, Tailwind, Python Backend Mocks',
    url: 'https://mapfre.manuelalvarez.dev',
    icon: Shield,
    color: 'from-[#e60028] to-[#b3001f]',
    glow: 'shadow-[0_0_30px_rgba(230,0,40,0.3)]',
    category: 'industrial',
    tag: 'INSURANCE POC'
  },
  {
    name: 'Moko-Tools',
    desc: 'Herramientas de cliente para parseo rápido de JSON, codificación Base64 y transformaciones de texto en local.',
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
    desc: 'Laboratorio de pruebas (BYOK) para inyectar system prompts y testear modelos. Interfaz de administración técnica (C2 Admin) con GodMode.',
    tech: 'React, Node.js, FastAPI, Multi-LLM API',
    url: 'https://assistant.manuelalvarez.dev',
    icon: MessageSquare,
    color: 'from-[#a855f7] to-[#9333ea]',
    glow: 'shadow-[0_0_30px_rgba(168,85,247,0.3)]',
    category: 'core',
    tag: 'AI LAB ADMIN'
  },
  {
    name: 'Perfume Trading',
    desc: 'Panel de control B2B para listar lotes de perfumería al por mayor. Catálogo privado para mayoristas.',
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
    desc: 'Gestor Kanban de tareas personales con persistencia en la nube.',
    tech: 'React, Tailwind, Firebase Realtime Database',
    url: 'https://taskflow.manuelalvarez.dev',
    icon: Layout,
    color: 'from-[#f59e0b] to-[#d97706]',
    glow: 'shadow-[0_0_30px_rgba(245,158,11,0.3)]',
    category: 'core',
    tag: 'PRODUCTIVITY'
  },
  {
    name: 'Traductor PRO',
    desc: 'Interfaz minimalista que conecta con la API de DeepL para traducciones de bloques de texto.',
    tech: 'React, Tailwind, DeepL API REST',
    url: 'https://traductor.manuelalvarez.dev',
    icon: Globe,
    color: 'from-[#10b981] to-[#059669]',
    glow: 'shadow-[0_0_30px_rgba(16,185,129,0.3)]',
    category: 'utilities',
    tag: 'TRANSLATION'
  },
  {
    name: 'Tu Energía Maya',
    desc: 'Calculadora de fechas según el Sincronario Maya Tzolkin (Kines, Tonos, Sellos). Proyecto estático frontend.',
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
    desc: 'Diario de entrenamiento para registrar ejercicios, series, repeticiones y medidas corporales.',
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
    desc: 'Página web estática (Landing Page) para promocionar la carta y ubicación de un restaurante.',
    tech: 'HTML5, CSS3, Vanilla JavaScript',
    url: 'https://atenea.manuelalvarez.dev',
    icon: Layout,
    color: 'from-[#c4b5fd] to-[#a78bfa]',
    glow: 'shadow-[0_0_30px_rgba(196,181,253,0.3)]',
    category: 'frontend',
    tag: 'GASTRONOMY'
  }
];

