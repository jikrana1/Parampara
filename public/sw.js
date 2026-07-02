const CACHE_VERSION = 'v2';
const CORE_CACHE = `parampara-core-${CACHE_VERSION}`;
const API_CACHE = `parampara-api-${CACHE_VERSION}`;
const MEDIA_CACHE = `parampara-media-${CACHE_VERSION}`;

const CORE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/styles/main.css',
  '/styles/theme.css',
  '/styles/languageSelector.css',
  '/scripts/main.js',
  '/scripts/theme.js',
  '/scripts/languageSwitcher.js',
  '/scripts/cacheLayer.js',
  '/scripts/sw-register.js',
  '/scripts/audio-visualizer.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CORE_CACHE).then((cache) => {
      console.log('[ServiceWorker] Caching core assets');
      return cache.addAll(CORE_ASSETS).catch(error => {
        console.warn('[ServiceWorker] Failed to cache some assets', error);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  const currentCaches = [CORE_CACHE, API_CACHE, MEDIA_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!currentCaches.includes(cacheName) && cacheName.startsWith('parampara-')) {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);

  // Strategy 1: Network First for APIs
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(event.request, API_CACHE));
    return;
  }

  // Strategy 2: Cache First for Media (Images, Audio, Maps)
  if (event.request.destination === 'image' || 
      event.request.destination === 'audio' || 
      url.hostname.includes('maptiler') ||
      url.pathname.endsWith('.mp3')) {
    event.respondWith(cacheFirst(event.request, MEDIA_CACHE));
    return;
  }

  // Strategy 3: Stale While Revalidate for Core Assets & Pages
  event.respondWith(staleWhileRevalidate(event.request, CORE_CACHE));
});

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const networkResponse = await fetch(request);
    // Dynamic caching
    if (networkResponse.ok && networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok && networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    if (request.mode === 'navigate') {
       return cache.match('/offline.html');
    }
    throw error;
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok && networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => null);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  const networkResponse = await fetchPromise;
  if (networkResponse) {
    return networkResponse;
  }
  
  return caches.match('/offline.html');
}

// Background Sync (Existing)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-queue') {
    event.waitUntil(syncOfflineQueue());
  }
});

async function syncOfflineQueue() {
  try {
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('ParamparaSyncDB', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    const queue = await new Promise((resolve, reject) => {
      const tx = db.transaction(['sync-queue'], 'readonly');
      const store = tx.objectStore('sync-queue');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    if (queue.length === 0) return;

    for (const item of queue) {
      if (item.status === 'failed') continue;
      try {
        const response = await fetch(item.url, {
          method: item.method,
          headers: item.headers,
          body: item.body
        });
        if (response.ok || response.status === 400 || response.status === 422) {
          await new Promise((resolve, reject) => {
            const tx = db.transaction(['sync-queue'], 'readwrite');
            const store = tx.objectStore('sync-queue');
            const req = store.delete(item.id);
            req.onsuccess = resolve;
            req.onerror = reject;
          });
        } else {
           throw new Error(`Server returned ${response.status}`);
        }
      } catch (err) {
        throw err;
      }
    }
  } catch (err) {
    console.error('[ServiceWorker] IndexedDB access failed', err);
  }
}
