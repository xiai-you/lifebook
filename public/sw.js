/* LifeBook Service Worker —— 离线 shell（网络优先，回退缓存）。
 * API 请求（/api/* 与 /uploads/*）完全绕过 SW：不缓存、不 fallback、不 respondWith，
 * 避免 SW 拦截导致的 "Failed to fetch"。 */
const CACHE = "lifebook-cache-v2";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  // 立即接管页面，并清理旧版本缓存，让新版 SW 尽快生效。
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      ),
    ])
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API 与上传资源不拦截：直接交给浏览器正常走网络（未来 /api/* 也统一 bypass）。
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/uploads/")) return;
  // 只处理同源 GET 请求
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        // 仅缓存成功的 200 静态/文档资源（不缓存 4xx/5xx）
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then((cached) => {
          if (cached) return cached;
          // 无缓存时正常失败：不返回 undefined、不拿首页兜底。
          throw new Error("离线且无缓存");
        })
      )
  );
});
