var CACHE = 'co2-v3';
var ASSETS = ['./', './index.html', './css/styles.css', './js/app.js', './manifest.json'];

self.addEventListener('install', function(e) {
  e.waitUntil(caches.open(CACHE).then(function(c) { return c.addAll(ASSETS); }));
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(ks) {
      return Promise.all(ks.filter(function(k) { return k !== CACHE; }).map(function(k) { return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  e.respondWith(
    fetch(e.request).then(function(resp) {
      if (resp.ok) {
        var c = resp.clone();
        caches.open(CACHE).then(function(ca) { ca.put(e.request, c); });
      }
      return resp;
    }).catch(function() {
      return caches.match(e.request);
    })
  );
});
