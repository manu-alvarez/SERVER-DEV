import { useEffect, useState } from 'react';
import { useStore } from './store';
import { api, getToken, setToken } from './api/client';
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';
import CheckListView from './components/CheckListView';
import ExpiryView from './components/ExpiryView';
import IncidentsView from './components/IncidentsView';
import TimesheetView from './components/TimesheetView';
import SettingsView from './components/SettingsView';
import { cn } from './components/ui';

import { 
  LayoutDashboard, 
  ClipboardCheck, 
  Calendar, 
  AlertTriangle, 
  Clock, 
  Settings, 
  Menu,
  X,
  LogOut
} from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { id: 'checklist', label: 'Checklists', icon: <ClipboardCheck size={20} /> },
  { id: 'expiry', label: 'Caducidades', icon: <Calendar size={20} /> },
  { id: 'incidents', label: 'Incidencias', icon: <AlertTriangle size={20} /> },
  { id: 'timesheet', label: 'Timesheet', icon: <Clock size={20} /> },
  { id: 'settings', label: 'Ajustes', icon: <Settings size={20} /> },
];

export default function App() {
  const { user, view, setUser, setView, logout } = useStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = getToken();
    const authEnabled = import.meta.env.VITE_AUTH_ENABLED !== 'false';
    if (!authEnabled) {
      setUser({ id: '1', name: 'Admin', role: 'encargado', pin: '0000', created_at: '' });
      setChecking(false);
      return;
    }
    
    if (token) {
      api.me().then(u => setUser(u)).catch(() => { setToken(null); setUser(null); }).finally(() => setChecking(false));
    } else {
      setChecking(false);
    }
  }, [setUser]);

  const handleLogout = () => {
    setToken(null);
    logout();
  };

  const renderView = () => {
    switch (view) {
      case 'dashboard': return <Dashboard onNavigate={(v) => { setView(v); setDrawerOpen(false); }} />;
      case 'checklist': return <CheckListView />;
      case 'expiry': return <ExpiryView />;
      case 'incidents': return <IncidentsView />;
      case 'timesheet': return <TimesheetView />;
      case 'settings': return <SettingsView onLogout={handleLogout} />;
      default: return <Dashboard onNavigate={(v) => { setView(v); setDrawerOpen(false); }} />;
    }
  };

  if (checking) return null;

  if (!user) {
    return (
      <div className="relative min-h-screen">
        <div className="bg-orbs-container">
          <div className="orb orb-1" />
          <div className="orb orb-2" />
        </div>
        <LoginScreen onLogin={setUser} />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground flex overflow-hidden">
      <div className="bg-orbs-container">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      {/* Mobile Drawer Overlay */}
      {drawerOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 glass-panel border-r border-white/5 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex-shrink-0 flex flex-col",
        drawerOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-white/5">
          <span className="text-xl font-bold text-gradient">Gas Station</span>
          <button className="lg:hidden text-muted-foreground hover:text-white" onClick={() => setDrawerOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setView(item.id); setDrawerOpen(false); }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium",
                view === item.id 
                  ? "bg-brand-500/20 text-brand-400" 
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold text-sm border border-brand-500/30">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 truncate">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.role || 'Operador'}</p>
            </div>
            <button onClick={handleLogout} className="text-muted-foreground hover:text-red-400 transition-colors" title="Cerrar sesión">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 flex items-center gap-4 px-4 lg:px-8 border-b border-white/5 bg-background/50 backdrop-blur-md z-30">
          <button className="lg:hidden text-muted-foreground hover:text-foreground" onClick={() => setDrawerOpen(true)}>
            <Menu size={24} />
          </button>
          <div className="flex-1" />
        </header>

        {/* View Container */}
        <div className="flex-1 overflow-auto custom-scrollbar p-4 lg:p-8">
          <div className="max-w-7xl mx-auto h-full">
            {renderView()}
          </div>
        </div>
      </main>
    </div>
  );
}
