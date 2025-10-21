const CACHE_NAME = 'threadflow-cache-v1';
const urlsToCache = ['/', '/index.html', '/client/App.tsx', '/placeholder.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    }),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        }),
      );
    }),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return (
        response ||
        fetch(event.request).then((fetchResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            try {
              cache.put(event.request, fetchResponse.clone());
            } catch (e) {
              // ignore put failures for cross-origin requests
            }
            return fetchResponse;
          });
        })
      );
    }),
  );
});
