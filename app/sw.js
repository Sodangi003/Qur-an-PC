/* Qur'an PC service worker: lets the web version install like an app and work offline.
   - Code files (html, css, js) are fetched from the network first, so updates show up
     straight away. If the network is slow or offline, the saved copy is used.
   - Big files that never change (Quran text, fonts, images) are served from the saved copy first. */
const CACHE = 'quran-pc-app-v9';
const SHELL = [
  './', 'index.html', 'style.css', 'app.js', 'book.js', 'pwa.js', 'riwaya.js', 'data/riwayat.js', 'audio.js', 'data/audio.js', 'update.js',
  'data/quran.js', 'data/meta.js',
  'fonts/amiri-quran-arabic-400-normal.woff2',
  'fonts/scheherazade-new-arabic-400-normal.woff2',
  'fonts/noto-naskh-arabic-arabic-400-normal.woff2',
  'img/frame.svg', 'img/paper.svg', 'img/cap.svg', 'img/carpet.svg',
  'icon.png', 'cover.webp', 'favicon.png',
  'manifest.webmanifest'
];
const STATIC = /\.(woff2|ttf|webp|png|svg|jpg)$|\/data\/(?!riwayat|audio)[^/]+\.js$/;
const NETWORK_WAIT_MS = 4000;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.all(SHELL.map((u) => c.add(new Request(u, { cache: 'reload' })).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.indexOf('quran-pc-app-') === 0 && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function fromNetwork(req) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('slow')), NETWORK_WAIT_MS);
    fetch(req).then((res) => { clearTimeout(timer); resolve(res); }, (e) => { clearTimeout(timer); reject(e); });
  });
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname.endsWith('/version.json')) return;     // the update check must always ask the server

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const saved = () => cache.match(req, { ignoreSearch: true });
    if (STATIC.test(url.pathname)) {
      const hit = await saved();
      if (hit) return hit;
      try { const res = await fetch(req); if (res.ok) cache.put(req, res.clone()); return res; }
      catch (e) { return Response.error(); }
    }
    try {
      const res = await fromNetwork(req);
      if (res.ok) cache.put(req, res.clone());
      return res;
    } catch (e) {
      return (await saved()) || (req.mode === 'navigate' ? await cache.match('index.html') : null) || Response.error();
    }
  })());
});
