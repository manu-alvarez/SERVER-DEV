import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Factory, Package, History, LogOut, Menu, X } from 'lucide-react';
import { setToken } from './api/client';
import api from './api/client';
import { useStore } from './store';

import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';
import OperationsView from './components/OperationsView';
import ProductsView from './components/ProductsView';
import HistoryView from './components/HistoryView';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { id: 'operations', label: 'Operaciones', icon: <Factory size={20} /> },
  { id: 'products', label: 'Productos', icon: <Package size={20} /> },
  { id: 'history', label: 'Historial', icon: <History size={20} /> },
];

export default function App() {
  const { user, setUser, logout } = useStore();
  const [view, setView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // We already persist the user in zustand, but we still check the token validitiy
    const authEnabled = import.meta.env.VITE_AUTH_ENABLED !== 'false';
    if (!authEnabled) {
      setUser({ id: 1, name: 'Admin', role: 'admin', created_at: '' });
      setChecking(false);
      return;
    }
    
    api.get('/auth/me')
      .then(r => setUser(r.data))
      .catch(() => { setToken(null); logout(); })
      .finally(() => setChecking(false));
  }, [setUser, logout]);

  if (checking) return null;

  if (!user) {
    return <LoginScreen />;
  }

  const renderView = () => {
    switch (view) {
      case 'dashboard': return <Dashboard onNavigate={setView} />;
      case 'operations': return <OperationsView />;
      case 'products': return <ProductsView />;
      case 'history': return <HistoryView />;
      default: return <Dashboard onNavigate={setView} />;
    }
  };

  const handleLogout = () => {
    setToken(null);
    logout();
  };

  return (
    <div className="min-h-screen flex bg-msb-dark text-slate-200">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={`fixed inset-y-0 left-0 z-50 w-64 glass-panel border-l-0 border-y-0 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:block ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex flex-col h-full">
          <div className="h-16 flex items-center px-6 border-b border-white/5">
            <Factory className="text-msb-primary mr-3" size={24} />
            <h1 className="text-xl font-bold neon-text-primary">IndustrialPro</h1>
          </div>

          <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => { setView(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  view === item.id 
                  ? 'bg-msb-primary/10 text-msb-primary neon-border' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </div>

          <div className="p-4 border-t border-white/5">
            <div className="flex items-center gap-3 px-4 py-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-msb-primary/20 flex items-center justify-center text-msb-primary font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium truncate text-white">{user.name}</p>
                <p className="text-xs text-slate-400 truncate">{user.role}</p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-400 hover:text-msb-error hover:bg-msb-error/10 rounded-lg transition-colors"
            >
              <LogOut size={16} />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden h-16 glass-panel border-x-0 border-t-0 flex items-center justify-between px-4 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <Factory className="text-msb-primary" size={24} />
            <span className="font-bold text-lg neon-text-primary">IndustrialPro</span>
          </div>
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
          >
            <Menu size={24} />
          </button>
        </header>

        {/* View Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            {renderView()}
          </div>
        </main>
      </div>
    </div>
  );
}
