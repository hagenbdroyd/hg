'use strict';
// =====================================================================
//  Service Worker (App startet auch ohne Netz)
// =====================================================================
// Immer zuerst aus dem Netz laden, damit Änderungen sofort ankommen.
// Nur ohne Verbindung wird die zuletzt gespeicherte Version gezeigt.
// Anfragen an die KI (andere Adresse) laufen nie über den Cache.

const CACHE = 'guru-266890e58d';
const SHELL = ["./", "index.html", "paket.json", "manifest.webmanifest", "icons/icon.svg", "icons/icon-192.png", "icons/apple-touch-icon.png"];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('guru-') && k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin || !url.pathname.startsWith(new URL(self.registration.scope).pathname)) return;
  e.respondWith(
    fetch(url.href, { cache: 'no-cache' }) // beim Server nachfragen, ob es eine neue Version gibt
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(url.pathname, copy));
        }
        return res;
      })
      .catch(() => caches.match(url.pathname, { ignoreSearch: true })
        .then((hit) => hit || (e.request.mode === 'navigate' ? caches.match('./') : Response.error()))),
  );
});
