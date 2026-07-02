import { Link, Outlet, useLocation } from 'react-router-dom';

import { Activity } from 'lucide-react';

export default function Layout() {
  const location = useLocation();

  const links = [
    { name: 'Agentes IA', path: '/agents' },
    { name: 'SaaS Tools', path: '/saas' },
    { name: 'Arquitectura', path: '/architecture' },
    { name: 'Contacto', path: '/contact' }
  ];

  return (
    <div className="min-h-screen text-white font-sans selection:bg-cyan-500/30">
      <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#050811]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <Activity className="w-6 h-6 text-cyan-400 group-hover:text-magenta-400 transition-colors" />
            <span className="font-bold text-xl tracking-tight">MSBross<span className="text-cyan-400">AI</span></span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8">
            {links.map(link => (
              <Link 
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors ${location.pathname.startsWith(link.path) ? 'text-cyan-400' : 'text-gray-400 hover:text-white'}`}
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="pt-20 min-h-[calc(100vh-80px)]">
        <Outlet />
      </main>
    </div>
  );
}
