/**
 * EliteScout PWA Service Worker v2.0
 * Strategies:
 *   - Static assets: Cache-first (stale-while-revalidate)
 *   - API /search: Network-first with offline cache fallback (TTL: 10min)
 *   - Pages: Network-first with offline fallback
 */

const CACHE_STATIC = 'elitescout-static-v4';
const CACHE_API = 'elitescout-api-v4';
const API_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

const PRECACHE = [
  '/',
  '/manifest.json',
  '/favicon.ico',
];

// ━━━ INSTALL ━━━
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIC).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

// ━━━ ACTIVATE ━━━
self.addEventListener('activate', (event) => {
  const keep = new Set([CACHE_STATIC, CACHE_API]);
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => !keep.has(n)).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// ━━━ FETCH ━━━
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Strategy 1: API search — Network-first with cache fallback
  if (url.pathname === '/app/elitescout/api/search/' && event.request.method === 'POST') {
    event.respondWith(handleAPISearch(event.request));
    return;
  }

  // Strategy 2: Static assets — Cache-first (stale-while-revalidate)
  if (
    url.pathname.startsWith('/_next/') ||
    url.pathname.includes('/fonts/') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.woff2') ||
    PRECACHE.includes(url.pathname)
  ) {
    event.respondWith(handleStatic(event.request));
    return;
  }

  // Strategy 3: Pages — Network-first
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

// ━━━ API SEARCH HANDLER ━━━
async function handleAPISearch(request) {
  const body = await request.clone().text();
  const safeBody = encodeURIComponent(body);
  const cacheKey = new Request('/app/elitescout/api/search/?body=' + btoa(safeBody).slice(0, 100));

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_API);
      const headers = new Headers(networkResponse.headers);
      headers.set('x-sw-cached-at', Date.now().toString());
      const cachedResponse = new Response(await networkResponse.clone().blob(), {
        status: networkResponse.status,
        headers,
      });
      cache.put(cacheKey, cachedResponse);
    }

    return networkResponse;
  } catch (err) {
    // Offline — try cache
    const cached = await caches.match(cacheKey);
    if (cached) {
      const cachedAt = parseInt(cached.headers.get('x-sw-cached-at') || '0');
      if (Date.now() - cachedAt < API_CACHE_TTL) {
        return cached;
      }
    }
    return new Response(JSON.stringify({ success: false, error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// ━━━ STATIC HANDLER ━━━
async function handleStatic(request) {
  const cached = await caches.match(request);
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        const cache = caches.open(CACHE_STATIC);
        cache.then((c) => c.put(request, response.clone()));
      }
      return response;
    })
    .catch(() => cached);

  return cached || fetchPromise;
}
