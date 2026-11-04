const C = 'decade-mf-v1';
const FILES = ['./', 'index.html', 'tokens.css', 'manifest.json', 'icon-192.png', 'icon-512.png',
  'fonts/GT-Walsheim-Regular-Trial.otf', 'fonts/GT-Walsheim-Medium-Trial.otf',
  'fonts/RecklessStandardS-TRIAL-Regular.woff2', 'fonts/RecklessStandardS-TRIAL-Medium.woff2'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(C).then((c) => Promise.all(FILES.map((f) => c.add(f).catch(() => {}))))); self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== C).map((k) => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', (e) => { e.respondWith(fetch(e.request).then((r) => { const copy = r.clone(); caches.open(C).then((c) => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request))); });
