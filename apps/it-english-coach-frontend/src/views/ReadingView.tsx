import { useState } from 'react';
import { READING, CATS } from '../lib/data';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, CheckCircle2, XCircle } from 'lucide-react';
import SkillsRadar from '../components/SkillsRadar';

export default function ReadingView() {
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const handleSelect = (rId: string, qIdx: number, optIdx: number) => {
    setAnswers(prev => ({ ...prev, [`${rId}-${qIdx}`]: optIdx }));
  };

  return (
    <div className="space-y-6 pb-12 w-full max-w-6xl mx-auto flex flex-col xl:flex-row gap-6">
      
      {/* Main Content */}
      <div className="flex-1 space-y-6">
        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between">
          <div>
            <h2 className="text-sm font-mono text-neon-cyan tracking-wider uppercase mb-1">Reading & Comprehension</h2>
            <p className="text-muted text-sm">Mejora tu comprensión lectora de IT.</p>
          </div>
          <FileText size={28} className="text-matrix-green opacity-80" />
        </div>

      <div className="space-y-10">
        {[
          { id: 'beginner', title: 'Beginner (A1-A2)', color: 'text-neon-cyan', bg: 'bg-neon-cyan', items: READING.filter(m => m.level === 'A1' || m.level === 'A2') },
          { id: 'intermediate', title: 'Intermediate (B1-B2)', color: 'text-amber-400', bg: 'bg-amber-400', items: READING.filter(m => m.level === 'B1' || m.level === 'B2') },
          { id: 'advanced', title: 'Advanced (C1-C2)', color: 'text-purple-400', bg: 'bg-purple-400', items: READING.filter(m => m.level === 'C1' || m.level === 'C2') }
        ].map(group => group.items.length > 0 && (
          <div key={group.id} className="space-y-4">
            <h3 className={`font-mono font-bold ${group.color} tracking-wider border-b border-border/50 pb-2 flex items-center gap-2`}>
              <span className={`w-2 h-2 rounded-full ${group.bg}`}></span>
              {group.title}
            </h3>
            <div className="space-y-8">
              {group.items.map((item: any, i: number) => (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="glass-panel rounded-2xl p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`text-xs font-mono px-2 py-0.5 rounded-md bg-surface border border-border ${group.color}`}>{item.level}</span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-surface border border-border text-muted uppercase">{(CATS as any)[item.cat]?.label || item.cat}</span>
                    <h3 className="text-lg font-bold text-white">{item.title}</h3>
                  </div>
                  
                  <div className="bg-[#02050A]/50 border border-border/30 rounded-xl p-5 mb-6 text-sm text-gray-300 leading-relaxed">
                    {item.text}
                  </div>
                  
                  <div className="space-y-6">
                    <h4 className="text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Comprehension Check</h4>
                    {item.qs.map((q: any, qIdx: number) => {
                      const ansKey = `${item.id}-${qIdx}`;
                      const userAns = answers[ansKey];
                      const isAnswered = userAns !== undefined;
                      const isCorrect = userAns === q.a;
                      
                      return (
                        <div key={qIdx} className={`bg-surface/50 border rounded-xl p-4 transition-colors ${isAnswered ? (isCorrect ? 'border-matrix-green/50' : 'border-red-500/50') : 'border-border/50'}`}>
                          <p className="text-sm font-medium text-white mb-3">{q.q}</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {q.opts.map((opt: string, oIdx: number) => {
                              const isSelected = userAns === oIdx;
                              const isWinningOpt = isAnswered && oIdx === q.a;
                              const isLosingOpt = isSelected && !isCorrect;
                              
                              let btnClass = "bg-surface border-border/50 text-muted hover:border-neon-cyan/50 hover:text-white";
                              if (isWinningOpt) btnClass = "bg-matrix-green/20 border-matrix-green text-matrix-green";
                              else if (isLosingOpt) btnClass = "bg-red-500/20 border-red-500 text-red-400";
                              
                              return (
                                <button 
                                  key={oIdx}
                                  disabled={isAnswered}
                                  onClick={() => handleSelect(item.id, qIdx, oIdx)}
                                  className={`flex items-center justify-between text-left px-3 py-2 rounded-lg border text-xs transition-all ${btnClass}`}
                                >
                                  <span>{opt}</span>
                                  {isWinningOpt && <CheckCircle2 size={14} className="shrink-0 ml-2" />}
                                  {isLosingOpt && <XCircle size={14} className="shrink-0 ml-2" />}
                                </button>
                              );
                            })}
                          </div>
                          <AnimatePresence>
                            {isAnswered && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="overflow-hidden">
                                <div className={`mt-3 text-xs p-3 rounded-lg bg-surface/80 border ${isCorrect ? 'border-matrix-green/20 text-matrix-green' : 'border-red-500/20 text-red-400'}`}>
                                  {q.ex}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
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
