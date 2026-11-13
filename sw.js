/* Service worker : garde une copie de la page pour l'utiliser sans Wi-Fi.
   Strategie : on sert la copie tout de suite, et on la rafraichit en arriere-plan quand le reseau repond. */
var CACHE = 'ciel-v1';
self.addEventListener('install', function (event) {
  event.waitUntil(caches.open(CACHE).then(function (cache) {
    return cache.addAll(['./', './index.html']);
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.map(function (k) { if (k !== CACHE) { return caches.delete(k); } return null; }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') { return; }
  event.respondWith(caches.open(CACHE).then(function (cache) {
    return cache.match(event.request, { ignoreSearch: true }).then(function (cached) {
      var fresh = fetch(event.request).then(function (resp) {
        if (resp && resp.status === 200 && resp.type === 'basic') { cache.put(event.request, resp.clone()); }
        return resp;
      }).catch(function () { return cached; });
      return cached || fresh;
    });
  }));
});
