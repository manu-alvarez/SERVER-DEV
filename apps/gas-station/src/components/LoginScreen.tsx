import { useState } from 'react';
import { motion } from 'framer-motion';
import { Fuel, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { api, setToken } from '../api/client';
import { Card, Input, Button } from './ui';

interface Props {
  onLogin: (user: any) => void;
}

export default function LoginScreen({ onLogin }: Props) {
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!name || !pin) { setError('Introduce usuario y PIN'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await api.login(name, pin);
      setToken(res.token);
      onLogin(res.user);
    } catch (e: any) {
      setError(e.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Card className="w-full max-w-[400px] p-8 glass-panel border border-brand-500/20 shadow-[0_0_50px_rgba(249,115,22,0.1)]">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-500/10 border border-brand-500/30 mb-4 text-brand-500 shadow-[0_0_20px_rgba(249,115,22,0.2)]">
              <Fuel size={32} />
            </div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Gas Station</h1>
            <p className="text-muted-foreground mt-1">Terminal de Control B2B</p>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-6">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            </motion.div>
          )}

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Usuario</label>
              <Input 
                value={name} 
                onChange={e => setName(e.target.value)}
                autoFocus 
                onKeyDown={e => e.key === 'Enter' && !loading && handleLogin()}
                placeholder="Ej: Demo"
                className="bg-black/40 border-white/10"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">PIN de Acceso</label>
              <div className="relative">
                <Input 
                  type={showPin ? 'text' : 'password'} 
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !loading && handleLogin()}
                  placeholder="••••"
                  className="bg-black/40 border-white/10 pr-10 tracking-widest font-mono"
                />
                <button 
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button 
              className="w-full mt-6" 
              variant="primary" 
              size="lg" 
              onClick={handleLogin} 
              isLoading={loading}
            >
              Acceder al Sistema
            </Button>
          </div>

          <div className="mt-8 p-4 rounded-lg bg-white/5 border border-white/5 text-sm">
            <h3 className="font-semibold text-brand-400 mb-2">Entorno de Pruebas Activo</h3>
            <ul className="space-y-1 text-muted-foreground">
              <li className="flex justify-between"><span>Supervisor: <b>Demo</b></span> <span>PIN: <b>1234</b></span></li>
              <li className="flex justify-between"><span>Expendedor: <b>Test</b></span> <span>PIN: <b>0000</b></span></li>
            </ul>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
