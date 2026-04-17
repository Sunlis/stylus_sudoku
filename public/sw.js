const CACHE_NAME = 'stylus-sudoku-cache-v5';

self.addEventListener('install', (event) => {
  // Precache the app shell on install so the app is available offline
  // immediately after a SW update, without needing a prior full page load.
  const scope = self.registration.scope;
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll([scope, `${scope}manifest.webmanifest`]))
      .then(() => self.skipWaiting())
  );
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
  const { request } = event;
  if (request.method !== 'GET') return;

  if (request.mode === 'navigate') {
    // Stale-while-revalidate for navigation: serve the cached shell
    // immediately (so the app loads offline), then update the cache in the
    // background during online visits. A cached version takes precedence
    // over the live version; clear app data to force an update.
    const scope = self.registration.scope;
    event.respondWith(
      caches.match(scope).then((cached) => {
        const networkUpdate = fetch(request)
          .then((response) => {
            if (response.ok) {
              caches.open(CACHE_NAME).then((cache) => cache.put(scope, response.clone()));
            }
            return response;
          })
          .catch(() => null);

        return cached
          ?? networkUpdate.then((r) => r ?? new Response(
            'Offline – please open the app while connected first.',
            { status: 503, headers: { 'Content-Type': 'text/plain' } },
          ));
      })
    );
    return;
  }

  // Cache-first for all other assets (JS, CSS, images, model files, etc.).
  // Hashed filenames are immutable, so no revalidation is needed.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }
      return fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => new Response('Offline', { status: 503 }));
    })
  );
});
