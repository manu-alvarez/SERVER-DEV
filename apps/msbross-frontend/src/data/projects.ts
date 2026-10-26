export interface Project {
  id: string;
  name: string;
  subtitle?: string;
  description: string;
  longDescription?: string;
  category: string;
  iconBg: string;
  iconSvg: string;
  tags: string[];
  tech: string[];
  url?: string;
  status: 'live' | 'development' | 'concept';
  featured: boolean;
}

export const CATEGORIES = [
  { id: 'all', label: 'Todos' },
  { id: 'agents', label: 'Plataforma de agentes' },
  { id: 'ai-productivity', label: 'IA y productividad' },
  { id: 'systems', label: 'Sistemas y herramientas' },
  { id: 'apps-mobile', label: 'Apps y móviles' },
  { id: 'audio', label: 'Audio y multimedia' },
];

export const FEATURED_PROJECTS: Project[] = [
  {
    id: 'uiep',
    name: 'Plataforma de Agentes IA',
    subtitle: 'UIEP + AgentForge + PromptForge',
    description: 'Plataforma unificada para crear, gestionar y desplegar agentes de IA.',
    longDescription: 'Una plataforma unificada para crear, gestionar y desplegar agentes de IA, con herramientas especializadas para el diseño de flujos, la generación de prompts y la orquestación de tareas.',
    category: 'agents',
    iconBg: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>`,
    tags: ['Creación de agentes', 'Flujos de trabajo', 'Prompt engineering', 'Integraciones'],
    tech: ['React', 'TypeScript', 'Node.js', 'OpenAI', 'Tailwind'],
    status: 'development',
    featured: true,
  },
  {
    id: 'iaprod-os',
    name: 'IAProdOS / IAPutaOS',
    subtitle: 'Herramientas y productividad',
    description: 'Suite de productividad y gestión documental empresarial con IA.',
    longDescription: 'Suite de productividad y gestión documental empresarial (B2B). Orquesta flujos de trabajo generativos para empresas con integración de múltiples modelos de lenguaje.',
    category: 'ai-productivity',
    icon: '',
    iconBg: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 7h10"/><path d="M7 12h10"/><path d="M7 17h10"/></svg>`,
    tags: ['Gestión documental', 'Flujos generativos', 'Enterprise'],
    tech: ['React', 'Vite', 'FastAPI', 'Python', 'Ollama'],
    url: 'https://iaprod.manuelalvarez.dev',
    status: 'development',
    featured: true,
  },
  {
    id: 'tu-energia-maya',
    name: 'Tu Energía Maya',
    subtitle: 'Calendario + Tarot + App',
    description: 'Calculadora de fechas según el Sincronario Maya Tzolkin.',
    longDescription: 'Calculadora de fechas según el Sincronario Maya Tzolkin (Kines, Tonos, Sellos). Proyecto estático frontend con cálculos del calendario maya.',
    category: 'apps-mobile',
    iconBg: 'linear-gradient(135deg, #F59E0B, #EF4444)',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a7 7 0 1 0 10 10"/><circle cx="12" cy="12" r="4"/><path d="m15 9-3 3"/></svg>`,
    tags: ['Calendario Maya', 'Tzolkin', 'Kines y Sellos'],
    tech: ['React', 'Vite', 'CSS Modules'],
    url: 'https://manu-alvarez.github.io/TuEnergiaMaya/',
    status: 'development',
    featured: true,
  },
  {
    id: 'logisearch',
    name: 'LogiSearch',
    subtitle: 'Logística y búsqueda',
    description: 'Buscador de referencias de almacén con filtros optimizados.',
    longDescription: 'Buscador de referencias de almacén con interfaz optimizada para lectura rápida y filtros básicos. Diseñado para entornos logísticos reales.',
    category: 'systems',
    iconBg: 'linear-gradient(135deg, #06B6D4, #3B82F6)',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M11 8v6"/><path d="M8 11h6"/></svg>`,
    tags: ['Búsqueda inteligente', 'Logística', 'Filtros avanzados'],
    tech: ['React', 'Tailwind', 'Supabase'],
    url: 'https://logisearch.manuelalvarez.dev',
    status: 'development',
    featured: true,
  },
  {
    id: 'nikolina-ai',
    name: 'Nikolina AI',
    subtitle: 'Asistente de reservas',
    description: 'Agente de voz WebRTC para reservas de restaurante con latencia baja.',
    longDescription: 'Prueba de concepto de agente de voz WebRTC para reservas de restaurante. Latencia baja con pipeline modular usando LiveKit, Google STT/TTS y Gemini.',
    category: 'agents',
    iconBg: 'linear-gradient(135deg, #10B981, #06B6D4)',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>`,
    tags: ['Voz en tiempo real', 'WebRTC', 'Pipeline modular'],
    tech: ['LiveKit', 'Google STT/TTS', 'Gemini', 'Python'],
    url: 'https://nikolina.manuelalvarez.dev',
    status: 'development',
    featured: true,
  },
  {
    id: 'foz-soundpro',
    name: 'FoZ SoundPro',
    subtitle: 'Audio profesional',
    description: 'Herramienta profesional de producción y procesamiento de audio.',
    longDescription: 'Herramienta profesional de producción y procesamiento de audio con capacidades avanzadas de edición, mezcla y efectos.',
    category: 'audio',
    iconBg: 'linear-gradient(135deg, #EC4899, #8B5CF6)',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
    tags: ['Producción musical', 'Procesamiento', 'Audio profesional'],
    tech: ['React', 'Web Audio API', 'TypeScript'],
    status: 'development',
    featured: true,
  },
  {
    id: 'teringo-neural-cockpit',
    name: 'Teringo Neural Cockpit',
    subtitle: 'Correo y productividad',
    description: 'Sistema de gestión de correo y productividad potenciado con IA.',
    longDescription: 'Sistema inteligente de gestión de correo electrónico y productividad, con clasificación automática, respuestas sugeridas y flujos de trabajo optimizados mediante IA.',
    category: 'ai-productivity',
    iconBg: 'linear-gradient(135deg, #F59E0B, #10B981)',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`,
    tags: ['Email inteligente', 'Automatización', 'Productividad'],
    tech: ['React', 'Node.js', 'OpenAI', 'PostgreSQL'],
    status: 'development',
    featured: true,
  },
];

