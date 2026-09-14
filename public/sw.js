/* LifeBook Service Worker —— 离线 shell（网络优先，回退缓存）。 */
const CACHE = "lifebook-v1";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 只处理同源 GET 请求
  if (request.method !== "GET" || url.origin !== location.origin) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        // 成功则缓存一份（仅缓存 200 的静态/文档资源）
        const copy = response.clone();
        caches
          .open(CACHE)
          .then((cache) => cache.put(request, copy))
          .catch(() => {});
        return response;
      })
      .catch(() =>
        caches.match(request).then((cached) => cached || caches.match("/"))
      )
  );
});
