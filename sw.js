/* Service worker : garde une copie de la page pour l'utiliser sans Wi-Fi.
   Strategie : on sert la copie tout de suite, et on la rafraichit en arriere-plan quand le reseau repond. */
var CACHE = 'ciel-v10';
self.addEventListener('install', function (event) {
  event.waitUntil(caches.open(CACHE).then(function (cache) {
    return cache.addAll(['./', './index.html', './icon-180.png', './icon-152.png']);
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.map(function (k) { if (k !== CACHE) { return caches.delete(k); } return null; }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') { return; }
  /* Les demandes vers d'autres sites (meteo) passent directement, sans copie locale */
  if (req.url.indexOf(self.location.origin) !== 0) { return; }
  /* Cle de la copie : l'adresse sans ses parametres, pour ne jamais garder deux copies de la meme page */
  var key = req.url.split('#')[0].split('?')[0];
  var offline = self.navigator && self.navigator.onLine === false;
  /* Hors ligne declare : on sert la copie sans toucher au reseau */
  var fresh = offline ? null : fetch(req).then(function (resp) {
    if (resp && resp.status === 200 && resp.type === 'basic') {
      var copy = resp.clone();
      return caches.open(CACHE).then(function (cache) { return cache.put(key, copy); }).then(function () { return resp; });
    }
    return resp;
  });
  /* On garde le service worker en vie jusqu'a la fin du rafraichissement */
  if (fresh) { event.waitUntil(fresh.then(function () { return null; }, function () { return null; })); }
  event.respondWith(caches.open(CACHE).then(function (cache) {
    return cache.match(key);
  }).then(function (cached) {
    if (cached) { return cached; }
    if (fresh) { return fresh; }
    return new Response('Hors ligne', { status: 503, statusText: 'Hors ligne' });
  }));
});
