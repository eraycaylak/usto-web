// USTO — basit PWA service worker (cache-first statik kabuk)
var CACHE = 'usto-v3';
// Göreli yollar — hem kök alanda hem GitHub Pages alt-yolunda (/usto-web/) çalışır.
var ASSETS = [
  './', './index.html',
  './styles/tokens.css', './styles/site.css', './scripts/site.js',
  './assets/img/hero-paint.jpg',
  './manifest.webmanifest', './assets/favicon.svg'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith(
    caches.match(req).then(function (hit) {
      return hit || fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); }).catch(function () {});
        return res;
      }).catch(function () { return caches.match('./index.html'); });
    })
  );
});
