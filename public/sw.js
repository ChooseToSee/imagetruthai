const CACHE_NAME = 'imagetruth-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Never cache OAuth or API routes
  if (event.request.url.includes('/~oauth') ||
      event.request.url.includes('/rest/') ||
      event.request.url.includes('/auth/') ||
      event.request.url.includes('/functions/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) return response;
        return fetch(event.request);
      })
  );
});
