const CACHE = 'rbf2026-v3';
const ASSETS = ['./index.html', './rbf-data.js', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  const isHTML = req.mode === 'navigate' ||
                 req.destination === 'document' ||
                 req.url.endsWith('.html') ||
                 req.url.endsWith('/');
  // rbf-data.js enthält die Künstler-/Auftrittsdaten und wird bei jedem
  // Daten-Update ausgetauscht - genau wie index.html soll das SOFORT
  // ankommen, nicht erst nach Ablauf des Cache-first-Verhaltens.
  const isDataFile = req.url.endsWith('/rbf-data.js');

  if (isHTML || isDataFile) {
    // App-Shell + Datendatei: immer zuerst das Netz fragen, damit Updates
    // sofort ankommen. Nur offline auf den Cache zurückfallen.
    e.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then(cached => cached || (isHTML ? caches.match('./index.html') : undefined)))
    );
  } else {
    // Statische Assets (Icons, Manifest): Cache-first fürs schnelle Laden,
    // im Hintergrund trotzdem aktualisieren.
    e.respondWith(
      caches.match(req).then(cached => {
        const network = fetch(req).then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
          return res;
        }).catch(() => cached);
        return cached || network;
      })
    );
  }
});
