// OneShop POS - Live Hot Update Service Worker v5
const CACHE_NAME = 'oneshop-pos-cache-v5';
const STATIC_ASSETS = [
  '/manifest.json',
  '/images/oneshop-pos-supermarket.jpg',
  '/images/supermarket-shelves.jpg',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;
  // Ignore API requests completely
  if (event.request.url.includes('/api/')) return;

  // For HTML page navigations (e.g. reload or visit): ALWAYS NETWORK-FIRST
  // This guarantees that any reload (F5) immediately loads the latest deployed version without locking or old bundle trapping!
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request, { cache: 'no-cache' })
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache ONLY if completely offline
          return caches.match(event.request).then((cached) => cached || caches.match('/'));
        })
    );
    return;
  }

  // For static assets: Stale-while-revalidate or Network-first
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});
