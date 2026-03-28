const CACHE_NAME = 'stylus-sudoku-cache-v4';

self.addEventListener('install', (event) => {
  // Fast install: don't precache anything here to avoid install failures
  // during dev if the dev server isn't ready. We'll cache on first use.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => (key === CACHE_NAME ? null : caches.delete(key))))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  // For navigations (address bar, home screen icon), serve the app shell
  // so we don't show the browser's offline error page.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // Network-first: if online, fetch the real page and cache it
          const networkResponse = await fetch(request);
          const cache = await caches.open(CACHE_NAME);
          // Cache the root shell so future offline launches have something
          cache.put('/', networkResponse.clone());
          return networkResponse;
        } catch (e) {
          // Offline or network error: fall back to cached shell if we have it
          const cachedRoot = await caches.match('/');
          if (cachedRoot) {
            return cachedRoot;
          }
          return new Response('Offline', { status: 503 });
        }
      })()
    );
    return;
  }

  // For other GETs (JS/CSS/assets), use cache-first then network + cache.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }
      return fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, copy);
          });
          return response;
        })
        .catch(() => new Response('Offline', { status: 503 }));
    })
  );
});
