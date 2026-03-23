const CACHE = 'co2-v2';
const ASSETS = ['./', './index.html', './css/styles.css', './js/app.js', './manifest.json', './icons/favicon.svg'];
const CDN = [
  'https://cdn.jsdelivr.net/npm/d3-geo@3/dist/d3-geo.min.js',
  'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => {
    c.addAll(ASSETS);
    CDN.forEach(u => c.add(u).catch(() => {}));
  }));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(resp => {
      if (resp.ok) { const c = resp.clone(); caches.open(CACHE).then(ca => ca.put(e.request, c)); }
      return resp;
    })).catch(() => e.request.mode === 'navigate' ? caches.match('./index.html') : undefined)
  );
});
