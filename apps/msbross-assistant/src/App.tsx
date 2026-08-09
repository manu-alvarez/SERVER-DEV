import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChatContainer } from './components/chat/ChatContainer';
import { Button } from './components/ui/Button';
import { Plus, Wrench, Menu, Activity } from 'lucide-react';
import { useChatStore } from './store/useChatStore';
import { useModels } from './hooks/useModels';

import { StitchPanel } from './components/ui/StitchPanel';
import { ToolsPanel } from './components/ui/ToolsPanel';
import { C2Monitor } from './components/ui/C2Monitor';
import { AnimatePresence } from 'framer-motion';
import { ApiConfigModal } from './components/ui/ApiConfigModal';
import GodModeListener from './components/ui/GodModeListener';
import { useState } from 'react';

const queryClient = new QueryClient();

import { useQuery } from '@tanstack/react-query';

function Topbar({ onSettingsClick, onMonitorClick }: { onSettingsClick: () => void; onMonitorClick: () => void }) {
  const { setMessages, setIsToolsOpen } = useChatStore();
  const { data: models = [] } = useModels();
  
  const { data: nodeData } = useQuery({
    queryKey: ['nodes'],
    queryFn: async () => {
      const res = await fetch('/_msbross/api/nodes');
      return res.json();
    },
    refetchInterval: 5000
  });
  
  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-[#0f1115]/80 backdrop-blur-md absolute top-0 left-0 right-0 z-30">
      <div className="flex items-center gap-8">
        <h1 className="font-bold text-xl tracking-tight text-white flex items-center gap-1">
          MSBrOSs<span className="text-[#00ffcc] text-2xl leading-none" style={{ textShadow: '0 0 10px #00ffcc' }}>.</span>
        </h1>
        
        <div className="hidden md:flex items-center gap-2">
          <Button variant="ghost" className="text-white/70 hover:text-white gap-2 text-sm font-medium transition-all hover:bg-white/5" onClick={() => setIsToolsOpen(true)}>
            <Wrench className="w-4 h-4 text-[#ffcc00]" />
            Herramientas
          </Button>
          <Button variant="ghost" className="text-white/70 hover:text-white gap-2 text-sm font-medium transition-all hover:bg-white/5" onClick={onSettingsClick}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            APIs
          </Button>
          <Button variant="ghost" className="text-white/70 hover:text-white gap-2 text-sm font-medium transition-all hover:bg-white/5" onClick={onMonitorClick}>
            <Activity className="w-4 h-4 text-[#aa3bff]" />
            Monitor
          </Button>
          <Button variant="ghost" className="text-white/70 hover:text-white gap-2 text-sm font-medium transition-all hover:bg-white/5" onClick={() => { setMessages([]); alert("Nueva sesión iniciada."); }}>
            <Plus className="w-4 h-4 text-[#00ffcc]" />
            Nuevo
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {nodeData && nodeData.count > 0 && (
          <div className="hidden md:flex bg-[#aa3bff]/10 border border-[#aa3bff]/30 text-[#aa3bff] px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider items-center gap-2 shadow-[0_0_10px_rgba(170,59,255,0.2)]">
            <span className="w-2 h-2 rounded-full bg-[#aa3bff] animate-pulse"></span>
            {nodeData.count} NODOS C2
          </div>
        )}
        <div className="hidden md:flex bg-[#00ffcc]/5 border border-[#00ffcc]/20 text-[#00ffcc] px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] items-center gap-2 shadow-[0_0_15px_rgba(0,255,204,0.1)] relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00ffcc]/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
          <span className="w-2 h-2 rounded-full bg-[#00ffcc] animate-pulse shadow-[0_0_8px_#00ffcc]"></span>
          SISTEMA EN LÍNEA (+ {models.length} MODELOS)
        </div>
        <Button variant="ghost" size="icon" className="md:hidden text-white/70 hover:text-white" onClick={onSettingsClick} title="Configurar APIs">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        </Button>
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsToolsOpen(true)}>
          <Menu className="w-5 h-5" />
        </Button>
      </div>
    </header>
  );
}

function MSBrOSsApp() {
  const { stitch, isToolsOpen } = useChatStore();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [monitorOpen, setMonitorOpen] = useState(false);

  return (
    <div className="h-[100dvh] w-full bg-[#0a0c10] text-white flex flex-col overflow-hidden font-sans relative">
      <GodModeListener />
      <ApiConfigModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <Topbar onSettingsClick={() => setSettingsOpen(true)} onMonitorClick={() => setMonitorOpen(!monitorOpen)} />
      
      <main className="flex-1 pt-16 relative z-10 flex w-full h-full overflow-hidden">
        {/* Chat Area */}
        <div className={`flex-1 transition-all duration-500 relative h-full ${stitch.isOpen ? 'lg:w-1/2' : 'w-full'}`}>
          <ChatContainer />
        </div>

        {/* Stitch Panel Area */}
        <AnimatePresence>
          {stitch.isOpen && <StitchPanel />}
        </AnimatePresence>
        
        {/* Tools Panel */}
        <AnimatePresence>
          {isToolsOpen && <ToolsPanel />}
        </AnimatePresence>

        {/* C2 Monitor Panel */}
        <AnimatePresence>
          {monitorOpen && <C2Monitor isOpen={monitorOpen} onClose={() => setMonitorOpen(false)} />}
        </AnimatePresence>
      </main>
      
      {/* Background ambient glows */}
      <div className="fixed top-0 left-1/4 w-[40rem] h-[40rem] bg-[#00ffcc]/5 rounded-full blur-[120px] pointer-events-none z-0 mix-blend-screen"></div>
      <div className="fixed bottom-0 right-1/4 w-[40rem] h-[40rem] bg-[#aa3bff]/5 rounded-full blur-[120px] pointer-events-none z-0 mix-blend-screen"></div>
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(0,255,204,0.02)_0%,rgba(0,0,0,0)_70%)] pointer-events-none z-0"></div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MSBrOSsApp />
    </QueryClientProvider>
  );
}

export default App;
