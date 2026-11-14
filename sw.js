/*
 * Service worker do Agendei.
 *
 * IMPORTANTE: ao mudar QUALQUER arquivo servido (html, css, js, manifest, ícones),
 * incremente CACHE_NAME (checklist-v1 -> checklist-v2...). Senão quem já instalou
 * continua vendo a versão antiga, porque o app é servido do cache.
 *
 * Todos os caminhos são relativos ao local deste arquivo (raiz do app), o que
 * faz o app funcionar em https://usuario.github.io/<repo>/.
 */
'use strict';

var CACHE_NAME = 'checklist-v3';

var ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function (cache) { return cache.addAll(ASSETS); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys
          .filter(function (key) { return key !== CACHE_NAME; })
          .map(function (key) { return caches.delete(key); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  var request = event.request;
  if (request.method !== 'GET') return;
  if (new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request, { ignoreSearch: request.mode === 'navigate' }).then(function (cached) {
      if (cached) return cached;
      return fetch(request).catch(function () {
        // Offline e fora do cache: navegação cai no app.
        if (request.mode === 'navigate') {
          return caches.match('./index.html');
        }
        return Response.error();
      });
    })
  );
});
