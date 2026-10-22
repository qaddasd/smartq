/* Cache only the demo UI. API and server-function requests always use the network. */
const VERSION = "smartq-ui-v2.1.0";
self.addEventListener("install", (event) =>
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) =>
        cache.addAll([
          "/offline.html",
          "/icons/icon-192.png",
          "/icons/icon-512.png",
          "/manifest.webmanifest",
        ]),
      ),
  ),
);
self.addEventListener("activate", (event) =>
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("smartq-ui-") && key !== VERSION)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  ),
);
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/api/") ||
    url.pathname.includes("_server") ||
    url.search.includes("_server")
  )
    return;
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            event.waitUntil(caches.open(VERSION).then((cache) => cache.put(request, copy)));
          }
          return response;
        })
        .catch(async () => (await caches.match(request)) || (await caches.match("/offline.html"))),
    );
    return;
  }
  if (["script", "style", "font", "image"].includes(request.destination)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              event.waitUntil(caches.open(VERSION).then((cache) => cache.put(request, copy)));
            }
            return response;
          }),
      ),
    );
  }
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (windows) => {
      const target = windows.find((w) => new URL(w.url).origin === self.location.origin);
      if (target) {
        await target.navigate("/notifications");
        return target.focus();
      }
      return self.clients.openWindow("/notifications");
    }),
  );
});

// Warm assets already loaded before the worker acquired control on the first visit.
self.addEventListener("message", (event) => {
  if (event.data?.type !== "CACHE_UI" || !Array.isArray(event.data.urls)) return;
  const uiRoutes = new Set([
    "/",
    "/queue",
    "/appointments",
    "/book",
    "/profile",
    "/notifications",
    "/centers",
    "/map",
    "/forecast",
    "/analytics",
    "/staff",
    "/scan",
  ]);
  const urls = event.data.urls
    .filter((value) => {
      try {
        const url = new URL(value, self.location.origin);
        return (
          url.origin === self.location.origin &&
          !url.pathname.startsWith("/api/") &&
          !url.pathname.includes("_server") &&
          !url.search.includes("_server") &&
          (uiRoutes.has(url.pathname) ||
            /^\/center\/[a-z0-9-]+$/.test(url.pathname) ||
            /\.(js|css|woff2?|png|svg)$/.test(url.pathname))
        );
      } catch {
        return false;
      }
    })
    .slice(0, 150);
  event.waitUntil(
    caches.open(VERSION).then((cache) => Promise.allSettled(urls.map((url) => cache.add(url)))),
  );
});
