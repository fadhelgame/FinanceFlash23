// Minimal service worker. Its job is to make the app installable and to serve
// build assets offline — nothing else.
//
// Deliberately narrow: it only ever answers requests for /_next/static/, whose
// URLs are content-hashed and therefore immutable. Every other request,
// including everything under /api/, is left entirely to the browser. Caching a
// stale API response in a finance app is how data goes missing, so this worker
// never sees those requests at all.

const CACHE = 'financeflash-static-v1'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  const { request } = event
  if (request.method !== 'GET') return

  let url
  try {
    url = new URL(request.url)
  } catch {
    return
  }

  if (url.origin !== self.location.origin) return
  if (!url.pathname.startsWith('/_next/static/')) return

  event.respondWith(
    caches.match(request).then(hit => {
      if (hit) return hit
      return fetch(request).then(response => {
        if (response.ok) {
          const copy = response.clone()
          caches.open(CACHE).then(cache => cache.put(request, copy))
        }
        return response
      })
    })
  )
})
