// Service worker : met en cache la coquille (pas l'app Apps Script, toujours en ligne)
// + réception des notifications push (Firebase Cloud Messaging)
try {
  importScripts(
    'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js',
    'firebase-config.js'
  );
  if (self.MC_FIREBASE && self.MC_FIREBASE.config && self.MC_FIREBASE.config.apiKey) {
    firebase.initializeApp(self.MC_FIREBASE.config);
    firebase.messaging(); // affiche automatiquement les notifications reçues appli fermée
  }
} catch (e) {
  // Firebase injoignable : la coquille hors ligne continue de fonctionner, sans push
}

// Appui sur une notification affichée par la page (appli ouverte) → ramène l'appli au premier plan
self.addEventListener('notificationclick', e => {
  if (e.notification.data && e.notification.data.FCM_MSG) return; // géré par Firebase
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    const ouverte = list.find(c => c.url.startsWith(self.registration.scope));
    return ouverte ? ouverte.focus() : clients.openWindow(url);
  }));
});
const CACHE = 'mutual-shell-v4';
const SHELL = ['./', 'index.html', 'manifest.json', 'firebase-config.js', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return; // Google passe en direct
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
