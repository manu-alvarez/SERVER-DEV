const CACHE_NAME = 'expositator-rte-2026-v1';
const STATIC_ASSETS = [
    './',
    './index.html',
    './main.js',
    './speech.js',
    './vision.js',
    './evaluator.js',
    './manifest.json',
    'https://cdn.tailwindcss.com'
];

self.addEventListener('install', (e) => {
    self.skipWaiting();
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
            );
        })
    );
});

self.addEventListener('fetch', (e) => {
    // Network-only para APIs o telemetría si existiera endpoint externo
    if (e.request.method !== 'GET' || e.request.url.includes('/api/telemetry')) {
        return;
    }
    
    // Cache-first para estáticos
    e.respondWith(
        caches.match(e.request).then(cached => {
            return cached || fetch(e.request).then(response => {
                const clone = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
                return response;
            });
        })
    );
});
