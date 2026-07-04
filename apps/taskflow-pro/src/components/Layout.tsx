import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Menu, LayoutDashboard, CheckSquare, Tags, Settings, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTaskStore } from '../store/taskStore';

const menuItems = [
  { text: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/' },
  { text: 'Misiones', icon: <CheckSquare size={20} />, path: '/tasks' },
  { text: 'Categorías', icon: <Tags size={20} />, path: '/categories' },
  { text: 'Ajustes', icon: <Settings size={20} />, path: '/settings' },
];

const Layout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useTaskStore();

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-transparent">
      {/* Header */}
      <div className="px-6 py-8 flex flex-col items-start relative z-10">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="text-brand-400" size={24} />
          <h1 className="text-3xl font-display font-black tracking-tight text-gradient">
            TaskFlow
          </h1>
        </div>
        <p className="text-[10px] font-bold tracking-[0.2em] text-white/40 uppercase">Omnimode Activated</p>
      </div>

      {/* User Profile */}
      <div className="px-6 mb-8 relative z-10">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-brand-500/30 transition-all duration-300">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-500 to-accent-500 text-white flex items-center justify-center font-black text-lg shadow-[0_0_15px_rgba(6,182,212,0.4)]">
            {(settings.whatsappPhone1 || 'U')[0].toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-bold text-white/90">{settings.whatsappPhone1 || 'Comandante MSB'}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2 relative z-10">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path === '/tasks' && location.pathname.startsWith('/tasks'));
          return (
            <button
              key={item.text}
              onClick={() => {
                navigate(item.path);
                setMobileOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden cursor-pointer ${
                isActive ? 'text-white' : 'text-muted-foreground hover:text-white'
              }`}
            >
              {isActive && (
                <motion.div layoutId="navGlow" className="absolute inset-0 bg-gradient-to-r from-brand-500/20 to-accent-500/5 rounded-xl border border-brand-500/20" />
              )}
              {!isActive && (
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
              )}

              <div className="flex items-center gap-3 relative z-10">
                <span className={`${isActive ? 'text-brand-400' : 'text-white/40 group-hover:text-white/80'} transition-colors`}>{item.icon}</span>
                <span className={`text-sm ${isActive ? 'font-black' : 'font-semibold tracking-wide'}`}>{item.text}</span>
              </div>
              {isActive && (
                <motion.div layoutId="activeNavIndicator" className="w-1.5 h-1.5 rounded-full bg-brand-400 shadow-[0_0_10px_rgba(34,211,238,0.8)] relative z-10" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-6 relative z-10">
        <div className="p-4 rounded-2xl bg-black/40 border border-white/5 backdrop-blur-md">
          <span className="block text-[10px] font-black tracking-widest text-white/50 mb-1 uppercase">Sistema Núcleo</span>
          <a href="https://msbross.me/" target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-accent-400 hover:text-accent-300 transition-colors">
            msbross.me
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen text-white relative">
      <div className="bg-orbs-container">
        <div className="orb orb-1"></div><div className="orb orb-2"></div><div className="orb orb-3"></div>
      </div>
      
      {/* Mobile AppBar */}
      <header className="md:hidden fixed top-0 w-full z-40 bg-background/80 backdrop-blur-2xl border-b border-white/5 px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="text-brand-400" size={20} />
          <h1 className="text-xl font-display font-black tracking-tight text-gradient">
            TaskFlow
          </h1>
        </div>
        <button onClick={handleDrawerToggle} className="p-2 text-white/80 hover:text-white bg-white/5 rounded-full">
          <Menu size={20} />
        </button>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={handleDrawerToggle}
              className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-md z-40"
            />
            <motion.div 
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="md:hidden fixed inset-y-0 left-0 w-[280px] bg-card border-r border-white/5 z-50 overflow-y-auto"
            >
              <div className="absolute top-4 right-4 z-50">
                <button onClick={handleDrawerToggle} className="p-2 text-muted-foreground hover:text-white bg-white/5 rounded-full cursor-pointer">
                  <X size={20} />
                </button>
              </div>
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar (Floating Glass Style) */}
      <div className="hidden md:flex p-6 pr-0">
        <aside className="flex flex-col w-[280px] glass-panel rounded-3xl h-[calc(100vh-48px)] sticky top-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-brand-500/5 to-transparent pointer-events-none" />
          <SidebarContent />
        </aside>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col w-full px-4 py-6 md:p-6 md:pl-10 mt-16 md:mt-0 min-h-screen">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname + location.search}
            initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -20, filter: 'blur(8px)' }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="flex-1 flex flex-col max-w-6xl"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Layout;
