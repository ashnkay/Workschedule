/* service-worker.js
   - Simple PWA service worker: caches assets for offline and handles notificationclick.
   - Does not implement Push API server logic (that requires a server).
*/

const CACHE_NAME = 'work-schedule-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/app.js',
  '/manifest.json',
  '/logo.png',
  '/logo2.png'
];

// Install: cache basic assets
self.addEventListener('install', evt => {
  self.skipWaiting();
  evt.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

// Activate: cleanup old caches
self.addEventListener('activate', evt => {
  evt.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

// Fetch: serve cached assets first, fallback to network
self.addEventListener('fetch', evt => {
  evt.respondWith(
    caches.match(evt.request).then(resp => resp || fetch(evt.request))
  );
});

// Notification click behavior
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const data = event.notification.data || {};
  event.waitUntil(
    clients.matchAll({type:'window', includeUncontrolled:true}).then(windowClients => {
      // If there is at least one client, focus it; otherwise open a new window.
      for (let client of windowClients) {
        if (client.url && 'focus' in client) {
          client.focus();
          // Optionally, send message to the page
          client.postMessage({type:'notification-click', data});
          return;
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
