// Ancienne adresse de la borne : ce service worker se retire et vide l'ancien cache.
// La borne est désormais sur https://glvq1.github.io/mutual-borne/ (cache « mutual-borne-app-* », non touché).
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => /^mutual-borne-v\d+$/.test(k)).map(k => caches.delete(k))))
    .then(() => self.registration.unregister()));
});
