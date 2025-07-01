const CACHE_NAME = 'todo-cache-v1';
const FILES_TO_CACHE = [
  '/todo-list-app/',
  '/todo-list-app/index.html',
  '/todo-list-app/style.css',
  '/todo-list-app/script.js',
  '/todo-list-app/manifest.json',
  '/todo-list-app/icons/icon-192.png',
  '/todo-list-app/icons/icon-512.png'
];

self.addEventListener('install', event => {
  console.log('Service Worker installato');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('Service Worker attivato');
  event.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(
        keyList.map(key => {
          if (key !== CACHE_NAME) {
            console.log('Elimino cache vecchia:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Promemoria Attività';
  const options = {
    body: data.body || 'Hai un’attività programmata!',
    icon: '/todo-list-app/icons/icon-192.png',
    badge: '/todo-list-app/icons/icon-192.png',
    tag: data.tag || 'todo-reminder'
  };
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});
