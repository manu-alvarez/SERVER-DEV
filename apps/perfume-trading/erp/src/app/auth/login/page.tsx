'use client';

import React, { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { AuthService } from '@/lib/services/auth';
import { useAuthStore } from '@/stores/auth-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/**
 * Inner login form that uses useSearchParams.
 * Must be wrapped in Suspense per Next.js requirements.
 */
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') ?? '/';
  const { setUser } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Email y contraseña requeridos'); return; }
    setLoading(true);
    setError(null);
    try {
      const user = await AuthService.login(email, password);
      setUser(user);
      router.push(redirect);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de autenticación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F8] dark:bg-[#161616] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#f43f5e] flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">P</span>
          </div>
          <h1 className="text-xl font-bold text-[#323130] dark:text-[#e0e0e0]">Perfume Trading</h1>
          <p className="text-sm text-[#605E5C] dark:text-[#888] mt-1">Inicia sesión para continuar</p>
        </div>
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-400">
                  {error}
                </div>
              )}
              <Input label="Email" type="email" placeholder="tu@email.com" value={email}
                onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
              <div className="relative">
                <Input label="Contraseña" type={showPwd ? 'text' : 'password'} placeholder="••••••••"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password" required />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-2 top-[30px] text-[#605E5C] hover:text-[#323130]">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <Button type="submit" variant="primary" className="w-full" loading={loading}
                icon={loading ? undefined : LogIn} disabled={loading}>
                {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>
              <p className="text-[10px] text-center text-[#605E5C] dark:text-[#888]">
                Admin: admin@perfume-trading.app / admin123
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FAF9F8] dark:bg-[#161616] flex items-center justify-center">
        <div className="animate-pulse text-[#605E5C] text-sm">Cargando...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
