// Service Worker สำหรับ cache LIFF และ resources สำคัญ
const CACHE_NAME = 'redpotion-liff-v1';
const LIFF_SDK_URL = 'https://static.line-scdn.net/liff/edge/2/sdk.js';

// Cache resources สำคัญ
const urlsToCache = [
  LIFF_SDK_URL,
  '/favicon.ico',
  '/images/logo_1_1.png',
  '/images/default_restaurant.jpg'
];

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('🔧 SW: Caching LIFF resources');
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.error('❌ SW: Cache failed', err))
  );
});

// Fetch event - serve from cache when possible
self.addEventListener('fetch', event => {
  // เฉพาะ LIFF SDK เท่านั้น
  if (event.request.url === LIFF_SDK_URL) {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          // Return cached version or fetch from network
          if (response) {
            console.log('✅ SW: Serving LIFF SDK from cache');
            return response;
          }
          
          console.log('📥 SW: Fetching LIFF SDK from network');
          return fetch(event.request).then(response => {
            // Cache the new version
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
            return response;
          });
        })
        .catch(() => {
          console.warn('⚠️ SW: LIFF SDK fetch failed');
          return new Response('LIFF SDK unavailable', { status: 503 });
        })
    );
  }
});

// Activate event - cleanup old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ SW: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
}); 