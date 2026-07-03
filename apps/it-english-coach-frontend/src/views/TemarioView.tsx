import { useState } from 'react';
import { useAppStore } from '../store';
import { TEMARIO } from '../lib/data';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, ChevronDown, Layers } from 'lucide-react';
import SkillsRadar from '../components/SkillsRadar';

export default function TemarioView() {
  const { progress, toggleModuleProgress } = useAppStore();
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="space-y-6 pb-12 w-full max-w-6xl mx-auto flex flex-col xl:flex-row gap-6">
      
      {/* Main Content */}
      <div className="flex-1 space-y-6">
        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between border-l-4 border-l-neon-cyan">
          <div>
            <h2 className="text-sm font-mono text-neon-cyan tracking-wider uppercase mb-1">Módulos de Aprendizaje</h2>
            <p className="text-muted text-sm">Avanza a través de los 12 niveles para dominar el vocabulario técnico IT.</p>
          </div>
          <Layers size={32} className="text-neon-cyan opacity-80" />
        </div>

      <div className="space-y-10">
        {[
          { id: 'beginner', title: 'Beginner (A1-A2)', color: 'text-neon-cyan', bg: 'bg-neon-cyan', items: TEMARIO.filter(m => m.from === 'A1' || m.from === 'A2') },
          { id: 'intermediate', title: 'Intermediate (B1-B2)', color: 'text-amber-400', bg: 'bg-amber-400', items: TEMARIO.filter(m => m.from === 'B1' || m.from === 'B2') },
          { id: 'advanced', title: 'Advanced (C1-C2)', color: 'text-purple-400', bg: 'bg-purple-400', items: TEMARIO.filter(m => m.from === 'C1' || m.from === 'C2') }
        ].map(group => group.items.length > 0 && (
          <div key={group.id} className="space-y-4">
            <h3 className={`font-mono font-bold ${group.color} tracking-wider border-b border-border/50 pb-2 flex items-center gap-2`}>
              <span className={`w-2 h-2 rounded-full ${group.bg}`}></span>
              {group.title}
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {group.items.map((mod: any, i: number) => {
                const isDone = !!progress.status[mod.code];
                const isOpen = openId === mod.code;
                return (
                  <motion.div 
                    key={mod.code}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`glass-panel rounded-2xl overflow-hidden group transition-all duration-300 ${isOpen ? `ring-2 ring-white/20 shadow-[0_0_30px_rgba(255,255,255,0.05)]` : ''}`}
                  >
                    <div 
                      className="p-6 flex items-start gap-5 cursor-pointer"
                      onClick={() => setOpenId(isOpen ? null : mod.code)}
                    >
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleModuleProgress(mod.code); }}
                        className={`mt-1 flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${isDone ? `${group.bg} border-transparent text-deep-void` : 'border-muted text-transparent hover:border-white/50'}`}
                      >
                        <CheckCircle size={20} className={isDone ? 'opacity-100' : 'opacity-0'} />
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`text-xs font-bold font-mono px-3 py-1 rounded-md ${group.color} bg-white/5 border border-white/10`}>{mod.code}</span>
                          <span className="text-xs font-mono text-muted bg-surface border border-border px-3 py-1 rounded-md">{mod.from} → {mod.to}</span>
                        </div>
                        <h3 className="text-xl font-extrabold text-white group-hover:text-gray-300 transition-colors">{mod.title}</h3>
                      </div>
                      <ChevronDown className={`text-muted transition-transform duration-300 mt-2 ${isOpen ? `rotate-180 ${group.color}` : ''}`} size={24} />
                    </div>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-border/30 bg-[#050A14]/50"
                        >
                          <div className="p-6 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div>
                                <h4 className="text-sm font-bold text-[#f59e0b] mb-4 flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] shadow-[0_0_8px_#f59e0b]"></span> Objetivos Generales</h4>
                                <ul className="space-y-3">
                                  {mod.og?.map((t:string, j:number) => <li key={j} className="text-sm text-gray-300 flex items-start gap-3"><span className="text-muted mt-0.5">›</span> {t}</li>)}
                                </ul>
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-[#14b8a6] mb-4 flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#14b8a6] shadow-[0_0_8px_#14b8a6]"></span> Objetivos IT / Sistemas</h4>
                                <ul className="space-y-3">
                                  {mod.oi?.map((t:string, j:number) => <li key={j} className="text-sm text-gray-300 flex items-start gap-3"><span className="text-muted mt-0.5">›</span> {t}</li>)}
                                </ul>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div>
                                <h4 className="text-sm font-bold text-[#f59e0b] mb-4">Vocabulario General</h4>
                                <div className="flex flex-wrap gap-2">
                                  {mod.vg?.map((v:string[], j:number) => (
                                    <div key={j} className="text-xs bg-surface border border-border rounded-xl px-3 py-1.5 flex gap-2 shadow-sm"><span className="text-gray-200 font-medium">{v[0]}</span><span className="text-muted">{v[1]}</span></div>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-[#14b8a6] mb-4">Vocabulario IT</h4>
                                <div className="flex flex-wrap gap-2">
                                  {mod.vi?.map((v:string[], j:number) => (
                                    <div key={j} className="text-xs bg-surface border border-border rounded-xl px-3 py-1.5 flex gap-2 shadow-sm"><span className="text-[#14b8a6] font-medium">{v[0]}</span><span className="text-muted">{v[1]}</span></div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div className="bg-surface2/50 border border-border/50 rounded-2xl p-5">
                                <h4 className="text-sm font-bold text-gray-400 mb-4">Gramática</h4>
                                <ul className="space-y-3">
                                  {mod.gr?.map((t:string, j:number) => <li key={j} className="text-sm text-gray-300 flex items-start gap-3"><span className={`${group.color} mt-0.5`}>›</span> {t}</li>)}
                                </ul>
                              </div>
                              <div className="bg-surface2/50 border border-border/50 rounded-2xl p-5">
                                <h4 className="text-sm font-bold text-gray-400 mb-4">Frases modelo</h4>
                                <div className="space-y-3">
                                  {mod.ph?.map((p:string, j:number) => (
                                    <div key={j} className={`text-sm font-mono bg-[#02050A]/80 border border-border/30 rounded-xl p-3 ${group.color} leading-relaxed shadow-inner`}>"{p}"</div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      </div>

      {/* Sidebar with Radar */}
      <div className="xl:w-80 shrink-0">
        <div className="glass-panel p-6 rounded-2xl sticky top-8">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-neon-cyan"></span> Skills Radar
          </h3>
          <div className="h-[250px]">
            <SkillsRadar />
          </div>
        </div>
      </div>

    </div>
  );
}
