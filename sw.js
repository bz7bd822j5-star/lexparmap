/* ========================================================
   🔄 SERVICE WORKER - LexPar Map v2
   PWA avec Cache Strategy & Offline Support
   ======================================================== */

const CACHE_NAME = 'lexparmap-v2.0';
const RUNTIME_CACHE = 'lexparmap-runtime-v2';
const STATIC_ASSETS = 'lexparmap-static-v2';
const IMAGE_CACHE = 'lexparmap-images-v2';

// Actifs à mettre en cache à l'installation
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/data/rues_paris.json',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js',
  'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css',
  'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css',
];

const DATA_URLS = [
  '/travaux.json',
  '/perturbants.json',
  '/bovp_pp_map_master_v13.json',
  '/terrasses.json',
];

/* ========================================================
   📥 INSTALLATION DU SERVICE WORKER
   ======================================================== */

self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installation...');

  event.waitUntil(
    Promise.all([
      // Cache des assets statiques
      caches.open(STATIC_ASSETS).then((cache) => {
        console.log('📦 Cache statique: assets');
        return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
          console.warn('⚠️ Certains assets CDN non disponibles:', err);
          // Ne pas échouer si CDN indisponible
          return Promise.resolve();
        });
      }),
      // Cache des données JSON
      caches.open(CACHE_NAME).then((cache) => {
        console.log('📦 Cache données: JSON');
        return Promise.all(
          DATA_URLS.map((url) =>
            fetch(url)
              .then((res) => {
                if (res.ok) {
                  cache.put(url, res.clone());
                  console.log(`  ✅ ${url} mis en cache`);
                }
              })
              .catch((err) => {
                console.warn(`  ⚠️ ${url} non disponible:`, err.message);
              })
          )
        );
      }),
    ])
  );

  // Force la prise de contrôle immédiate
  self.skipWaiting();
});

/* ========================================================
   🔄 ACTIVATION DU SERVICE WORKER
   ======================================================== */

self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker: Activation...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      // Supprimer les anciens caches
      return Promise.all(
        cacheNames
          .filter((name) => {
            return (
              name !== CACHE_NAME &&
              name !== STATIC_ASSETS &&
              name !== RUNTIME_CACHE &&
              name !== IMAGE_CACHE
            );
          })
          .map((name) => {
            console.log(`🗑️ Suppression cache ancien: ${name}`);
            return caches.delete(name);
          })
      );
    })
  );

  // Reprendre le contrôle des clients existants
  return self.clients.claim();
});

/* ========================================================
   🌐 STRATÉGIES DE CACHE
   ======================================================== */

/**
 * Cache First: Utiliser le cache d'abord, puis réseau si absent
 * Parfait pour: Assets statiques, images, CDN
 */
function cacheFirst(request) {
  return caches.match(request).then((response) => {
    if (response) {
      console.log(`📦 Cache hit: ${request.url}`);
      return response;
    }

    return fetch(request).then((response) => {
      if (!response || response.status !== 200 || response.type === 'error') {
        return response;
      }

      // Cloner et mettre en cache
      const responseClone = response.clone();
      if (request.url.includes('leaflet') || request.url.includes('openstreetmap')) {
        caches.open(STATIC_ASSETS).then((cache) => {
          cache.put(request, responseClone);
        });
      }

      return response;
    });
  });
}

/**
 * Network First: Utiliser le réseau d'abord, cache en fallback
 * Parfait pour: Données, API, contenu temps réel
 */
function networkFirst(request) {
  return fetch(request)
    .then((response) => {
      // Valider la réponse
      if (!response || response.status !== 200 || response.type === 'error') {
        return response;
      }

      // Mettre en cache
      const responseClone = response.clone();
      caches.open(RUNTIME_CACHE).then((cache) => {
        cache.put(request, responseClone);
      });

      return response;
    })
    .catch((err) => {
      console.log(`🔌 Offline: Utilisation cache pour ${request.url}`);
      // Fallback au cache en cas d'erreur réseau
      return caches.match(request).then((response) => {
        if (response) {
          return response;
        }

        // Si pas de cache et offline, retourner page offline
        if (request.destination === 'document') {
          return caches.match('/index.html');
        }

        // Sinon, erreur
        return new Response('Contenu indisponible (offline)', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({
            'Content-Type': 'text/plain',
          }),
        });
      });
    });
}

/**
 * Stale While Revalidate: Servir cache immédiatement, mettre à jour en arrière-plan
 * Parfait pour: Données JSON, photos
 */
function staleWhileRevalidate(request) {
  return caches.match(request).then((response) => {
    // Servir le cache immédiatement
    if (response) {
      console.log(`⚡ Stale cache + revalidate: ${request.url}`);

      // Mettre à jour en arrière-plan
      fetch(request).then((newResponse) => {
        if (newResponse && newResponse.status === 200) {
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, newResponse);
            // Notifier les clients de la mise à jour
            self.clients.matchAll().then((clients) => {
              clients.forEach((client) => {
                client.postMessage({
                  type: 'CACHE_UPDATED',
                  url: request.url,
                });
              });
            });
          });
        }
      });

      return response;
    }

    // Si pas en cache, récupérer du réseau
    return fetch(request).then((response) => {
      if (!response || response.status !== 200) {
        return response;
      }

      const responseClone = response.clone();
      caches.open(RUNTIME_CACHE).then((cache) => {
        cache.put(request, responseClone);
      });

      return response;
    });
  });
}

