import { motion } from 'framer-motion';
import { Monitor, Code, Bot, BookOpen, Terminal, ShieldCheck, Server, Cpu } from 'lucide-react';

const SKILLS = [
  {
    icon: Monitor,
    title: 'Técnico de Sistemas',
    desc: 'Infraestructura y soporte',
    color: '#3B82F6',
    bgColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  {
    icon: Code,
    title: 'Desarrollador',
    desc: 'Web, Apps y Herramientas',
    color: '#06B6D4',
    bgColor: 'rgba(6, 182, 212, 0.15)',
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  {
    icon: Bot,
    title: 'IA & Automatización',
    desc: 'Productividad y eficiencia',
    color: '#8B5CF6',
    bgColor: 'rgba(139, 92, 246, 0.15)',
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  {
    icon: BookOpen,
    title: 'Aprendizaje continuo',
    desc: 'Siempre en evolución',
    color: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
];

export default function About() {
  return (
    <section id="sobre-mi" className="relative py-24 lg:py-32 overflow-hidden">
      {/* Ambient lighting */}
      <div className="absolute top-1/2 left-0 w-[550px] h-[550px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none -translate-y-1/2" />
      <div className="absolute bottom-0 right-10 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[130px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Story & Motivation */}
          <div className="lg:col-span-6 space-y-7">
            {/* Pill Badge */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold tracking-wider uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                Sobre Mí
              </span>
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.08 }}
            >
              <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight tracking-tight">
                Mi historia,
                <br />
                <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  mi motivación
                </span>
              </h2>
            </motion.div>

            {/* Paragraph */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.16 }}
              className="text-slate-300 text-base sm:text-lg leading-relaxed"
            >
              Soy Técnico de Sistemas y actualmente estoy en constante crecimiento
              como desarrollador web, de apps y herramientas, integrando la inteligencia
              artificial en todo lo que hago. Me apasiona la tecnología, la automatización
              y la creación de soluciones que realmente aporten valor.
            </motion.p>

            {/* 4 Skill Cards Grid (2x2) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.24 }}
              className="grid grid-cols-2 gap-3 pt-2"
            >
              {SKILLS.map((skill) => {
                const Icon = skill.icon;
                return (
                  <div
                    key={skill.title}
                    className="p-4 rounded-2xl bg-gradient-to-b from-slate-900/80 to-[#0A1220]/90 border border-slate-800/80 hover:border-slate-700 transition-all space-y-2.5 group"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
                      style={{
                        background: skill.bgColor,
                        border: `1px solid ${skill.borderColor}`,
                      }}
                    >
                      <Icon size={19} style={{ color: skill.color }} />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-cyan-200 transition-colors">
                        {skill.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 font-medium leading-snug">
                        {skill.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </motion.div>

            {/* Quote Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.32 }}
              className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60"
            >
              <span className="text-3xl text-cyan-400/50 font-serif leading-none select-none">
                “
              </span>
              <p className="text-xs sm:text-sm text-slate-300 italic leading-relaxed pt-0.5">
                No se trata solo de programar, sino de resolver problemas reales con tecnología.
              </p>
            </motion.div>
          </div>

          {/* Right Column: Workstation & Infrastructure Command Center */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-6 relative"
          >
            {/* Ambient workstation glow */}
            <div className="absolute -inset-2 bg-gradient-to-br from-cyan-500/20 via-blue-600/15 to-purple-600/15 rounded-3xl blur-2xl pointer-events-none" />

            {/* High-tech Multi-Monitor / Console Frame */}
            <div className="relative rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden">
              {/* Window Bar */}
              <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  <span className="text-xs font-mono text-slate-300 ml-2 font-semibold">
                    vps-contabo:~# neofetch --ecosystem
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE SERVER
                  </span>
                </div>
              </div>

              {/* Console Body */}
              <div className="p-6 space-y-5 bg-gradient-to-b from-[#090F1E] to-[#060B18]">
                {/* Active Services Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-1">
                    <div className="flex items-center gap-2 text-cyan-400">
                      <Server size={14} />
                      <span className="text-xs font-bold text-white">Traefik v3 Proxy</span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono">
                      SSL Let's Encrypt · *.manuelalvarez.dev
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-1">
                    <div className="flex items-center gap-2 text-blue-400">
                      <Cpu size={14} />
                      <span className="text-xs font-bold text-white">Node.js Gateway</span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Port 8080 · Express PM2 Cluster
                    </p>
                  </div>
                </div>

                {/* Real Code Preview Terminal */}
                <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800/90 font-mono text-xs space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 border-b border-slate-800 pb-2 mb-2">
                    <span className="flex items-center gap-1.5 text-cyan-400">
                      <Terminal size={12} /> orchestrator.py
                    </span>
                    <span>FastAPI + LiveKit WebRTC</span>
                  </div>
                  <div>
                    <span className="text-purple-400">async def</span>{' '}
                    <span className="text-blue-400">dispatch_request</span>(query: QueryModel):
                  </div>
                  <div className="pl-4 text-slate-400">
                    context = <span className="text-purple-400">await</span> memory.
                    <span className="text-yellow-300">retrieve</span>(query.vector)
                  </div>
                  <div className="pl-4 text-slate-400">
                    response = <span className="text-purple-400">await</span> llm_engine.
                    <span className="text-yellow-300">generate_stream</span>(context)
                  </div>
                  <div className="pl-4 text-emerald-400">
                    <span className="text-purple-400">return</span> AudioStreamResponse(response)
                  </div>
                </div>

                {/* Live Stats Status Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-800/80 text-[11px] font-mono text-slate-400">
                  <span className="flex items-center gap-1 text-slate-300">
                    <ShieldCheck size={13} className="text-emerald-400" />
                    Security Hardened (UFW + Fail2Ban)
                  </span>
                  <span className="text-cyan-400">RAM: 4.8GB / 16GB</span>
                  <span className="text-emerald-400">99.98% SLA</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
