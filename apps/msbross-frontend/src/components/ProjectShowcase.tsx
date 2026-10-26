import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bot,
  Workflow,
  Sparkles,
  Cpu,
  Layers,
  ArrowUpRight,
  Activity,
  CheckCircle2,
  Play,
} from 'lucide-react';
import type { Project } from '../data/projects';
import { FEATURED_PROJECTS } from '../data/projects';

interface ProjectShowcaseProps {
  selectedProject?: Project;
  onClose?: () => void;
}

export default function ProjectShowcase({ selectedProject, onClose }: ProjectShowcaseProps) {
  const project = selectedProject || FEATURED_PROJECTS[0];
  const [activeTab, setActiveTab] = useState<'canvas' | 'code'>('canvas');
  const [isSimulating, setIsSimulating] = useState(false);

  const handleSimulate = () => {
    setIsSimulating(true);
    setTimeout(() => setIsSimulating(false), 2400);
  };

  return (
    <section className="relative py-8 lg:py-12">
      {/* Background neon ambient */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="rounded-3xl bg-gradient-to-b from-slate-900/95 via-[#0A1224]/95 to-slate-950/98 border border-cyan-500/30 p-6 sm:p-10 shadow-2xl shadow-cyan-950/40 overflow-hidden relative"
        >
          {/* Subtle top cyan line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

          {/* Top Bar with back action if callback provided */}
          {onClose && (
            <div className="mb-6">
              <button
                onClick={onClose}
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
              >
                ← Volver a proyectos
              </button>
            </div>
          )}

          <div className="grid lg:grid-cols-12 gap-10 items-center">
            {/* Left Column: Details */}
            <div className="lg:col-span-6 space-y-6">
              {/* Category Pill */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold tracking-wider uppercase">
                <Sparkles size={13} className="text-cyan-400" />
                {project.category === 'agents'
                  ? 'Plataforma de Agentes IA'
                  : project.category === 'ai-productivity'
                  ? 'IA y Productividad'
                  : project.category === 'apps-mobile'
                  ? 'Apps y Móviles'
                  : project.category === 'audio'
                  ? 'Audio y Multimedia'
                  : 'Sistemas y Herramientas'}
              </div>

              {/* Title & Subtitle */}
              <div>
                <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  {project.name}
                </h3>
                {project.subtitle && (
                  <p className="text-lg font-semibold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mt-1">
                    {project.subtitle}
                  </p>
                )}
              </div>

              {/* Long Description */}
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                {project.longDescription || project.description}
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {project.url ? (
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-xl shadow-cyan-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                  >
                    Ver demo
                    <ArrowUpRight size={16} />
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 font-semibold text-sm">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    En desarrollo activo
                  </span>
                )}

                <a
                  href="#contacto"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-slate-800/80 hover:bg-slate-700/80 text-white font-semibold text-sm border border-slate-700 hover:border-slate-500 transition-all cursor-pointer"
                >
                  Consultar detalles
                </a>
              </div>

              {/* Feature Badges Grid (4 Pills with Icons from Mockup) */}
              <div className="grid grid-cols-2 gap-2.5 pt-4 border-t border-slate-800/80">
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/70 border border-slate-800/80">
                  <Bot size={16} className="text-cyan-400 shrink-0" />
                  <span className="text-xs text-slate-200 font-medium">Creación de agentes</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/70 border border-slate-800/80">
                  <Workflow size={16} className="text-purple-400 shrink-0" />
                  <span className="text-xs text-slate-200 font-medium">Flujos de trabajo</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/70 border border-slate-800/80">
                  <Cpu size={16} className="text-blue-400 shrink-0" />
                  <span className="text-xs text-slate-200 font-medium">Prompt engineering</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/70 border border-slate-800/80">
                  <Layers size={16} className="text-emerald-400 shrink-0" />
                  <span className="text-xs text-slate-200 font-medium">Integraciones</span>
                </div>
              </div>

              {/* Technologies row */}
              <div className="space-y-2 pt-2">
                <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 block">
                  Tecnologías
                </span>
                <div className="flex flex-wrap gap-2">
                  {project.tech.map((t) => (
                    <span
                      key={t}
                      className="px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700/70 text-slate-300 text-xs font-medium"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Interactive 3D Tablet Mockup with Workflow Canvas */}
            <div className="lg:col-span-6 relative">
              <div className="relative rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden">
                {/* Device Header Bar */}
                <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                    <span className="text-[11px] font-mono text-slate-400 ml-2">
                      AgentForge Studio — flow_canvas.agent
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setActiveTab('canvas')}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                        activeTab === 'canvas'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Canvas
                    </button>
                    <button
                      onClick={() => setActiveTab('code')}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                        activeTab === 'code'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Código
                    </button>
                  </div>
                </div>

                {/* Device Content Area */}
                <div className="p-5 min-h-[380px] bg-gradient-to-b from-[#0B132B]/60 to-[#060B18] relative overflow-hidden flex flex-col justify-between">
                  {/* Subtle Canvas Dot Grid */}
                  <div
                    className="absolute inset-0 opacity-[0.08] pointer-events-none"
                    style={{
                      backgroundImage: 'radial-gradient(circle, #38bdf8 1px, transparent 1px)',
                      backgroundSize: '18px 18px',
                    }}
                  />

                  {activeTab === 'canvas' ? (
                    <div className="relative z-10 space-y-4">
                      {/* Top simulation trigger */}
                      <div className="flex items-center justify-between pb-1">
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                          Pipeline de Ejecución
                        </span>
                        <button
                          onClick={handleSimulate}
                          disabled={isSimulating}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-[11px] font-medium transition-all cursor-pointer disabled:opacity-50"
                        >
                          <Play size={11} className={isSimulating ? 'animate-spin' : ''} />
                          {isSimulating ? 'Procesando...' : 'Simular Flujo'}
                        </button>
                      </div>

                      {/* Flow Node 1: Input Trigger */}
                      <div className="flex items-center gap-3">
                        <div
                          className={`px-3.5 py-2 rounded-xl border text-xs font-semibold shadow-md flex items-center gap-2 transition-all duration-300 ${
                            isSimulating
                              ? 'bg-blue-500/30 border-blue-400 text-white shadow-blue-500/40 scale-102'
                              : 'bg-blue-500/15 border-blue-500/40 text-blue-300'
                          }`}
                        >
                          <Activity size={14} className="text-blue-400 animate-pulse" />
                          <span>Input: User Query / Voice Stream</span>
                        </div>
                        <div className="h-0.5 w-8 bg-gradient-to-r from-blue-400 to-cyan-400" />
                        <span className="text-[10px] font-mono text-slate-400">WebRTC / REST</span>
                      </div>

                      {/* Flow Node 2: Central Orchestrator */}
                      <div
                        className={`p-4 rounded-xl bg-slate-900/90 border shadow-lg space-y-2 transition-all duration-300 ${
                          isSimulating
                            ? 'border-cyan-400 shadow-cyan-950/80 ring-1 ring-cyan-400/50'
                            : 'border-cyan-500/40 shadow-cyan-950/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Bot size={16} className="text-cyan-400" />
                            <span className="text-xs font-bold text-white">Agent Orchestrator</span>
                          </div>
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                            <CheckCircle2 size={11} /> Running (42ms)
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 pt-1 text-[10px] font-mono">
                          <div className="p-1.5 rounded bg-slate-950/70 border border-slate-800 text-slate-300 text-center">
                            Gemini 3.8
                          </div>
                          <div className="p-1.5 rounded bg-slate-950/70 border border-slate-800 text-slate-300 text-center">
                            ChromaDB RAG
                          </div>
                          <div className="p-1.5 rounded bg-slate-950/70 border border-slate-800 text-slate-300 text-center">
                            Tool Dispatch
                          </div>
                        </div>
                      </div>

                      {/* Flow Node 3: Outputs */}
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div
                          className={`p-3 rounded-xl border text-xs transition-all duration-300 ${
                            isSimulating
                              ? 'bg-purple-500/20 border-purple-400 shadow-lg shadow-purple-950/50'
                              : 'bg-purple-500/10 border-purple-500/30 text-purple-300'
                          }`}
                        >
                          <div className="font-semibold text-white mb-0.5">PromptForge Synthesizer</div>
                          <div className="text-[10px] text-purple-300/80">Context injection & Guardrails</div>
                        </div>
                        <div
                          className={`p-3 rounded-xl border text-xs transition-all duration-300 ${
                            isSimulating
                              ? 'bg-emerald-500/20 border-emerald-400 shadow-lg shadow-emerald-950/50'
                              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          }`}
                        >
                          <div className="font-semibold text-white mb-0.5">Execution Engine</div>
                          <div className="text-[10px] text-emerald-300/80">API actions, DB update & Voice TTS</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative z-10 font-mono text-xs text-slate-300 space-y-1.5">
                      <div className="text-cyan-400">// Orquestador de agentes en producción</div>
                      <div>
                        <span className="text-purple-400">const</span> agent ={' '}
                        <span className="text-blue-400">new</span>{' '}
                        <span className="text-yellow-300">AgentForge</span>({`{`}
                      </div>
                      <div className="pl-4">
                        model: <span className="text-emerald-400">'gemini-3.8-flash'</span>,
                      </div>
                      <div className="pl-4">
                        knowledgeBase: <span className="text-emerald-400">'server-chromadb'</span>,
                      </div>
                      <div className="pl-4">tools: [livekitSTT, postgresQuery, systemMonitor],</div>
                      <div className="pl-4">maxLatencyMs: <span className="text-orange-400">120</span>,</div>
                      <div>{`});`}</div>
                      <div className="pt-2 text-slate-400">
                        <span className="text-purple-400">await</span> agent.
                        <span className="text-blue-400">deploy</span>({`{`} target:{' '}
                        <span className="text-emerald-400">'contabo-vps-cluster'</span> {`}`});
                      </div>
                    </div>
                  )}

                  {/* Device Footer Telemetry */}
                  <div className="pt-4 mt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Status: Active on Port 8080
                    </span>
                    <span className="text-cyan-400">Uptime 99.98%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