/* ========================================================
   🔗 INTERCEPTION DES REQUÊTES
   ======================================================== */

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // ❌ Ignorer les schémas non-HTTP
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // 🏠 HTML (Network First)
  if (request.destination === 'document') {
    return event.respondWith(networkFirst(request));
  }

  // 📦 Assets statiques (Cache First)
  if (
    url.hostname === 'unpkg.com' ||
    url.hostname === 'tile.openstreetmap.org' ||
    request.destination === 'style' ||
    request.destination === 'script'
  ) {
    return event.respondWith(cacheFirst(request));
  }

  // 📊 Données JSON (Stale While Revalidate)
  if (request.url.includes('.json')) {
    return event.respondWith(staleWhileRevalidate(request));
  }

  // 🌍 API Nominatim (Network First avec fallback)
  if (url.hostname === 'nominatim.openstreetmap.org') {
    return event.respondWith(networkFirst(request));
  }

  // 🖼️ Images (Cache First)
  if (request.destination === 'image') {
    return event.respondWith(
      caches.open(IMAGE_CACHE).then((cache) => {
        return cache.match(request).then((response) => {
          return (
            response ||
            fetch(request).then((response) => {
              if (response && response.status === 200) {
                cache.put(request, response.clone());
              }
              return response;
            })
          );
        });
      })
    );
  }

  // 📝 Autres (Network First)
  event.respondWith(networkFirst(request));
});

/* ========================================================
   💬 MESSAGES DEPUIS LE CLIENT
   ======================================================== */

self.addEventListener('message', (event) => {
  const { type, payload } = event.data;

  console.log(`📨 Message reçu: ${type}`, payload);

  switch (type) {
    case 'SKIP_WAITING':
      // Force la nouvelle version à prendre contrôle
      self.skipWaiting();
      break;

    case 'CLEAR_CACHE':
      // Vider le cache runtime
      caches.delete(RUNTIME_CACHE).then(() => {
        console.log('🗑️ Cache runtime vidé');
        event.ports[0].postMessage({ success: true });
      });
      break;

    case 'CACHE_URLS':
      // Mettre en cache des URLs spécifiques
      if (payload && Array.isArray(payload.urls)) {
        caches.open(RUNTIME_CACHE).then((cache) => {
          payload.urls.forEach((url) => {
            fetch(url)
              .then((res) => {
                if (res.ok) {
                  cache.put(url, res.clone());
                  console.log(`✅ URL mise en cache: ${url}`);
                }
              })
              .catch((err) => {
                console.warn(`❌ Erreur cache URL: ${url}`, err);
              });
          });

          event.ports[0].postMessage({
            success: true,
            cached: payload.urls.length,
          });
        });
      }
      break;

    case 'GET_CACHE_SIZE':
      // Calculer taille du cache
      estimateCacheSize().then((size) => {
        event.ports[0].postMessage({ size });
      });
      break;

    default:
      console.warn(`Unknown message type: ${type}`);
  }
});

/**
 * Estimer la taille du cache
 */
async function estimateCacheSize() {
  const cacheNames = await caches.keys();
  let totalSize = 0;

  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();

    for (const request of keys) {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.blob();
        totalSize += blob.size;
      }
    }
  }

  return totalSize;
}

/* ========================================================
   📲 NOTIFICATIONS PUSH (Futur)
   ======================================================== */

self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const title = data.title || 'LexPar Map';
  const options = {
    body: data.body || 'Nouvelle mise à jour disponible',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: 'lexparmap-notification',
    requireInteraction: false,
    ...data,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Chercher un client existant
        for (let client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        // Sinon, ouvrir une nouvelle fenêtre
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});

/* ========================================================
   📊 BACKGROUND SYNC (Futur)
   ======================================================== */

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(
      fetch('/api/sync')
        .then((response) => {
          if (response.ok) {
            console.log('✅ Données synchronisées');
            return response.json();
          }
          throw new Error('Sync failed');
        })
        .catch((err) => {
          console.error('❌ Erreur sync:', err);
          throw err; // Réessayer plus tard
        })
    );
  }
});

/* ========================================================
   📝 LOGS & DEBUG
   ======================================================== */

console.log(
  `%c🔄 Service Worker LexPar Map v2 - ${CACHE_NAME}`,
  'color: #0d47a1; font-weight: bold; font-size: 14px'
);
console.log('%cStratégies:', 'color: #27ae60; font-weight: bold;');
console.log('  📦 Cache First → Assets statiques');
console.log('  ⚡ Stale While Revalidate → Données JSON');
console.log('  🌐 Network First → API, HTML');
console.log('  🖼️ Cache First → Images');
