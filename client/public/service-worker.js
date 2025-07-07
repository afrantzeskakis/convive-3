// Name and version of the cache
const CACHE_NAME = 'convive-cache-v2';
const API_CACHE_NAME = 'convive-api-cache-v1';

// IndexedDB configuration
const DB_NAME = 'convive-db';
const DB_VERSION = 1;
const OFFLINE_REQUEST_STORE = 'offline-requests';

// Assets to cache immediately when the service worker installs
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-384x384.png'
];

// Assets that should be cached as they're used (not preloaded)
const RUNTIME_CACHE_PATTERNS = [
  /\.(?:js|css)$/,
  /\.(?:png|jpg|jpeg|svg|gif)$/,
];

// Install event handler - precache key resources
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing Service Worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Precaching App Shell');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        console.log('[Service Worker] Precaching complete');
        return self.skipWaiting();
      })
  );
});

// Activate event handler - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating Service Worker...');
  
  // List of caches to keep
  const currentCaches = [CACHE_NAME, API_CACHE_NAME];
  
  event.waitUntil(
    caches.keys()
      .then((keyList) => {
        return Promise.all(keyList.map((key) => {
          // Delete old versions of the caches
          if (!currentCaches.includes(key)) {
            console.log('[Service Worker] Removing old cache', key);
            return caches.delete(key);
          }
        }));
      })
      .then(() => {
        console.log('[Service Worker] Claiming clients');
        return self.clients.claim();
      })
  );
  
  return self.clients.claim();
});

