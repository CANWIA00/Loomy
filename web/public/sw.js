const CACHE = "loomy-site-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache.addAll(["/", "/site.webmanifest", "/icon-192.png", "/icon-512.png", "/logo.png"])
    )
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      try {
        const network = await fetch(request);
        if (network.ok && (request.mode === "navigate" || request.url.startsWith(self.location.origin))) {
          cache.put(request, network.clone());
        }
        return network;
      } catch {
        const cached = await cache.match(request);
        if (cached) return cached;
        if (request.mode === "navigate") {
          const fallback = await cache.match("/");
          if (fallback) return fallback;
        }
        return new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } });
      }
    })
  );
});