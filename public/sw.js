const VERSION = "english-journey-v2";
const STATIC_CACHE = `${VERSION}-static`;
const STATIC_ASSETS = ["/offline", "/offline/study", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(STATIC_CACHE);
    await cache.addAll(STATIC_ASSETS);
    const study = await cache.match("/offline/study");
    if (!study) return;
    const html = await study.text();
    const assets = [...html.matchAll(/(?:src|href)="(\/_next\/static\/[^\"]+\.(?:js|css)(?:\?[^\"]*)?)"/g)]
      .map((match) => match[1]);
    await Promise.allSettled([...new Set(assets)].map((asset) => cache.add(asset)));
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(Promise.all([
    caches.keys().then((keys) => Promise.all(keys.filter((key) => !key.startsWith(VERSION)).map((key) => caches.delete(key)))),
    self.clients.claim(),
  ]));
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/_next/static/") || url.pathname === "/icon-192.png" || url.pathname === "/icon-512.png") {
    event.respondWith(caches.open(STATIC_CACHE).then(async (cache) => {
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok) cache.put(request, response.clone());
      return response;
    }));
    return;
  }
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(async () => {
      const cache = await caches.open(STATIC_CACHE);
      if (url.pathname === "/offline/study") {
        const study = await cache.match("/offline/study");
        if (study) return study;
      }
      return await cache.match("/offline") ?? Response.error();
    }));
  }
});

self.addEventListener("push", (event) => {
  let payload = { title: "English Journey", body: "Sua jornada continua!", path: "/dashboard" };
  try { payload = { ...payload, ...event.data.json() }; } catch { /* fallback */ }
  const path = typeof payload.path === "string" && /^\/(dashboard|study|review|lessons|progress|vocabulary)(\/.*)?$/.test(payload.path) ? payload.path : "/dashboard";
  event.waitUntil(self.registration.showNotification(String(payload.title).slice(0, 80), {
    body: String(payload.body).slice(0, 180), icon: "/icon-192.png", badge: "/icon-192.png", data: { path },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const path = event.notification.data?.path ?? "/dashboard";
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (clients) => {
    const existing = clients.find((client) => new URL(client.url).pathname === path);
    if (existing) return existing.focus();
    return self.clients.openWindow(path);
  }));
});
