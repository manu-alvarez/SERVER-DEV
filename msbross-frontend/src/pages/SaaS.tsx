import { Rocket, Box, Globe, Shield, Activity } from 'lucide-react';

export default function SaaS() {
  const tools = [
    {
      name: 'LogiSearch',
      desc: 'Motor logístico inteligente B2B para cotización de rutas y transportistas.',
      tech: 'React 19, Supabase',
      icon: Globe,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10'
    },
    {
      name: 'Perfume Trading',
      desc: 'ERP transaccional B2B con catálogo maestro e inventario dinámico.',
      tech: 'Next.js, PostgreSQL',
      icon: Box,
      color: 'text-magenta-400',
      bg: 'bg-magenta-500/10'
    },
    {
      name: 'IndustrialPro',
      desc: 'Plataforma integral de gestión de procesos productivos y calidad industrial.',
      tech: 'FastAPI, Tailwind',
      icon: Shield,
      color: 'text-green-400',
      bg: 'bg-green-500/10'
    },
    {
      name: 'Gas Station ERP',
      desc: 'Suite PWA para control operativo de estaciones Repsol.',
      tech: 'SQLite, PWA',
      icon: Rocket,
      color: 'text-orange-400',
      bg: 'bg-orange-500/10'
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">
          <span className="text-white">SaaS & </span>
          <span className="glow-text text-[#00E5FF]">Enterprise Tools</span>
        </h1>
        <p className="text-gray-400 font-mono text-sm">B2B SOLUTIONS & ERP PLATFORMS</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tools.map((tool, i) => {
          const Icon = tool.icon;
          return (
            <div key={i} className="glass-panel p-6 rounded-2xl glass-panel-hover group cursor-pointer">
              <div className="flex items-start gap-4">
                <div className={`p-4 rounded-xl ${tool.bg} transition-transform group-hover:scale-110 duration-300`}>
                  <Icon className={`w-8 h-8 ${tool.color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-white">{tool.name}</h3>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                      <span className="text-[10px] text-gray-500 font-mono">LIVE</span>
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm mb-4 leading-relaxed">{tool.desc}</p>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                    <Activity className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-300 font-mono">{tool.tech}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
