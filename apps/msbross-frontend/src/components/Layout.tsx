import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Activity, LayoutTemplate, Network, Phone, User, ChevronDown, ChevronRight, Menu, X } from 'lucide-react';

export default function Layout() {
  const location = useLocation();
  const [isAppsOpen, setIsAppsOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const mainLinks = [
    { name: 'Dashboard', path: '/', icon: Activity },
    { name: 'ARQUITECTURA', path: '/architecture', icon: Network },
    { name: 'PERFIL TÉCNICO', path: '/profile', icon: User },
    { name: 'CONTACTO', path: '/contact', icon: Phone }
  ];

  const appCategories = [
    { name: 'DEV AI', path: '/saas?cat=dev-ai' },
    { name: 'SPORTS AI', path: '/saas?cat=sports-ai' },
    { name: 'CREATIVE AI', path: '/saas?cat=creative-ai' },
    { name: 'VISION PLAY', path: '/saas?cat=vision-play' },
    { name: 'ENTERPRISE', path: '/saas?cat=enterprise' }
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#0A101C]">
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Glass Panel */}
      <aside 
        className={`fixed lg:relative w-72 lg:w-64 flex-shrink-0 flex flex-col my-4 ml-4 rounded-2xl overflow-hidden z-50 h-[calc(100vh-2rem)] transition-transform duration-300 ease-in-out bg-[#050B14] lg:bg-[#111827]/70 backdrop-blur-xl border border-white/5 shadow-[20px_0_40px_rgba(0,0,0,0.5)] lg:shadow-none ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-[150%] lg:translate-x-0'}`}
      >
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center shadow-[0_0_15px_rgba(0,229,255,0.4)] p-1.5">
              <img src="/logo-icon.svg" className="w-full h-full object-contain" alt="MSBross Logo" />
            </div>
            <span className="font-bold text-xl tracking-tight glow-text">MSBross</span>
          </Link>
          <button 
            className="lg:hidden p-2 text-gray-400 hover:text-white"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
          {/* Dashboard */}
          <Link 
            to="/"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${location.pathname === '/' ? 'bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30 shadow-[0_0_10px_rgba(0,229,255,0.15)]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
          >
            <Activity className={`w-5 h-5 ${location.pathname === '/' ? 'text-[#00E5FF]' : ''}`} />
            <span className="font-medium text-sm">Dashboard</span>
          </Link>

          {/* SaaS Dropdown */}
          <div className="pt-2 pb-1">
            <button 
              onClick={() => setIsAppsOpen(!isAppsOpen)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 ${location.pathname.startsWith('/saas') && !isAppsOpen ? 'bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
            >
              <div className="flex items-center gap-3">
                <LayoutTemplate className={`w-5 h-5 ${location.pathname.startsWith('/saas') && !isAppsOpen ? 'text-[#00E5FF]' : ''}`} />
                <span className="font-medium text-sm">SAAS & APPS</span>
              </div>
              {isAppsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            
            {/* Dropdown Items */}
            {isAppsOpen && (
              <div className="ml-4 pl-4 border-l border-white/10 mt-1 flex flex-col gap-1">
                <Link 
                  to="/saas"
                  className={`block px-4 py-2 rounded-lg transition-all duration-300 text-xs font-medium tracking-wide ${location.pathname === '/saas' && !location.search ? 'bg-[#00E5FF]/10 text-[#00E5FF] shadow-[0_0_10px_rgba(0,229,255,0.1)]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                >
                  TODAS LAS APPS
                </Link>
                {appCategories.map(cat => {
                  const isActive = location.search === `?cat=${cat.path.split('=')[1]}`;
                  return (
                    <Link 
                      key={cat.path}
                      to={cat.path}
                      className={`block px-4 py-2 rounded-lg transition-all duration-300 text-xs font-medium tracking-wide ${isActive ? 'bg-[#00E5FF]/10 text-[#00E5FF] shadow-[0_0_10px_rgba(0,229,255,0.1)]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                    >
                      {cat.name}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Remaining Links */}
          {mainLinks.slice(1).map(link => {
            const isActive = location.pathname.startsWith(link.path);
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
      <main className="flex-1 h-screen overflow-y-auto relative w-full">
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-30 bg-[#0A101C]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center p-1">
              <img src="/logo-icon.svg" className="w-full h-full object-contain" alt="MSBross Logo" />
            </div>
            <span className="font-bold text-lg tracking-tight glow-text">MSBross</span>
          </Link>
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 -mr-2 text-gray-300 hover:text-white"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-4 lg:p-8 max-w-7xl mx-auto min-h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
