import { Bot, Cpu, Activity, Shield, Sparkles } from 'lucide-react';

export default function Agents() {
  const agents = [
    {
      name: 'AlphaTrader',
      desc: 'Agente predictivo para mercados financieros usando Gemini Pro.',
      tech: 'Python, Gemini API',
      icon: Activity,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10'
    },
    {
      name: 'Nikolina',
      desc: 'Asistente médica virtual para triaje inicial de pacientes.',
      tech: 'React, OpenAI',
      icon: Bot,
      color: 'text-magenta-400',
      bg: 'bg-magenta-500/10'
    },
    {
      name: 'CyberGuard',
      desc: 'Monitor de anomalías en logs de servidores y Nginx.',
      tech: 'Node.js, Groq',
      icon: Shield,
      color: 'text-green-400',
      bg: 'bg-green-500/10'
    },
    {
      name: 'Cuentos Mágicos',
      desc: 'Generador de narrativa interactiva multimodal (Texto + Audio).',
      tech: 'Next.js, ElevenLabs',
      icon: Sparkles,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10'
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">
          <span className="text-white">Agentes </span>
          <span className="glow-text text-[#00E5FF]">Inteligentes</span>
        </h1>
        <p className="text-gray-400 font-mono text-sm">AUTONOMOUS AI SYSTEMS & INTEGRATIONS</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {agents.map((agent, i) => {
          const Icon = agent.icon;
          return (
            <div key={i} className="glass-panel p-6 rounded-2xl glass-panel-hover group cursor-pointer">
              <div className="flex items-start gap-4">
                <div className={`p-4 rounded-xl ${agent.bg} transition-transform group-hover:scale-110 duration-300`}>
                  <Icon className={`w-8 h-8 ${agent.color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-white">{agent.name}</h3>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#00E5FF] animate-pulse"></div>
                      <span className="text-[10px] text-cyan-400 font-mono">STANDBY</span>
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm mb-4 leading-relaxed">{agent.desc}</p>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                    <Cpu className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-300 font-mono">{agent.tech}</span>
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
