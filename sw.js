const CACHE_NAME = 'diecast-garage-shell-v1.99';
const base = self.registration.scope;
const APP_SHELL = ['./', './index.html', './seed.js', './viewer3d.js', './manifest.webmanifest', './icon.svg', './icon-192.png']
  .map(path => new URL(path, base).toString());

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys
        .filter(key => key.startsWith('diecast-garage-shell-') && key !== CACHE_NAME)
        .map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  // Large catalogues already persist in IndexedDB; never pin obsolete imports in PWA cache.
  if (url.pathname.includes('/catalog/')) {
    event.respondWith(fetch(request));
    return;
  }

  // Network-first for page navigation, so installed PWA users see new releases.
  // Cached HTML remains available when the phone is offline.
  if (request.mode === 'navigate' || url.pathname.endsWith('/index.html')) {
    event.respondWith(fetch(request).then(response => {
      if (response.ok) {
        const copy = response.clone();
        event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.put(new URL('./index.html', base).toString(), copy)));
      }
      return response;
    }).catch(() => caches.match(new URL('./index.html', base).toString())));
    return;
  }

  event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
    if (response.ok) {
      const copy = response.clone();
      event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.put(request, copy)));
    }
    return response;
  })));
});
