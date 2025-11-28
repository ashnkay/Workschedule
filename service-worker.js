/* service-worker.js
   Basic offline caching + notification click handler for a GitHub Pages site.
   Note: For reliable background push notifications when the browser is closed,
   you'll need to implement a Push server (VAPID) or use Firebase Cloud Messaging.
*/

const CACHE_NAME = 'work-schedule-cache-v1';
const urlsToCache = [
  './',
  './index.html',
  './app.js',
  './manifest.json',
  './logo.png',
  './logo2.png'
];

self.addEventListener('install', evt => {
  self.skipWaiting();
  evt.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', evt => {
  evt.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', evt => {
  evt.respondWith(
    caches.match(evt.request).then(resp => resp || fetch(evt.request))
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const data = event.notification.data || {};
  event.waitUntil(
    clients.matchAll({type:'window', includeUncontrolled:true}).then(windowClients => {
      for (let client of windowClients) {
        if (client.url && 'focus' in client) {
          client.focus();
          client.postMessage({type:'notification-click', data});
          return;
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('./');
      }
    })
  );
});