// Fetch event handler with improved caching strategies
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Handle API requests differently - only GET requests
  if (url.pathname.startsWith('/api/') && event.request.method === 'GET') {
    event.respondWith(handleApiRequest(event.request));
    return;
  }
  
  // Skip cross-origin requests that aren't API requests
  if (!url.origin.includes(self.location.origin)) return;
  
  // Skip other non-GET requests
  if (event.request.method !== 'GET') return;
  
  // For HTML navigation requests - Network first, then cache fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseClone);
            });
          return response;
        })
        .catch(() => {
          return caches.match('/') || caches.match(event.request);
        })
    );
    return;
  }
  
  // For assets that should be cached as they're used - Cache first, then network
  const isRuntimeCacheable = RUNTIME_CACHE_PATTERNS.some(pattern => 
    pattern.test(url.pathname)
  );
  
  if (isRuntimeCacheable) {
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          // Return cached response if available
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // Otherwise fetch from network and cache
          return fetch(event.request)
            .then((response) => {
              // Clone the response to store in cache and return the original
              const responseClone = response.clone();
              
              // Open cache and store the response
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseClone);
                });
                
              return response;
            })
            .catch((error) => {
              console.error('[Service Worker] Fetch failed:', error);
              
              // Return appropriate fallback for image requests
              if (event.request.url.match(/\.(jpg|jpeg|png|gif|svg)$/)) {
                return caches.match('/icons/placeholder.png');
              }
              
              throw error;
            });
        })
    );
    return;
  }
  
  // Default strategy for other requests - Network first with cache fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response to store in cache and return the original
        const responseClone = response.clone();
        
        // Open cache and store the response
        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseClone);
          });
          
        return response;
      })
      .catch(() => {
        // If network request fails, try to serve from cache
        console.log('[Service Worker] Serving from cache', event.request.url);
        return caches.match(event.request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // For navigation requests, return the offline page
            if (event.request.mode === 'navigate') {
              return caches.match('/');
            }
            
            // If no cached response, return a basic error response
            return new Response('Network error', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// Special handling for API requests
async function handleApiRequest(request) {
  // Try network first
  try {
    const response = await fetch(request);
    
    // Cache successful responses
    if (response.ok) {
      const responseClone = response.clone();
      const cache = await caches.open(API_CACHE_NAME);
      cache.put(request, responseClone);
    }
    
    return response;
  } catch (error) {
    console.log('[Service Worker] API fetch failed, trying cache', request.url);
    
    // Try to get from cache if network fails
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // Add a header to indicate this is from cache
      const headers = new Headers(cachedResponse.headers);
      headers.append('X-Convive-Cache', 'true');
      
      // Return modified response with the new header
      return new Response(await cachedResponse.blob(), {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers: headers
      });
    }
    
    // If no cached response, return error
    return new Response(JSON.stringify({
      error: 'Network error',
      offline: true,
      message: 'You are currently offline. Please check your connection.'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle background sync for deferred operations
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-requests') {
    event.waitUntil(syncOfflineRequests());
  }
});

// Function to sync offline requests when online
async function syncOfflineRequests() {
  try {
    const offlineRequests = await getOfflineRequests();
    
    if (offlineRequests && offlineRequests.length > 0) {
      console.log(`[Service Worker] Syncing ${offlineRequests.length} offline requests`);
      
      for (const request of offlineRequests) {
        try {
          // Attempt to send the request
          const response = await fetch(request.url, {
            method: request.method,
            headers: request.data ? { 'Content-Type': 'application/json' } : {},
            body: request.data ? JSON.stringify(request.data) : undefined,
            credentials: 'include'
          });
          
          if (response.ok) {
            // Remove the request after successful sync
            await removeOfflineRequest(request.id);
            console.log(`[Service Worker] Successfully synced request to ${request.url}`);
          } else {
            console.error(`[Service Worker] Failed to sync request to ${request.url}: ${response.status}`);
          }
        } catch (error) {
          console.error(`[Service Worker] Error syncing request to ${request.url}:`, error);
          // We don't remove failed requests so they can be tried again
        }
      }
      
      // Notify any open clients that syncing is complete
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({
          type: 'SYNC_COMPLETED',
          timestamp: new Date().getTime()
        });
      });
    }
  } catch (error) {
    console.error('[Service Worker] Sync failed:', error);
  }
}

// Get offline requests from IndexedDB
async function getOfflineRequests() {
  return new Promise((resolve, reject) => {
    const openRequest = indexedDB.open(DB_NAME, DB_VERSION);
    
    openRequest.onerror = (event) => {
      console.error('Error opening IndexedDB:', event.target.error);
      reject(event.target.error);
    };
    
    openRequest.onsuccess = (event) => {
      const db = event.target.result;
      
      // If the store doesn't exist, return empty array
      if (!db.objectStoreNames.contains(OFFLINE_REQUEST_STORE)) {
        resolve([]);
        return;
      }
      
      const transaction = db.transaction(OFFLINE_REQUEST_STORE, 'readonly');
      const store = transaction.objectStore(OFFLINE_REQUEST_STORE);
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => {
        resolve(getAllRequest.result);
      };
      
      getAllRequest.onerror = (event) => {
        console.error('Error getting offline requests:', event.target.error);
        reject(event.target.error);
      };
    };
    
    openRequest.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create the store if it doesn't exist
      if (!db.objectStoreNames.contains(OFFLINE_REQUEST_STORE)) {
        db.createObjectStore(OFFLINE_REQUEST_STORE, { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

// Remove an offline request from IndexedDB
async function removeOfflineRequest(id) {
  return new Promise((resolve, reject) => {
    const openRequest = indexedDB.open(DB_NAME, DB_VERSION);
    
    openRequest.onerror = (event) => {
      console.error('Error opening IndexedDB:', event.target.error);
      reject(event.target.error);
    };
    
    openRequest.onsuccess = (event) => {
      const db = event.target.result;
      
      // If the store doesn't exist, resolve
      if (!db.objectStoreNames.contains(OFFLINE_REQUEST_STORE)) {
        resolve();
        return;
      }
      
      const transaction = db.transaction(OFFLINE_REQUEST_STORE, 'readwrite');
      const store = transaction.objectStore(OFFLINE_REQUEST_STORE);
      const deleteRequest = store.delete(id);
      
      deleteRequest.onsuccess = () => {
        resolve();
      };
      
      deleteRequest.onerror = (event) => {
        console.error('Error removing offline request:', event.target.error);
        reject(event.target.error);
      };
    };
  });
}

// Push notification handler
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push Received');
  
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    data: {
      url: data.url || '/'
    },
    actions: [
      {
        action: 'view',
        title: 'View'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // Handle notification action if present
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  } else {
    // Default action for notification click
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});