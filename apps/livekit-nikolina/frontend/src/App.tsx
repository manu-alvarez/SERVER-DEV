import React, { useState } from 'react';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  VoiceAssistantControlBar,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Phone, Calendar as CalendarIcon, Settings, LogIn, Mic, Power, Menu, X } from 'lucide-react';

import { useNikolinaBackend } from './hooks/useNikolinaBackend';
import { NeuralOrb } from './components/agent/NeuralOrb';
import { MenuGrid } from './components/views/MenuGrid';
import { ReservationsList } from './components/views/ReservationsList';
import { CallHistory } from './components/views/CallHistory';
import { AdminDashboard } from './components/views/AdminDashboard';

type TabType = 'assistant' | 'menu' | 'reservations' | 'calls' | 'admin';

const LIVEKIT_URL = (import.meta as any).env.VITE_LIVEKIT_URL || 
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? 'wss://nikolina-1jg7t00i.livekit.cloud'
    : (typeof window !== 'undefined' ? `ws://${window.location.hostname}:7880` : 'ws://127.0.0.1:7880'));

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('assistant');
  const [adminPassword, setAdminPassword] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [isLivekitConnected, setIsLivekitConnected] = useState(false);
  const [livekitToken, setLivekitToken] = useState('');

  const {
    isConnectedBackend,
    isLoggedIn,
    isLoggingIn,
    loginError,
    restaurantInfo,
    menuItems,
    reservations,
    calls,
    login,
    generateLivekitToken
  } = useNikolinaBackend();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login(adminPassword);
  };

  const connectToVoice = async () => {
    try {
      const token = await generateLivekitToken(`Admin-${Math.floor(Math.random() * 1000)}`);
      setLivekitToken(token);
      setIsLivekitConnected(true);
    } catch (e) {
      alert('Error de conexión a la IA.');
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#050b14]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-[#050b14] to-[#050b14] z-0"></div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 w-full max-w-md p-8 rounded-3xl bg-[#0a1520]/80 backdrop-blur-2xl border border-white/5 shadow-2xl"
        >
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.3)]">
              <Power className="w-8 h-8 text-cyan-400" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-center text-white mb-2 tracking-tight">Nikolina AI</h1>
          <p className="text-center text-gray-400 text-sm mb-8">Autenticación requerida para acceder al core.</p>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <input 
                type="password" 
                placeholder="Secure Password"
                value={adminPassword}
                onChange={e => setAdminPassword(e.target.value)}
                className="w-full bg-[#050b14] text-white border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all font-mono"
                required
              />
            </div>
            {loginError && (
              <p className="text-red-400 text-sm text-center font-mono">{loginError}</p>
            )}
            <button 
              type="submit" 
              disabled={isLoggingIn}
              className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] disabled:opacity-50"
            >
              {isLoggingIn ? 'Verificando...' : <><LogIn className="w-5 h-5" /> Iniciar Sesión</>}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  const tabs = [
    { id: 'assistant', label: 'Asistente IA', icon: Mic },
    { id: 'menu', label: 'Carta Digital', icon: LayoutDashboard },
    { id: 'reservations', label: 'Reservas', icon: CalendarIcon },
    { id: 'calls', label: 'Llamadas', icon: Phone },
    { id: 'admin', label: 'Sistema', icon: Settings }
  ];

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#050b14] overflow-hidden text-gray-100 font-sans">
      
      {/* GLOBAL HEADER */}
      <div className="flex items-center justify-between p-4 bg-[#0a1520] border-b border-white/5 z-30 shrink-0 shadow-lg md:hidden">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 p-0.5">
            <div className="w-full h-full bg-[#0a1520] rounded-[6px] flex items-center justify-center">
              <Mic className="w-4 h-4 text-cyan-400" />
            </div>
          </div>
          <h1 className="font-bold text-md text-white">Nikolina AI</h1>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-gray-300 p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* MOBILE BACKDROP */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`fixed lg:relative top-0 left-0 w-72 lg:w-64 h-full bg-[#0a1520] border-r border-white/5 flex flex-col z-50 shadow-2xl transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 p-0.5 shadow-[0_0_15px_rgba(6,182,212,0.5)]">
              <div className="w-full h-full bg-[#0a1520] rounded-[10px] flex items-center justify-center">
                <Mic className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight text-white leading-tight">Nikolina AI</h1>
              <p className="text-[10px] font-mono text-cyan-400/80 uppercase tracking-widest">{restaurantInfo.name}</p>
            </div>
          </div>
          <button 
            className="lg:hidden text-gray-400 hover:text-white p-2" 
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as TabType);
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium text-sm ${
                activeTab === tab.id 
                  ? 'bg-cyan-500/10 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.1)]' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </nav>
        
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.02] rounded-lg border border-white/5">
            <div className={`w-2 h-2 rounded-full ${isConnectedBackend ? 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-red-500'} animate-pulse`}></div>
            <span className="text-xs font-mono text-gray-400">
              {isConnectedBackend ? 'SYS_ONLINE' : 'SYS_OFFLINE'}
            </span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 relative overflow-y-auto">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-900/10 via-[#050b14] to-[#050b14] pointer-events-none"></div>
        
        <div className="p-8 max-w-6xl mx-auto min-h-full relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'assistant' && (
                <div className="flex flex-col items-center justify-center min-h-[70vh]">
                  {!isLivekitConnected ? (
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-center"
                    >
                      <h2 className="text-4xl font-serif text-white mb-4 font-bold tracking-tight">Activar Asistente Vocal</h2>
                      <p className="text-gray-400 max-w-md mx-auto mb-8 leading-relaxed">
                        Nikolina se conectará mediante WebRTC de baja latencia a la sala segura de LiveKit para tomar pedidos o resolver dudas.
                      </p>
                      <button 
                        onClick={connectToVoice} 
                        className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold py-4 px-8 rounded-full shadow-[0_0_30px_rgba(6,182,212,0.6)] hover:shadow-[0_0_50px_rgba(6,182,212,0.8)] transition-all transform hover:scale-105"
                      >
                        Conectar a Nikolina
                      </button>
                    </motion.div>
                  ) : (
                    <LiveKitRoom
                      serverUrl={LIVEKIT_URL}
                      token={livekitToken}
                      connect={true}
                      audio={true}
                      video={false}
                      className="w-full max-w-3xl flex flex-col items-center"
                    >
                      <div className="mb-12">
                        <NeuralOrb />
                        <p className="text-center text-cyan-400 font-mono mt-4 opacity-70 tracking-widest text-sm">ENLACE ACTIVO</p>
                      </div>
                      
                      <div className="bg-[#0a1520] border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-xl w-full">
                        <RoomAudioRenderer />
                        <VoiceAssistantControlBar />
                      </div>
                      
                      <button 
                        onClick={() => setIsLivekitConnected(false)} 
                        className="mt-8 text-sm text-red-400 hover:text-red-300 font-mono flex items-center gap-2 px-4 py-2 bg-red-500/10 rounded-lg transition-colors border border-red-500/20"
                      >
                        <Power className="w-4 h-4" /> Desconectar Sesión
                      </button>
                    </LiveKitRoom>
                  )}
                </div>
              )}

              {activeTab === 'menu' && <MenuGrid menuItems={menuItems} />}
              {activeTab === 'reservations' && <ReservationsList reservations={reservations} />}
              {activeTab === 'calls' && <CallHistory calls={calls} />}
              {activeTab === 'admin' && (
                <AdminDashboard 
                  isConnectedBackend={isConnectedBackend} 
                  reservationsCount={reservations.length} 
                  callsCount={calls.length} 
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
