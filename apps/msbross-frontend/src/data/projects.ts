/**
 * FUENTE ÚNICA DE PROYECTOS (Misión de cierre de manuelalvarez.dev).
 * Portada, tarjetas, filtros y catálogo consumen ESTE fichero — no duplicar
 * datos en componentes.
 *
 * Reglas de honestidad:
 * · status 'live' SOLO con URL verificada en producción.
 * · sin demo pública → 'development' / 'experimental' (repo únicamente).
 * · nada se presenta como publicado si solo existe código o un borrador.
 */

export type ProjectStatus = 'live' | 'development' | 'experimental';

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  live: 'En producción',
  development: 'En desarrollo',
  experimental: 'Experimento',
};

export interface Project {
  id: string;
  name: string;
  subtitle: string;
  /** Qué es y para quién. */
  description: string;
  /** Problema que resuelve / finalidad. */
  problem?: string;
  category: 'platforms' | 'apps' | 'tools' | 'experiments';
  iconBg: string;
  iconSvg: string;
  tech: string[];
  /** URL SOLO si el despliegue está verificado. */
  url?: string;
  github?: string;
  download?: string;
  status: ProjectStatus;
  featured: boolean;
  features?: string[];
  architecture?: string;
}

export const CATEGORIES = [
  { id: 'platforms', label: 'Plataformas e IA' },
  { id: 'apps', label: 'Aplicaciones y productos' },
  { id: 'tools', label: 'Herramientas y utilidades' },
  { id: 'experiments', label: 'Experimentos e investigación' },
] as const;

