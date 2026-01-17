const CACHE_NAME = 'boardbrief-cache-v1';
// List of URLs to pre-cache for offline support. These assets will be
// cached during the install step and served from cache when offline.
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico'
];

self.addEventListener('install', (event) => {
  // Perform install steps: open the cache and pre-cache essential assets.
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
});

self.addEventListener('activate', (event) => {
  // Clean up old caches if the cache name changes in the future.
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached response if available, otherwise fetch from network
      const networkFetch = fetch(event.request)
        .then((networkResponse) => {
          // Cache the new response for future requests
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type === 'basic'
          ) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // When offline and network fetch fails, return cached response
          return cachedResponse;
        });

      // Respond with cached response immediately if available, else wait for network
      return cachedResponse || networkFetch;
    })
  );
});