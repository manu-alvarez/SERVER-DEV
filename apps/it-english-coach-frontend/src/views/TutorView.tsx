import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Bot } from 'lucide-react';
import { chat as chatLLM } from '../lib/llm';
import SkillsRadar from '../components/SkillsRadar';

export default function TutorView() {
  const [messages, setMessages] = useState<{role:string, content:string}[]>([{role:'assistant', content:'Hello! I am your IT English Coach. Tell me about your role or ask me to practice an interview.'}]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const handleSend = async () => {
    if(!input.trim() || loading) return;
    const msg = input.trim();
    setInput('');
    const newMsgs = [...messages, {role:'user', content:msg}];
    setMessages(newMsgs);
    setLoading(true);
    
    try {
      const system = "You are an IT English Coach. Keep responses concise, helpful, and focused on tech English. Correct mistakes gently.";
      const res = await chatLLM(newMsgs, system);
      setMessages([...newMsgs, {role:'assistant', content:res}]);
    } catch (e: any) {
      setMessages([...newMsgs, {role:'assistant', content:`⚠️ Error: ${e.message}`}]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col xl:flex-row gap-6 h-[calc(100vh-200px)] xl:h-[calc(100vh-100px)] pb-12">
      
      {/* Main Content (Chat) */}
      <div className="flex-1 flex flex-col h-full min-h-0">
        <div className="glass-panel p-4 rounded-t-2xl flex items-center justify-between border-b-0 rounded-b-none z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface border border-neon-cyan/30 flex items-center justify-center">
              <Bot size={22} className="text-neon-cyan" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">AI Tutor</h2>
              <p className="text-xs text-matrix-green">Connected</p>
            </div>
          </div>
        </div>

        <div className="flex-1 glass-panel rounded-none border-y-0 p-4 overflow-y-auto space-y-4" ref={scrollRef}>
          {messages.map((m, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${m.role==='user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${m.role==='user' ? 'bg-neon-cyan/10 border border-neon-cyan/20 text-white rounded-tr-sm' : 'bg-surface border border-border text-gray-200 rounded-tl-sm shadow-[0_4px_20px_rgba(0,0,0,0.3)]'}`}>
                {m.content}
              </div>
            </motion.div>
          ))}
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="bg-surface border border-border rounded-2xl rounded-tl-sm p-4 flex gap-1 items-center">
                <span className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse"></span>
                <span className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse delay-75"></span>
                <span className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse delay-150"></span>
              </div>
            </motion.div>
          )}
        </div>

        <div className="glass-panel p-4 rounded-b-2xl border-t-0 z-10 shrink-0">
          <div className="relative">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your message..."
              className="w-full bg-surface border border-border/50 text-white rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:border-neon-cyan transition-colors"
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-neon-cyan disabled:text-muted hover:bg-neon-cyan/10 rounded-lg transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar with Radar */}
      <div className="xl:w-80 shrink-0 hidden xl:block">
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
