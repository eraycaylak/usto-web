// USTAG — service worker
// Strateji:
//  • Gezinme/HTML  → NETWORK-FIRST (bayat sayfa servis etmeyi önler), çevrimdışıysa cache
//  • Statik varlık → stale-while-revalidate
//  • /app/ (Flutter web) → HİÇ dokunma; kendi service worker'ı var, çakışmasın
// TEK sürüm sabiti — HTML'deki ?v=N ile aynı tutulmalı.
var VER = 9;
var CACHE = 'ustag-v' + VER;
// Ön-önbellek: sorgu dizesi HTML'dekiyle birebir aynı olmalı, yoksa istek eşleşmez.
var Q = '?v=' + VER;
var ASSETS = [
  './', './index.html',
  './styles/tokens.css' + Q, './styles/site.css' + Q, './scripts/site.js' + Q,
  './vendor/lenis-1.1.13.min.js', './vendor/gsap-3.12.5.min.js', './vendor/ScrollTrigger-3.12.5.min.js',
  './manifest.webmanifest', './favicon.png', './assets/favicon.svg'
];

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      // Kurulumda ağdan taze çek (HTTP cache'i baypas et)
      return Promise.all(ASSETS.map(function (u) {
        return fetch(u, { cache: 'reload' }).then(function (r) {
          if (r && r.ok) return c.put(u, r);
        }).catch(function () {});
      }));
    })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;

  var url;
  try { url = new URL(req.url); } catch (_) { return; }
  if (url.origin !== self.location.origin) return;     // 3. taraf: dokunma
  if (url.pathname.indexOf('/app/') !== -1) return;     // Flutter uygulaması: dokunma

  // Gezinme (HTML) → network-first
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').indexOf('text/html') !== -1) {
    e.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); }).catch(function () {});
        return res;
      }).catch(function () {
        return caches.match(req).then(function (hit) { return hit || caches.match('./index.html'); });
      })
    );
    return;
  }

  // Statik varlık → stale-while-revalidate
  // ignoreSearch: sürüm sorgusu (?v=N) değiştiğinde bile önbellekteki kopya bulunabilsin;
  // tazeleme yine arka planda ağdan yapılır.
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(function (hit) {
      var net = fetch(req).then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); }).catch(function () {});
        }
        return res;
      }).catch(function () { return hit; });
      return hit || net;
    })
  );
});
