const CACHE_NAME = "fmc-v1";
const OFFLINE_URLS = ["/", "/campaigns"];

// Pre-cache shell on install
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_URLS)),
  );
  self.skipWaiting();
});

// Clean up old caches on activate
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
      ),
  );
  self.clients.claim();
});

// Network-first for API/RPC, cache-first for static assets
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin (except cached shells)
  if (request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;

  const isNavigation = request.mode === "navigate";
  const isStatic = /\.(js|css|png|jpg|webp|svg|woff2?)$/.test(url.pathname);

  if (isStatic) {
    // Cache-first for static assets
    event.respondWith(
      caches.match(request).then((cached) => cached ?? fetch(request)),
    );
    return;
  }

  if (isNavigation) {
    // Network-first for pages, fall back to cached shell
    event.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return res;
        })
        .catch(() => caches.match(request).then((c) => c ?? caches.match("/"))),
    );
    return;
  }
});

// Background sync for draft campaigns
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-drafts") {
    event.waitUntil(syncDrafts());
  }
});

async function syncDrafts() {
  // Drafts are stored in IndexedDB by the app; here we just signal readiness
  const clients = await self.clients.matchAll();
  clients.forEach((c) => c.postMessage({ type: "SYNC_DRAFTS_READY" }));
}

// Push notifications
self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title ?? "Fund My Cause", {
      body: data.body,
      icon: "/icon-192x192.png",
      badge: "/icon-192x192.png",
      vibrate: [100, 50, 100],
      data: { url: data.url ?? "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url ?? "/";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find((c) => c.url.includes(self.location.origin));
        if (existing) {
          existing.focus();
          existing.navigate(targetUrl);
        } else {
          self.clients.openWindow(targetUrl);
        }
      }),
  );
});
