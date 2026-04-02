const CACHE_VERSION = 'v1';
const TILE_CACHE = `tiles-${CACHE_VERSION}`;
const API_CACHE = `api-${CACHE_VERSION}`;
const ASSET_CACHE = `assets-${CACHE_VERSION}`;

const CACHE_NAMES = [TILE_CACHE, API_CACHE, ASSET_CACHE];

// Install event: clear old caches
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names
          .filter((name) => !CACHE_NAMES.includes(name))
          .map((name) => caches.delete(name))
      );
    })
  );
  self.skipWaiting();
});

// Activate event: clean up stale caches
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Fetch event: implement cache-first strategy for tiles, network-first for API
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Cache map tiles (OSM, ArcGIS)
  if (
    url.hostname.includes('tile.openstreetmap.org') ||
    url.hostname.includes('arcgisonline.com') ||
    url.hostname.includes('tile.opentopomap.org')
  ) {
    event.respondWith(
      caches.open(TILE_CACHE).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response) return response;
          return fetch(event.request).then((fetchResponse) => {
            if (fetchResponse && fetchResponse.status === 200) {
              cache.put(event.request, fetchResponse.clone());
            }
            return fetchResponse;
          }).catch(() => {
            // Return offline placeholder if available
            return new Response('Tile unavailable offline', { status: 503 });
          });
        });
      })
    );
    return;
  }

  // Network-first for API calls (Base44)
  if (url.pathname.includes('/api') || url.hostname.includes('base44')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const cloned = response.clone();
            caches.open(API_CACHE).then((cache) => {
              cache.put(event.request, cloned);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request).then((response) => {
            return response || new Response('Offline - data unavailable', { status: 503 });
          });
        })
    );
    return;
  }

  // Cache-first for static assets
  if (
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.svg')
  ) {
    event.respondWith(
      caches.open(ASSET_CACHE).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response) return response;
          return fetch(event.request).then((fetchResponse) => {
            if (fetchResponse && fetchResponse.status === 200) {
              cache.put(event.request, fetchResponse.clone());
            }
            return fetchResponse;
          });
        });
      })
    );
    return;
  }

  // Default: network-first
  event.respondWith(fetch(event.request).catch(() => new Response('Offline', { status: 503 })));
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((names) => {
      Promise.all(names.map((name) => caches.delete(name))).then(() => {
        event.ports[0].postMessage({ success: true });
      });
    });
  }
});
