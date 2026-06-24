const CACHE = 'web-kokhi-v1'
const SHELL = ['/', '/index.html', '/favicon.svg', '/manifest.json']

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)))
  self.skipWaiting()
})

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return
  const url = new URL(e.request.url)
  if (url.pathname.startsWith('/api/')) return
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request)),
  )
})
