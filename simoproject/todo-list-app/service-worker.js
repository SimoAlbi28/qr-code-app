const CACHE_NAME = 'todo-cache-v1';
const FILES_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', event => {
  console.log('Service Worker installato');
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('Service Worker attivato');
  return self.clients.claim();
});

self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Promemoria Attività';
  const options = {
    body: data.body || 'Hai un’attività programmata!',
    icon: 'icon.png',
    badge: 'badge.png',
    tag: data.tag || 'todo-reminder'
  };
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

