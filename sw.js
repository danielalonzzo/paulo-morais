const CACHE_NAME = 'paulo-morais-pwa-v17';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/perfil.html',
  '/osteopatia.html',
  '/sobre-mim.html',
  '/css/style.css',
  '/js/theme.js',
  '/js/lang.js',
  '/images/logo/logo_ios_android.png',
  '/images/logo/logo_bw_loading.png',
  '/images/logo/paulo_morais-08.png'
];

// Install Event - Precache essential assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Precaching app shell');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Network first strategy for HTML, Cache first for others
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Exclude API requests and external scripts
  if (url.pathname.startsWith('/__/') || !url.protocol.startsWith('http')) {
    return;
  }

  // Use Network-First for HTML to ensure freshness
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, response.clone());
            return response;
          });
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Use Cache-First for static assets (images, css, js)
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then(networkResponse => {
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      });
    })
  );
});