export const OTHER_PROJECTS: Project[] = [
  {
    id: 'jartosdto',
    name: 'JartOS DTo',
    subtitle: 'Desarrollo y automatización',
    description: 'Chatbot conversacional con personalidad propia.',
    category: 'ai-productivity',
    iconBg: 'linear-gradient(135deg, #8B5CF6, #6366F1)',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>`,
    tags: [],
    tech: ['Next.js', 'Tailwind', 'Ollama'],
    url: 'https://jartosdto.manuelalvarez.dev',
    status: 'development',
    featured: false,
  },
  {
    id: 'msbross',
    name: 'MSBrOSs',
    subtitle: 'Entorno / Ecosistema',
    description: 'Ecosistema de administración técnica avanzada.',
    category: 'systems',
    iconBg: 'linear-gradient(135deg, #3B82F6, #06B6D4)',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>`,
    tags: [],
    tech: ['React', 'Node.js', 'Multi-LLM'],
    url: 'https://assistant.manuelalvarez.dev',
    status: 'development',
    featured: false,
  },
  {
    id: 'app-generator',
    name: 'App Generator',
    subtitle: 'Generación de aplicaciones',
    description: 'Generador de UI estáticas a partir de prompts de texto.',
    category: 'ai-productivity',
    iconBg: 'linear-gradient(135deg, #EC4899, #F43F5E)',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg>`,
    tags: [],
    tech: ['React', 'Gemini API'],
    url: 'https://appgen.manuelalvarez.dev',
    status: 'development',
    featured: false,
  },
];

// Technology logos — Real SVG paths from official brand guidelines
export const TECHNOLOGIES = [
  {
    name: 'React',
    svg: `<svg viewBox="-11.5 -10.232 23 20.463" xmlns="http://www.w3.org/2000/svg"><circle r="2.05" fill="#61DAFB"/><g stroke="#61DAFB" fill="none" stroke-width="1"><ellipse rx="11" ry="4.2"/><ellipse rx="11" ry="4.2" transform="rotate(60)"/><ellipse rx="11" ry="4.2" transform="rotate(120)"/></g></svg>`,
  },
  {
    name: 'Next.js',
    svg: `<svg viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg"><path d="M11.572 0c-.176 0-.31.001-.358.007a19.76 19.76 0 0 1-.364.033C7.443.346 4.25 2.185 2.228 5.012a11.875 11.875 0 0 0-2.119 5.243c-.096.659-.108.854-.108 1.747s.012 1.089.108 1.748c.652 4.506 3.86 8.292 8.209 9.695.779.25 1.6.422 2.534.525.363.04 1.935.04 2.299 0 1.611-.178 2.977-.577 4.323-1.264.207-.106.247-.134.219-.158-.02-.013-.9-1.193-1.955-2.62l-1.919-2.592-2.404-3.558a338.739 338.739 0 0 0-2.422-3.556c-.009-.002-.018 1.579-.023 3.51-.007 3.38-.01 3.515-.052 3.595a.426.426 0 0 1-.206.214c-.075.037-.14.044-.495.044H7.81l-.108-.068a.438.438 0 0 1-.157-.171l-.05-.106.006-4.703.007-4.705.072-.092a.645.645 0 0 1 .174-.143c.096-.047.134-.051.54-.051.478 0 .558.018.682.154.035.038 1.337 1.999 2.895 4.361a10760.433 10760.433 0 0 0 4.735 7.17l1.9 2.879.096-.063a12.317 12.317 0 0 0 2.466-2.163 11.944 11.944 0 0 0 2.824-6.134c.096-.66.108-.854.108-1.748 0-.893-.012-1.088-.108-1.747-.652-4.506-3.86-8.292-8.208-9.695a12.597 12.597 0 0 0-2.499-.523A33.119 33.119 0 0 0 11.572 0zm4.069 7.217c.347 0 .408.005.486.047a.473.473 0 0 1 .237.277c.018.06.023 1.365.018 4.304l-.006 4.218-.744-1.14-.746-1.14v-3.066c0-1.982.01-3.097.023-3.15a.478.478 0 0 1 .233-.296c.096-.05.13-.054.5-.054z"/></svg>`,
  },
  {
    name: 'TypeScript',
    svg: `<svg viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg"><rect width="28" height="28" rx="2" fill="#3178C6"/><path d="M16.5 23.5v-2.8c0-.7.2-1.2.6-1.6.4-.4.9-.6 1.6-.6.7 0 1.2.2 1.6.6.4.4.6.9.6 1.6v.6c0 .7-.2 1.3-.5 1.7-.3.4-.8.7-1.4.8l-.5-.9c.4-.1.6-.2.8-.5.2-.2.3-.5.3-.9h-.4c-.4 0-.8-.1-1.1-.3-.3-.2-.6-.5-.8-.9-.2-.4-.3-.8-.3-1.3v-.6c0-.7.2-1.3.7-1.8.5-.5 1.1-.7 1.8-.7s1.3.2 1.8.7c.5.5.7 1.1.7 1.8v2.8h-1.3v-2.8c0-.4-.1-.7-.3-.9-.2-.2-.5-.4-.9-.4-.4 0-.7.1-.9.4-.2.2-.3.5-.3.9v.6c0 .4.1.7.3.9.2.2.5.3.9.3h1.2v1.1h-1.2c-.7 0-1.3-.2-1.8-.7-.5-.5-.7-1-.7-1.6zm-9.5-8h2.8v8.7H11V16.7h2.8v-1.2H7v1.2z" fill="white"/></svg>`,
  },
  {
    name: 'Tailwind',
    svg: `<svg viewBox="0 0 24 24" fill="#06B6D4" xmlns="http://www.w3.org/2000/svg"><path d="M12.001 4.8c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624C13.666 10.618 15.027 12 18.001 12c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C16.337 6.182 14.976 4.8 12.001 4.8zm-6 7.2c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624 1.177 1.194 2.538 2.576 5.512 2.576 3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C10.337 13.382 8.976 12 6.001 12z"/></svg>`,
  },
  {
    name: 'Node.js',
    svg: `<svg viewBox="0 0 24 24" fill="#339933" xmlns="http://www.w3.org/2000/svg"><path d="M11.998 24c-.321 0-.641-.084-.922-.247l-2.936-1.737c-.438-.245-.224-.332-.08-.383.585-.203.703-.25 1.328-.604.065-.037.151-.023.218.017l2.256 1.339a.29.29 0 0 0 .272 0l8.795-5.076a.277.277 0 0 0 .134-.238V6.921a.28.28 0 0 0-.137-.242l-8.791-5.072a.278.278 0 0 0-.271 0L3.075 6.68a.28.28 0 0 0-.138.24v10.15a.27.27 0 0 0 .136.235l2.409 1.392c1.307.654 2.108-.116 2.108-.89V7.787c0-.142.114-.253.256-.253h1.115c.139 0 .255.112.255.253v10.021c0 1.745-.95 2.745-2.604 2.745-.508 0-.909 0-2.026-.551L2.28 18.675a1.857 1.857 0 0 1-.922-1.604V6.921c0-.659.353-1.275.922-1.603L11.075.242a1.925 1.925 0 0 1 1.846 0l8.794 5.076c.57.329.924.944.924 1.603v10.15a1.86 1.86 0 0 1-.924 1.604l-8.794 5.078a1.836 1.836 0 0 1-.923.247z"/></svg>`,
  },
  {
    name: 'Python',
    svg: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M14.25.18l.9.2.73.26.59.3.45.32.34.34.25.34.16.33.1.3.04.26.02.2-.01.13V8.5l-.05.63-.13.55-.21.46-.26.38-.3.31-.33.25-.35.19-.35.14-.33.1-.3.07-.26.04-.21.02H8.77l-.69.05-.59.14-.5.22-.41.27-.33.32-.27.35-.2.36-.15.37-.1.35-.07.32-.04.27-.02.21v3.06H3.17l-.21-.03-.28-.07-.32-.12-.35-.18-.36-.26-.36-.36-.35-.46-.32-.59-.28-.73-.21-.88-.14-1.05-.05-1.23.06-1.22.16-1.04.24-.87.32-.71.36-.57.4-.44.42-.33.42-.24.4-.16.36-.1.32-.05.24-.01h.16l.06.01h8.16v-.83H6.18l-.01-2.75-.02-.37.05-.34.11-.31.17-.28.25-.26.31-.23.38-.2.44-.18.51-.15.58-.12.64-.1.71-.06.77-.04.84-.02 1.27.05zm-6.3 1.09l-.92.16-.68.22-.51.29-.39.37-.32.47-.26.62-.21.8-.17 1.05-.14 1.34-.12 1.68-.1 2.09 0 .4v.92h7.97l.18-.01.3-.04.38-.09.44-.16.48-.24.49-.33.47-.45.43-.58.36-.74.27-.93.16-1.14.02-.41v-.48l-.06-.43-.12-.38-.18-.33-.26-.28-.33-.24-.41-.2-.49-.15-.59-.11-.69-.07-.78-.04-.88-.01H9.35l-1.4.07z" fill="#3776AB"/><path d="M9.749 23.82l-.9-.2-.73-.26-.59-.3-.45-.32-.34-.34-.25-.34-.16-.33-.1-.3-.04-.26-.02-.2.01-.13V15.5l.05-.63.13-.55.21-.46.26-.38.3-.31.33-.25.35-.19.35-.14.33-.1.3-.07.26-.04.21-.02h5.47l.69-.05.59-.14.5-.22.41-.27.33-.32.27-.35.2-.36.15-.37.1-.35.07-.32.04-.27.02-.21v-3.06h3.33l.21.03.28.07.32.12.35.18.36.26.36.36.35.46.32.59.28.73.21.88.14 1.05.05 1.23-.06 1.22-.16 1.04-.24.87-.32.71-.36.57-.4.44-.42.33-.42.24-.4.16-.36.1-.32.05-.24.01h-.16l-.06-.01H9.83v.83h7.66l.01 2.75.02.37-.05.34-.11.31-.17.28-.25.26-.31.23-.38.2-.44.18-.51.15-.58.12-.64.1-.71.06-.77.04-.84.02-1.27-.05zm6.3-1.09l.92-.16.68-.22.51-.29.39-.37.32-.47.26-.62.21-.8.17-1.05.14-1.34.12-1.68.1-2.09v-.4l.01-.92H11.3l-.18.01-.3.04-.38.09-.44.16-.48.24-.49.33-.47.45-.43.58-.36.74-.27.93-.16 1.14-.02.41v.48l.06.43.12.38.18.33.26.28.33.24.41.2.49.15.59.11.69.07.78.04.88.01h1.6l1.4-.07z" fill="#FFD43B"/></svg>`,
  },
  {
    name: 'OpenAI',
    svg: `<svg viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg"><path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/></svg>`,
  },
  {
    name: 'Docker',
    svg: `<svg viewBox="0 0 24 24" fill="#2496ED" xmlns="http://www.w3.org/2000/svg"><path d="M13.983 11.078h2.119a.186.186 0 0 0 .186-.185V9.006a.186.186 0 0 0-.186-.186h-2.119a.185.185 0 0 0-.185.185v1.888c0 .102.083.185.185.185m-2.954-5.43h2.118a.186.186 0 0 0 .186-.186V3.574a.186.186 0 0 0-.186-.185h-2.118a.185.185 0 0 0-.185.185v1.888c0 .102.082.185.185.186m0 2.716h2.118a.187.187 0 0 0 .186-.186V6.29a.186.186 0 0 0-.186-.185h-2.118a.185.185 0 0 0-.185.185v1.887c0 .102.082.185.185.186m-2.93 0h2.12a.186.186 0 0 0 .184-.186V6.29a.185.185 0 0 0-.185-.185H8.1a.185.185 0 0 0-.185.185v1.887c0 .102.083.185.185.186m-2.964 0h2.119a.186.186 0 0 0 .185-.186V6.29a.185.185 0 0 0-.185-.185H5.136a.186.186 0 0 0-.186.185v1.887c0 .102.084.185.186.186m5.893 2.715h2.118a.186.186 0 0 0 .186-.185V9.006a.186.186 0 0 0-.186-.186h-2.118a.185.185 0 0 0-.185.185v1.888c0 .102.082.185.185.185m-2.93 0h2.12a.185.185 0 0 0 .184-.185V9.006a.185.185 0 0 0-.184-.186h-2.12a.185.185 0 0 0-.184.185v1.888c0 .102.083.185.185.185m-2.964 0h2.119a.185.185 0 0 0 .185-.185V9.006a.185.185 0 0 0-.185-.186h-2.12a.186.186 0 0 0-.185.186v1.887c0 .102.084.185.186.185m-2.92 0h2.12a.185.185 0 0 0 .184-.185V9.006a.185.185 0 0 0-.184-.186h-2.12a.185.185 0 0 0-.184.185v1.888c0 .102.082.185.185.185M23.763 9.89c-.065-.051-.672-.51-1.954-.51-.338.001-.676.03-1.01.087-.248-1.7-1.653-2.53-1.716-2.566l-.344-.199-.226.327c-.284.438-.49.922-.612 1.43-.23.97-.09 1.882.403 2.661-.595.332-1.55.413-1.744.42H.751a.751.751 0 0 0-.75.748 11.376 11.376 0 0 0 .692 4.062c.545 1.428 1.355 2.48 2.41 3.124 1.18.723 3.1 1.137 5.275 1.137.983.003 1.963-.086 2.93-.266a12.248 12.248 0 0 0 3.823-1.389c.98-.567 1.86-1.288 2.61-2.136 1.252-1.418 1.998-2.997 2.553-4.4h.221c1.372 0 2.215-.549 2.68-1.009.309-.293.55-.65.707-1.046l.098-.288Z"/></svg>`,
  },
  {
    name: 'Git',
    svg: `<svg viewBox="0 0 24 24" fill="#F05032" xmlns="http://www.w3.org/2000/svg"><path d="M23.546 10.93L13.067.452a1.55 1.55 0 0 0-2.188 0L8.708 2.627l2.76 2.76a1.838 1.838 0 0 1 2.327 2.341l2.66 2.66a1.838 1.838 0 1 1-1.103 1.06l-2.48-2.48v6.53a1.838 1.838 0 1 1-1.512-.06V8.783a1.838 1.838 0 0 1-.998-2.41L7.629 3.64.452 10.818a1.55 1.55 0 0 0 0 2.187l10.48 10.48a1.55 1.55 0 0 0 2.186 0l10.43-10.43a1.55 1.55 0 0 0 0-2.125z"/></svg>`,
  },
  {
    name: 'PostgreSQL',
    svg: `<svg viewBox="0 0 24 24" fill="#4169E1" xmlns="http://www.w3.org/2000/svg"><path d="M17.128 0a10.134 10.134 0 0 0-2.755.403l-.063.02A10.922 10.922 0 0 0 12.6.258C11.422.238 10.4.524 9.594 1.01 8.79.711 7.122.25 5.364.335 4.14.397 2.804.775 1.814 1.82.826 2.865.35 4.482.456 6.732c.03.655.175 2.383.678 4.158.502 1.775 1.312 3.673 2.69 4.731.25.191.496.26.724.264l.01-.001c.268-.004.504-.124.7-.37.39-.49.713-1.206 1.059-1.938l.013-.028a9.62 9.62 0 0 0 1.477.879l.001.002c-.097.315-.19.735-.157 1.152.044.563.312 1.088.823 1.438.347.238.757.362 1.18.388.38.024.74-.034 1.063-.109l.002-.001c.621-.143 1.24-.4 1.79-.622a18.46 18.46 0 0 0 1.148-.519c-.01.233-.001.468.022.698.058.576.193 1.38.611 2.048.215.343.497.67.873.884.376.213.848.324 1.364.253.498-.068.94-.293 1.294-.599.35-.305.614-.697.836-1.126.407-.788.73-1.747.979-2.682.13-.487.241-.978.333-1.44l.048.036c.46.345 1.024.586 1.658.643.164.015.33.012.493-.008a3.424 3.424 0 0 0 1.968-.991 3.635 3.635 0 0 0 .96-1.776c.204-.738.228-1.406.123-1.983a3.546 3.546 0 0 0-.516-1.32c.225-.727.376-1.442.38-2.096.005-.917-.235-1.764-.793-2.337-.541-.554-1.308-.81-2.215-.768-.554.026-1.108.168-1.636.403a7.15 7.15 0 0 0-.217-.264c-.573-.65-1.305-1.063-2.088-1.328A10.963 10.963 0 0 0 17.128 0z"/></svg>`,
  },
  {
    name: 'Firebase',
    svg: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M3.89 15.672L6.255.461A.542.542 0 0 1 7.27.288l2.543 4.771zm16.794 3.692l-2.25-14a.54.54 0 0 0-.919-.295L3.316 19.365l7.856 4.427a1.621 1.621 0 0 0 1.588 0zM14.3 7.147l-1.82-3.482a.542.542 0 0 0-.96 0L3.53 17.984z" fill="#FFCA28"/></svg>`,
  },
];
