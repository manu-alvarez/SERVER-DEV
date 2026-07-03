import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Auth Proxy — Protege rutas del ERP.
 *
 * En desarrollo (sin Supabase), permite acceso libre.
 * En producción, redirige a /auth/login si no hay sesión.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths (always accessible)
  const publicPaths = [
    '/auth/login',
    '/auth/register',
    '/api/auth',
    '/_next',
    '/favicon.ico',
    '/manifest.json',
    '/sw.js',
    '/icons',
    '/screenshot',
  ];

  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Dev/local mode: allow access  // Always allow for local/SQL environment now
  if (process.env.NODE_ENV === 'development' || process.env.SKIP_AUTH === 'true') {
    return NextResponse.next();
  }

  // Production: check auth session
  const authCookie = request.cookies.get('sb-auth-token')?.value;
  const hasSession = request.cookies.get('sb-session')?.value;

  if (!authCookie && !hasSession) {
    // Note: We use relative path so URL() keeps the basePath /app/perfume-trading
    const loginUrl = new URL('./auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|icons|favicon.ico|manifest.json|sw.js).*)',
  ],
};
