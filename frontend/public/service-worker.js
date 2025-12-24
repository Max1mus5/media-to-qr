const CACHE_NAME = 'media-to-qr-v1'
const OFFLINE_CACHE = 'media-to-qr-offline-v1'

// Archivos estáticos a cachear
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
]

// Instalar service worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalando...')
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Cacheando archivos estáticos')
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

// Activar service worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activando...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== OFFLINE_CACHE) {
            console.log('[Service Worker] Eliminando caché antigua:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// Estrategia de caché
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // No cachear APIs del backend
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request))
    return
  }

  // Estrategia: Network First con fallback a caché
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Si la respuesta es válida, cachearla
        if (response && response.status === 200) {
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone)
          })
        }
        return response
      })
      .catch(() => {
        // Si falla, buscar en caché
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse
          }

          // Si no hay en caché y es una navegación, mostrar página offline
          if (request.mode === 'navigate') {
            return caches.match('/index.html')
          }

          // Para otros recursos, retornar error
          return new Response('Sin conexión', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/plain'
            })
          })
        })
      })
  )
})

// Sincronización en segundo plano
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Sincronización en segundo plano')
  if (event.tag === 'sync-storage') {
    event.waitUntil(syncStorage())
  }
})

async function syncStorage() {
  // Sincronizar datos cuando vuelva la conexión
  console.log('[Service Worker] Sincronizando almacenamiento...')
}

// Mensajes desde la aplicación
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }

  if (event.data && event.data.type === 'CACHE_HISTORY') {
    // Cachear historial de archivos
    const historyData = event.data.data
    caches.open(OFFLINE_CACHE).then((cache) => {
      cache.put(
        new Request('/offline-history'),
        new Response(JSON.stringify(historyData), {
          headers: { 'Content-Type': 'application/json' }
        })
      )
    })
  }
})
