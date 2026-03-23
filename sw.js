/* ═══════════════════════════════════════════
   Service Worker — EU CO₂ Explorer PWA
   ═══════════════════════════════════════════ */

const CACHE_NAME = 'co2-explorer-v1';

const STATIC_ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './js/map.js',
  './js/app.js',
  './data/co2-data.json',
  './manifest.json',
  './icons/favicon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

const CDN_ASSETS = [
  'https://cdn.jsdelivr.net/npm/d3-geo@3/dist/d3-geo.min.js',
  'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json',
  'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap',
];

/* ── Install: cache static assets ── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Cache local assets (must succeed)
      const localPromise = cache.addAll(STATIC_ASSETS);
      // Cache CDN assets (best-effort)
      const cdnPromise = Promise.allSettled(
        CDN_ASSETS.map(url => cache.add(url).catch(() => {}))
      );
      return Promise.all([localPromise, cdnPromise]);
    })
  );
  self.skipWaiting();
});

/* ── Activate: clean old caches ── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

/* ── Fetch: network-first for data, cache-first for assets ── */
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // For navigation requests and local assets: cache-first
  if (url.origin === location.origin || url.hostname.includes('cdn.jsdelivr.net')) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          // Cache successful responses
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        });
      }).catch(() => {
        // Fallback for navigation
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      })
    );
    return;
  }

  // For Google Fonts: stale-while-revalidate
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        const fetchPromise = fetch(event.request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  // Everything else: network only
  event.respondWith(fetch(event.request));
});
