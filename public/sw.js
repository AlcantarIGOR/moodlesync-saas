// MoodleSync Service Worker — cache-first for static assets, network-first for API + Web Push
const CACHE = "moodlesync-v1"
// Only cache unconditional 200s — never auth-gated routes like /dashboard
const STATIC = ["/manifest.json", "/icons/icon-192.png", "/icons/icon-512.png"]

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(STATIC)).then(() => self.skipWaiting())
  )
})

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener("fetch", (e) => {
  const { request } = e
  const url = new URL(request.url)

  // Skip non-GET and API/auth routes (always network)
  if (request.method !== "GET") return
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/login")) return

  // Next.js static assets: cache-first
  if (url.pathname.startsWith("/_next/static/")) {
    e.respondWith(
      caches.match(request).then((cached) =>
        cached ?? fetch(request).then((res) => {
          const clone = res.clone()
          caches.open(CACHE).then((c) => c.put(request, clone))
          return res
        })
      )
    )
    return
  }

  // Navigation: network-first, fallback to cache
  if (request.mode === "navigate") {
    e.respondWith(
      fetch(request).catch(() => caches.match(request) ?? caches.match("/dashboard"))
    )
    return
  }
})

// ── Web Push ──────────────────────────────────────────────────────────────────

self.addEventListener("push", (e) => {
  if (!e.data) return
  let payload
  try { payload = e.data.json() } catch { return }

  const { title = "MoodleSync", body = "", url = "/dashboard/tareas" } = payload

  e.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url },
      vibrate: [200, 100, 200],
      tag: "moodlesync-reminder",   // replaces previous notification instead of stacking
      renotify: true,
    })
  )
})

self.addEventListener("notificationclick", (e) => {
  e.notification.close()
  const url = e.notification.data?.url ?? "/dashboard/tareas"
  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      const existing = wins.find((w) => w.url.includes(self.location.origin))
      if (existing) return existing.focus().then((w) => w.navigate(url))
      return clients.openWindow(url)
    })
  )
})
