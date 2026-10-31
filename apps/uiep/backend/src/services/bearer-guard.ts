import type { Request } from 'express';
import { timingSafeEqual } from 'node:crypto';

/**
 * Guard compartido de superficie protegida por Bearer UIEP_RUNTIME_TOKEN
 * (Agent Runtime Fase 3 + Knowledge API Fase 5). Sin token configurado o
 * vacío → DESHABILITADO (seguridad por defecto); token incorrecto → no
 * autorizado. Comparación timing-safe.
 */

export type BearerAuthState = 'ok' | 'disabled' | 'unauthorized';

export function bearerAuth(req: Request): BearerAuthState {
  const token = process.env.UIEP_RUNTIME_TOKEN;
  if (!token || token.length < 8) {
    return 'disabled';
  }
  const header = req.headers.authorization;
  if (typeof header !== 'string' || !header.startsWith('Bearer ')) {
    return 'unauthorized';
  }
  const provided = header.slice('Bearer '.length);
  if (provided.length !== token.length) {
    return 'unauthorized';
  }
  return timingSafeEqual(Buffer.from(provided), Buffer.from(token)) ? 'ok' : 'unauthorized';
}

export function bearerGuard(res: {
  status: (code: number) => { json: (body: unknown) => void };
}, state: BearerAuthState): boolean {
  if (state === 'disabled') {
    res.status(503).json({ error: 'runtime_disabled', message: 'UIEP_RUNTIME_TOKEN no configurado en el despliegue' });
    return false;
  }
  if (state === 'unauthorized') {
    res.status(401).json({ error: 'unauthorized' });
    return false;
  }
  return true;
}
