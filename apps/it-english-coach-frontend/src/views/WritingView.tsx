import { useState } from 'react';
import { WRITING, CATS } from '../lib/data';
import { motion, AnimatePresence } from 'framer-motion';
import { PenTool, Send, Loader2 } from 'lucide-react';
import SkillsRadar from '../components/SkillsRadar';

export default function WritingView() {
  const [texts, setTexts] = useState<Record<string, string>>({});
  const [evaluating, setEvaluating] = useState<string | null>(null);
  const [feedbacks, setFeedbacks] = useState<Record<string, string>>({});

  const handleTextChange = (id: string, val: string) => {
    setTexts(prev => ({ ...prev, [id]: val }));
  };

  const handleEvaluate = async (id: string, promptText: string) => {
    const userText = texts[id];
    if (!userText || userText.trim() === '') return;

    setEvaluating(id);
    try {
      const response = await fetch('/_coach/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: `You are an expert IT English Teacher. The user was asked to write: "${promptText}". The user wrote: "${userText}". Provide a short, constructive evaluation. Rate their English level (A1-C2) based on the text, point out grammar mistakes if any, and suggest a better way to write it. Keep it concise, using markdown.`
        })
      });
      if (!response.ok) throw new Error('API Error');
      const data = await response.json();
      setFeedbacks(prev => ({ ...prev, [id]: data.text || "No feedback received." }));
    } catch (err) {
      setFeedbacks(prev => ({ ...prev, [id]: "Error evaluating the text. Please try again later." }));
    }
    setEvaluating(null);
  };

  return (
    <div className="space-y-6 pb-12 w-full max-w-6xl mx-auto flex flex-col xl:flex-row gap-6">
      
      {/* Main Content */}
      <div className="flex-1 space-y-6">
        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between">
          <div>
            <h2 className="text-sm font-mono text-neon-cyan tracking-wider uppercase mb-1">Writing Practice</h2>
            <p className="text-muted text-sm">Redacta emails y mensajes basados en escenarios reales IT.</p>
          </div>
          <PenTool size={28} className="text-neon-cyan opacity-80" />
        </div>

        <div className="space-y-10">
          {[
            { id: 'beginner', title: 'Beginner (A1-A2)', color: 'text-neon-cyan', bg: 'bg-neon-cyan', items: WRITING.filter(m => m.level === 'A1' || m.level === 'A2') },
            { id: 'intermediate', title: 'Intermediate (B1-B2)', color: 'text-amber-400', bg: 'bg-amber-400', items: WRITING.filter(m => m.level === 'B1' || m.level === 'B2') },
            { id: 'advanced', title: 'Advanced (C1-C2)', color: 'text-purple-400', bg: 'bg-purple-400', items: WRITING.filter(m => m.level === 'C1' || m.level === 'C2') }
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
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="glass-panel rounded-2xl p-6"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <span className={`text-xs font-mono px-2 py-0.5 rounded-md bg-surface border border-border ${group.color}`}>{item.level}</span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-surface border border-border text-muted uppercase">{(CATS as any)[item.cat]?.label || item.cat}</span>
                      <h3 className="text-lg font-bold text-white">{item.title}</h3>
                    </div>

                    <div className="bg-[#02050A]/50 border border-border/30 rounded-xl p-5 mb-6">
                      <p className="text-sm text-gray-300 leading-relaxed mb-4">{item.prompt}</p>
                      
                      <textarea
                        value={texts[item.id] || ''}
                        onChange={(e) => handleTextChange(item.id, e.target.value)}
                        placeholder={item.hint || "Type your answer here..."}
                        className="w-full h-32 bg-surface border border-border/50 rounded-xl p-4 text-sm text-white placeholder-muted focus:outline-none focus:border-neon-cyan/50 resize-none transition-colors"
                        disabled={!!feedbacks[item.id] || evaluating === item.id}
                      ></textarea>

                      {!feedbacks[item.id] && (
                        <div className="flex justify-end mt-4">
                          <button
                            onClick={() => handleEvaluate(item.id, item.prompt)}
                            disabled={!texts[item.id] || texts[item.id].trim() === '' || evaluating === item.id}
                            className="flex items-center gap-2 bg-neon-cyan/10 hover:bg-neon-cyan/20 text-neon-cyan px-4 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-50"
                          >
                            {evaluating === item.id ? (
                              <><Loader2 size={16} className="animate-spin" /> Evaluando...</>
                            ) : (
                              <><Send size={16} /> Evaluar con IA</>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <AnimatePresence>
                      {feedbacks[item.id] && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="overflow-hidden">
                          <div className="bg-surface/50 border border-neon-cyan/30 rounded-xl p-5">
                            <h4 className="text-xs font-bold text-neon-cyan mb-3 uppercase tracking-wider">AI Evaluation</h4>
                            <div className="prose prose-invert prose-sm max-w-none text-gray-300">
                              {feedbacks[item.id].split('\n').map((paragraph: string, idx: number) => (
                                <p key={idx}>{paragraph}</p>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

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