export const ALL_PROJECTS: Project[] = [
  /* ── Plataformas e ingeniería IA ───────────────────────────────────────── */

  {
    id: 'uiep',
    name: 'UIEP',
    subtitle: 'Universal Intelligent Engineering Platform · v1.8.0',
    description:
      'Plataforma de ingeniería para diseñar, generar, componer, validar, ejecutar y administrar sistemas y soluciones agentic. Release estable en producción.',
    problem:
      'Centraliza el ciclo completo de ingeniería de agentes (especificación → generación → composición → ejecución aislada → evaluación → despliegue controlado) en un único Control Center con trazabilidad completa.',
    category: 'platforms',
    iconBg: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>`,
    tech: ['React 19', 'Material UI', 'Express', 'TypeScript', 'Node.js', 'Docker', 'Zod', 'Ollama'],
    url: 'https://uiep.manuelalvarez.dev/app/uiep/',
    github: 'https://github.com/manu-alvarez/SERVER-DEV',
    status: 'live',
    featured: true,
    features: [
      '17 generadores deterministas de artefactos (agentes, workflows, APIs, aplicaciones, sistemas agénticos, SaaS…) con validación zod y upserts id@version',
      'Composición de proyectos UES con orden topológico, tokens $ref y rollback lógico',
      'Sandbox de ejecución aislado (contenedor read-only, sin red externa, límites de CPU/RAM/procesos y cancelación real)',
      'Quality Engine en 4 dimensiones (schema, referencias, seguridad, comportamiento) y export uiep-export-v1 (JSON + ZIP reinstalable)',
      'Control Center con 9 módulos operativos y ejecuciones reconciliadas automáticamente',
    ],
    architecture:
      'Monorepo pnpm/Turbo (backend Express + React 19/MUI + paquete de schemas @uiep/agent-spec) servido en contenedores Docker: backend + sandbox aislado (red interna sin salida), tras Traefik con cookie de sesión y CSRF.',
  },

  {
    id: 'nikolina-ai',
    name: 'Nikolina AI',
    subtitle: 'Agente de Voz en Tiempo Real',
    description:
      'Asistente de voz para atención telefónica automatizada con LiveKit WebRTC, transcripción y síntesis neuronal.',
    problem:
      'Atiende llamadas y reservas sin dejar llamadas perdidas: responde, clasifica la intención y registra la conversación.',
    category: 'platforms',
    iconBg: 'linear-gradient(135deg, #10B981, #06B6D4)',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>`,
    tech: ['LiveKit', 'WebRTC', 'Python', 'FastAPI', 'STT/TTS'],
    url: 'https://nikolina.manuelalvarez.dev',
    github: 'https://github.com/manu-alvarez/LIVEKIT',
    status: 'live',
    featured: true,
    features: [
      'Conversación por voz en tiempo real sobre WebRTC',
      'Transcripción y síntesis de voz neuronales',
      'Panel de administración de sesiones y conversaciones',
    ],
  },

  {
    id: 'mcp-agent-memory',
    name: 'MCP Agent Memory',
    subtitle: 'Servidor MCP de memoria jerárquica para agentes',
    description:
      'Servidor MCP (Model Context Protocol) de memoria persistente multi-agente con 54 herramientas: capas de consolidación, búsqueda FTS y vault.',
    problem:
      'Los agentes LLM olvidan entre sesiones; este servidor MCP les da memoria persistente organizada y consultable.',
    category: 'platforms',
    iconBg: 'linear-gradient(135deg, #38BDF8, #6366F1)',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 12 22 2"/><path d="M16 2h6v6"/></svg>`,
    tech: ['TypeScript', 'MCP', 'SQLite', 'FTS5'],
    github: 'https://github.com/manu-alvarez/MCP-agent-memory',
    status: 'development',
    featured: false,
    features: [
      '54 herramientas MCP (memoria L0–L5, deliberativa y vault)',
      'Consolidación automática en background y búsqueda léxica bm25',
      'Aislamiento por agente y sidecar REST para hooks',
    ],
  },

  {
    id: 'skill-forge',
    name: 'Skill Forge',
    subtitle: 'Forge de Agent Skills y MCP servers',
    description:
      'Generador con validación para Agent Skills (agentskills.io) y servidores MCP, pensado para crear paquetes reutilizables de capacidades.',
    problem:
      'Crear skills y MCP servers a mano es repetitivo y propenso a errores de contrato; el forge los genera validados.',
    category: 'platforms',
    iconBg: 'linear-gradient(135deg, #F59E0B, #EF4444)',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m14.5 17.5 3-3L21 18l-9 4-9-4 3.5-3.5"/><path d="m5 14 7-14 7 14"/></svg>`,
    tech: ['TypeScript', 'MCP', 'Zod'],
    github: 'https://github.com/manu-alvarez/SKILL-skill-forge',
    status: 'development',
    featured: false,
    features: [
      'Generación validada de skills con contratos de E/S',
      'Plantillas de MCP servers listas para publicar',
      'Verificación automática de estructura y metadatos',
    ],
  },

  {
    id: 'iaprod-os',
    name: 'IA Prod OS',
    subtitle: 'Productividad & automatización documental',
    description:
      'Suite de procesamiento inteligente de documentos por lotes con modelos de lenguaje de baja latencia (Groq / Gemini / Ollama).',
    problem:
      'Automatiza el análisis de contratos y PDFs que se revisan a mano: extracción de acciones, informes estructurados y métricas.',
    category: 'platforms',
    iconBg: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 7h10"/><path d="M7 12h10"/><path d="M7 17h10"/></svg>`,
    tech: ['React', 'FastAPI', 'Groq', 'Google GenAI', 'Python'],
    github: 'https://github.com/manu-alvarez/iaprod-os',
    status: 'development',
    featured: false,
    features: [
      'Procesamiento por lotes de PDF y contratos',
      'Rotación multimodelo de proveedores (Groq / Gemini / Ollama)',
      'Generación de informes descargables y panel de métricas',
    ],
    architecture: 'Backend FastAPI (puerto 8006) + frontend React — despliegue interno (sin demo pública).',
  },

  /* ── Aplicaciones y productos ─────────────────────────────────────────── */

  {
    id: 'foz-soundpro',
    name: 'FoZ SoundPro',
    subtitle: 'Beatmaker AI Studio · v1.2',
    description:
      'Aplicación musical PWA con secuenciador de ritmos, producción y exportación WAV/MIDI, más herramientas de asistencia IA.',
    problem:
      'Permite producir bases rítmicas completas desde el navegador sin software de pago, con export a formatos estándar.',
    category: 'apps',
    iconBg: 'linear-gradient(135deg, #F472B6, #8B5CF6)',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
    tech: ['React', 'Web Audio API', 'PWA', 'TypeScript'],
    url: 'https://foz.manuelalvarez.dev',
    github: 'https://github.com/manu-alvarez/FoZ-SoundPro',
    status: 'live',
    featured: true,
    features: [
      'Secuenciador de beats multi-pista en el navegador',
      'Exportación WAV y MIDI de las producciones',
      'Herramientas de asistencia IA para patrones',
      'PWA instalable con audio en tiempo real',
    ],
  },

  {
    id: 'cuentos-magicos',
    name: 'Cuentos Mágicos',
    subtitle: 'Cuentos infantiles generados con IA',
    description:
      'Plataforma para crear historias infantiles personalizadas con narrativa generativa, ilustraciones y lectura por voz.',
    problem:
      'Genera cuentos a medida (protagonistas, valores, temática) listos para leer o escuchar, en minutos.',
    category: 'apps',
    iconBg: 'linear-gradient(135deg, #EC4899, #8B5CF6)',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10"/><path d="M6 10h10"/></svg>`,
    tech: ['Next.js', 'FastAPI', 'TTS', 'Difusión de imágenes'],
    url: 'https://cuentos.manuelalvarez.dev',
    status: 'live',
    featured: true,
    features: [
      'Cuentos personalizados por protagonistas, valores y temática',
      'Ilustraciones generadas para portada e interiores',
      'Lectura guiada por voz con reproductor interactivo',
    ],
  },

  {
    id: 'gas-station',
    name: 'Gas Station',
    subtitle: 'Precios de combustible en tiempo real',
    description:
      'Comparador de estaciones de servicio de España con mapa, geolocalización y cálculo de ahorro por depósito.',
    problem:
      'Encuentra la gasolinera más barata cerca de ti con datos oficiales del Ministerio, filtrando por producto y distancia.',
    category: 'apps',
    iconBg: 'linear-gradient(135deg, #F59E0B, #EF4444)',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 22h12"/><path d="M4 9h10"/><path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18"/><path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5"/></svg>`,
    tech: ['React', 'Node.js', 'Leaflet', 'APIs oficiales'],
    url: 'https://gasstation.manuelalvarez.dev',
    status: 'live',
    featured: true,
    features: [
      'Precios actualizados por hora (Gasolina 95/98, Diésel, GLP)',
      'Mapa interactivo con filtros de distancia y precio',
      'Cálculo del coste de llenado por modelo de vehículo',
    ],
  },

  {
    id: 'logisearch',
    name: 'LogiSearch',
    subtitle: 'Búsqueda logística inteligente',
    description:
      'Motor de búsqueda de referencias logísticas con cálculo de cubicaje y albaranes PDF para terminales de almacén.',
    problem:
      'Agiliza el trabajo diario de almacén: localizar referencias y ubicaciones sin hojas de cálculo ni papeleo.',
    category: 'apps',
    iconBg: 'linear-gradient(135deg, #06B6D4, #3B82F6)',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M11 8v6"/><path d="M8 11h6"/></svg>`,
    tech: ['React', 'TypeScript', 'Material UI', 'jsPDF'],
    url: 'https://logisearch.manuelalvarez.dev',
    github: 'https://github.com/manu-alvarez/LogiSearch',
    status: 'live',
    featured: true,
    features: [
      'Búsqueda rápida de SKU, referencias y ubicaciones',
      'Calculadora de cubicaje y optimización de carga',
      'Albaranes de salida en PDF con formato oficial',
      'Alto contraste para tablets industriales',
    ],
  },

  {
    id: 'combipro',
    name: 'CombiPro',
    subtitle: 'Análisis de cuotas deportivas',
    description:
      'Análisis de probabilidades y arbitraje de cuotas en tiempo real conectado con TheOdds API.',
    problem:
      'Identifica apuestas de valor y combinadas equilibradas calculando márgenes reales entre casas de apuestas.',
    category: 'apps',
    iconBg: 'linear-gradient(135deg, #10B981, #06B6D4)',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>`,
    tech: ['React', 'TypeScript', 'TheOdds API'],
    url: 'https://combipro.manuelalvarez.dev',
    status: 'live',
    featured: false,
    features: [
      'Monitorización de cuotas en tiempo real',
      'Cálculo de arbitraje (surebets) con filtro de rentabilidad',
      'Generador asistido de combinadas con análisis de riesgo',
    ],
  },

  {
    id: 'tarot-rws',
    name: 'Tarot RWS',
    subtitle: 'Manual interactivo Rider-Waite-Smith',
    description:
      'Aplicación de tiradas y estudio simbólico de las 78 cartas Rider-Waite-Smith con significados y diseño inmersivo.',
    problem:
      'Un manual interactivo para aprender y practicar el tarot RWS con tiradas guiadas, en lugar de buscar en libros.',
    category: 'apps',
    iconBg: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="20" x="5" y="2" rx="2"/><path d="M12 6v4"/><path d="M10 8h4"/><circle cx="12" cy="15" r="2"/></svg>`,
    tech: ['React', 'TypeScript', 'Canvas', 'Framer Motion'],
    url: 'https://tarot.manuelalvarez.dev',
    status: 'live',
    featured: false,
    features: [
      'Las 78 cartas (Arcanos Mayores y Menores) en alta definición',
      'Tiradas guiadas: Carta del Día, Pasado-Presente-Futuro y Cruz Celta',
      'Interpretación de polaridades (derecha/invertida)',
    ],
  },

  {
    id: 'teringo-cockpit',
    name: 'Teringo Neural Cockpit',
    subtitle: 'Gestión inteligente de correspondencia',
    description:
      'Clasificación automática de comunicaciones por intención (soporte, presupuestos, urgencias) con borradores y acciones extraídas.',
    problem:
      'Convierte el buzón compartido de una empresa en acciones: clasifica, extrae citas y propone respuestas.',
    category: 'apps',
    iconBg: 'linear-gradient(135deg, #0EA5E9, #3B82F6)',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10H12z"/><path d="M12 12 2 12a10 10 0 0 1 10-10z"/></svg>`,
    tech: ['React', 'NLP', 'FastAPI'],
    url: 'https://teringo.manuelalvarez.dev',
    status: 'live',
    featured: false,
    features: [
      'Clasificación por intención (soporte, presupuestos, urgencias, spam)',
      'Extracción de acciones y citas a calendario',
      'Borradores con tono y contexto corporativo',
    ],
  },

  {
    id: 'calendario-maya-app',
    name: 'Calendario Maya',
    subtitle: 'Mano Eléctrica Azul · Expo / React Native',
    description:
      'Aplicación móvil del calendario maya desarrollada con Expo/React Native: Kines natales, sellos y tonos con diseño nativo.',
    problem:
      'Lleva el cálculo del Kin natal y el oráculo maya al móvil, sin depender de webs.',
    category: 'apps',
    iconBg: 'linear-gradient(135deg, #F59E0B, #84CC16)',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/><path d="M9 6h6"/><path d="M8 10h8"/><path d="M8 14h8"/></svg>`,
    tech: ['Expo', 'React Native', 'TypeScript'],
    github: 'https://github.com/manu-alvarez/CalendarioMaya-ManoElectricaAzul',
    download: 'https://github.com/manu-alvarez/CalendarioMaya-ManoElectricaAzul/tree/main/APKs',
    status: 'experimental',
    featured: false,
    features: [
      'Cálculo de Kin natal y Firma Galáctica',
      'Sellos solares y tonos con arquetipos',
      'APK v1.0.1 distribuida desde el repositorio (sin tienda)',
    ],
  },

  {
    id: 'taskflow-pro',
    name: 'TaskFlow Pro',
    subtitle: 'Gestión de tareas premium',
    description:
      'Aplicación de gestión de tareas con proyectos, etiquetas, prioridades y vista de productividad.',
    problem:
      'Organización de trabajo personal y de equipo con estructura de proyectos y seguimiento de progreso.',
    category: 'apps',
    iconBg: 'linear-gradient(135deg, #22D3EE, #6366F1)',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/><path d="m9 16 2 2 4-4"/></svg>`,
    tech: ['React', 'TypeScript'],
    github: 'https://github.com/manu-alvarez/TaskFlowPro',
    status: 'development',
    featured: false,
    features: [
      'Proyectos, etiquetas y prioridades',
      'Vista de productividad y progreso',
      'Interfaz premium con tema oscuro',
    ],
  },

  /* ── Herramientas y utilidades ────────────────────────────────────────── */

  {
    id: 'tu-energia-maya',
    name: 'Tu Energía Maya',
    subtitle: 'Sincronario & Tarot Tzolk\'in (PWA)',
    description:
      'Calculadora del calendario maya Tzolk\'in: Kin natal, 20 sellos solares, 13 tonos, oráculo y compatibilidad energética. PWA instalable.',
    problem:
      'Consulta diaria de la energía maya con cálculo exacto y audio ceremonial, desde cualquier dispositivo.',
    category: 'tools',
    iconBg: 'linear-gradient(135deg, #F59E0B, #EF4444)',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a7 7 0 1 0 10 10"/><circle cx="12" cy="12" r="4"/><path d="m15 9-3 3"/></svg>`,
    tech: ['React', 'JavaScript', 'Web Audio API', 'PWA'],
    url: 'https://manu-alvarez.github.io/TuEnergiaMaya/',
    github: 'https://github.com/manu-alvarez/TuEnergiaMaya',
    status: 'live',
    featured: true,
    features: [
      'Cálculo exacto de Firma Galáctica y Kin natal',
      '20 sellos y 13 tonos con arquetipos detallados',
      'Tarot Tzolk\'in con Cruz Maya y Onda Encantada',
      'Sintetizador ceremonial con Web Audio API',
    ],
  },

  {
    id: 'logitrack',
    name: 'LogiTrack',
    subtitle: 'Gestión de salidas de almacén',
    description:
      'Sistema de gestión de almacén para optimizar la preparación y salida de pedidos.',
    problem:
      'Control de pedidos y rutas de carga para reducir errores en la salida de mercancía.',
    category: 'tools',
    iconBg: 'linear-gradient(135deg, #64748B, #0EA5E9)',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5"/><path d="M14 17h1"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>`,
    tech: ['React', 'Node.js'],
    github: 'https://github.com/manu-alvarez/LogiTrack-Warehouse-System',
    status: 'development',
    featured: false,
    features: [
      'Gestión de pedidos y preparación de rutas',
      'Control de cargas y salidas',
      'Interfaz táctil para almacén',
    ],
  },

  {
    id: 'nexusflow',
    name: 'NexusFlow',
    subtitle: 'Framework de gestión operativa ágil',
    description:
      'Sistema de gestión operativa basado en metodología ágil: tableros, flujos y métricas de equipo.',
    problem:
      'Estructura el trabajo operativo de equipos pequeños sin la complejidad de suites enterprise.',
    category: 'tools',
    iconBg: 'linear-gradient(135deg, #8B5CF6, #06B6D4)',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="5" cy="6" r="3"/><path d="M5 9v6"/><circle cx="5" cy="18" r="3"/><path d="M12 3h10"/><path d="M12 9h10"/><path d="M12 15h10"/><path d="M12 21h10"/></svg>`,
    tech: ['React', 'TypeScript'],
    github: 'https://github.com/manu-alvarez/NexusFlow-Framework',
    status: 'development',
    featured: false,
    features: [
      'Tableros y flujos de trabajo ágiles',
      'Métricas de carga y progreso',
      'Metodología documentada',
    ],
  },

  {
    id: 'web-atenea',
    name: 'Atenea',
    subtitle: 'Web de restaurante',
    description:
      'Sitio web para restaurante con carta, presentación y contacto.',
    problem:
      'Presencia web sencilla y rápida para restauración local.',
    category: 'tools',
    iconBg: 'linear-gradient(135deg, #F97316, #EF4444)',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7a3 3 0 0 0 6 0V2"/><path d="M6 2v20"/><path d="M18 2v8a3 3 0 0 1-3 3v9"/><path d="M15 2v8"/></svg>`,
    tech: ['React', 'Tailwind'],
    github: 'https://github.com/manu-alvarez/web-restaurante-atenea',
    status: 'development',
    featured: false,
    features: ['Carta digital', 'Presentación del negocio', 'Contacto'],
  },

  {
    id: 'traductor-pro',
    name: 'Traductor Pro',
    subtitle: 'Traducción asistida',
    description:
      'Servicio de traducción asistida por modelos con backend dedicado.',
    problem:
      'Traducciones con contexto y tono controlado, más allá del traductor genérico.',
    category: 'tools',
    iconBg: 'linear-gradient(135deg, #34D399, #3B82F6)',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/></svg>`,
    tech: ['Python', 'FastAPI', 'LLM'],
    github: 'https://github.com/manu-alvarez/msb-traductor-backend',
    status: 'development',
    featured: false,
    features: ['Traducción con contexto', 'Backend dedicado con API'],
  },

  /* ── Experimentos e investigación ─────────────────────────────────────── */

  {
    id: 'dream-os',
    name: 'DreamOS',
    subtitle: 'Laboratorio de exploración onírica (PWA)',
    description:
      'PWA personal para registrar e investigar sueños: diario, patrones y etiquetado.',
    problem:
      'Estructura el registro de sueños para poder analizar patrones a lo largo del tiempo.',
    category: 'experiments',
    iconBg: 'linear-gradient(135deg, #A78BFA, #22D3EE)',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.985 11.486a8.5 8.5 0 1 1-4.473-8.47 2 2 0 0 1 .496 3.46 6.5 6.5 0 1 0 3.977 5.01Z"/></svg>`,
    tech: ['PWA', 'JavaScript', 'IndexedDB'],
    github: 'https://github.com/manu-alvarez/Dream_OS',
    status: 'experimental',
    featured: false,
    features: ['Diario de sueños con etiquetas', 'Búsqueda de patrones', 'PWA offline'],
  },

  {
    id: 'mequi3d',
    name: 'Mequi3D',
    subtitle: 'Visor 3D del castillo de Mequinenza',
    description:
      'Visor interactivo del castillo medieval de Mequinenza con WebGL.',
    problem:
      'Divulga patrimonio histórico con un recorrido 3D accesible desde el navegador.',
    category: 'experiments',
    iconBg: 'linear-gradient(135deg, #94A3B8, #6366F1)',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>`,
    tech: ['Three.js', 'WebGL', 'JavaScript'],
    github: 'https://github.com/manu-alvarez/Mequi3D',
    status: 'experimental',
    featured: false,
    features: ['Recorrido 3D interactivo', 'Modelado histórico del castillo'],
  },

  {
    id: 'infocool',
    name: 'InfoCool',
    subtitle: 'Automatización de partes (MAPFRE InfoCol)',
    description:
      'Automatización inteligente de partes de trabajo con IA para flujos internos de documentación.',
    problem:
      'Reduce el tiempo de rellenado y revisión de partes informatizados mediante procesamiento con IA.',
    category: 'experiments',
    iconBg: 'linear-gradient(135deg, #2563EB, #7C3AED)',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>`,
    tech: ['Python', 'IA', 'Automatización'],
    github: 'https://github.com/manu-alvarez/InfoCool',
    status: 'experimental',
    featured: false,
    features: ['Procesamiento de partes con IA', 'Validación de campos automática'],
  },

  {
    id: 'msb-dashboard',
    name: 'MSB Mission Control',
    subtitle: 'Panel de control del ecosistema',
    description:
      'Panel interno de control y catálogo centralizado del ecosistema de aplicaciones MSB.',
    problem:
      'Visión única del estado y catálogo de todos los servicios propios.',
    category: 'experiments',
    iconBg: 'linear-gradient(135deg, #0F172A, #334155)',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`,
    tech: ['React', 'Node.js'],
    github: 'https://github.com/manu-alvarez/MSB',
    status: 'experimental',
    featured: false,
    features: ['Catálogo centralizado de apps', 'Estado de servicios'],
  },
];

/** Portada: destacados (un único conjunto; el catálogo completo vive en /apps). */
export const FEATURED_PROJECTS: Project[] = ALL_PROJECTS.filter((p) => p.featured);

/** Compat: el resto del catálogo (la portada ya no lo muestra completo). */
export const OTHER_PROJECTS: Project[] = ALL_PROJECTS.filter((p) => !p.featured);

/** 12 tecnologías verificadas del perfil (SMR + Full-Stack IA). */
export const TECHNOLOGIES: Array<{ name: string; category: string; svg: string }> = [
  { name: 'Linux (Ubuntu)', category: 'Sistemas', svg: '<svg viewBox="0 0 24 24" fill="#E95420"><circle cx="12" cy="12" r="10"/><path d="M12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12z" fill="#060B18"/></svg>' },
  { name: 'Sistemas Windows', category: 'Sistemas', svg: '<svg viewBox="0 0 24 24" fill="#0078D6"><path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/></svg>' },
  { name: 'Redes (Cisco CCST)', category: 'Redes', svg: '<svg viewBox="0 0 24 24" fill="#049FD9"><path d="M12 3a9 9 0 0 0-9 9v3a3 3 0 0 0 3 3h2v-6H5v-2a7 7 0 0 1 14 0v2h-3v6h2a3 3 0 0 0 3-3v-3a9 9 0 0 0-9-9z"/><circle cx="12" cy="14" r="2"/></svg>' },
  { name: 'Docker', category: 'DevOps', svg: '<svg viewBox="0 0 24 24" fill="#2496ED"><path d="M13.983 11.078h2.119a.186.186 0 0 0 .186-.185V9.006a.186.186 0 0 0-.186-.186h-2.119a.185.185 0 0 0-.185.185v1.888c0 .102.083.185.185.185m-2.954-5.43h2.118a.186.186 0 0 0 .186-.186V3.574a.186.186 0 0 0-.186-.185h-2.118a.185.185 0 0 0-.185.185v1.888c0 .102.082.185.185.186m0 2.716h2.118a.187.187 0 0 0 .186-.186V6.29a.186.186 0 0 0-.186-.185h-2.118a.185.185 0 0 0-.185.185v1.887c0 .102.082.185.185.186m-2.93 0h2.12a.186.186 0 0 0 .184-.186V6.29a.185.185 0 0 0-.185-.185H8.1a.185.185 0 0 0-.185.185v1.887c0 .102.083.185.185.186m-2.964 0h2.119a.186.186 0 0 0 .185-.186V6.29a.185.185 0 0 0-.185-.185H5.136a.186.186 0 0 0-.186.185v1.887c0 .102.084.185.186.186m5.893 2.715h2.118a.186.186 0 0 0 .186-.185V9.006a.186.186 0 0 0-.186-.186h-2.118a.185.185 0 0 0-.185.185v1.888c0 .102.082.185.185.185m-2.93 0h2.12a.185.185 0 0 0 .184-.185V9.006a.185.185 0 0 0-.184-.186h-2.12a.185.185 0 0 0-.184.185v1.888c0 .102.083.185.185.185m-2.964 0h2.119a.185.185 0 0 0 .185-.185V9.006a.185.185 0 0 0-.185-.186h-2.12a.186.186 0 0 0-.185.186v1.887c0 .102.084.185.186.185M23.763 9.89c-.065-.051-.672-.51-1.954-.51-.338.001-.676.03-1.01.087-.248-1.7-1.653-2.53-1.716-2.566l-.344-.199-.226.327c-.284.438-.49.922-.612 1.43-.23.97-.09 1.882.403 2.661-.595.332-1.55.413-1.744.42H.751a.751.751 0 0 0-.75.748 11.376 11.376 0 0 0 .692 4.062c.545 1.428 1.355 2.48 2.41 3.124 1.18.723 3.1 1.137 5.275 1.137.983.003 1.963-.086 2.93-.266a12.248 12.248 0 0 0 3.823-1.389c.98-.567 1.86-1.288 2.61-2.136 1.252-1.418 1.998-2.997 2.553-4.4h.221c1.372 0 2.215-.549 2.68-1.009.309-.293.55-.65.707-1.046l.098-.288Z"/></svg>' },
  { name: 'Traefik Proxy', category: 'Infraestructura', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="#24A1C1" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>' },
  { name: 'Python & FastAPI', category: 'Backend', svg: '<svg viewBox="0 0 24 24" fill="#3776AB"><path d="M12 2c-3 0-4.5 1.3-4.5 3.5V8h5v1H5c-2 0-3 1.5-3 4s1 4 3 4h2v-2.5c0-1.7 1.3-3.5 3.5-3.5h4.5c1.5 0 3-1 3-3V5.5C18 3.3 15 2 12 2zM9.5 4.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/><path d="M12 22c3 0 4.5-1.3 4.5-3.5V16h-5v-1H19c2 0 3-1.5 3-4s-1-4-3-4h-2v2.5c0 1.7-1.3 3.5-3.5 3.5H9c-1.5 0-3 1-3 3v2c0 2.2 3 3.5 6 3.5zm2.5-2.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" fill="#FFD43B"/></svg>' },
  { name: 'Node.js & Express', category: 'Backend', svg: '<svg viewBox="0 0 24 24" fill="#339933"><path d="M11.998 24c-.321 0-.641-.084-.922-.247l-2.936-1.737c-.438-.245-.224-.332-.08-.383.585-.203.703-.25 1.328-.604.065-.037.151-.023.218.017l2.256 1.339a.29.29 0 0 0 .272 0l8.795-5.076a.277.277 0 0 0 .134-.238V6.921a.28.28 0 0 0-.137-.242l-8.791-5.072a.278.278 0 0 0-.271 0L3.075 6.68a.28.28 0 0 0-.138.24v10.15a.27.27 0 0 0 .136.235l2.409 1.392c1.307.654 2.108-.116 2.108-.89V7.787c0-.142.114-.253.256-.253h1.115c.139 0 .255.112.255.253v10.021c0 1.745-.95 2.745-2.604 2.745-.508 0-.909 0-2.026-.551L2.28 18.675a1.857 1.857 0 0 1-.922-1.604V6.921c0-.659.353-1.275.922-1.603L11.075.242a1.925 1.925 0 0 1 1.846 0l8.794 5.076c.57.329.924.944.924 1.603v10.15a1.86 1.86 0 0 1-.924 1.604l-8.794 5.078a1.836 1.836 0 0 1-.923.247z"/></svg>' },
  { name: 'React', category: 'Frontend', svg: '<svg viewBox="-11.5 -10.232 23 20.463" xmlns="http://www.w3.org/2000/svg"><circle r="2.05" fill="#61DAFB"/><g stroke="#61DAFB" fill="none" stroke-width="1"><ellipse rx="11" ry="4.2"/><ellipse rx="11" ry="4.2" transform="rotate(60)"/><ellipse rx="11" ry="4.2" transform="rotate(120)"/></g></svg>' },
  { name: 'TypeScript', category: 'Frontend', svg: '<svg viewBox="0 0 28 28"><rect width="28" height="28" rx="2" fill="#3178C6"/><path d="M6 13h9v2H6zm0 4h9v2H6zm0 4h6v2H6z" fill="#fff"/></svg>' },
  { name: 'PostgreSQL & Redis', category: 'Bases de Datos', svg: '<svg viewBox="0 0 24 24" fill="#4169E1"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/></svg>' },
  { name: 'Integración IA & LiveKit', category: 'Inteligencia Artificial', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M12 2a4 4 0 0 1 4 4c2.2.5 4 2.5 4 5a5 5 0 0 1-2 4 5 5 0 0 1-6 6 5 5 0 0 1-6-6 5 5 0 0 1-2-4c0-2.5 1.8-4.5 4-5a4 4 0 0 1 4-4z"/></svg>' },
  { name: 'Git & GitHub', category: 'Control de Versiones', svg: '<svg viewBox="0 0 24 24" fill="#F05032"><path d="M23.546 10.93L13.067.452a1.55 1.55 0 0 0-2.188 0L8.708 2.627l2.76 2.76a1.838 1.838 0 0 1 2.327 2.341l2.66 2.66a1.838 1.838 0 1 1-1.103 1.06l-2.48-2.48v6.53a1.838 1.838 0 1 1-1.512-.06V8.783a1.838 1.838 0 0 1-.998-2.41L7.629 3.64.452 10.818a1.55 1.55 0 0 0 0 2.187l10.48 10.48a1.55 1.55 0 0 0 2.186 0l10.43-10.43a1.55 1.55 0 0 0 0-2.125z"/></svg>' },
];
