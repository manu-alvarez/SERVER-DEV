// Service Worker básico para PWA de IA Prod OS
const CACHE_NAME = 'iaprod-os-v1'
const ASSETS = [
  '/',
  '/index.html',
  '/assets/index-OwSYXicZ.js',
  '/assets/index-DuZ4s6_I.css',
  '/orb.png',
  '/manifest.json',
]

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)))
})

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((resp) => resp || fetch(e.request))
  )
})
