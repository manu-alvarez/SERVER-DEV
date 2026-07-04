import { useState } from 'react';
import { motion } from 'framer-motion';
import { Factory, Eye, EyeOff } from 'lucide-react';
import api, { setToken } from '../api/client';
import { Card, Button, Input } from './ui';
import { useStore } from '../store';

export default function LoginScreen() {
  const setUser = useStore((state) => state.setUser);
  
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!name || !password) { setError('Introduce usuario y contraseña'); return; }
    setLoading(true);
    setError('');
    try {
      const ep = mode === 'login' ? '/auth/login' : '/auth/register';
      const res = await api.post(ep, { name, password });
      setToken(res.data.token);
      setUser(res.data.user);
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
        <Card portal className="p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-msb-primary/20 text-msb-primary mb-4 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
              <Factory size={32} />
            </div>
            <h1 className="text-3xl font-bold neon-text-primary mb-2">IndustrialPro</h1>
            <p className="text-slate-400">Control de Procesos Industriales</p>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-3 rounded-lg bg-msb-error/10 border border-msb-error/30 text-msb-error text-sm text-center">
              {error}
            </motion.div>
          )}

          <div className="flex rounded-lg p-1 bg-black/40 border border-white/5 mb-6">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'login' ? 'bg-msb-card shadow text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Entrar
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'register' ? 'bg-msb-card shadow text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Registrarse
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Usuario</label>
              <Input 
                autoFocus 
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="Ingresa tu usuario"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Contraseña</label>
              <div className="relative">
                <Input 
                  type={showPw ? 'text' : 'password'} 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  placeholder="••••••••"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full mt-6" size="lg" isLoading={loading}>
              {mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </Button>
          </form>

          <div className="mt-8 p-4 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-300">
            <p className="font-semibold text-msb-primary mb-2">Entorno de Pruebas Activo</p>
            <ul className="space-y-1">
              <li>• Admin: <span className="text-white font-mono bg-black/50 px-1 rounded">Demo</span> / Pass: <span className="text-white font-mono bg-black/50 px-1 rounded">demo123</span></li>
              <li>• Operario: <span className="text-white font-mono bg-black/50 px-1 rounded">Test</span> / Pass: <span className="text-white font-mono bg-black/50 px-1 rounded">test123</span></li>
            </ul>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
