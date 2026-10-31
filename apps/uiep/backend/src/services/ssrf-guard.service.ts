import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

/**
 * ssrf-guard (Fase 5.1) — protección SSRF para la ingesta por URL.
 *
 * La ingesta corre dentro de la red Docker del VPS (con acceso a Ollama,
 * Traefik y demás servicios internos): una URL maliciosa NO debe poder
 * alcanzar nada interno. Reglas:
 *   · Solo http/https.
 *   · Resolución DNS real: TODAS las direcciones del hostname deben ser
 *     públicas (bloquea localhost, loopback, privadas v4/v6, link-local,
 *     multicast, 0.0.0.0 y la propia gateway del bridge).
 *   · Redirects resueltos MANUALMENTE re-validando cada salto (máx. 3).
 *   · Límites de tamaño y tiempo (el llamador también aplica los suyos).
 *   · Content-type esperado: texto/HTML/JSON.
 */

const BLOCKED_V4 = [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10], // CGNAT
  ['127.0.0.0', 8],
  ['169.254.0.0', 16], // link-local (incluye metadatos de nube)
  ['172.16.0.0', 12], // privadas (incluye el bridge docker 172.20/16)
  ['192.168.0.0', 16],
  ['224.0.0.0', 4], // multicast
  ['240.0.0.0', 4], // reservadas
] as const;

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  'ip6-localhost',
  'ip6-loopback',
]);

function ipToLong(ip: string): number {
  return ip.split('.').reduce((acc, o) => (acc << 8) + Number(o), 0) >>> 0;
}

function isPrivateV4(ip: string): boolean {
  const addr = ipToLong(ip);
  return BLOCKED_V4.some(([base, bits]) => {
    const mask = (0xffffffff << (32 - bits)) >>> 0;
    return (addr & mask) === (ipToLong(base) & mask);
  });
}

function isPrivateV6(ip: string): boolean {
  const v = ip.toLowerCase();
  return (
    v === '::' || v === '::1' ||
    v.startsWith('fe8') || v.startsWith('fe9') || v.startsWith('fea') || v.startsWith('feb') || // link-local
    v.startsWith('fc') || v.startsWith('fd') || // unique local
    v.startsWith('ff') || // multicast
    v.startsWith('::ffff:127.') || v.startsWith('::ffff:10.') || v.startsWith('::ffff:192.168.') ||
    v.startsWith('::ffff:172.16.') || v.startsWith('::ffff:172.17.') || v.startsWith('::ffff:172.18.') ||
    v.startsWith('::ffff:172.19.') || v.startsWith('::ffff:172.2') || v.startsWith('::ffff:172.3') ||
    v.startsWith('::ffff:169.254')
  );
}

function isPrivate(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) return isPrivateV4(ip);
  if (version === 6) return isPrivateV6(ip);
  return true; // no es una IP parseable → tratar como privada
}

export type SsrfVerdict = { ok: true; url: string } | { ok: false; reason: string };

/** Valida protocolo, hostname y TODAS las IPs resueltas (A + AAAA). */
export async function assertPublicUrl(rawUrl: string): Promise<SsrfVerdict> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { ok: false, reason: 'url_invalid' };
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { ok: false, reason: `protocol_forbidden_${url.protocol.replace(':', '')}` };
  }
  const host = url.hostname.toLowerCase().replace(/\.$/, '');
  if (BLOCKED_HOSTNAMES.has(host) || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) {
    return { ok: false, reason: 'hostname_forbidden' };
  }
  // Si el hostname es una IP literal, se clasifica directamente.
  if (isIP(host.replace(/^\[|\]$/g, ''))) {
    return isPrivate(host.replace(/^\[|\]$/g, '')) ? { ok: false, reason: 'ip_private' } : { ok: true, url: url.toString() };
  }
  try {
    const results = await lookup(host, { all: true, verbatim: true });
    if (results.length === 0) {
      return { ok: false, reason: 'dns_empty' };
    }
    for (const r of results) {
      if (isPrivate(r.address)) {
        return { ok: false, reason: `dns_private_${r.address}` };
      }
    }
  } catch {
    return { ok: false, reason: 'dns_resolve_failed' };
  }
  return { ok: true, url: url.toString() };
}

export interface GuardedFetchOptions {
  timeoutMs: number
  maxBytes: number
  maxRedirects?: number
}

export interface GuardedFetchResult {
  ok: boolean
  status?: number
  text?: string
  contentType?: string
  error?: string
}

/** fetch con validación SSRF en CADA salto de redirección (redirect: manual). */
export async function guardedFetch(rawUrl: string, opts: GuardedFetchOptions): Promise<GuardedFetchResult> {
  let current = rawUrl;
  const maxRedirects = opts.maxRedirects ?? 3;
  for (let hop = 0; hop <= maxRedirects; hop += 1) {
    const verdict = await assertPublicUrl(current);
    if (!verdict.ok) {
      return { ok: false, error: `ssrf_blocked_${verdict.reason}` };
    }
    let res: Response;
    try {
      res = await fetch(verdict.url, {
        redirect: 'manual',
        headers: { 'user-agent': 'UIEP-Knowledge/1.0 (+ingestion)' },
        signal: AbortSignal.timeout(opts.timeoutMs),
      });
    } catch (err) {
      return { ok: false, error: `fetch_error: ${(err as Error).message}` };
    }
    if ([301, 302, 303, 307, 308].includes(res.status)) {
      const location = res.headers.get('location');
      if (!location) {
        return { ok: false, error: 'redirect_without_location' };
      }
      try {
        current = new URL(location, current).toString();
      } catch {
        return { ok: false, error: 'redirect_location_invalid' };
      }
      continue;
    }
    if (!res.ok) {
      return { ok: false, status: res.status, error: `fetch_status_${res.status}` };
    }
    const contentType = res.headers.get('content-type') ?? '';
    if (!/^(text\/|application\/(json|ld\+json|x-html|html))/i.test(contentType)) {
      return { ok: false, status: res.status, contentType, error: `content_type_unexpected_${contentType.split(';')[0] || 'unknown'}` };
    }
    const buf = await res.arrayBuffer();
    if (buf.byteLength > opts.maxBytes) {
      return { ok: false, status: res.status, error: `source_too_large_${opts.maxBytes}` };
    }
    return { ok: true, status: res.status, contentType, text: Buffer.from(buf).toString('utf8') };
  }
  return { ok: false, error: 'too_many_redirects' };
}
