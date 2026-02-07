// Service Worker for Zyeuté PWA
const CACHE_NAME = 'zyeute-v6';
const OLD_CACHES = ['zyeute-v1', 'zyeute-v2', 'zyeute-v3', 'zyeute-v4', 'zyeute-v5'];
const CACHE_NAME = 'zyeute-v5';
const OLD_CACHES = ['zyeute-v1', 'zyeute-v2', 'zyeute-v3', 'zyeute-v4'];

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting(); // Activate immediately
});

// Activate event - delete old caches so clients load the new build
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - Network first strategy
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Don't cache POST requests or API calls
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
    return;
  }

  // Don't intercept external requests (Pexels, etc.) - let browser handle them directly
  // This avoids CSP issues with service worker fetch requests
  if (url.origin !== self.location.origin && 
      !url.hostname.includes('supabase.co') &&
      !url.hostname.includes('zyeute')) {
    return; // Let browser handle external requests directly
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response
        const clonedResponse = response.clone();
        
        // Cache successful responses
        if (response.status === 200) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clonedResponse);
          });
        }
        
        return response;
      })
      .catch(() => {
        // Return cached version if network request fails
        return caches.match(event.request).then((response) => {
          return response || new Response('Offline - Resource not available');
        });
      })
  );
});

// Handle messages from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
