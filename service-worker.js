const CACHE_NAME = 'note-app-cache-v2'; // bump this version to force update!

const CORE_ASSETS = [
  '/',
  '/index.html',
  '/Centaur.woff2',
  '/manifest.json',
  '/jquery.min.js',
  '/style.css',
  '/script.js',
  '/icon.png'
  // Add other static files here
];

// ⏳ Install: cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

// 🧹 Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// ⚡️ Fetch: serve core assets from cache, everything else from network
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  const EXCLUDE_URLS = [
    'googleapis.com',
    'firebaseio.com',
    'firestore.googleapis.com'
  ];

  // Ignore Firebase and Google API requests
  if (
    event.request.method !== 'GET' ||
    EXCLUDE_URLS.some((domain) => url.includes(domain))
  ) {
    return;
  }

  // For core assets: try cache first, fallback to network
  if (CORE_ASSETS.some((path) => url.endsWith(path))) {
    event.respondWith(
      caches.match(event.request).then((response) => response || fetch(event.request))
    );
    return;
  }

  // For other GET requests (like images): try cache, then update cache in background
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (
              networkResponse &&
              networkResponse.status === 200 &&
              networkResponse.type === 'basic'
            ) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    )
  );
});
