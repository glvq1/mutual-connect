// Service worker de la borne : garde la page en cache (démarrage même si le wifi est lent).
// Les envois vers Apps Script (script.google.com) passent toujours en direct.
const CACHE = 'mutual-borne-v9';
const SHELL = ['./', 'index.html', 'manifest.json', '../icon-192.png', '../icon-512.png', '../assets/logo-mutual.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  // Ne supprime que les anciens caches de la borne (pas ceux de Mutual Connect)
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k.indexOf('mutual-borne-') === 0 && k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin || e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
