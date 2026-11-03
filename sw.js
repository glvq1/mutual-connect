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
    // Messages « data » : la notification est affichée ici, pour que l'appui ouvre l'appli installée
    firebase.messaging().onBackgroundMessage(p => {
      const d = p.data || {};
      if (p.notification) return; // ancien format : déjà affiché par Firebase
      return self.registration.showNotification(d.title || 'Mutual Connect', {
        body: d.body || '', icon: 'icon-192.png', badge: 'icon-192.png', tag: d.tag || undefined,
        data: { url: self.registration.scope }
      });
    });
  }
} catch (e) {
  // Firebase injoignable : la coquille hors ligne continue de fonctionner, sans push
}

// Appui sur une notification → remet au premier plan la fenêtre déjà ouverte,
// sinon ouvre l'appli (dans sa fenêtre d'appli installée si elle est installée)
self.addEventListener('notificationclick', e => {
  e.notification.close();
  try { if (self.navigator.clearAppBadge) self.navigator.clearAppBadge(); } catch (err) {}
  const url = self.registration.scope;
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    const ouverte = list.find(c => c.url.startsWith(url));
    return ouverte ? ouverte.focus() : clients.openWindow(url);
  }));
});
const CACHE = 'mutual-shell-v8';
const SHELL = ['./', 'index.html', 'manifest.json', 'firebase-config.js', 'icon-192.png', 'icon-512.png', 'assets/logo-mutual.png'];

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
