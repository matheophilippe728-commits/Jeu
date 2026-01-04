const CACHE = "civitas-cache-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./style.css?v=1",
  "./app.js?v=1",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k !== CACHE ? caches.delete(k) : null)))
    ).then(()=>self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // Toujours réseau d'abord pour HTML (évite les pages “bloquées”)
  if (e.request.mode === "navigate") {
    e.respondWith(fetch(e.request).catch(()=>caches.match("./")));
    return;
  }

  // Cache-first pour le reste
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});
