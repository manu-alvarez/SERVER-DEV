import { Server, Activity, ShieldCheck, Database, Code, Briefcase, Zap } from 'lucide-react';

export default function Home() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            <span className="text-white">Panel de </span>
            <span className="glow-text text-[#00E5FF]">Control</span>
          </h1>
          <p className="text-gray-400 font-mono text-sm">MANU ALVAREZ | SYSTEM ARCHITECT & AI INTEGRATOR</p>
        </div>
        <div className="glass-panel px-4 py-2 rounded-full flex items-center gap-3 border-[#00E5FF]/20">
           <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
           <span className="text-sm text-cyan-400 font-mono">STATUS: NOMINAL</span>
        </div>
      </div>

      {/* TOP METRICS (MOCKUP STYLE) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-panel p-6 rounded-2xl glass-panel-hover group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 rounded-lg bg-cyan-500/10 group-hover:bg-cyan-500/20 transition-colors">
              <Server className="w-6 h-6 text-cyan-400" />
            </div>
            <span className="text-green-400 text-xs font-mono">+99.9%</span>
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">22</h3>
          <p className="text-sm text-gray-400">Servicios Activos</p>
        </div>

        <div className="glass-panel p-6 rounded-2xl glass-panel-hover group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 rounded-lg bg-magenta-500/10 group-hover:bg-magenta-500/20 transition-colors">
              <Activity className="w-6 h-6 text-magenta-400" />
            </div>
            <span className="text-green-400 text-xs font-mono">OPTIMIZED</span>
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">4</h3>
          <p className="text-sm text-gray-400">LLM Fallbacks</p>
        </div>

        <div className="glass-panel p-6 rounded-2xl glass-panel-hover group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
              <Database className="w-6 h-6 text-blue-400" />
            </div>
            <span className="text-cyan-400 text-xs font-mono">SYNCED</span>
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">3</h3>
          <p className="text-sm text-gray-400">Bases de Datos</p>
        </div>

        <div className="glass-panel p-6 rounded-2xl glass-panel-hover group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 rounded-lg bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
              <ShieldCheck className="w-6 h-6 text-green-400" />
            </div>
            <span className="text-green-400 text-xs font-mono">SECURE</span>
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">100%</h3>
          <p className="text-sm text-gray-400">Tráfico Enrutado</p>
        </div>
      </div>

      {/* PROFILE / TIMELINE WIDGET */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-8 rounded-2xl relative overflow-hidden">
          {/* Cyber Decoration */}
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl"></div>
          
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-400" /> 
            Ecosistema de Software Integrado
          </h2>
          <p className="text-gray-300 leading-relaxed mb-6">
            MSBrossAI es una suite consolidada de microservicios. Mi perfil técnico combina la <strong>Administración de Sistemas y Redes</strong> con el desarrollo Fullstack y la integración de modelos de IA (Gemini, Groq, OpenAI). 
          </p>
          <div className="space-y-4">
            <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center gap-4">
              <div className="bg-cyan-500/20 p-3 rounded-lg">
                <Code className="text-cyan-400 w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white">Desarrollo y Orquestación</h4>
                <p className="text-sm text-gray-400">React 19, Tailwind CSS, PM2, Docker, Reverse Proxies</p>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center gap-4">
              <div className="bg-magenta-500/20 p-3 rounded-lg">
                <Server className="text-magenta-400 w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white">Infraestructura</h4>
                <p className="text-sm text-gray-400">Linux (Ubuntu), Cloudflare Tunnels, Certbot SSL, CI/CD</p>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-panel p-8 rounded-2xl">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-cyan-400" /> 
            Perfil Operativo
          </h2>
          <div className="space-y-6">
            <div className="relative pl-6 border-l border-cyan-500/30">
              <div className="absolute w-3 h-3 bg-cyan-400 rounded-full -left-[6.5px] top-1 shadow-[0_0_10px_#00E5FF]"></div>
              <h4 className="font-bold text-white">Técnico en Sistemas SMR</h4>
              <p className="text-xs text-cyan-400 mb-1">ILERNA (2022 - 2023)</p>
              <p className="text-sm text-gray-400">Certificaciones Cisco CCST Networking & Cybersecurity.</p>
            </div>
            <div className="relative pl-6 border-l border-white/10">
              <div className="absolute w-3 h-3 bg-gray-600 rounded-full -left-[6.5px] top-1"></div>
              <h4 className="font-bold text-white">Sector Industrial & IT</h4>
              <p className="text-xs text-gray-400 mb-1">Teringo, P&G, GB Foods, Döhler</p>
              <p className="text-sm text-gray-400">Experiencia en control de procesos industriales, logística y soporte IT en planta.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
