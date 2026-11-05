// Uzquiz service worker — oflayn rejim uchun keshlash.
const CACHE = "uzquiz-v4";
const SHELL = [
  "./",
  "./index.html",
  "./css/styles.css",
  "./js/app.js",
  "./js/logic.js",
  "./js/pack.js",
  "./js/mediastore.js",
  "./icon.svg",
  "./manifest.webmanifest",
  "./packs/index.json",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  // Audio/video: Range so'rovlari brauzerning o'ziga qoldiriladi (Safari talabi). Muharrir keshlanmaydi.
  if (req.headers.has("range") || /\.(mp4|webm|mp3|m4a|ogg|wav)$/i.test(url.pathname) || /admin/.test(url.pathname)) return;
  // Paket rasmlari: keshdan darhol, fonda yangilash
  if (/\.(webp|png|jpe?g|svg)$/i.test(url.pathname) && url.pathname.includes("/packs/")) {
    e.respondWith(
      caches.open(CACHE).then(async (c) => {
        const hit = await c.match(req);
        const net = fetch(req).then((res) => { if (res.ok) c.put(req, res.clone()); return res; }).catch(() => hit);
        return hit || net;
      })
    );
    return;
  }
  // Qolganlari (ilova, paketlar JSON): avval tarmoq, xato bo'lsa kesh
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }))
  );
});
