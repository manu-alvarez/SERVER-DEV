import { useState, useEffect } from 'react';
import { SPEAKING, CATS } from '../lib/data';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, CheckCircle2, Circle, Loader2 } from 'lucide-react';
import SkillsRadar from '../components/SkillsRadar';
import { LiveKitRoom, RoomAudioRenderer, VoiceAssistantControlBar } from '@livekit/components-react';
import '@livekit/components-styles';

export default function SpeakingView() {
  const [activeTimer, setActiveTimer] = useState<string | null>(null);
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [checklistState, setChecklistState] = useState<Record<string, boolean[]>>({});
  
  // LiveKit State
  const [lkToken, setLkToken] = useState<string | null>(null);
  const [lkUrl, setLkUrl] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  // Fetch Proxy config on mount to know the LiveKit URL
  useEffect(() => {
    fetch('/__config')
      .then(r => r.json())
      .then(cfg => {
        if (cfg.livekitUrl) setLkUrl(cfg.livekitUrl);
      })
      .catch(() => setLkUrl('wss://nikolina-1jg7t00i.livekit.cloud')); // fallback
  }, []);

  const startLiveKit = async (id: string) => {
    setConnecting(true);
    setActiveTimer(id);
    try {
      const roomName = `coach-${id}-${Math.floor(Math.random() * 10000)}`;
      const res = await fetch('/_nikolina/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participant_identity: `user-${Math.floor(Math.random()*1000)}`,
          room_name: roomName
        })
      });
      if (!res.ok) throw new Error('Error fetching token');
      const data = await res.json();
      setLkToken(data.accessToken);
    } catch (e) {
      console.error(e);
      setActiveTimer(null);
    }
    setConnecting(false);
  };

  const handleComplete = (id: string) => {
    setActiveTimer(null);
    setLkToken(null);
    setCompleted(prev => ({ ...prev, [id]: true }));
    if (!checklistState[id]) {
      setChecklistState(prev => ({ ...prev, [id]: SPEAKING.find(s => s.id === id)?.checklist.map(() => false) || [] }));
    }
  };

  const toggleCheck = (id: string, idx: number) => {
    setChecklistState(prev => {
      const newState = [...(prev[id] || [])];
      newState[idx] = !newState[idx];
      return { ...prev, [id]: newState };
    });
  };

  return (
    <div className="space-y-6 pb-12 w-full max-w-6xl mx-auto flex flex-col xl:flex-row gap-6">
      
      {/* Main Content */}
      <div className="flex-1 space-y-6">
        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between">
          <div>
            <h2 className="text-sm font-mono text-neon-cyan tracking-wider uppercase mb-1">Speaking Practice (Live Agent)</h2>
            <p className="text-muted text-sm">Simula reuniones con un tutor de IA nativo. Habla en tiempo real por micrófono.</p>
          </div>
          <Mic size={28} className="text-neon-cyan opacity-80" />
        </div>

        <div className="space-y-10">
          {[
            { id: 'beginner', title: 'Beginner (A1-A2)', color: 'text-neon-cyan', bg: 'bg-neon-cyan', items: SPEAKING.filter(m => m.level === 'A1' || m.level === 'A2') },
            { id: 'intermediate', title: 'Intermediate (B1-B2)', color: 'text-amber-400', bg: 'bg-amber-400', items: SPEAKING.filter(m => m.level === 'B1' || m.level === 'B2') },
            { id: 'advanced', title: 'Advanced (C1-C2)', color: 'text-purple-400', bg: 'bg-purple-400', items: SPEAKING.filter(m => m.level === 'C1' || m.level === 'C2') }
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

                    <div className="bg-[#02050A]/50 border border-border/30 rounded-xl p-5 mb-6 text-center flex flex-col items-center">
                      <p className="text-lg font-medium text-white mb-6">"{item.prompt}"</p>
                      
                      {!completed[item.id] && activeTimer !== item.id && (
                        <button 
                          onClick={() => startLiveKit(item.id)}
                          disabled={connecting || !lkUrl}
                          className="bg-neon-cyan/10 hover:bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-50"
                        >
                          {connecting ? <Loader2 size={20} className="animate-spin" /> : <Mic size={20} />} 
                          {connecting ? 'Conectando al Tutor...' : 'Llamar al Tutor IA'}
                        </button>
                      )}

                      {activeTimer === item.id && lkToken && lkUrl && (
                        <div className="flex flex-col items-center w-full max-w-sm mt-4">
                          <LiveKitRoom
                            serverUrl={lkUrl}
                            token={lkToken}
                            connect={true}
                            audio={true}
                            video={false}
                            className="w-full flex flex-col items-center p-4 bg-surface rounded-xl border border-neon-cyan/30"
                          >
                            <RoomAudioRenderer />
                            <div className="h-16 w-full flex justify-center items-center mb-4">
                              <VoiceAssistantControlBar />
                            </div>
                            <button 
                              onClick={() => handleComplete(item.id)}
                              className="bg-red-500/20 text-red-400 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-500/30 transition-colors"
                            >
                              Finalizar Llamada
                            </button>
                          </LiveKitRoom>
                        </div>
                      )}
                    </div>
                    
                    <AnimatePresence>
                      {completed[item.id] && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="overflow-hidden">
                          <div className="bg-surface/50 border border-matrix-green/30 rounded-xl p-5">
                            <h4 className="text-xs font-bold text-matrix-green mb-3 uppercase tracking-wider">Checklist de Auto-Evaluación</h4>
                            <p className="text-sm text-gray-400 mb-4">¿Mencionaste los siguientes puntos clave durante tu conversación?</p>
                            <div className="space-y-2">
                              {item.checklist.map((check: string, idx: number) => {
                                const isChecked = checklistState[item.id]?.[idx];
                                return (
                                  <button
                                    key={idx}
                                    onClick={() => toggleCheck(item.id, idx)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${isChecked ? 'bg-matrix-green/10 border-matrix-green/50 text-white' : 'bg-[#02050A] border-border/50 text-gray-400 hover:border-gray-500'}`}
                                  >
                                    {isChecked ? <CheckCircle2 size={18} className="text-matrix-green shrink-0" /> : <Circle size={18} className="shrink-0" />}
                                    <span className="text-sm">{check}</span>
                                  </button>
                                );
                              })}
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
