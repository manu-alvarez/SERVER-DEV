import { Link, Outlet, useLocation } from 'react-router-dom';
import { Activity, Bot, LayoutTemplate, Network, Phone } from 'lucide-react';

export default function Layout() {
  const location = useLocation();

  const links = [
    { name: 'Dashboard', path: '/', icon: Activity },
    { name: 'Agentes IA', path: '/agents', icon: Bot },
    { name: 'SaaS Tools', path: '/saas', icon: LayoutTemplate },
    { name: 'Arquitectura', path: '/architecture', icon: Network },
    { name: 'Contacto', path: '/contact', icon: Phone }
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar Glass Panel */}
      <aside className="w-64 flex-shrink-0 glass-panel border-r border-white/5 flex flex-col m-4 rounded-2xl overflow-hidden z-20 relative">
        <div className="p-6 border-b border-white/5">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center shadow-[0_0_15px_rgba(0,229,255,0.4)]">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight glow-text">MSBross</span>
          </Link>
        </div>
        
        <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
          {links.map(link => {
            const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path));
            const Icon = link.icon;
            return (
              <Link 
                key={link.path}
                to={link.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${isActive ? 'bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30 shadow-[0_0_10px_rgba(0,229,255,0.15)]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#00E5FF]' : ''}`} />
                <span className="font-medium text-sm">{link.name}</span>
              </Link>
            );
          })}
        </div>

        <div className="p-6 border-t border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            <span className="text-xs text-gray-400 font-mono">SYS_ONLINE</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-screen overflow-y-auto relative">
        <div className="p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
