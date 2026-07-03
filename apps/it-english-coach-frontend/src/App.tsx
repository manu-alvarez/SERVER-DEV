import React from 'react';
import { useAppStore } from './store';
import { Settings, BookOpen, MessageSquare, Headphones, FileText, LayoutDashboard, PenTool, Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import DashboardView from './views/DashboardView';
import TemarioView from './views/TemarioView';
import ReadingView from './views/ReadingView';
import ListeningView from './views/ListeningView';
import WritingView from './views/WritingView';
import SpeakingView from './views/SpeakingView';
import TutorView from './views/TutorView';
import SettingsView from './views/SettingsView';

function App() {
  const { activeTab, setActiveTab } = useAppStore();

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardView />;
      case 'temario': return <TemarioView />;
      case 'practica': return <ReadingView />;
      case 'pruebas': return <ListeningView />;
      case 'writing': return <WritingView />;
      case 'speaking': return <SpeakingView />;
      case 'tutor': return <TutorView />;
      case 'settings': return <SettingsView />;
      default: return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#02050A] font-inter text-gray-200 flex flex-col md:flex-row">
      {/* Background Orbs */}
      <div className="ambient-orb orb-1"></div>
      <div className="ambient-orb orb-2"></div>

      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 h-screen border-r border-border/30 bg-[#0A101C]/80 backdrop-blur-xl z-50 p-6">
        <div className="flex items-center gap-3 mb-10">
          <div className="h-10 w-10 rounded-xl bg-surface border border-border flex items-center justify-center shrink-0">
            <span className="text-xl">🇬🇧</span>
          </div>
          <h1 className="font-extrabold tracking-tight text-white text-lg leading-tight">IT English<br/><span className="text-neon-cyan">Coach</span></h1>
        </div>

        <nav className="flex-1 space-y-2">
          <SidebarBtn icon={<LayoutDashboard size={20} />} label="Panel General" active={activeTab==='dashboard'} onClick={()=>setActiveTab('dashboard')} />
          <SidebarBtn icon={<BookOpen size={20} />} label="Temario" active={activeTab==='temario'} onClick={()=>setActiveTab('temario')} />
          <SidebarBtn icon={<FileText size={20} />} label="Reading" active={activeTab==='practica'} onClick={()=>setActiveTab('practica')} />
          <SidebarBtn icon={<PenTool size={20} />} label="Writing" active={activeTab==='writing'} onClick={()=>setActiveTab('writing')} />
          <SidebarBtn icon={<Headphones size={20} />} label="Listening" active={activeTab==='pruebas'} onClick={()=>setActiveTab('pruebas')} />
          <SidebarBtn icon={<Mic size={20} />} label="Speaking" active={activeTab==='speaking'} onClick={()=>setActiveTab('speaking')} />
          <SidebarBtn icon={<MessageSquare size={20} />} label="Tutor IA" active={activeTab==='tutor'} onClick={()=>setActiveTab('tutor')} />
        </nav>

        <div className="mt-auto pt-6 border-t border-border/30">
          <SidebarBtn icon={<Settings size={20} />} label="Configuración" active={activeTab==='settings'} onClick={()=>setActiveTab('settings')} />
        </div>
      </aside>

      {/* Header (Mobile Only) */}
      <header className="md:hidden px-6 pt-10 pb-6 flex items-center gap-4 z-40 relative">
        <div className="h-12 w-12 rounded-xl bg-surface border border-border flex items-center justify-center shrink-0 glass-panel">
          <span className="text-2xl">🇬🇧</span>
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-extrabold tracking-tight text-white">IT English <span className="text-neon-cyan">Coach</span></h1>
        </div>
        <button onClick={() => setActiveTab('settings')} className="h-10 w-10 rounded-xl glass-panel flex items-center justify-center hover:scale-105 transition-transform">
          <Settings size={20} className={activeTab === 'settings' ? 'text-white' : 'text-neon-cyan'} />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto z-10 relative pb-24 md:pb-0 px-4 md:px-8 pt-4 md:pt-8 scroll-smooth">
        <div className="max-w-5xl mx-auto h-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Bottom Nav (Mobile Only) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0A101C] border-t border-border/30 rounded-t-3xl pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <div className="max-w-md mx-auto flex justify-between p-2">
          <NavBtn icon={<LayoutDashboard size={22} />} label="General" active={activeTab==='dashboard'} onClick={()=>setActiveTab('dashboard')} />
          <NavBtn icon={<BookOpen size={22} />} label="Temario" active={activeTab==='temario'} onClick={()=>setActiveTab('temario')} />
          <NavBtn icon={<FileText size={22} />} label="Read" active={activeTab==='practica'} onClick={()=>setActiveTab('practica')} />
          <NavBtn icon={<PenTool size={22} />} label="Write" active={activeTab==='writing'} onClick={()=>setActiveTab('writing')} />
          <NavBtn icon={<Headphones size={22} />} label="Listen" active={activeTab==='pruebas'} onClick={()=>setActiveTab('pruebas')} />
          <NavBtn icon={<Mic size={22} />} label="Speak" active={activeTab==='speaking'} onClick={()=>setActiveTab('speaking')} />
          <NavBtn icon={<MessageSquare size={22} />} label="Tutor" active={activeTab==='tutor'} onClick={()=>setActiveTab('tutor')} />
        </div>
      </nav>
    </div>
  );
}

function SidebarBtn({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick} 
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium ${active ? 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 shadow-[0_0_15px_rgba(0,255,204,0.1)]' : 'text-gray-400 hover:text-white hover:bg-surface'}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function NavBtn({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 rounded-2xl transition-all duration-300 ${active ? 'bg-surface text-neon-cyan shadow-[0_0_15px_rgba(0,255,204,0.15)]' : 'text-muted hover:text-white'}`}>
      {icon}
      <span className="text-[11px] font-medium tracking-wide">{label}</span>
    </button>
  );
}

export default App;
