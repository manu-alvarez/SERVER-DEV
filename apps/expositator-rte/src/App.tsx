import React, { useRef } from 'react';
import { useExpositatorStore } from './store/expositatorStore';
import { useSpeechEngine } from './hooks/useSpeechEngine';
import { useEvaluator } from './hooks/useEvaluator';
import { WebcamViewport } from './components/WebcamViewport';
import { VisionDropzone } from './components/VisionDropzone';
import { TribunalLogs } from './components/TribunalLogs';
import { MetricsPanel } from './components/MetricsPanel';

function App() {
  const { 
    apiKey, setApiKey, 
    knowledgeBase, setKnowledgeBase, 
    isRunning, startSession, stopSession,
    addLog
  } = useExpositatorStore();

  const { resetMetrics, processUtterance, processSilence } = useEvaluator();
  const { initSpeechEngine, stopSpeechEngine, transcript, handlePartial } = useSpeechEngine();
  
  const apiKeyInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveApi = () => {
    const val = apiKeyInputRef.current?.value.trim();
    if (val) {
      setApiKey(val);
      addLog({ level: 'INFO', type: 'CONFIG', message: 'API_KEY_STORED_LOCALLY' });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setKnowledgeBase(evt.target?.result as string);
      addLog({ level: 'INFO', type: 'CONFIG', message: `Knowledge Base loaded: ${file.name} (${Math.round((evt.target?.result as string).length / 1024)} KB)` });
    };
    reader.readAsText(file);
  };

  const toggleSession = () => {
    if (!isRunning) {
      startSession();
      resetMetrics();
      initSpeechEngine({
        onPartial: handlePartial,
        onUtterance: processUtterance,
        onSilence: processSilence,
        onError: (err) => addLog({ level: 'CRITICAL', type: 'SPEECH_ENGINE_ERROR', message: err })
      });
      addLog({ level: 'INFO', type: 'SYSTEM', message: 'Session started. RAG engine armed.' });
    } else {
      stopSession();
      stopSpeechEngine();
      addLog({ level: 'INFO', type: 'SYSTEM', message: 'Session terminated.' });
    }
  };

  return (
    <>
      {/* Background Orbs */}
      <div className="bg-orbs-container">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      <div className="h-screen w-screen flex p-4 gap-6 overflow-hidden">
        {/* Main Content Area */}
        <main className="flex-1 flex flex-col gap-6">
          
          {/* Header */}
          <header className="glass-panel p-4 rounded-2xl flex justify-between items-center shadow-xl">
            <h1 className="text-2xl font-display font-black tracking-tight text-white flex items-center gap-4">
              <div className={`w-3 h-3 rounded-full shadow-lg ${isRunning ? 'bg-red-500 animate-pulse shadow-red-500/50' : 'bg-slate-500'}`}></div>
              EXPOSITATOR <span className="text-gradient">RTE</span>
            </h1>
            
            <div className="flex gap-3 items-center bg-black/40 p-1.5 rounded-xl border border-white/10">
              <input 
                ref={apiKeyInputRef}
                type="password" 
                defaultValue={apiKey}
                placeholder="Gemini API Key..." 
                className="bg-transparent border-none px-4 py-2 text-sm font-mono text-brand-400 focus:outline-none w-64 placeholder-slate-500"
              />
              <button 
                onClick={handleSaveApi}
                className="bg-white/5 hover:bg-white/10 text-slate-300 px-4 py-2 rounded-lg text-xs font-bold transition-colors"
              >
                {apiKey ? '✓ GUARDADA' : 'GUARDAR API'}
              </button>
              <div className="w-px h-8 bg-white/10 mx-1"></div>
              
              <div className="portal-card h-[38px] w-[160px]">
                <button 
                  onClick={toggleSession}
                  className="portal-card-inner btn-premium text-sm font-bold flex items-center justify-center w-full shadow-lg"
                >
                  {isRunning ? 'FINALIZAR' : 'INICIAR SESIÓN'}
                </button>
              </div>
            </div>
          </header>
          
          {/* Main Visual Arena */}
          <div className="portal-card flex-1 flex flex-col">
            <section className="portal-card-inner flex flex-col overflow-hidden relative shadow-2xl">
              <WebcamViewport />
              <VisionDropzone />
              
              {/* Transcript Footer */}
              <div className="h-28 bg-black/80 border-t border-white/10 p-4 overflow-y-auto custom-scrollbar relative z-10 backdrop-blur-md">
                <p className="text-slate-300 font-display text-lg leading-relaxed">
                  {transcript || <span className="text-white/20 italic font-mono text-sm">Esperando señal de voz...</span>}
                </p>
              </div>
            </section>
          </div>
        </main>

        {/* Sidebar Tribunal */}
        <div className="portal-card w-1/3 flex flex-col">
          <aside className="portal-card-inner flex flex-col p-5 shadow-2xl">
            <MetricsPanel />

            {/* Knowledge Base Input */}
            <div className="bg-black/40 p-4 rounded-xl border border-white/10 mb-4 flex flex-col gap-2">
              <div className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase">Base de Conocimiento (.TXT / .MD)</div>
              <input 
                ref={fileInputRef}
                onChange={handleFileChange}
                type="file" 
                accept=".txt,.md" 
                className="text-xs text-slate-300 file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-white/10 file:text-brand-400 hover:file:bg-white/20 cursor-pointer"
              />
              <div className={`text-[10px] mt-1 font-mono ${knowledgeBase ? 'text-brand-400' : 'text-amber-500'}`}>
                {knowledgeBase ? '✓ Motor RAG armado y listo.' : '⚠️ Documento no cargado. Evaluación genérica activa.'}
              </div>
            </div>

            {/* Logs Output */}
            <TribunalLogs />
          </aside>
        </div>
      </div>
    </>
  );
}

export default App;
