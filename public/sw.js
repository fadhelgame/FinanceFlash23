// Minimal service worker. Its job is to make the app installable and to serve
// build assets offline — nothing else.
//
// Deliberately narrow: it only ever answers requests for /_next/static/, whose
// URLs are content-hashed and therefore immutable. Every other request,
// including everything under /api/, is left entirely to the browser. Caching a
// stale API response in a finance app is how data goes missing, so this worker
// never sees those requests at all.

// Bumping this name makes activate drop everything the previous version had
// cached, which is how already-installed copies shed the unbounded v1 cache.
const CACHE = 'financeflash-static-v2'

// A build ships around 30 assets. Sixty leaves room for the current build plus
// the one before it, so nothing in use is ever evicted mid-session, while the
// cache cannot grow without limit across deploys — content-hashed filenames
// mean every deploy adds new entries and never replaces old ones.
const MAX_ENTRIES = 60

// Trims run one at a time. Concurrent puts would otherwise each read the same
// key list and delete overlapping ranges.
let trimQueue = Promise.resolve()

function trimCache() {
  trimQueue = trimQueue
    .then(async () => {
      const cache = await caches.open(CACHE)
      const keys = await cache.keys()
      // The Cache API returns keys in insertion order, so the front is oldest.
      const excess = keys.length - MAX_ENTRIES
      for (let i = 0; i < excess; i++) {
        await cache.delete(keys[i])
      }
    })
    .catch(() => {})
  return trimQueue
}

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      // Also trim the current cache, in case a previous version of this worker
      // already let it grow past the limit.
      .then(() => trimCache())
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
          event.waitUntil(
            caches
              .open(CACHE)
              .then(cache => cache.put(request, copy))
              .then(() => trimCache())
              .catch(() => {})
          )
        }
        return response
      })
    })
  )
})
